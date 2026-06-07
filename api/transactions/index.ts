import { applyCors, requireUser, sendError, sendJson } from "../_lib/http";
import { mapTransaction } from "../_lib/mappers";
import { supabaseAdmin } from "../_lib/supabase";

function virtualAccount(method?: string) {
  return method?.includes("Virtual Account") ? "8808 1234 5678 9012" : null;
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const { user, error: authError } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, authError || "Session tidak valid.");

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("id,item_title,category,price,status,payment_method,va_number,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return sendError(res, 500, "Gagal mengambil transaksi.", error.message);
    return sendJson(res, 200, { transactions: (data || []).map(mapTransaction) });
  }

  if (req.method === "POST") {
    const { orderId, itemTitle, category = "service", price, status = "Pending", paymentMethod } = req.body || {};

    if (!itemTitle || typeof price !== "number") {
      return sendError(res, 400, "itemTitle dan price wajib dikirim.");
    }

    if (orderId) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (!order) return sendError(res, 403, "Order tidak valid untuk user ini.");
    }

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: user.id,
        order_id: orderId || null,
        item_title: itemTitle,
        category,
        price,
        status,
        payment_method: paymentMethod || "QRIS",
        va_number: virtualAccount(paymentMethod),
      })
      .select("id,item_title,category,price,status,payment_method,va_number,created_at")
      .single();

    if (error || !data) return sendError(res, 500, "Gagal membuat transaksi.", error?.message);
    return sendJson(res, 201, { transaction: mapTransaction(data) });
  }

  return sendError(res, 405, "Method not allowed");
}
