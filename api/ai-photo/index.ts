import { applyCors, requireUser, sendError, sendJson } from "../_lib/http";
import { supabaseAdmin } from "../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed");
  }

  const { style, sourceImageUrl, resultImageUrl, status = "generated" } = req.body || {};

  if (!style) {
    return sendError(res, 400, "style wajib dikirim.");
  }

  const { data, error } = await supabaseAdmin
    .from("ai_photo_requests")
    .insert({
      user_id: user.id,
      style,
      source_image_url: sourceImageUrl || null,
      result_image_url: resultImageUrl || null,
      status,
    })
    .select("id,style,source_image_url,result_image_url,status,created_at")
    .single();

  if (error || !data) {
    return sendError(res, 500, "Gagal menyimpan request AI Foto CV.", error?.message);
  }

  return sendJson(res, 201, {
    request: {
      id: data.id,
      style: data.style,
      sourceImageUrl: data.source_image_url,
      resultImageUrl: data.result_image_url,
      status: data.status,
      createdAt: data.created_at,
    },
  });
}
