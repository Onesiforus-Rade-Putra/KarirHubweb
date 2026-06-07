import { applyCors, sendError, sendJson } from "../../_lib/http";
import { requireSeller } from "../../_lib/seller";
import { supabaseAdmin } from "../../_lib/supabase";

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const { user, error, status } = await requireSeller(req, supabaseAdmin);
  if (!user) return sendError(res, status, error || "Akses ditolak.");

  const { data: orders, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,service_price,order_status,status,services!inner(seller_id)")
    .eq("services.seller_id", user.id);

  if (orderError) return sendError(res, 500, "Gagal menghitung pendapatan seller.", orderError.message);

  const orderIds = (orders || []).map((order: any) => order.id);
  let paidByOrder = new Map<string, number>();

  if (orderIds.length) {
    const { data: transactions } = await supabaseAdmin
      .from("transactions")
      .select("order_id,price,status")
      .in("order_id", orderIds)
      .eq("status", "Berhasil");

    paidByOrder = new Map((transactions || []).map((tx: any) => [tx.order_id, tx.price]));
  }

  const totalOrders = orders?.length || 0;
  const completedOrders = (orders || []).filter((order: any) => order.order_status === "completed" || order.status === "Selesai").length;
  const pendingOrders = (orders || []).filter((order: any) => ["pending", "accepted", "in_progress"].includes(order.order_status)).length;
  const grossRevenue = (orders || []).reduce((total: number, order: any) => {
    if (!(order.order_status === "completed" || order.status === "Selesai")) return total;
    return total + (paidByOrder.get(order.id) || order.service_price || 0);
  }, 0);

  return sendJson(res, 200, {
    earnings: {
      total_orders: totalOrders,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      gross_revenue: grossRevenue,
      estimated_net_revenue: Math.round(grossRevenue * 0.9),
    },
  });
}
