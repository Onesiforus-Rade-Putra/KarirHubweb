import { applyCors, sendError, sendJson } from "../../_lib/http";
import { mapService } from "../../_lib/mappers";
import { parseServiceCategory, requireSeller } from "../../_lib/seller";
import { supabaseAdmin } from "../../_lib/supabase";

const serviceSelect = "id,title,provider_name,provider_avatar,category,rating,reviews_count,price,duration,description,active,status,seller_id,created_at";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, profile, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user || !profile) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin
      .from("services")
      .select(serviceSelect)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) return sendError(res, 500, "Gagal mengambil layanan seller.", queryError.message);
    return sendJson(res, 200, { services: (data || []).map(mapService) });
  }

  if (req.method === "POST") {
    const { title, category, price, duration, description, active = true } = req.body || {};

    if (!title || typeof price !== "number" || !duration || !description) {
      return sendError(res, 400, "title, price, duration, dan description wajib dikirim.");
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("services")
      .insert({
        seller_id: user.id,
        title,
        provider_name: profile.full_name,
        provider_avatar: profile.avatar_url || profile.full_name?.slice(0, 2).toUpperCase() || "SL",
        category: parseServiceCategory(category),
        rating: 5,
        reviews_count: 0,
        price,
        duration,
        description,
        active: Boolean(active),
        status: active ? "active" : "inactive",
      })
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

    const { data, error: updateError } = await supabaseAdmin
      .from("services")
      .update(updates)
      .eq("id", id)
      .eq("seller_id", user.id)
      .select(serviceSelect)
      .single();

    if (updateError || !data) return sendError(res, 404, "Layanan tidak ditemukan atau gagal diupdate.", updateError?.message);
    return sendJson(res, 200, { service: mapService(data) });
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || req.body?.id;
    if (!id) return sendError(res, 400, "id layanan wajib dikirim.");

    const { data, error: deleteError } = await supabaseAdmin
      .from("services")
      .update({ active: false, status: "inactive" })
      .eq("id", id)
      .eq("seller_id", user.id)
      .select(serviceSelect)
      .single();

    if (deleteError || !data) return sendError(res, 404, "Layanan tidak ditemukan atau gagal dinonaktifkan.", deleteError?.message);
    return sendJson(res, 200, { service: mapService(data) });
  }

  return sendError(res, 405, "Method not allowed");
}
