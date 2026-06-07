import { applyCors, sendError, sendJson } from "../../_lib/http";
import { requireRecruiter } from "../../_lib/recruiter";
import { supabaseAdmin } from "../../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { user, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  const { data: jobs, error: jobError } = await supabaseAdmin
    .from("jobs")
    .select("id,status")
    .eq("recruiter_id", user.id);

  if (jobError) return sendError(res, 500, "Gagal menghitung statistik lowongan.", jobError.message);

  const jobIds = (jobs || []).map((job: any) => job.id);
  let applicants: any[] = [];

  if (jobIds.length) {
    const { data, error: appError } = await supabaseAdmin
      .from("applications")
      .select("id,application_status")
      .in("job_id", jobIds);

    if (appError) return sendError(res, 500, "Gagal menghitung statistik pelamar.", appError.message);
    applicants = data || [];
  }

  return sendJson(res, 200, {
    stats: {
      total_jobs: jobs?.length || 0,
      active_jobs: (jobs || []).filter((job: any) => job.status === "aktif").length,
      closed_jobs: (jobs || []).filter((job: any) => job.status === "ditutup").length,
      total_applicants: applicants.length,
      applicants_reviewed: applicants.filter((app: any) => app.application_status === "reviewed").length,
      applicants_interview: applicants.filter((app: any) => app.application_status === "interview").length,
    },
  });
}
