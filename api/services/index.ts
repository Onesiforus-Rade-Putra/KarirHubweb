import { applyCors, sendError, sendJson } from "../_lib/http";
import { mapService } from "../_lib/mappers";
import { supabaseAdmin } from "../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { data, error } = await supabaseAdmin
    .from("services")
    .select("id,title,provider_name,provider_avatar,category,rating,reviews_count,price,duration,description,active")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return sendError(res, 500, "Gagal mengambil data layanan.", error.message);
  }

  return sendJson(res, 200, { services: (data || []).map(mapService) });
}
