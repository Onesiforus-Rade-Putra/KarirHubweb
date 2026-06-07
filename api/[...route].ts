import { applyCors, parseRole, requireUser, sendError, sendJson } from "./_lib/http.js";
import { mapApplication, mapJob, mapOrder, mapRecruiterApplication, mapSellerOrder, mapService, mapTalentCandidate, mapTransaction } from "./_lib/mappers.js";
import { recruiterApplicationStatusToPublic, requireRecruiter } from "./_lib/recruiter.js";
import { parseServiceCategory, requireSeller, sellerOrderStatusToPublic } from "./_lib/seller.js";
import { supabaseAdmin, supabaseAnon } from "./_lib/supabase.js";

const serviceSelect = "id,title,provider_name,provider_avatar,category,rating,reviews_count,price,duration,description,active,status,seller_id,created_at";
const publicServiceSelect = "id,title,provider_name,provider_avatar,category,rating,reviews_count,price,duration,description,active";
const jobSelect = "id,title,company,company_logo,location,type,salary_min,salary_max,description,requirements,benefits,posted_date,category,applicants_count,status,recruiter_id,created_at";
const orderSelect = "id,buyer_name,buyer_email,service_title,service_price,requirements,status,result_url,created_at";
const sellerOrderSelect = "id,buyer_name,buyer_email,service_title,service_price,requirements,status,order_status,seller_notes,result_url,created_at,services!inner(id,title,seller_id)";
const appSelect = "id,user_id,job_id,candidate_name,candidate_title,candidate_email,candidate_rating,candidate_experience,status,application_status,recruiter_notes,resume_summary,created_at,jobs!inner(id,title,recruiter_id)";

function routeValueToString(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join("/");
  return typeof value === "string" ? value : "";
}

