import { applyCors, sendError, sendJson } from "../../_lib/http";
import { mapJob } from "../../_lib/mappers";
import { requireRecruiter } from "../../_lib/recruiter";
import { supabaseAdmin } from "../../_lib/supabase";

const jobSelect = "id,title,company,company_logo,location,type,salary_min,salary_max,description,requirements,benefits,posted_date,category,applicants_count,status,recruiter_id,created_at";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, profile, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user || !profile) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin
      .from("jobs")
      .select(jobSelect)
      .eq("recruiter_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) return sendError(res, 500, "Gagal mengambil lowongan recruiter.", queryError.message);
    return sendJson(res, 200, { jobs: (data || []).map(mapJob) });
  }

  if (req.method === "POST") {
    const { title, company, location, type, salaryMin, salaryMax, description, requirements, benefits, category, status: jobStatus = "aktif" } = req.body || {};

    if (!title || !location || !description) {
      return sendError(res, 400, "title, location, dan description wajib dikirim.");
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("jobs")
      .insert({
        recruiter_id: user.id,
        title,
        company: company || profile.company || profile.full_name || "KarirHub Recruiter",
        company_logo: profile.company?.slice(0, 2).toUpperCase() || "KH",
        location,
        type: type || "Full-time",
        salary_min: salaryMin || 0,
        salary_max: salaryMax || salaryMin || 0,
        description,
        requirements: Array.isArray(requirements) ? requirements : [],
        benefits: Array.isArray(benefits) ? benefits : [],
        posted_date: new Date().toISOString().slice(0, 10),
        category: category || "General",
        applicants_count: 0,
        status: jobStatus,
      })
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

    const { data, error: updateError } = await supabaseAdmin
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .eq("recruiter_id", user.id)
      .select(jobSelect)
      .single();

    if (updateError || !data) return sendError(res, 404, "Lowongan tidak ditemukan atau gagal diupdate.", updateError?.message);
    return sendJson(res, 200, { job: mapJob(data) });
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || req.body?.id;
    if (!id) return sendError(res, 400, "id lowongan wajib dikirim.");

    const { data, error: deleteError } = await supabaseAdmin
      .from("jobs")
      .update({ status: "ditutup" })
      .eq("id", id)
      .eq("recruiter_id", user.id)
      .select(jobSelect)
      .single();

    if (deleteError || !data) return sendError(res, 404, "Lowongan tidak ditemukan atau gagal ditutup.", deleteError?.message);
    return sendJson(res, 200, { job: mapJob(data) });
  }

  return sendError(res, 405, "Method not allowed");
}
