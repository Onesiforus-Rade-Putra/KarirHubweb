import { applyCors, sendError, sendJson } from "../_lib/http";
import { mapJob } from "../_lib/mappers";
import { supabaseAdmin } from "../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("id,title,company,company_logo,location,type,salary_min,salary_max,description,requirements,benefits,posted_date,category,applicants_count,status")
    .eq("status", "aktif")
    .order("posted_date", { ascending: false });

  if (error) {
    return sendError(res, 500, "Gagal mengambil data lowongan.", error.message);
  }

  return sendJson(res, 200, { jobs: (data || []).map(mapJob) });
}
