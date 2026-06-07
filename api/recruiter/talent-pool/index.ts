import { applyCors, sendError, sendJson } from "../../_lib/http";
import { mapTalentCandidate } from "../../_lib/mappers";
import { requireRecruiter } from "../../_lib/recruiter";
import { supabaseAdmin } from "../../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { user, error, status } = await requireRecruiter(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  const { data, error: queryError } = await supabaseAdmin
    .from("applications")
    .select("id,user_id,candidate_name,candidate_title,candidate_email,candidate_rating,candidate_experience,resume_summary,created_at,jobs!inner(id,title,recruiter_id),user_profiles(full_name,avatar_url)")
    .eq("jobs.recruiter_id", user.id)
    .order("created_at", { ascending: false });

  if (queryError) return sendError(res, 500, "Gagal mengambil talent pool.", queryError.message);

  const unique = new Map<string, any>();
  (data || []).forEach((row: any) => {
    const key = row.user_id || row.candidate_email || row.id;
    if (!unique.has(key)) unique.set(key, row);
  });

  return sendJson(res, 200, { candidates: Array.from(unique.values()).map(mapTalentCandidate) });
}
