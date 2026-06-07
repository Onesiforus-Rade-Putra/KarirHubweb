import React, { useState } from "react";
import { AlertTriangle, Box, CheckCircle2, Clock, Filter, Search, XCircle } from "lucide-react";

import { ServiceOrder } from "../../types";

interface OrderManagerProps {
  orders?: ServiceOrder[];
  onUpdateOrderStatus?: (orderId: string, status: "Baru" | "Sedang Diproses" | "Selesai" | "Dibatalkan", resultUrl?: string) => void;
}

const seedOrders = [
  { id: "ORD-001", initials: "BS", serviceTitle: "Review CV Profesional", buyerName: "Budi Santoso", price: 250000, time: "2 jam yang lalu", status: "Baru", note: "" },
  { id: "ORD-002", initials: "SA", serviceTitle: "Mock Interview", buyerName: "Siti Aminah", price: 350000, time: "5 jam yang lalu", status: "Sedang Diproses", note: "Deadline: 2 hari" },
  { id: "ORD-003", initials: "AR", serviceTitle: "Career Coaching Premium", buyerName: "Ahmad Rizki", price: 500000, time: "2 hari yang lalu", status: "Selesai", note: "Diselesaikan 1 hari yang lalu" },
  { id: "ORD-004", initials: "DL", serviceTitle: "Optimasi LinkedIn Profile", buyerName: "Dewi Lestari", price: 300000, time: "1 hari yang lalu", status: "Sedang Diproses", note: "Deadline: 4 hari" },
  { id: "ORD-005", initials: "RH", serviceTitle: "Review CV Profesional", buyerName: "Rudi Hartono", price: 250000, time: "5 hari yang lalu", status: "Selesai", note: "Diselesaikan 2 hari yang lalu" },
  { id: "ORD-006", initials: "MS", serviceTitle: "Mock Interview", buyerName: "Maya Sari", price: 350000, time: "1 minggu yang lalu", status: "Dibatalkan", note: "Dibatalkan oleh pelanggan" }
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);

const statusTone = (status: string) => {
  if (status === "Baru") return "bg-blue-100 text-blue-700";
  if (status === "Sedang Diproses") return "bg-amber-100 text-amber-700";
  if (status === "Selesai") return "bg-emerald-100 text-emerald-700";
  return "bg-red-100 text-red-700";
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) => (
  <div className="flex min-h-[126px] items-center gap-7 rounded-2xl border border-slate-200 bg-white px-7">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-5 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KH";

const toSellerOrder = (order: ServiceOrder) => ({
  id: order.id,
  initials: initials(order.buyerName),
  serviceTitle: order.serviceTitle,
  buyerName: order.buyerName,
  price: order.servicePrice,
  time: order.date || "Baru saja",
  status: order.status,
  note: order.requirements || ""
});

export const OrderManager: React.FC<OrderManagerProps> = ({ orders: incomingOrders = [], onUpdateOrderStatus }) => {
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState(() => incomingOrders.length ? incomingOrders.map(toSellerOrder) : seedOrders);

  React.useEffect(() => {
    if (incomingOrders.length) setOrders(incomingOrders.map(toSellerOrder));
  }, [incomingOrders]);

  const counts = {
    Baru: orders.filter((order) => order.status === "Baru").length,
    "Sedang Diproses": orders.filter((order) => order.status === "Sedang Diproses").length,
    Selesai: orders.filter((order) => order.status === "Selesai").length,
    Dibatalkan: orders.filter((order) => order.status === "Dibatalkan").length
  };

  const filtered = orders.filter((order) => {
    const matchTab = activeTab === "Semua" || order.status === activeTab;
    const term = searchTerm.toLowerCase();
    const matchSearch = order.serviceTitle.toLowerCase().includes(term) || order.buyerName.toLowerCase().includes(term);
    return matchTab && matchSearch;
  });

  const updateStatus = (orderId: string, status: string) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status, note: status === "Selesai" ? "Diselesaikan baru saja" : order.note } : order)));
    onUpdateOrderStatus?.(orderId, status as "Baru" | "Sedang Diproses" | "Selesai" | "Dibatalkan");
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div>
        <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Pesanan Masuk</h1>
        <p className="mt-2 text-xl text-slate-600">Kelola dan pantau pesanan dari pelanggan</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Box} label="Order Baru" value={`${counts.Baru}`} tone="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock} label="Sedang Diproses" value={`${counts["Sedang Diproses"]}`} tone="bg-amber-100 text-amber-600" />
        <StatCard icon={CheckCircle2} label="Selesai" value={`${counts.Selesai}`} tone="bg-emerald-100 text-emerald-600" />
        <StatCard icon={XCircle} label="Dibatalkan" value={`${counts.Dibatalkan}`} tone="bg-red-100 text-red-600" />
      </div>

      <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              ["Semua", orders.length],
              ["Baru", counts.Baru],
              ["Sedang Diproses", counts["Sedang Diproses"]],
              ["Selesai", counts.Selesai],
              ["Dibatalkan", counts.Dibatalkan]
            ].map(([tab, count]) => (
              <button
                key={tab as string}
                onClick={() => setActiveTab(tab as string)}
                className={`h-10 rounded-lg px-4 font-semibold ${
                  activeTab === tab ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab as string} ({count as number})
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 w-72 rounded-lg border border-slate-200 pl-12 pr-4 outline-none focus:border-purple-500"
                placeholder="Cari pesanan..."
              />
            </label>
            <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>
      </section>

      <div className="mt-7 space-y-5">
        {filtered.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div className="flex min-w-0 gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-base font-black text-purple-700">
                  {order.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-950">{order.serviceTitle}</h2>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusTone(order.status)}`}>{order.status === "Baru" ? "Order Baru" : order.status}</span>
                  </div>
                  <p className="mt-2 text-base text-slate-600">Pelanggan: {order.buyerName}</p>
                  <p className="mt-1 text-base text-slate-500">Order ID: {order.id}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-2xl font-black text-purple-600">{formatPrice(order.price)}</p>
                <p className="mt-2 text-sm text-slate-500">{order.time}</p>
              </div>
            </div>

            {order.note && (
              <div
                className={`mt-5 flex items-center gap-2 rounded-lg border p-4 text-base font-medium ${
                  order.status === "Sedang Diproses"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : order.status === "Selesai"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {order.status === "Sedang Diproses" ? <AlertTriangle className="h-5 w-5" /> : order.status === "Selesai" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                {order.note}
              </div>
            )}

            <div className="mt-5 flex gap-3 border-t border-slate-200 pt-5">
              {order.status === "Baru" && (
                <>
                  <button onClick={() => updateStatus(order.id, "Sedang Diproses")} className="h-11 flex-1 rounded-lg bg-purple-600 font-semibold text-white hover:bg-purple-700">
                    Terima Pesanan
                  </button>
                  <button onClick={() => updateStatus(order.id, "Dibatalkan")} className="h-11 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50">
                    Tolak
                  </button>
                </>
              )}
              {order.status === "Sedang Diproses" && (
                <>
                  <button onClick={() => updateStatus(order.id, "Selesai")} className="h-11 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
                    Tandai Selesai
                  </button>
                  <button className="h-11 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50">
                    Hubungi Pelanggan
                  </button>
                </>
              )}
              {(order.status === "Selesai" || order.status === "Dibatalkan") && (
                <button className="h-11 flex-1 rounded-lg bg-slate-100 font-semibold text-slate-700 hover:bg-slate-200">
                  Lihat Detail
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
