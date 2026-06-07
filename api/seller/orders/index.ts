import { applyCors, sendError, sendJson } from "../../_lib/http";
import { mapSellerOrder } from "../../_lib/mappers";
import { sellerOrderStatusToPublic, requireSeller } from "../../_lib/seller";
import { supabaseAdmin } from "../../_lib/supabase";

const orderSelect = "id,buyer_name,buyer_email,service_title,service_price,requirements,status,order_status,seller_notes,result_url,created_at,services!inner(id,title,seller_id)";
const allowedStatuses = ["pending", "accepted", "in_progress", "completed", "cancelled"];

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  if (req.method === "GET") {
    const { data, error: queryError } = await supabaseAdmin
      .from("orders")
      .select(orderSelect)
      .eq("services.seller_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) return sendError(res, 500, "Gagal mengambil order seller.", queryError.message);
    return sendJson(res, 200, { orders: (data || []).map(mapSellerOrder) });
  }

  if (req.method === "PATCH") {
    const { id, orderStatus, sellerNotes, resultUrl } = req.body || {};
    const nextStatus = orderStatus || req.body?.status;

    if (!id || !allowedStatuses.includes(nextStatus)) {
      return sendError(res, 400, "id dan orderStatus valid wajib dikirim.");
    }

    const updates: any = {
      order_status: nextStatus,
      status: sellerOrderStatusToPublic(nextStatus),
    };
    if (sellerNotes !== undefined) updates.seller_notes = sellerNotes;
    if (resultUrl !== undefined) updates.result_url = resultUrl;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("orders")
      .select(orderSelect)
      .eq("id", id)
      .eq("services.seller_id", user.id)
      .single();

    if (existingError || !existing) return sendError(res, 404, "Order bukan milik layanan seller ini.", existingError?.message);

    const { data, error: updateError } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select(orderSelect)
      .single();

    if (updateError || !data) return sendError(res, 500, "Order gagal diupdate.", updateError?.message);

    return sendJson(res, 200, { order: mapSellerOrder(data) });
  }

  return sendError(res, 405, "Method not allowed");
}
