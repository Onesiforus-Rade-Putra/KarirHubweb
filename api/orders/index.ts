import { applyCors, requireUser, sendError, sendJson } from "../_lib/http";
import { mapOrder } from "../_lib/mappers";
import { supabaseAdmin } from "../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id,buyer_name,buyer_email,service_title,service_price,requirements,status,result_url,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return sendError(res, 500, "Gagal mengambil data order.", error.message);
    return sendJson(res, 200, { orders: (data || []).map(mapOrder) });
  }

  if (req.method === "POST") {
    const { serviceId, requirements, buyerName, buyerEmail } = req.body || {};

    if (!serviceId) return sendError(res, 400, "serviceId wajib dikirim.");

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("id,title,price")
      .eq("id", serviceId)
      .eq("active", true)
      .single();

    if (serviceError || !service) {
      return sendError(res, 404, "Layanan tidak ditemukan.");
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        service_id: service.id,
        buyer_name: buyerName || user.user_metadata?.full_name || user.email || "KarirHub User",
        buyer_email: buyerEmail || user.email || "",
        service_title: service.title,
        service_price: service.price,
        requirements: requirements || "Pesanan dibuat dari checkout Jasa Karir.",
        status: "Baru",
      })
      .select("id,buyer_name,buyer_email,service_title,service_price,requirements,status,result_url,created_at")
      .single();

    if (error || !order) return sendError(res, 500, "Gagal membuat order.", error?.message);
    return sendJson(res, 201, { order: mapOrder(order) });
  }

  return sendError(res, 405, "Method not allowed");
}
