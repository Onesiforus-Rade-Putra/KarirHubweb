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

function sellerRequestContext(req: any, user?: any, profile?: any) {
  let pathname = "";
  try {
    pathname = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`).pathname;
  } catch {
    pathname = req.url || "";
  }

  return {
    method: req.method,
    pathname,
    userId: user?.id,
    role: profile?.role,
  };
}

function logSellerEndpointError(endpoint: string, error: any, context: Record<string, unknown> = {}) {
  console.error(`[seller endpoint error] ${endpoint}`, {
    ...context,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  });
}

function supabaseErrorDetail(error: any) {
  return [error?.message, error?.details, error?.hint, error?.code ? `code=${error.code}` : ""].filter(Boolean).join(" | ");
}

function routeValueToString(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join("/");
  return typeof value === "string" ? value : "";
}

function cleanApiRoute(value: string) {
  return value
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/^(api\/)+/, "");
}

function normalizeApiPath(req: any) {
  const query = req.query || {};
  const routeFromQuery = cleanApiRoute(routeValueToString(query.route || query["...route"] || query.slug || query.path || query["0"]));

  let pathname = "/";
  try {
    pathname = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`).pathname;
  } catch {
    pathname = "/";
  }

  if (pathname === "/" || pathname === "/api" || pathname === "/api/" || pathname === "/api/[...route]") {
    pathname = routeFromQuery ? `/api/${routeFromQuery}` : "/api";
  }

  pathname = `/${cleanApiRoute(pathname)}`;
  if (pathname === "/") pathname = "/api";
  return pathname || "/api";
}

function rawPathname(req: any) {
  try {
    return new URL(req.url || "/", `https://${req.headers.host || "localhost"}`).pathname;
  } catch {
    return req.url || "";
  }
}

function logRawApiRequest(req: any) {
  const routeQuery = req.query?.route;
  console.log("[api request raw]", {
    method: req.method,
    url: req.url,
    queryRoute: routeQuery,
    queryRouteType: Array.isArray(routeQuery) ? "array" : typeof routeQuery,
    pathname: rawPathname(req),
  });
}

function logRouteSelection(req: any, route: string, handlerName: string) {
  console.log("[api route selected]", {
    method: req.method,
    url: req.url,
    normalizedPathname: normalizeApiPath(req),
    route,
    handlerName,
  });
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

function defaultProfileDetails(user: any, profile: any) {
  return {
    title: profile.role === "recruiter" ? "Recruiter" : profile.role === "seller" ? "Pakar Karir" : "Job Seeker",
    location: "",
    phone: "",
    website: "",
    about: "",
    language: "id",
    region: "ID",
    email_notifications: true,
    product_notifications: false,
    payment_methods: [],
  };
}

function mapProfilePayload(user: any, profile: any, details: any, experiences: any[], educations: any[], certifications: any[], skills: any[], cvFiles: any[]) {
  const safeDetails = details || defaultProfileDetails(user, profile);

  return {
    user: publicUser(profile, user.email || ""),
    details: {
      title: safeDetails.title || "",
      location: safeDetails.location || "",
      phone: safeDetails.phone || "",
      website: safeDetails.website || "",
      about: safeDetails.about || "",
    },
    experiences: (experiences || []).map((item: any) => ({
      id: item.id,
      role: item.role,
      company: item.company,
      startDate: item.start_date || "",
      endDate: item.end_date || "",
      isCurrent: Boolean(item.is_current),
      description: item.description || "",
    })),
    educations: (educations || []).map((item: any) => ({
      id: item.id,
      school: item.school,
      degree: item.degree,
      period: item.period || "",
    })),
    certifications: (certifications || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      issuer: item.issuer,
    })),
    skills: (skills || []).map((item: any) => item.skill).filter(Boolean),
    cvFiles: (cvFiles || []).map((item: any) => ({
      id: item.id,
      fileName: item.file_name,
      fileSize: item.file_size || 0,
      fileType: item.file_type || "",
      downloadUrl: item.download_url || "",
      source: item.source || "local-metadata",
      createdAt: item.created_at,
    })),
    settings: {
      language: safeDetails.language || "id",
      region: safeDetails.region || "ID",
      emailNotifications: safeDetails.email_notifications !== false,
      productNotifications: Boolean(safeDetails.product_notifications),
      paymentMethods: Array.isArray(safeDetails.payment_methods) ? safeDetails.payment_methods : [],
    },
  };
}

