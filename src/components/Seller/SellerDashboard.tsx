import React from "react";
import { CareerService, ServiceOrder } from "../../types";
import { SellerEarningsSummary } from "../../lib/karirHubApi";
import { AlertCircle, Box, DollarSign, Eye, Loader2, Plus, RefreshCw, ShoppingCart, Star, TrendingUp, Users } from "lucide-react";

interface SellerDashboardProps {
  currentUser: any;
  orders: ServiceOrder[];
  services: CareerService[];
  earnings: SellerEarningsSummary | null;
  isLoading: boolean;
  errors: {
    services?: string;
    orders?: string;
    earnings?: string;
  };
  onRetry: () => void;
  setActiveTab: (tab: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);

const orderTone = (status: ServiceOrder["status"]) => {
  if (status === "Selesai") return "bg-emerald-100 text-emerald-700";
  if (status === "Sedang Diproses") return "bg-amber-100 text-amber-700";
  if (status === "Dibatalkan") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
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

const EmptyState = ({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
    <p className="text-base font-black text-slate-800">{title}</p>
    <p className="mt-2 text-sm font-medium text-slate-500">{description}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-purple-600 px-5 text-sm font-bold text-white hover:bg-purple-700">
        {actionLabel}
      </button>
    )}
  </div>
);

const SectionError = ({ title, message, onRetry }: { title: string; message?: string; onRetry: () => void }) => {
  if (!message) return null;
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-1 text-xs font-semibold">{message}</p>
        </div>
      </div>
      <button onClick={onRetry} className="h-9 rounded-lg bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700">
        Coba Lagi
      </button>
    </div>
  );
};

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ currentUser, orders, services, earnings, isLoading, errors, onRetry, setActiveTab }) => {
  const activeServices = services.filter((service) => service.active);
  const reviewedServices = services.filter((service) => service.reviewsCount > 0 && service.rating > 0);
  const averageRating = reviewedServices.length
    ? (reviewedServices.reduce((total, service) => total + service.rating, 0) / reviewedServices.length).toFixed(1)
    : "-";
  const completedOrders = earnings?.completed_orders ?? orders.filter((order) => order.status === "Selesai").length;
  const totalOrders = earnings?.total_orders ?? orders.length;
  const inProgressOrders = orders.filter((order) => order.status === "Sedang Diproses").length;
  const completionRate = totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const hasData = services.length > 0 || orders.length > 0 || Boolean(earnings?.total_orders);
  const hasErrors = Boolean(errors.services || errors.orders || errors.earnings);

  if (isLoading && !hasData) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-[1536px] items-center justify-center px-8 py-12 text-slate-500">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        <span className="text-sm font-black">Memuat dashboard seller...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Dashboard Seller</h1>
          <p className="mt-2 text-xl text-slate-600">Kelola layanan dan pesanan Anda{currentUser?.name ? `, ${currentUser.name}` : ""}</p>
        </div>
        <button
          onClick={onRetry}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Coba Lagi
        </button>
      </div>

      {hasErrors && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">Sebagian data dashboard seller gagal dimuat.</p>
              <p className="mt-1 text-sm font-semibold">Data dari endpoint yang berhasil tetap ditampilkan. Tekan Coba Lagi untuk mengambil ulang semua bagian.</p>
            </div>
          </div>
          <button onClick={onRetry} disabled={isLoading} className="h-10 rounded-lg bg-amber-600 px-5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60">
            Coba Lagi
          </button>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Pendapatan" value={formatPrice(earnings?.gross_revenue || 0)} tone="bg-emerald-100 text-emerald-600" />
        <StatCard icon={ShoppingCart} label="Total Pesanan" value={`${totalOrders}`} tone="bg-blue-100 text-blue-600" />
        <StatCard icon={Box} label="Layanan Aktif" value={`${activeServices.length}`} tone="bg-purple-100 text-purple-600" />
        <StatCard icon={Star} label="Rating Rata-rata" value={averageRating} tone="bg-orange-100 text-orange-600" />
      </div>

      <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-9">
          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <SectionError title="GET /api/seller/services gagal" message={errors.services} onRetry={onRetry} />
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
              {services.length === 0 ? (
                <EmptyState title="Belum ada layanan." description="Layanan yang Anda buat melalui Kelola Layanan akan muncul di sini." actionLabel="Buat Layanan" onAction={() => setActiveTab("seller-services")} />
              ) : (
                services.slice(0, 3).map((service) => {
                  const sold = orders.filter((order) => order.serviceTitle === service.title).length;
                  return (
                    <article key={service.id} className="rounded-xl border border-slate-200 p-5">
                      <h3 className="text-xl font-black text-slate-950">{service.title}</h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-base">
                        <span className="font-black text-purple-600">{formatPrice(service.price)}</span>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-slate-900">{service.reviewsCount > 0 ? service.rating : "-"}</span>
                        <span className="text-slate-500">({service.reviewsCount} review)</span>
                      </div>
                      <div className="mt-5 flex items-center gap-3 text-base text-slate-600">
                        <ShoppingCart className="h-4 w-4" />
                        {sold} pesanan
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${service.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{service.active ? "Aktif" : "Nonaktif"}</span>
                      </div>
                      <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
                        <button onClick={() => setActiveTab("seller-services")} className="h-10 flex-1 rounded-lg bg-purple-600 font-semibold text-white hover:bg-purple-700">
                          Edit
                        </button>
                        <button onClick={() => setActiveTab("seller-earnings")} className="h-10 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                          Statistik
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <SectionError title="GET /api/seller/orders gagal" message={errors.orders} onRetry={onRetry} />
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">Pesanan Terbaru</h2>
              <button onClick={() => setActiveTab("seller-orders")} className="font-semibold text-purple-600 hover:text-purple-700">
                Lihat Semua
              </button>
            </div>
            <div className="mt-7 space-y-4">
              {orders.length === 0 ? (
                <EmptyState title="Belum ada pesanan." description="Pesanan dari layanan seller Anda akan muncul setelah pembeli menyelesaikan transaksi." />
              ) : (
                orders.slice(0, 3).map((order) => (
                  <article key={order.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-5">
                    <div>
                      <h3 className="text-lg font-black text-slate-950">{order.serviceTitle}</h3>
                      <p className="mt-2 text-base text-slate-600">Pelanggan: {order.buyerName}</p>
                      <p className="mt-2 font-black text-purple-600">{formatPrice(order.servicePrice)}</p>
                      <p className="mt-2 text-sm text-slate-500">{order.date || "Baru saja"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${orderTone(order.status)}`}>{order.status}</span>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <SectionError title="GET /api/seller/earnings gagal" message={errors.earnings} onRetry={onRetry} />
            <h2 className="text-xl font-black text-slate-950">Performa Pesanan</h2>
            {[
              ["Pesanan Selesai", `${completedOrders}/${totalOrders}`, completionRate, "bg-emerald-600"],
              ["Sedang Diproses", `${inProgressOrders}`, totalOrders ? Math.round((inProgressOrders / totalOrders) * 100) : 0, "bg-blue-600"],
              ["Pendapatan Bersih", formatPrice(earnings?.estimated_net_revenue || 0), earnings?.gross_revenue ? Math.round(((earnings?.estimated_net_revenue || 0) / earnings.gross_revenue) * 100) : 0, "bg-purple-600"]
            ].map(([label, value, percent, color]) => (
              <div key={label as string} className="mt-6">
                <div className="flex justify-between gap-4 text-base">
                  <span className="text-slate-600">{label as string}</span>
                  <span className="font-black text-slate-950">{value as string}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${color as string}`} style={{ width: `${percent as number}%` }} />
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Aksi Cepat</h2>
            {[
              [Box, "Tambah Layanan Baru", "seller-services", "bg-purple-100 text-purple-600", false],
              [Eye, "Lihat Profil Publik", "profil", "bg-blue-100 text-blue-600", false],
              [TrendingUp, "Analitik Detail", "seller-earnings", "bg-emerald-100 text-emerald-600", false],
              [Users, "Kelola Pelanggan", "seller-orders", "bg-orange-100 text-orange-600", false]
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
