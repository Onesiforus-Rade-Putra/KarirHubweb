import { applyCors, sendError, sendJson } from "../../_lib/http";
import { mapRecruiterApplication } from "../../_lib/mappers";
import { recruiterApplicationStatusToPublic, requireRecruiter } from "../../_lib/recruiter";
import { supabaseAdmin } from "../../_lib/supabase";

const appSelect = "id,user_id,job_id,candidate_name,candidate_title,candidate_email,candidate_rating,candidate_experience,status,application_status,recruiter_notes,resume_summary,created_at,jobs!inner(id,title,recruiter_id)";
const allowedStatuses = ["submitted", "reviewed", "interview", "accepted", "rejected"];

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin
      .from("applications")
      .select(appSelect)
      .eq("jobs.recruiter_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) return sendError(res, 500, "Gagal mengambil pelamar.", queryError.message);
    return sendJson(res, 200, { applicants: (data || []).map(mapRecruiterApplication) });
  }

  if (req.method === "PATCH") {
    const { id, applicationStatus, recruiterNotes } = req.body || {};
    const nextStatus = applicationStatus || req.body?.status;

    if (!id || !allowedStatuses.includes(nextStatus)) {
      return sendError(res, 400, "id dan applicationStatus valid wajib dikirim.");
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("applications")
      .select(appSelect)
      .eq("id", id)
      .eq("jobs.recruiter_id", user.id)
      .single();

    if (existingError || !existing) return sendError(res, 404, "Lamaran bukan milik lowongan recruiter ini.", existingError?.message);

    const updates: any = {
      application_status: nextStatus,
      status: recruiterApplicationStatusToPublic(nextStatus),
    };
    if (recruiterNotes !== undefined) updates.recruiter_notes = recruiterNotes;

    const { data, error: updateError } = await supabaseAdmin
      .from("applications")
      .update(updates)
      .eq("id", id)
      .select(appSelect)
      .single();

    if (updateError || !data) return sendError(res, 500, "Lamaran gagal diupdate.", updateError?.message);
    return sendJson(res, 200, { applicant: mapRecruiterApplication(data) });
  }

  return sendError(res, 405, "Method not allowed");
}
