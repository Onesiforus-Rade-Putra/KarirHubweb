import React from "react";
import { CareerService, ServiceOrder } from "../../types";
import { SellerEarningsSummary } from "../../lib/karirHubApi";
import { BarChart3, Box, DollarSign, Eye, Plus, ShoppingCart, Star, TrendingUp, Users } from "lucide-react";

interface SellerDashboardProps {
  currentUser: any;
  orders: ServiceOrder[];
  services: CareerService[];
  earnings: SellerEarningsSummary | null;
  setActiveTab: (tab: string) => void;
}

const fallbackServices = [
  { title: "Konsultasi Karir Premium", price: "Rp 500.000", rating: "4.8", reviews: "32 review", sold: 45 },
  { title: "Review CV Profesional", price: "Rp 250.000", rating: "4.9", reviews: "56 review", sold: 78 },
  { title: "Mock Interview", price: "Rp 350.000", rating: "4.7", reviews: "18 review", sold: 23 }
];

const recentOrders = [
  { title: "Konsultasi Karir Premium", client: "Budi Santoso", price: "Rp 500.000", time: "2 hari yang lalu", status: "Selesai", tone: "bg-emerald-100 text-emerald-700" },
  { title: "Review CV Profesional", client: "Siti Aminah", price: "Rp 250.000", time: "3 hari yang lalu", status: "Dalam Proses", tone: "bg-amber-100 text-amber-700" },
  { title: "Mock Interview", client: "Ahmad Rizki", price: "Rp 350.000", time: "5 hari yang lalu", status: "Menunggu", tone: "bg-slate-100 text-slate-600" }
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);

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
  <div className="flex min-h-[110px] items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-5">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ orders, services, earnings, setActiveTab }) => {
  const dashboardServices = services.length
    ? services.slice(0, 3).map((service) => ({
        title: service.title,
        price: formatPrice(service.price),
        rating: String(service.rating),
        reviews: `${service.reviewsCount} review`,
        sold: 0,
        active: service.active
      }))
    : fallbackServices.map((service) => ({ ...service, active: true }));

  const dashboardOrders = orders.length
    ? orders.slice(0, 3).map((order) => ({
        title: order.serviceTitle,
        client: order.buyerName,
        price: formatPrice(order.servicePrice),
        time: order.date || "Baru saja",
        status: order.status,
        tone: order.status === "Selesai" ? "bg-emerald-100 text-emerald-700" : order.status === "Sedang Diproses" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
      }))
    : recentOrders;

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div>
        <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Dashboard Seller</h1>
        <p className="mt-2 text-xl text-slate-600">Kelola layanan dan pesanan Anda</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Pendapatan" value={formatPrice(earnings?.gross_revenue || 0)} tone="bg-emerald-100 text-emerald-600" />
        <StatCard icon={ShoppingCart} label="Total Pesanan" value={`${earnings?.total_orders ?? orders.length}`} tone="bg-blue-100 text-blue-600" />
        <StatCard icon={Box} label="Layanan Aktif" value={`${services.filter((service) => service.active).length || 0}`} tone="bg-purple-100 text-purple-600" />
        <StatCard icon={Star} label="Rating Rata-rata" value="4.8" tone="bg-orange-100 text-orange-600" />
      </div>

      <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-9">
          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">Layanan Saya</h2>
              <button
                onClick={() => setActiveTab("seller-services")}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                Tambah Layanan
              </button>
            </div>

            <div className="mt-7 space-y-4">
              {dashboardServices.map((service) => (
                <article key={service.title} className="rounded-xl border border-slate-200 p-5">
                  <h3 className="text-xl font-black text-slate-950">{service.title}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-base">
                    <span className="font-black text-purple-600">{service.price}</span>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-900">{service.rating}</span>
                    <span className="text-slate-500">({service.reviews})</span>
                  </div>
                  <div className="mt-5 flex items-center gap-3 text-base text-slate-600">
                    <ShoppingCart className="h-4 w-4" />
                    {service.sold} terjual
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${service.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{service.active ? "Aktif" : "Nonaktif"}</span>
                  </div>
                  <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
                    <button onClick={() => setActiveTab("seller-services")} className="h-10 flex-1 rounded-lg bg-purple-600 font-semibold text-white hover:bg-purple-700">
                      Edit
                    </button>
                    <button onClick={() => setActiveTab("seller-services")} className="h-10 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                      Statistik
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">Pesanan Terbaru</h2>
              <button onClick={() => setActiveTab("seller-orders")} className="font-semibold text-purple-600 hover:text-purple-700">
                Lihat Semua
              </button>
            </div>
            <div className="mt-7 space-y-4">
              {dashboardOrders.map((order) => (
                <article key={order.title} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-5">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{order.title}</h3>
                    <p className="mt-2 text-base text-slate-600">Pelanggan: {order.client}</p>
                    <p className="mt-2 font-black text-purple-600">{order.price}</p>
                    <p className="mt-2 text-sm text-slate-500">{order.time}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-medium ${order.tone}`}>{order.status}</span>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Performa Bulan Ini</h2>
            {[
              ["Pesanan Selesai", "42/45", "93%", "bg-emerald-600"],
              ["Tingkat Respon", "98%", "98%", "bg-blue-600"],
              ["Kepuasan Pelanggan", "4.8/5.0", "96%", "bg-purple-600"]
            ].map(([label, value, width, color]) => (
              <div key={label} className="mt-6">
                <div className="flex justify-between text-base">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-black text-slate-950">{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${color}`} style={{ width }} />
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Aksi Cepat</h2>
            {[
              [Box, "Tambah Layanan Baru", "seller-services", "bg-purple-100 text-purple-600"],
              [Eye, "Lihat Profil Publik", "profil", "bg-blue-100 text-blue-600"],
              [TrendingUp, "Analitik Detail", "seller-earnings", "bg-emerald-100 text-emerald-600"],
              [Users, "Kelola Pelanggan", "seller-orders", "bg-orange-100 text-orange-600"]
            ].map(([Icon, label, tab, tone]) => (
              <button
                key={label as string}
                onClick={() => setActiveTab(tab as string)}
                className="mt-4 flex h-16 w-full items-center gap-4 rounded-lg border border-slate-200 px-4 text-left font-semibold text-slate-800 hover:bg-slate-50"
              >
                {React.createElement(Icon as React.ElementType, {
                  className: `h-10 w-10 rounded-lg p-2.5 ${tone}`
                })}
                {label as string}
              </button>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
};