async function readProfileBundle(user: any) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: profileError?.message || "Profil user belum tersedia.", profile: null };
  }

  const [detailsResult, expResult, eduResult, certResult, skillResult, cvResult] = await Promise.all([
    supabaseAdmin.from("user_profile_details").select("*").eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("user_profile_experiences").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabaseAdmin.from("user_profile_educations").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabaseAdmin.from("user_profile_certifications").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabaseAdmin.from("user_profile_skills").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabaseAdmin.from("user_cv_files").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const firstError = detailsResult.error || expResult.error || eduResult.error || certResult.error || skillResult.error || cvResult.error;
  if (firstError) return { error: firstError.message, profile: null };

  return {
    error: null,
    profile: mapProfilePayload(
      user,
      profile,
      detailsResult.data,
      expResult.data || [],
      eduResult.data || [],
      certResult.data || [],
      skillResult.data || [],
      cvResult.data || []
    ),
  };
}

async function replaceProfileList(table: string, userId: string, rows: any[]) {
  const { error: deleteError } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
  if (deleteError) return deleteError;
  if (!rows.length) return null;
  const { error } = await supabaseAdmin.from(table).insert(rows);
  return error;
}

async function handleProfile(req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const bundle = await readProfileBundle(user);
    if (bundle.error) return sendError(res, 500, "Gagal mengambil profil user.", bundle.error);
    return sendJson(res, 200, { profile: bundle.profile });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const payload = req.body || {};
    const userPatch = payload.user || {};
    const details = payload.details || {};
    const settings = payload.settings || {};

    if (userPatch.name) {
      const profileUpdates: any = { full_name: userPatch.name };
      if (userPatch.avatar !== undefined) profileUpdates.avatar_url = userPatch.avatar || null;
      if (userPatch.company !== undefined) profileUpdates.company = userPatch.company || null;
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update(profileUpdates)
        .eq("id", user.id);
      if (error) return sendError(res, 500, "Gagal memperbarui data akun.", error.message);
    }

    const detailRow: any = {
      user_id: user.id,
      title: details.title,
      location: details.location,
      phone: details.phone,
      website: details.website,
      about: details.about,
      language: settings.language,
      region: settings.region,
      email_notifications: settings.emailNotifications,
      product_notifications: settings.productNotifications,
      payment_methods: Array.isArray(settings.paymentMethods) ? settings.paymentMethods : undefined,
    };
    Object.keys(detailRow).forEach((key) => detailRow[key] === undefined && delete detailRow[key]);

    const { error: detailError } = await supabaseAdmin.from("user_profile_details").upsert(detailRow);
    if (detailError) return sendError(res, 500, "Gagal menyimpan detail profil.", detailError.message);

    if (Array.isArray(payload.experiences)) {
      const error = await replaceProfileList(
        "user_profile_experiences",
        user.id,
        payload.experiences.map((item: any, index: number) => ({
          user_id: user.id,
          role: item.role || "Role",
          company: item.company || "Perusahaan",
          start_date: item.startDate || "",
          end_date: item.endDate || "",
          is_current: Boolean(item.isCurrent),
          description: item.description || "",
          sort_order: index,
        }))
      );
      if (error) return sendError(res, 500, "Gagal menyimpan pengalaman.", error.message);
    }

    if (Array.isArray(payload.educations)) {
      const error = await replaceProfileList(
        "user_profile_educations",
        user.id,
        payload.educations.map((item: any, index: number) => ({
          user_id: user.id,
          school: item.school || "Institusi",
          degree: item.degree || "Gelar",
          period: item.period || "",
          sort_order: index,
        }))
      );
      if (error) return sendError(res, 500, "Gagal menyimpan pendidikan.", error.message);
    }

    if (Array.isArray(payload.certifications)) {
      const error = await replaceProfileList(
        "user_profile_certifications",
        user.id,
        payload.certifications.map((item: any, index: number) => ({
          user_id: user.id,
          name: item.name || "Sertifikasi",
          issuer: item.issuer || "Issuer",
          sort_order: index,
        }))
      );
      if (error) return sendError(res, 500, "Gagal menyimpan sertifikasi.", error.message);
    }

    if (Array.isArray(payload.skills)) {
      const uniqueSkills = Array.from(new Set(payload.skills.map((skill: any) => String(skill || "").trim()).filter(Boolean)));
      const error = await replaceProfileList(
        "user_profile_skills",
        user.id,
        uniqueSkills.map((skill, index) => ({ user_id: user.id, skill, sort_order: index }))
      );
      if (error) return sendError(res, 500, "Gagal menyimpan skill.", error.message);
    }

    const bundle = await readProfileBundle(user);
    if (bundle.error) return sendError(res, 500, "Profil tersimpan, tetapi gagal dimuat ulang.", bundle.error);
    return sendJson(res, 200, { profile: bundle.profile });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleProfileCv(req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "POST") {
    const { fileName, fileSize = 0, fileType, downloadUrl } = req.body || {};
    if (!fileName) return sendError(res, 400, "Nama file CV wajib dikirim.");

    const { data, error } = await supabaseAdmin
      .from("user_cv_files")
      .insert({
        user_id: user.id,
        file_name: String(fileName).slice(0, 180),
        file_size: Number(fileSize) || 0,
        file_type: fileType || null,
        download_url: downloadUrl || null,
        source: downloadUrl ? "supabase-storage" : "local-metadata",
      })
      .select("*")
      .single();

    if (error || !data) return sendError(res, 500, "Gagal menyimpan metadata CV.", error?.message);
    return sendJson(res, 201, {
      cvFile: {
        id: data.id,
        fileName: data.file_name,
        fileSize: data.file_size,
        fileType: data.file_type || "",
        downloadUrl: data.download_url || "",
        source: data.source,
        createdAt: data.created_at,
      },
    });
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || req.body?.id;
    if (!id) return sendError(res, 400, "id CV wajib dikirim.");
    const { error } = await supabaseAdmin.from("user_cv_files").delete().eq("id", id).eq("user_id", user.id);
    if (error) return sendError(res, 500, "Gagal menghapus CV.", error.message);
    return sendJson(res, 200, { ok: true });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleSettings(req: any, res: any) {
  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const bundle = await readProfileBundle(user);
    if (bundle.error) return sendError(res, 500, "Gagal mengambil pengaturan.", bundle.error);
    return sendJson(res, 200, { settings: bundle.profile?.settings, user: bundle.profile?.user });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const payload = req.body || {};
    const row: any = {
      user_id: user.id,
      language: payload.language,
      region: payload.region,
      email_notifications: payload.emailNotifications,
      product_notifications: payload.productNotifications,
      payment_methods: Array.isArray(payload.paymentMethods) ? payload.paymentMethods : undefined,
    };
    Object.keys(row).forEach((key) => row[key] === undefined && delete row[key]);
    const { error } = await supabaseAdmin.from("user_profile_details").upsert(row);
    if (error) return sendError(res, 500, "Gagal menyimpan pengaturan.", error.message);
    const bundle = await readProfileBundle(user);
    if (bundle.error) return sendError(res, 500, "Pengaturan tersimpan, tetapi gagal dimuat ulang.", bundle.error);
    return sendJson(res, 200, { settings: bundle.profile?.settings });
  }

  return sendError(res, 405, "Method not allowed");
}

function mapSellerProfileBundle(profile: any, base: any, specializations: any[], experiences: any[], certificates: any[], portfolios: any[]) {
  return {
    basic: {
      photoUrl: base?.photo_url || profile.avatar_url || "",
      fullName: base?.full_name || profile.full_name || "",
      tagline: base?.tagline || "",
      bio: base?.bio || "",
    },
    specializations: (specializations || []).map((item: any) => item.specialization).filter(Boolean),
    experiences: (experiences || []).map((item: any) => ({
      id: item.id,
      position: item.position || "",
      company: item.company || "",
      startDate: item.start_date || "",
      endDate: item.end_date || "",
      description: item.description || "",
    })),
    certificates: (certificates || []).map((item: any) => ({
      id: item.id,
      name: item.name || "",
      issuer: item.issuer || "",
      year: item.year || "",
    })),
    portfolios: (portfolios || []).map((item: any) => ({
      id: item.id,
      title: item.title || "",
      description: item.description || "",
      link: item.link || "",
    })),
  };
}

async function readSellerProfileBundle(user: any, profile: any, req?: any) {
  const [baseResult, specResult, expResult, certResult, portfolioResult] = await Promise.all([
    supabaseAdmin.from("seller_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("seller_specializations").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabaseAdmin.from("seller_experiences").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabaseAdmin.from("seller_certificates").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabaseAdmin.from("seller_portfolios").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
  ]);
  const firstError = baseResult.error || specResult.error || expResult.error || certResult.error || portfolioResult.error;
  if (firstError) {
    logSellerEndpointError("GET /api/seller/profile", firstError, req ? sellerRequestContext(req, user, profile) : { userId: user.id, role: profile?.role });
    return { error: supabaseErrorDetail(firstError), profile: null };
  }
  return { error: null, profile: mapSellerProfileBundle(profile, baseResult.data, specResult.data || [], expResult.data || [], certResult.data || [], portfolioResult.data || []) };
}

async function handleSellerProfile(req: any, res: any) {
  const { user, profile, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user || !profile) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const bundle = await readSellerProfileBundle(user, profile, req);
    if (bundle.error) return sendError(res, 500, "Gagal mengambil profil seller.", bundle.error);
    return sendJson(res, 200, { profile: bundle.profile });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const payload = req.body || {};
    const basic = payload.basic || {};
    const { error: baseError } = await supabaseAdmin.from("seller_profiles").upsert({
      user_id: user.id,
      photo_url: basic.photoUrl || null,
      full_name: basic.fullName || profile.full_name || "",
      tagline: basic.tagline || "",
      bio: basic.bio || "",
    }, { onConflict: "user_id" });
    if (baseError) {
      logSellerEndpointError("PATCH /api/seller/profile base upsert", baseError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "PATCH /api/seller/profile gagal menyimpan profil dasar seller.", supabaseErrorDetail(baseError));
    }

    const spec = Array.isArray(payload.specializations) ? Array.from(new Set(payload.specializations.map((item: any) => String(item || "").trim()).filter(Boolean))) : [];
    let listError =
      await replaceProfileList("seller_specializations", user.id, spec.map((specialization, index) => ({ user_id: user.id, specialization, sort_order: index })));
    if (listError) {
      logSellerEndpointError("PATCH /api/seller/profile specializations", listError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "PATCH /api/seller/profile gagal menyimpan spesialisasi seller.", supabaseErrorDetail(listError));
    }

    listError = await replaceProfileList("seller_experiences", user.id, (payload.experiences || []).map((item: any, index: number) => ({
      user_id: user.id,
      position: item.position || "Posisi",
      company: item.company || "Perusahaan",
      start_date: item.startDate || "",
      end_date: item.endDate || "",
      description: item.description || "",
      sort_order: index,
    })));
    if (listError) {
      logSellerEndpointError("PATCH /api/seller/profile experiences", listError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "PATCH /api/seller/profile gagal menyimpan pengalaman seller.", supabaseErrorDetail(listError));
    }

    listError = await replaceProfileList("seller_certificates", user.id, (payload.certificates || []).map((item: any, index: number) => ({
      user_id: user.id,
      name: item.name || "Sertifikat",
      issuer: item.issuer || "Institusi",
      year: item.year || "",
      sort_order: index,
    })));
    if (listError) {
      logSellerEndpointError("PATCH /api/seller/profile certificates", listError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "PATCH /api/seller/profile gagal menyimpan sertifikat seller.", supabaseErrorDetail(listError));
    }

    listError = await replaceProfileList("seller_portfolios", user.id, (payload.portfolios || []).map((item: any, index: number) => ({
      user_id: user.id,
      title: item.title || "Portfolio",
      description: item.description || "",
      link: item.link || "",
      sort_order: index,
    })));
    if (listError) {
      logSellerEndpointError("PATCH /api/seller/profile portfolios", listError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "PATCH /api/seller/profile gagal menyimpan portfolio seller.", supabaseErrorDetail(listError));
    }

    const bundle = await readSellerProfileBundle(user, profile, req);
    if (bundle.error) return sendError(res, 500, "Profil seller tersimpan, tetapi gagal dimuat ulang.", bundle.error);
    return sendJson(res, 200, { profile: bundle.profile });
  }

  return sendError(res, 405, "Method not allowed");
}

function mapRecruiterProfileBundle(profile: any, base: any, benefits: any[], locations: any[], teamMembers: any[]) {
  return {
    company: {
      logoUrl: base?.logo_url || "",
      companyName: base?.company_name || profile.company || profile.full_name || "",
      industry: base?.industry || "",
      companySize: base?.company_size || "",
      companyEmail: base?.company_email || "",
      phone: base?.phone || "",
      website: base?.website || "",
      about: base?.about || "",
    },
    benefits: (benefits || []).map((item: any) => item.benefit).filter(Boolean),
    locations: (locations || []).map((item: any) => ({
      id: item.id,
      name: item.name || "",
      address: item.address || "",
      city: item.city || "",
      officeType: item.office_type || "Branch Office",
    })),
    teamMembers: (teamMembers || []).map((item: any) => ({
      id: item.id,
      name: item.name || "",
      position: item.position || "",
      email: item.email || "",
    })),
  };
}

async function readRecruiterProfileBundle(user: any, profile: any) {
  const [baseResult, benefitResult, locationResult, teamResult] = await Promise.all([
    supabaseAdmin.from("recruiter_company_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("recruiter_company_benefits").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabaseAdmin.from("recruiter_office_locations").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabaseAdmin.from("recruiter_team_members").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
  ]);
  const firstError = baseResult.error || benefitResult.error || locationResult.error || teamResult.error;
  if (firstError) return { error: firstError.message, profile: null };
  return { error: null, profile: mapRecruiterProfileBundle(profile, baseResult.data, benefitResult.data || [], locationResult.data || [], teamResult.data || []) };
}

async function handleRecruiterProfile(req: any, res: any) {
  const { user, profile, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user || !profile) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const bundle = await readRecruiterProfileBundle(user, profile);
    if (bundle.error) return sendError(res, 500, "Gagal mengambil profil recruiter.", bundle.error);
    return sendJson(res, 200, { profile: bundle.profile });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    const payload = req.body || {};
    const company = payload.company || {};
    const { error: baseError } = await supabaseAdmin.from("recruiter_company_profiles").upsert({
      user_id: user.id,
      logo_url: company.logoUrl || null,
      company_name: company.companyName || profile.company || profile.full_name || "",
      industry: company.industry || "",
      company_size: company.companySize || "",
      company_email: company.companyEmail || "",
      phone: company.phone || "",
      website: company.website || "",
      about: company.about || "",
    }, { onConflict: "user_id" });
    if (baseError) return sendError(res, 500, "Gagal menyimpan profil perusahaan.", baseError.message);

    const benefits = Array.isArray(payload.benefits) ? Array.from(new Set(payload.benefits.map((item: any) => String(item || "").trim()).filter(Boolean))) : [];
    let listError = await replaceProfileList("recruiter_company_benefits", user.id, benefits.map((benefit, index) => ({ user_id: user.id, benefit, sort_order: index })));
    if (listError) return sendError(res, 500, "Gagal menyimpan benefit perusahaan.", listError.message);

    listError = await replaceProfileList("recruiter_office_locations", user.id, (payload.locations || []).map((item: any, index: number) => ({
      user_id: user.id,
      name: item.name || "Lokasi Kantor",
      address: item.address || "",
      city: item.city || "",
      office_type: item.officeType === "Head Office" ? "Head Office" : "Branch Office",
      sort_order: index,
    })));
    if (listError) return sendError(res, 500, "Gagal menyimpan lokasi kantor.", listError.message);

    listError = await replaceProfileList("recruiter_team_members", user.id, (payload.teamMembers || []).map((item: any, index: number) => ({
      user_id: user.id,
      name: item.name || "Anggota Tim",
      position: item.position || "",
      email: item.email || "",
      sort_order: index,
    })));
    if (listError) return sendError(res, 500, "Gagal menyimpan tim rekrutmen.", listError.message);

    const bundle = await readRecruiterProfileBundle(user, profile);
    if (bundle.error) return sendError(res, 500, "Profil recruiter tersimpan, tetapi gagal dimuat ulang.", bundle.error);
    return sendJson(res, 200, { profile: bundle.profile });
  }

  return sendError(res, 405, "Method not allowed");
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
    if (queryError) {
      logSellerEndpointError("GET /api/seller/services", queryError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "GET /api/seller/services gagal mengambil layanan seller.", supabaseErrorDetail(queryError));
    }
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
    if (insertError || !data) {
      logSellerEndpointError("POST /api/seller/services", insertError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "POST /api/seller/services gagal membuat layanan seller.", supabaseErrorDetail(insertError));
    }
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
    if (updateError || !data) {
      logSellerEndpointError("PATCH /api/seller/services", updateError, sellerRequestContext(req, user, profile));
      return sendError(res, 404, "PATCH /api/seller/services gagal mengupdate layanan seller.", supabaseErrorDetail(updateError));
    }
    return sendJson(res, 200, { service: mapService(data) });
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || req.body?.id;
    if (!id) return sendError(res, 400, "id layanan wajib dikirim.");
    const { data, error: deleteError } = await supabaseAdmin.from("services").update({ active: false, status: "inactive" }).eq("id", id).eq("seller_id", user.id).select(serviceSelect).single();
    if (deleteError || !data) {
      logSellerEndpointError("DELETE /api/seller/services", deleteError, sellerRequestContext(req, user, profile));
      return sendError(res, 404, "DELETE /api/seller/services gagal menonaktifkan layanan seller.", supabaseErrorDetail(deleteError));
    }
    return sendJson(res, 200, { service: mapService(data) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleSellerOrders(req: any, res: any) {
  const { user, profile, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin.from("orders").select(sellerOrderSelect).eq("services.seller_id", user.id).order("created_at", { ascending: false });
    if (queryError) {
      logSellerEndpointError("GET /api/seller/orders", queryError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "GET /api/seller/orders gagal mengambil order seller.", supabaseErrorDetail(queryError));
    }
    return sendJson(res, 200, { orders: (data || []).map(mapSellerOrder) });
  }

  if (req.method === "PATCH") {
    const { id, orderStatus, sellerNotes, resultUrl } = req.body || {};
    const nextStatus = orderStatus || req.body?.status;
    if (!id || !["pending", "accepted", "in_progress", "completed", "cancelled"].includes(nextStatus)) return sendError(res, 400, "id dan orderStatus valid wajib dikirim.");
    const { data: existing, error: existingError } = await supabaseAdmin.from("orders").select(sellerOrderSelect).eq("id", id).eq("services.seller_id", user.id).single();
    if (existingError) {
      logSellerEndpointError("PATCH /api/seller/orders read", existingError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "PATCH /api/seller/orders gagal membaca order seller.", supabaseErrorDetail(existingError));
    }
    if (!existing) return sendError(res, 404, "Order bukan milik layanan seller ini.");
    const updates: any = { order_status: nextStatus, status: sellerOrderStatusToPublic(nextStatus) };
    if (sellerNotes !== undefined) updates.seller_notes = sellerNotes;
    if (resultUrl !== undefined) updates.result_url = resultUrl;
    const { data, error: updateError } = await supabaseAdmin.from("orders").update(updates).eq("id", id).select(sellerOrderSelect).single();
    if (updateError || !data) {
      logSellerEndpointError("PATCH /api/seller/orders update", updateError, sellerRequestContext(req, user, profile));
      return sendError(res, 500, "PATCH /api/seller/orders gagal mengupdate order.", supabaseErrorDetail(updateError));
    }
    return sendJson(res, 200, { order: mapSellerOrder(data) });
  }

  return sendError(res, 405, "Method not allowed");
}

async function handleSellerEarnings(req: any, res: any) {
  const { user, profile, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");
  if (req.method !== "GET") return sendError(res, 405, "Method not allowed");

  const { data: orders, error: orderError } = await supabaseAdmin.from("orders").select("id,service_price,order_status,status,services!inner(seller_id)").eq("services.seller_id", user.id);
  if (orderError) {
    logSellerEndpointError("GET /api/seller/earnings", orderError, sellerRequestContext(req, user, profile));
    return sendError(res, 500, "GET /api/seller/earnings gagal menghitung pendapatan seller.", supabaseErrorDetail(orderError));
  }

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
  const required = [resume.fullName, resume.email, resume.phone, resume.title, resume.summary];
  const contactScore = required.filter((item: any) => String(item || "").trim()).length * 6;
  const structureScore =
    Math.min(experience.length, 3) * 8 +
    Math.min(education.length, 2) * 6 +
    (draft.certifications.length ? 4 : 0) +
    (draft.languages.length ? 4 : 0);
  const keywordText = `${resume.title || ""} ${resume.summary || ""} ${skills.join(" ")} ${experience.map((item: any) => item.description || "").join(" ")}`.toLowerCase();
  const keywordMatches = ["react", "typescript", "javascript", "api", "sql", "agile", "lead", "develop", "implement", "improve", "collaborat", "analyt"].filter((word) => keywordText.includes(word)).length;
  const keywordScore = Math.min(30, skills.length * 2 + keywordMatches * 2);
  const impactScore = experience.some((item: any) => /\d|%|increased|reduced|improved|optimized/i.test(item.description || "")) ? 10 : 0;
  const linkScore = resume.website || draft.portfolioLink ? 4 : 0;
  const atsScore = Math.min(100, contactScore + structureScore + keywordScore + impactScore + linkScore);

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
    atsScore,
    scoreBreakdown: [
      contactScore >= 24 ? "Kontak dan headline lengkap." : "Lengkapi nama, email, telepon, headline, dan summary.",
      structureScore >= 20 ? "Struktur utama resume sudah terbaca ATS." : "Tambahkan pengalaman, pendidikan, sertifikasi, atau bahasa.",
      keywordScore >= 22 ? "Keyword relevan cukup kuat." : "Tambahkan skill dan kata kerja yang sesuai target posisi.",
      impactScore ? "Bullet sudah punya dampak terukur." : "Tambahkan angka, persen, atau hasil bisnis pada bullet pengalaman.",
    ],
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

function escapeHtml(value: any) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderGeneratedResumeHtml(generated: any) {
  const template = generated?.template || "modern";
  const isCorporate = template === "corporate";
  const isFresh = template === "minimalist";
  const accent = isCorporate ? "#0f172a" : isFresh ? "#047857" : "#1d4ed8";
  const fontFamily = isCorporate ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif";
  const personal = generated?.personal || {};
  const contact = [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio].filter(Boolean).map(escapeHtml).join(" | ");
  const section = (title: string, body: string) =>
    body ? `<section style="margin-top:22px;"><h2 style="margin:0 0 10px;color:${accent};font-size:13px;letter-spacing:.08em;text-transform:uppercase;${isCorporate ? "border-bottom:1px solid #cbd5e1;padding-bottom:4px;" : ""}">${title}</h2>${body}</section>` : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(personal.fullName || "Resume")}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: ${fontFamily}; }
    main { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 18mm; }
    h1 { margin: 0; font-size: ${isCorporate ? "28px" : "34px"}; text-transform: ${isCorporate ? "uppercase" : "none"}; letter-spacing: ${isCorporate ? ".08em" : "0"}; }
    p { margin: 0; line-height: 1.5; }
    ul { margin: 8px 0 0 18px; padding: 0; }
    li { margin: 4px 0; line-height: 1.45; }
    .header { ${isFresh ? `border-left: 5px solid ${accent}; padding-left: 18px;` : isCorporate ? "text-align:center;border-bottom:4px solid #0f172a;padding-bottom:18px;" : "border-bottom:1px solid #bfdbfe;padding-bottom:18px;"} }
    .title { margin-top: 5px; color: ${accent}; font-weight: 700; }
    .contact { margin-top: 8px; font-size: 12px; color: #475569; }
    .item { margin-top: 12px; }
    .row { display:flex; justify-content:space-between; gap:18px; font-weight:700; }
    .meta { color:#475569; font-size:12px; white-space:nowrap; }
    .skills { display:flex; flex-wrap:wrap; gap:6px; }
    .skill { border:1px solid #cbd5e1; padding:4px 8px; font-size:12px; }
    @media print { body { background: #fff; } main { width: auto; min-height: auto; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  <main>
    <header class="header">
      <h1>${escapeHtml(personal.fullName || "Your Name")}</h1>
      <p class="title">${escapeHtml(personal.title || "Target Role")}</p>
      <p class="contact">${contact}</p>
    </header>
    ${section("Professional Summary", generated?.summary ? `<p>${escapeHtml(generated.summary)}</p>` : "")}
    ${section(
      "Experience",
      (generated?.experience || [])
        .map((item: any) => `<div class="item"><div class="row"><span>${escapeHtml(item.position || "Role")} - ${escapeHtml(item.company || "Company")}</span><span class="meta">${escapeHtml(item.period)}</span></div><ul>${(item.bullets || []).map((bullet: string) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul></div>`)
        .join("")
    )}
    ${section(
      "Education",
      (generated?.education || [])
        .map((item: any) => `<div class="item"><div class="row"><span>${escapeHtml(item.degree || "Degree")} - ${escapeHtml(item.school || "School")}</span><span class="meta">${escapeHtml(item.period)}</span></div>${item.details ? `<p>${escapeHtml(item.details)}</p>` : ""}</div>`)
        .join("")
    )}
    ${section("Skills", generated?.skills?.length ? `<div class="skills">${generated.skills.map((skill: string) => `<span class="skill">${escapeHtml(skill)}</span>`).join("")}</div>` : "")}
    ${section("Certifications", (generated?.certifications || []).map((item: any) => `<p>${escapeHtml(item.name)} - ${escapeHtml(item.issuer)}${item.year ? `, ${escapeHtml(item.year)}` : ""}</p>`).join(""))}
    ${section("Languages", (generated?.languages || []).map((item: any) => `<p>${escapeHtml(item.lang)} - ${escapeHtml(item.level)}</p>`).join(""))}
  </main>
</body>
</html>`;
}

function mapResumePurchase(row: any) {
  const method = row.payment_method || "";
  const reference = row.payment_reference || "";
  return {
    id: row.id,
    resumeDraftId: row.resume_draft_id,
    amount: row.amount,
    adminFee: row.admin_fee || 0,
    total: (row.amount || 0) + (row.admin_fee || 0),
    status: row.status,
    packageId: row.package_id || "pdf-html",
    formats: Array.isArray(row.formats) ? row.formats : ["pdf", "html"],
    paymentMethod: method,
    paymentReference: reference,
    paymentInstructions: buildPaymentInstructions(method, reference),
    paymentProvider: row.payment_provider,
    checkoutUrl: row.checkout_url || "",
    expiresAt: row.expires_at || null,
    paidAt: row.paid_at || null,
    createdAt: row.created_at,
  };
}

function normalizeResumePackage(packageId: any) {
  const id = ["pdf", "pdf-html", "all"].includes(packageId) ? packageId : "pdf-html";
  if (id === "pdf") return { id, amount: 10000, formats: ["pdf"] };
  if (id === "all") return { id, amount: 25000, formats: ["pdf", "html"] };
  return { id: "pdf-html", amount: 15000, formats: ["pdf", "html"] };
}

function normalizePaymentMethod(method: any) {
  const value = String(method || "").toLowerCase();
  return ["qris", "gopay", "ovo", "dana", "shopeepay", "bca-va", "mandiri-va"].includes(value) ? value : "";
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    qris: "QRIS",
    gopay: "GoPay",
    ovo: "OVO",
    dana: "DANA",
    shopeepay: "ShopeePay",
    "bca-va": "BCA Virtual Account",
    "mandiri-va": "Mandiri Virtual Account",
  };
  return labels[method] || method;
}

function paymentReference(method: string) {
  if (method === "qris") return "SIMULASI-QRIS-KARIRHUB-RESUME";
  if (method === "bca-va") return "8808123456789012";
  if (method === "mandiri-va") return "8877123456789012";
  return `SIM-${method.toUpperCase()}-081234567890`;
}

function buildPaymentInstructions(method: string, reference: string) {
  if (!method) return [];
  if (method === "qris") return ["Simulasi Prototype: scan QRIS demo KarirHub.", `Kode QRIS: ${reference}`, "Klik Simulasikan Pembayaran Berhasil untuk menyelesaikan prototype."];
  if (method === "bca-va" || method === "mandiri-va") return [`Simulasi Prototype: transfer ke ${paymentMethodLabel(method)}.`, `Nomor VA: ${reference}`, "Klik Simulasikan Pembayaran Berhasil untuk menyelesaikan prototype."];
  return [`Buka aplikasi ${paymentMethodLabel(method)}.`, `Gunakan kode pembayaran simulasi: ${reference}`, "Klik Simulasikan Pembayaran Berhasil untuk menyelesaikan prototype."];
}

async function findPaidResumePurchase(userId: string, resumeDraftId: string) {
  const { data, error } = await supabaseAdmin
    .from("resume_purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("resume_draft_id", resumeDraftId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { purchase: null, error };
  return { purchase: data || null, error: null };
}

async function maybeSetDevelopmentPaymentPaid(purchase: any) {
  return purchase;
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
    let purchase = null;
    if (data?.id) {
      const { data: purchaseData, error: purchaseError } = await supabaseAdmin
        .from("resume_purchases")
        .select("*")
        .eq("user_id", user.id)
        .eq("resume_draft_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (purchaseError) return sendError(res, 500, "Gagal mengambil status pembelian resume.", purchaseError.message);
      purchase = purchaseData ? mapResumePurchase(await maybeSetDevelopmentPaymentPaid(purchaseData)) : null;
    }
    return sendJson(res, 200, { draft: data || null, purchase });
  }

  if (action === "draft" && (req.method === "POST" || req.method === "PATCH")) {
    const resumeData = normalizeResumePayload(req.body || {});
    const { data, error } = await supabaseAdmin
      .from("resume_drafts")
      .upsert({ user_id: user.id, resume_data: resumeData }, { onConflict: "user_id" })
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
      .upsert({ user_id: user.id, resume_data: draft }, { onConflict: "user_id" })
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
      .upsert({ user_id: user.id, resume_data: resumeData, generated_resume: generated }, { onConflict: "user_id" })
      .select("id,resume_data,generated_resume,updated_at")
      .single();

    if (error || !data) return sendError(res, 500, "Gagal generate resume.", error?.message);
    return sendJson(res, 200, { generatedResume: generated, draft: data, draftId: data.id, resumeId: data.id });
  }

  if (action === "checkout" && req.method === "POST") {
    const draftId = req.body?.draftId || req.body?.resumeId;
    const selectedPackage = normalizeResumePackage(req.body?.packageId);
    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);
    if (!paymentMethod) return sendError(res, 400, "Metode pembayaran wajib dipilih.");
    const { data: draft, error: draftError } = await supabaseAdmin
      .from("resume_drafts")
      .select("id,generated_resume")
      .eq("user_id", user.id)
      .eq("id", draftId || "")
      .maybeSingle();
    if (draftError) return sendError(res, 500, "Gagal membaca resume.", draftError.message);
    if (!draft) return sendError(res, 404, "Resume tidak ditemukan untuk user ini.");
    if (!draft.generated_resume) return sendError(res, 400, "Generate resume terlebih dahulu sebelum checkout.");

    const { purchase: paidPurchase, error: paidError } = await findPaidResumePurchase(user.id, draft.id);
    if (paidError) return sendError(res, 500, "Gagal memeriksa pembelian resume.", paidError.message);
    if (paidPurchase) return sendJson(res, 200, { purchase: mapResumePurchase(paidPurchase), message: "Resume sudah dibeli dan siap diunduh." });

    const { data: existingPending, error: pendingError } = await supabaseAdmin
      .from("resume_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("resume_draft_id", draft.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingError) return sendError(res, 500, "Gagal memeriksa checkout resume.", pendingError.message);
    if (existingPending) {
      const { data: updatedPending, error: updatePendingError } = await supabaseAdmin
        .from("resume_purchases")
        .update({
          amount: selectedPackage.amount,
          admin_fee: Math.ceil(selectedPackage.amount * 0.025),
          package_id: selectedPackage.id,
          formats: selectedPackage.formats,
          payment_method: paymentMethod,
          payment_reference: paymentReference(paymentMethod),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })
        .eq("id", existingPending.id)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (updatePendingError || !updatedPending) return sendError(res, 500, "Gagal memperbarui checkout resume.", updatePendingError?.message);
      return sendJson(res, 200, {
        purchase: mapResumePurchase(updatedPending),
        message: "Checkout resume masih menunggu pembayaran.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("resume_purchases")
      .insert({
        user_id: user.id,
        resume_draft_id: draft.id,
        amount: selectedPackage.amount,
        admin_fee: Math.ceil(selectedPackage.amount * 0.025),
        status: "pending",
        package_id: selectedPackage.id,
        formats: selectedPackage.formats,
        payment_method: paymentMethod,
        payment_reference: paymentReference(paymentMethod),
        payment_provider: "development-simulator",
        checkout_url: null,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
      .select("*")
      .single();
    if (error || !data) return sendError(res, 500, "Gagal membuat checkout resume.", error?.message);
    return sendJson(res, 201, {
      purchase: mapResumePurchase(data),
      message: "Checkout development dibuat dengan status pending.",
    });
  }

  if (action.startsWith("payment-status/") && req.method === "GET") {
    const purchaseId = action.replace(/^payment-status\/?/, "");
    if (!purchaseId) return sendError(res, 400, "ID checkout wajib dikirim.");
    const { data, error } = await supabaseAdmin
      .from("resume_purchases")
      .select("*")
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return sendError(res, 500, "Gagal mengambil status pembayaran.", error.message);
    if (!data) return sendError(res, 404, "Checkout resume tidak ditemukan.");
    const purchase = await maybeSetDevelopmentPaymentPaid(data);
    return sendJson(res, 200, {
      purchase: mapResumePurchase(purchase),
      message: purchase.status === "paid" ? "Pembayaran berhasil, resume siap diunduh." : "Menunggu Pembayaran.",
    });
  }

  if (action.startsWith("simulate-payment-success/") && req.method === "POST") {
    const purchaseId = action.replace(/^simulate-payment-success\/?/, "");
    if (!purchaseId) return sendError(res, 400, "ID checkout wajib dikirim.");
    const { data: existing, error: readError } = await supabaseAdmin
      .from("resume_purchases")
      .select("*")
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (readError) return sendError(res, 500, "Gagal membaca checkout resume.", readError.message);
    if (!existing) return sendError(res, 404, "Checkout resume tidak ditemukan.");
    if (existing.status === "paid") return sendJson(res, 200, { purchase: mapResumePurchase(existing), message: "Pembayaran sudah berhasil." });
    if (existing.status !== "pending") return sendError(res, 400, "Checkout tidak dalam status pending.");

    const { data, error } = await supabaseAdmin
      .from("resume_purchases")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error || !data) return sendError(res, 500, "Gagal mensimulasikan pembayaran.", error?.message);
    return sendJson(res, 200, { purchase: mapResumePurchase(data), message: "Pembayaran berhasil, resume siap diunduh." });
  }

  if (action.startsWith("download/") && req.method === "GET") {
    const purchaseId = action.replace(/^download\/?/, "");
    const format = String(req.query?.format || "html").toLowerCase();
    if (!purchaseId) return sendError(res, 400, "ID pembelian wajib dikirim.");

    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("resume_purchases")
      .select("*")
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (purchaseError) return sendError(res, 500, "Gagal memeriksa pembelian resume.", purchaseError.message);
    if (!purchase) return sendError(res, 404, "Pembelian resume tidak ditemukan.");
    const checkedPurchase = await maybeSetDevelopmentPaymentPaid(purchase);
    if (checkedPurchase.status !== "paid") return sendError(res, 402, "Resume belum dibayar. Selesaikan pembayaran untuk mengunduh file final.");
    if (!["pdf", "html"].includes(format)) return sendError(res, 400, "Format download tidak valid.");
    const allowedFormats = Array.isArray(checkedPurchase.formats) ? checkedPurchase.formats : ["pdf", "html"];
    if (!allowedFormats.includes(format)) return sendError(res, 403, "Format ini tidak termasuk paket yang dibeli.");

    const { data: draft, error: draftError } = await supabaseAdmin
      .from("resume_drafts")
      .select("id,generated_resume")
      .eq("id", checkedPurchase.resume_draft_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (draftError) return sendError(res, 500, "Gagal membaca resume.", draftError.message);
    if (!draft || !draft.generated_resume) return sendError(res, 404, "Resume tidak ditemukan untuk user ini.");

    const html = renderGeneratedResumeHtml(draft.generated_resume);
    const filename = `${String((draft.generated_resume as any)?.personal?.fullName || "resume").replace(/\s+/g, "-").toLowerCase()}-ats.${format === "pdf" ? "html" : "html"}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `${format === "pdf" ? "inline" : "attachment"}; filename="${filename}"`);
    res.status(200).send(html);
    return;
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

  logRawApiRequest(req);
  const normalizedPathname = normalizeApiPath(req);
  const route = cleanApiRoute(normalizedPathname);
  const method = req.method;
  console.log("[api route normalized]", {
    method,
    url: req.url,
    normalizedPathname,
    route,
  });

  try {
    if (route === "auth/register" && method === "POST") return handleRegister(req, res);
    if (route === "auth/login" && method === "POST") return handleLogin(req, res);
    if (route === "auth/me" && method === "GET") return handleMe(req, res);
    if (route === "profile") return handleProfile(req, res);
    if (route === "profile/cv") return handleProfileCv(req, res);
    if (route === "settings") return handleSettings(req, res);
    if (route === "seller/services") {
      logRouteSelection(req, route, "handleSellerServices");
      return handleSellerServices(req, res);
    }
    if (route === "seller/orders") {
      logRouteSelection(req, route, "handleSellerOrders");
      return handleSellerOrders(req, res);
    }
    if (route === "seller/earnings") {
      logRouteSelection(req, route, "handleSellerEarnings");
      return handleSellerEarnings(req, res);
    }
    if (route === "seller/profile") {
      logRouteSelection(req, route, "handleSellerProfile");
      return handleSellerProfile(req, res);
    }
    if (route === "services" && method === "GET") return handlePublicServices(res);
    if (route === "jobs" && method === "GET") return handlePublicJobs(res);
    if (route === "orders") return handleOrders(req, res);
    if (route === "transactions") return handleTransactions(req, res);
    if (route === "applications") return handleApplications(req, res);
    if (route === "ai-photo") return handleAIPhoto(req, res);
    if (route === "recruiter/jobs") return handleRecruiterJobs(req, res);
    if (route === "recruiter/applicants") return handleRecruiterApplicants(req, res);
    if (route === "recruiter/talent-pool") return handleRecruiterTalent(req, res);
    if (route === "recruiter/stats") return handleRecruiterStats(req, res);
    if (route === "recruiter/profile") return handleRecruiterProfile(req, res);
    if (route === "resume-builder" || route.startsWith("resume-builder/")) return handleResumeBuilder(route, req, res);

    if (route.includes("seller") || String(req.url || "").includes("seller")) {
      console.warn("[api route unmatched seller]", {
        method,
        url: req.url,
        normalizedPathname: normalizeApiPath(req),
        route,
      });
    }

    return sendError(res, 404, `Endpoint /api/${route} tidak ditemukan.`);
  } catch (error) {
    return sendError(res, 500, "Terjadi kesalahan server.", error instanceof Error ? error.message : error);
  }
}
