import { applyCors, requireUser, sendError, sendJson } from "../_lib/http";
import { mapApplication } from "../_lib/mappers";
import { supabaseAdmin } from "../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("id,job_id,candidate_name,candidate_title,candidate_email,candidate_rating,candidate_experience,status,resume_summary,created_at,jobs(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return sendError(res, 500, "Gagal mengambil lamaran.", error.message);
    return sendJson(res, 200, { applications: (data || []).map(mapApplication) });
  }

  if (req.method === "POST") {
    const { jobId, pitch, candidateTitle } = req.body || {};
    if (!jobId) return sendError(res, 400, "jobId wajib dikirim.");

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

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

    await supabaseAdmin.rpc("increment_job_applicants", { job_uuid: jobId }).then(async ({ error: rpcError }: any) => {
      if (!rpcError) return;
      await supabaseAdmin.from("jobs").update({ updated_at: new Date().toISOString() }).eq("id", jobId);
    });

    return sendJson(res, 201, { application: mapApplication(application) });
  }

  return sendError(res, 405, "Method not allowed");
}