function normalizeApiPath(req: any) {
  const query = req.query || {};
  const routeFromQuery = routeValueToString(query.route || query.slug || query.path || query["0"]).replace(/^\/+/, "");

  let pathname = "/";
  try {
    pathname = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`).pathname;
  } catch {
    pathname = "/";
  }

  if (pathname === "/" || pathname === "/api" || pathname === "/api/") {
    pathname = routeFromQuery ? `/api/${routeFromQuery}` : "/api";
  }

  pathname = pathname.replace(/\/+$/, "");
  return pathname || "/api";
}

function routeOf(req: any) {
  return normalizeApiPath(req).replace(/^\/api\/?/, "");
}

function publicUser(profile: any, email: string) {
  return {
    id: profile.id,
    name: profile.full_name,
    email,
    role: profile.role,
    avatar: profile.avatar_url,
    company: profile.company,
  };
}

function virtualAccount(method?: string) {
  return method?.includes("Virtual Account") ? "8808 1234 5678 9012" : null;
}

async function handleRegister(req: any, res: any) {
  const { email, password, role, company } = req.body || {};
  const name = req.body?.name || req.body?.fullName || req.body?.full_name;
  const userRole = parseRole(role);

  if (!name || !email || !password || !userRole) return sendError(res, 400, "Nama, email, password, dan role wajib diisi.");
  if (password.length < 6) return sendError(res, 400, "Password minimal 6 karakter.");

  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: userRole },
  });

  if (createError || !authData.user) {
    const message = createError?.message?.toLowerCase().includes("already")
      ? "Email sudah terdaftar."
      : createError?.message || "Gagal membuat user.";
    return sendError(res, 400, message);
  }

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .upsert({
      id: authData.user.id,
      full_name: name,
      role: userRole,
      avatar_url: avatarUrl,
      company: userRole === "recruiter" ? company || null : null,
    })
    .select("id, full_name, role, avatar_url, company")
    .single();

  if (profileError || !profile) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return sendError(res, 500, profileError?.message || "Gagal menyimpan profil user.");
  }

  const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (sessionError || !sessionData.session) return sendError(res, 500, sessionError?.message || "User dibuat, tetapi session login gagal dibuat.");

  return sendJson(res, 201, {
    user: publicUser(profile, email),
    session: {
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresAt: sessionData.session.expires_at,
    },
  });
}

async function handleLogin(req: any, res: any) {
  const { email, password, role } = req.body || {};
  const selectedRole = role ? parseRole(role) : null;

  if (!email || !password) return sendError(res, 400, "Email dan password wajib diisi.");
  if (role && !selectedRole) return sendError(res, 400, "Role tidak valid.");

  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (authError || !authData.user || !authData.session) return sendError(res, 401, authError?.message || "Email atau password salah.");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) return sendError(res, 404, profileError?.message || "Profil user belum tersedia.");
  if (selectedRole && profile.role !== selectedRole) return sendError(res, 403, "Role akun tidak sesuai dengan pilihan login.");

  return sendJson(res, 200, {
    user: publicUser(profile, authData.user.email || email),
    session: {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: authData.session.expires_at,
    },
  });
}

async function handleMe(req: any, res: any) {
  const { user, error } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, error || "Session tidak valid.");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return sendError(res, 404, profileError?.message || "Profil user belum tersedia.");
  return sendJson(res, 200, { user: publicUser(profile, user.email || "") });
}

async function handlePublicServices(res: any) {
  const { data, error } = await supabaseAdmin
    .from("services")
    .select(publicServiceSelect)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) return sendError(res, 500, "Gagal mengambil data layanan.", error.message);
  return sendJson(res, 200, { services: (data || []).map(mapService) });
}

async function handlePublicJobs(res: any) {
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("id,title,company,company_logo,location,type,salary_min,salary_max,description,requirements,benefits,posted_date,category,applicants_count,status")
    .eq("status", "aktif")
    .order("posted_date", { ascending: false });

  if (error) return sendError(res, 500, "Gagal mengambil data lowongan.", error.message);
  return sendJson(res, 200, { jobs: (data || []).map(mapJob) });
}

async function handleOrders(req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("orders").select(orderSelect).eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) return sendError(res, 500, "Gagal mengambil data order.", error.message);
    return sendJson(res, 200, { orders: (data || []).map(mapOrder) });
  }

  if (req.method === "POST") {
    const { serviceId, requirements, buyerName, buyerEmail } = req.body || {};
    if (!serviceId) return sendError(res, 400, "serviceId wajib dikirim.");

    const { data: service, error: serviceError } = await supabaseAdmin.from("services").select("id,title,price").eq("id", serviceId).eq("active", true).single();
    if (serviceError || !service) return sendError(res, 404, "Layanan tidak ditemukan.");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        service_id: service.id,
        buyer_name: buyerName || user.user_metadata?.full_name || user.email || "KarirHub User",
        buyer_email: buyerEmail || user.email || "",
        service_title: service.title,
        service_price: service.price,
        requirements: requirements || "Pesanan dibuat dari checkout Jasa Karir.",
        status: "Baru",
      })
      .select(orderSelect)
      .single();

    if (error || !order) return sendError(res, 500, "Gagal membuat order.", error?.message);
    return sendJson(res, 201, { order: mapOrder(order) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleTransactions(req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("transactions").select("id,item_title,category,price,status,payment_method,va_number,created_at").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) return sendError(res, 500, "Gagal mengambil transaksi.", error.message);
    return sendJson(res, 200, { transactions: (data || []).map(mapTransaction) });
  }

  if (req.method === "POST") {
    const { orderId, itemTitle, category = "service", price, status = "Pending", paymentMethod } = req.body || {};
    if (!itemTitle || typeof price !== "number") return sendError(res, 400, "itemTitle dan price wajib dikirim.");

    if (orderId) {
      const { data: order } = await supabaseAdmin.from("orders").select("id").eq("id", orderId).eq("user_id", user.id).single();
      if (!order) return sendError(res, 403, "Order tidak valid untuk user ini.");
    }

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert({ user_id: user.id, order_id: orderId || null, item_title: itemTitle, category, price, status, payment_method: paymentMethod || "QRIS", va_number: virtualAccount(paymentMethod) })
      .select("id,item_title,category,price,status,payment_method,va_number,created_at")
      .single();

    if (error || !data) return sendError(res, 500, "Gagal membuat transaksi.", error?.message);
    return sendJson(res, 201, { transaction: mapTransaction(data) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleApplications(req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("applications").select("id,job_id,candidate_name,candidate_title,candidate_email,candidate_rating,candidate_experience,status,resume_summary,created_at,jobs(title)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) return sendError(res, 500, "Gagal mengambil lamaran.", error.message);
    return sendJson(res, 200, { applications: (data || []).map(mapApplication) });
  }

  if (req.method === "POST") {
    const { jobId, pitch, candidateTitle } = req.body || {};
    if (!jobId) return sendError(res, 400, "jobId wajib dikirim.");

    const { data: profile } = await supabaseAdmin.from("user_profiles").select("full_name").eq("id", user.id).single();
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .insert({
        user_id: user.id,
        job_id: jobId,
        candidate_name: profile?.full_name || user.user_metadata?.full_name || user.email || "KarirHub User",
        candidate_title: candidateTitle || "Job Seeker",
        candidate_email: user.email || "",
        candidate_rating: 4.9,
        candidate_experience: 0,
        status: "Baru",
        resume_summary: pitch || "Saya tertarik dengan posisi ini.",
      })
      .select("id,job_id,candidate_name,candidate_title,candidate_email,candidate_rating,candidate_experience,status,resume_summary,created_at,jobs(title)")
      .single();

    if (error || !application) return sendError(res, 500, "Gagal mengirim lamaran.", error?.message);
    await supabaseAdmin.rpc("increment_job_applicants", { job_uuid: jobId });
    return sendJson(res, 201, { application: mapApplication(application) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleAIPhoto(req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");
  if (req.method !== "POST") return sendError(res, 405, "Method not allowed");

  const { style, sourceImageUrl, resultImageUrl, status = "generated" } = req.body || {};
  if (!style) return sendError(res, 400, "style wajib dikirim.");

  const { data, error } = await supabaseAdmin
    .from("ai_photo_requests")
    .insert({ user_id: user.id, style, source_image_url: sourceImageUrl || null, result_image_url: resultImageUrl || null, status })
    .select("id,style,source_image_url,result_image_url,status,created_at")
    .single();

  if (error || !data) return sendError(res, 500, "Gagal menyimpan request AI Foto CV.", error?.message);
  return sendJson(res, 201, { request: { id: data.id, style: data.style, sourceImageUrl: data.source_image_url, resultImageUrl: data.result_image_url, status: data.status, createdAt: data.created_at } });
}

async function handleSellerServices(req: any, res: any) {
  const { user, profile, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user || !profile) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin.from("services").select(serviceSelect).eq("seller_id", user.id).order("created_at", { ascending: false });
    if (queryError) return sendError(res, 500, "Gagal mengambil layanan seller.", queryError.message);
    return sendJson(res, 200, { services: (data || []).map(mapService) });
  }

  if (req.method === "POST") {
    const { title, category, price, duration, description, active = true } = req.body || {};
    if (!title || typeof price !== "number" || !duration || !description) return sendError(res, 400, "title, price, duration, dan description wajib dikirim.");
    const { data, error: insertError } = await supabaseAdmin
      .from("services")
      .insert({ seller_id: user.id, title, provider_name: profile.full_name, provider_avatar: profile.avatar_url || profile.full_name?.slice(0, 2).toUpperCase() || "SL", category: parseServiceCategory(category), rating: 5, reviews_count: 0, price, duration, description, active: Boolean(active), status: active ? "active" : "inactive" })
      .select(serviceSelect)
      .single();
    if (insertError || !data) return sendError(res, 500, "Gagal membuat layanan.", insertError?.message);
    return sendJson(res, 201, { service: mapService(data) });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const { id, title, category, price, duration, description, active } = req.body || {};
    if (!id) return sendError(res, 400, "id layanan wajib dikirim.");
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = parseServiceCategory(category);
    if (price !== undefined) updates.price = price;
    if (duration !== undefined) updates.duration = duration;
    if (description !== undefined) updates.description = description;
    if (active !== undefined) {
      updates.active = Boolean(active);
      updates.status = active ? "active" : "inactive";
    }
    const { data, error: updateError } = await supabaseAdmin.from("services").update(updates).eq("id", id).eq("seller_id", user.id).select(serviceSelect).single();
    if (updateError || !data) return sendError(res, 404, "Layanan tidak ditemukan atau gagal diupdate.", updateError?.message);
    return sendJson(res, 200, { service: mapService(data) });
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || req.body?.id;
    if (!id) return sendError(res, 400, "id layanan wajib dikirim.");
    const { data, error: deleteError } = await supabaseAdmin.from("services").update({ active: false, status: "inactive" }).eq("id", id).eq("seller_id", user.id).select(serviceSelect).single();
    if (deleteError || !data) return sendError(res, 404, "Layanan tidak ditemukan atau gagal dinonaktifkan.", deleteError?.message);
    return sendJson(res, 200, { service: mapService(data) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleSellerOrders(req: any, res: any) {
  const { user, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin.from("orders").select(sellerOrderSelect).eq("services.seller_id", user.id).order("created_at", { ascending: false });
    if (queryError) return sendError(res, 500, "Gagal mengambil order seller.", queryError.message);
    return sendJson(res, 200, { orders: (data || []).map(mapSellerOrder) });
  }

  if (req.method === "PATCH") {
    const { id, orderStatus, sellerNotes, resultUrl } = req.body || {};
    const nextStatus = orderStatus || req.body?.status;
    if (!id || !["pending", "accepted", "in_progress", "completed", "cancelled"].includes(nextStatus)) return sendError(res, 400, "id dan orderStatus valid wajib dikirim.");
    const { data: existing } = await supabaseAdmin.from("orders").select(sellerOrderSelect).eq("id", id).eq("services.seller_id", user.id).single();
    if (!existing) return sendError(res, 404, "Order bukan milik layanan seller ini.");
    const updates: any = { order_status: nextStatus, status: sellerOrderStatusToPublic(nextStatus) };
    if (sellerNotes !== undefined) updates.seller_notes = sellerNotes;
    if (resultUrl !== undefined) updates.result_url = resultUrl;
    const { data, error: updateError } = await supabaseAdmin.from("orders").update(updates).eq("id", id).select(sellerOrderSelect).single();
    if (updateError || !data) return sendError(res, 500, "Order gagal diupdate.", updateError?.message);
    return sendJson(res, 200, { order: mapSellerOrder(data) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleSellerEarnings(req: any, res: any) {
  const { user, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const { data: orders, error: orderError } = await supabaseAdmin.from("orders").select("id,service_price,order_status,status,services!inner(seller_id)").eq("services.seller_id", user.id);
  if (orderError) return sendError(res, 500, "Gagal menghitung pendapatan seller.", orderError.message);

  const totalOrders = orders?.length || 0;
  const completedOrders = (orders || []).filter((order: any) => order.order_status === "completed" || order.status === "Selesai").length;
  const pendingOrders = (orders || []).filter((order: any) => ["pending", "accepted", "in_progress"].includes(order.order_status)).length;
  const grossRevenue = (orders || []).reduce((total: number, order: any) => (order.order_status === "completed" || order.status === "Selesai" ? total + (order.service_price || 0) : total), 0);
  return sendJson(res, 200, { earnings: { total_orders: totalOrders, completed_orders: completedOrders, pending_orders: pendingOrders, gross_revenue: grossRevenue, estimated_net_revenue: Math.round(grossRevenue * 0.9) } });
}

async function handleRecruiterJobs(req: any, res: any) {
  const { user, profile, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user || !profile) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin.from("jobs").select(jobSelect).eq("recruiter_id", user.id).order("created_at", { ascending: false });
    if (queryError) return sendError(res, 500, "Gagal mengambil lowongan recruiter.", queryError.message);
    return sendJson(res, 200, { jobs: (data || []).map(mapJob) });
  }

  if (req.method === "POST") {
    const { title, company, location, type, salaryMin, salaryMax, description, requirements, benefits, category, status: jobStatus = "aktif" } = req.body || {};
    if (!title || !location || !description) return sendError(res, 400, "title, location, dan description wajib dikirim.");
    const { data, error: insertError } = await supabaseAdmin
      .from("jobs")
      .insert({ recruiter_id: user.id, title, company: company || profile.company || profile.full_name || "KarirHub Recruiter", company_logo: profile.company?.slice(0, 2).toUpperCase() || "KH", location, type: type || "Full-time", salary_min: salaryMin || 0, salary_max: salaryMax || salaryMin || 0, description, requirements: Array.isArray(requirements) ? requirements : [], benefits: Array.isArray(benefits) ? benefits : [], posted_date: new Date().toISOString().slice(0, 10), category: category || "General", applicants_count: 0, status: jobStatus })
      .select(jobSelect)
      .single();
    if (insertError || !data) return sendError(res, 500, "Gagal membuat lowongan.", insertError?.message);
    return sendJson(res, 201, { job: mapJob(data) });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const { id, title, company, location, type, salaryMin, salaryMax, description, requirements, benefits, category, status: jobStatus } = req.body || {};
    if (!id) return sendError(res, 400, "id lowongan wajib dikirim.");
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (company !== undefined) updates.company = company;
    if (location !== undefined) updates.location = location;
    if (type !== undefined) updates.type = type;
    if (salaryMin !== undefined) updates.salary_min = salaryMin;
    if (salaryMax !== undefined) updates.salary_max = salaryMax;
    if (description !== undefined) updates.description = description;
    if (requirements !== undefined) updates.requirements = requirements;
    if (benefits !== undefined) updates.benefits = benefits;
    if (category !== undefined) updates.category = category;
    if (jobStatus !== undefined) updates.status = jobStatus;
    const { data, error: updateError } = await supabaseAdmin.from("jobs").update(updates).eq("id", id).eq("recruiter_id", user.id).select(jobSelect).single();
    if (updateError || !data) return sendError(res, 404, "Lowongan tidak ditemukan atau gagal diupdate.", updateError?.message);
    return sendJson(res, 200, { job: mapJob(data) });
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || req.body?.id;
    if (!id) return sendError(res, 400, "id lowongan wajib dikirim.");
    const { data, error: deleteError } = await supabaseAdmin.from("jobs").update({ status: "ditutup" }).eq("id", id).eq("recruiter_id", user.id).select(jobSelect).single();
    if (deleteError || !data) return sendError(res, 404, "Lowongan tidak ditemukan atau gagal ditutup.", deleteError?.message);
    return sendJson(res, 200, { job: mapJob(data) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleRecruiterApplicants(req: any, res: any) {
  const { user, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin.from("applications").select(appSelect).eq("jobs.recruiter_id", user.id).order("created_at", { ascending: false });
    if (queryError) return sendError(res, 500, "Gagal mengambil pelamar.", queryError.message);
    return sendJson(res, 200, { applicants: (data || []).map(mapRecruiterApplication) });
  }

  if (req.method === "PATCH") {
    const { id, applicationStatus, recruiterNotes } = req.body || {};
    const nextStatus = applicationStatus || req.body?.status;
    if (!id || !["submitted", "reviewed", "interview", "accepted", "rejected"].includes(nextStatus)) return sendError(res, 400, "id dan applicationStatus valid wajib dikirim.");
    const { data: existing } = await supabaseAdmin.from("applications").select(appSelect).eq("id", id).eq("jobs.recruiter_id", user.id).single();
    if (!existing) return sendError(res, 404, "Lamaran bukan milik lowongan recruiter ini.");
    const updates: any = { application_status: nextStatus, status: recruiterApplicationStatusToPublic(nextStatus) };
    if (recruiterNotes !== undefined) updates.recruiter_notes = recruiterNotes;
    const { data, error: updateError } = await supabaseAdmin.from("applications").update(updates).eq("id", id).select(appSelect).single();
    if (updateError || !data) return sendError(res, 500, "Lamaran gagal diupdate.", updateError?.message);
    return sendJson(res, 200, { applicant: mapRecruiterApplication(data) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleRecruiterTalent(req: any, res: any) {
  const { user, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const { data, error: queryError } = await supabaseAdmin
    .from("applications")
    .select("id,user_id,candidate_name,candidate_title,candidate_email,candidate_rating,candidate_experience,resume_summary,created_at,jobs!inner(id,title,recruiter_id),user_profiles(full_name,avatar_url)")
    .eq("jobs.recruiter_id", user.id)
    .order("created_at", { ascending: false });
  if (queryError) return sendError(res, 500, "Gagal mengambil talent pool.", queryError.message);
  const unique = new Map<string, any>();
  (data || []).forEach((row: any) => unique.set(row.user_id || row.candidate_email || row.id, row));
  return sendJson(res, 200, { candidates: Array.from(unique.values()).map(mapTalentCandidate) });
}

async function handleRecruiterStats(req: any, res: any) {
  const { user, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const { data: jobs, error: jobError } = await supabaseAdmin.from("jobs").select("id,status").eq("recruiter_id", user.id);
  if (jobError) return sendError(res, 500, "Gagal menghitung statistik lowongan.", jobError.message);
  const jobIds = (jobs || []).map((job: any) => job.id);
  let applicants: any[] = [];
  if (jobIds.length) {
    const { data, error: appError } = await supabaseAdmin.from("applications").select("id,application_status").in("job_id", jobIds);
    if (appError) return sendError(res, 500, "Gagal menghitung statistik pelamar.", appError.message);
    applicants = data || [];
  }
  return sendJson(res, 200, { stats: { total_jobs: jobs?.length || 0, active_jobs: (jobs || []).filter((job: any) => job.status === "aktif").length, closed_jobs: (jobs || []).filter((job: any) => job.status === "ditutup").length, total_applicants: applicants.length, applicants_reviewed: applicants.filter((app: any) => app.application_status === "reviewed").length, applicants_interview: applicants.filter((app: any) => app.application_status === "interview").length } });
}

function normalizeResumePayload(payload: any) {
  return {
    resume: payload?.resume || {},
    certifications: Array.isArray(payload?.certifications) ? payload.certifications : [],
    languages: Array.isArray(payload?.languages) ? payload.languages : [],
    portfolioLink: payload?.portfolioLink || "",
  };
}

function generateATSResume(payload: any) {
  const draft = normalizeResumePayload(payload);
  const resume = draft.resume || {};
  const experience = Array.isArray(resume.experience) ? resume.experience : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const skills = Array.isArray(resume.skills) ? resume.skills : [];

  return {
    personal: {
      fullName: resume.fullName || "",
      title: resume.title || "",
      email: resume.email || "",
      phone: resume.phone || "",
      location: resume.address || "",
      linkedin: resume.website || "",
      portfolio: draft.portfolioLink || "",
    },
    summary: resume.summary || "",
    experience: experience.map((item: any) => ({
      position: item.position,
      company: item.company,
      period: [item.startDate, item.endDate].filter(Boolean).join(" - "),
      bullets: String(item.description || "")
        .split("\n")
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean),
    })),
    education: education.map((item: any) => ({
      degree: item.degree,
      school: item.school,
      period: [item.startDate, item.endDate].filter(Boolean).join(" - "),
      details: item.description,
    })),
    skills,
    certifications: draft.certifications,
    languages: draft.languages,
    template: resume.template || "modern",
    atsScore: Math.min(98, 70 + Math.min(skills.length, 12) * 2 + Math.min(experience.length, 4) * 3),
    generatedAt: new Date().toISOString(),
  };
}

function enhanceExperienceText(text: string, jobTitle?: string) {
  const role = jobTitle || "the target role";
  const source = text || "Managed responsibilities and contributed to team goals.";
  const firstLine = source.split("\n").find(Boolean) || source;

  return [
    `Led ${role.toLowerCase()} initiatives by translating business requirements into measurable deliverables.`,
    `Developed ATS-friendly achievement bullets from prior responsibility: ${firstLine.replace(/^[-•*]\s*/, "").trim()}.`,
    "Improved collaboration, delivery quality, and operational efficiency through structured documentation and cross-functional communication.",
  ].join("\n");
}

function suggestResumeKeywords(jobTitle?: string, skills: string[] = []) {
  const text = `${jobTitle || ""} ${skills.join(" ")}`.toLowerCase();
  const suggestions = new Set<string>();

  if (text.includes("front") || text.includes("react")) ["React", "TypeScript", "JavaScript", "REST API", "Responsive Design", "Git"].forEach((item) => suggestions.add(item));
  if (text.includes("data")) ["SQL", "Python", "Dashboarding", "Data Visualization", "ETL", "Business Insight"].forEach((item) => suggestions.add(item));
  if (text.includes("product")) ["Product Strategy", "PRD", "Agile", "User Research", "Roadmap", "Analytics"].forEach((item) => suggestions.add(item));
  if (text.includes("design") || text.includes("ui")) ["Figma", "User Research", "Wireframing", "Prototyping", "Design System"].forEach((item) => suggestions.add(item));

  ["Communication", "Problem Solving", "Cross-functional Collaboration"].forEach((item) => suggestions.add(item));
  skills.forEach((skill) => suggestions.delete(skill));

  return Array.from(suggestions).slice(0, 8);
}

async function handleResumeBuilder(route: string, req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  const action = route.replace(/^resume-builder\/?/, "");

  if (action === "draft" && req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("resume_drafts")
      .select("id,resume_data,generated_resume,updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return sendError(res, 500, "Gagal mengambil draft resume.", error.message);
    return sendJson(res, 200, { draft: data || null });
  }

  if (action === "draft" && (req.method === "POST" || req.method === "PATCH")) {
    const resumeData = normalizeResumePayload(req.body || {});
    const { data, error } = await supabaseAdmin
      .from("resume_drafts")
      .upsert({ user_id: user.id, resume_data: resumeData })
      .select("id,resume_data,generated_resume,updated_at")
      .single();

    if (error || !data) return sendError(res, 500, "Gagal menyimpan draft resume.", error?.message);
    return sendJson(res, 200, { draft: data });
  }

  if (action === "draft" && req.method === "DELETE") {
    const section = req.query?.section || req.body?.section;
    const itemId = req.query?.id || req.body?.id;
    const { data: existing, error: readError } = await supabaseAdmin
      .from("resume_drafts")
      .select("resume_data")
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) return sendError(res, 500, "Gagal membaca draft resume.", readError.message);
    if (!existing) return sendJson(res, 200, { draft: null });

    const draft = normalizeResumePayload(existing.resume_data);
    if (section === "experience" || section === "education") {
      draft.resume[section] = (draft.resume[section] || []).filter((item: any) => item.id !== itemId);
    } else if (section === "skills") {
      draft.resume.skills = (draft.resume.skills || []).filter((item: string) => item !== itemId);
    } else if (section === "certifications") {
      draft.certifications = draft.certifications.filter((item: any) => item.id !== itemId);
    } else if (section === "languages") {
      draft.languages = draft.languages.filter((item: any) => item.id !== itemId);
    }

    const { data, error } = await supabaseAdmin
      .from("resume_drafts")
      .upsert({ user_id: user.id, resume_data: draft })
      .select("id,resume_data,generated_resume,updated_at")
      .single();

    if (error || !data) return sendError(res, 500, "Gagal menghapus bagian resume.", error?.message);
    return sendJson(res, 200, { draft: data });
  }

  if (action === "generate" && req.method === "POST") {
    const resumeData = normalizeResumePayload(req.body || {});
    const generated = generateATSResume(resumeData);
    const { data, error } = await supabaseAdmin
      .from("resume_drafts")
      .upsert({ user_id: user.id, resume_data: resumeData, generated_resume: generated })
      .select("id,resume_data,generated_resume,updated_at")
      .single();

    if (error || !data) return sendError(res, 500, "Gagal generate resume.", error?.message);
    return sendJson(res, 200, { generatedResume: generated, draft: data });
  }

  if (action === "enhance" && req.method === "POST") {
    const { text, jobTitle } = req.body || {};
    return sendJson(res, 200, { enhancedText: enhanceExperienceText(text || "", jobTitle) });
  }

  if (action === "keywords" && req.method === "POST") {
    const { jobTitle, skills } = req.body || {};
    return sendJson(res, 200, { keywords: suggestResumeKeywords(jobTitle, Array.isArray(skills) ? skills : []) });
  }

  return sendError(res, 404, `Endpoint /api/${route} tidak ditemukan.`);
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const route = routeOf(req);
  const method = req.method;

  try {
    if (route === "auth/register" && method === "POST") return handleRegister(req, res);
    if (route === "auth/login" && method === "POST") return handleLogin(req, res);
    if (route === "auth/me" && method === "GET") return handleMe(req, res);
    if (route === "services" && method === "GET") return handlePublicServices(res);
    if (route === "jobs" && method === "GET") return handlePublicJobs(res);
    if (route === "orders") return handleOrders(req, res);
    if (route === "transactions") return handleTransactions(req, res);
    if (route === "applications") return handleApplications(req, res);
    if (route === "ai-photo") return handleAIPhoto(req, res);
    if (route === "seller/services") return handleSellerServices(req, res);
    if (route === "seller/orders") return handleSellerOrders(req, res);
    if (route === "seller/earnings") return handleSellerEarnings(req, res);
    if (route === "recruiter/jobs") return handleRecruiterJobs(req, res);
    if (route === "recruiter/applicants") return handleRecruiterApplicants(req, res);
    if (route === "recruiter/talent-pool") return handleRecruiterTalent(req, res);
    if (route === "recruiter/stats") return handleRecruiterStats(req, res);
    if (route === "resume-builder" || route.startsWith("resume-builder/")) return handleResumeBuilder(route, req, res);

    return sendError(res, 404, `Endpoint /api/${route} tidak ditemukan.`);
  } catch (error) {
    return sendError(res, 500, "Terjadi kesalahan server.", error instanceof Error ? error.message : error);
  }
}
