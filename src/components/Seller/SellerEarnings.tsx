import React from "react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Download, Landmark, Layers, TrendingUp } from "lucide-react";
import { ServiceOrder } from "../../types";
import { SellerEarningsSummary } from "../../lib/karirHubApi";

interface EarningsProps {
  earnings?: SellerEarningsSummary | null;
  orders?: ServiceOrder[];
  onUnavailableAction?: (message?: string) => void;
  toast?: (msg: string, status?: string) => void;
  setActiveTab?: (tab: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);

export const SellerEarnings: React.FC<EarningsProps> = ({ earnings, orders = [], onUnavailableAction, setActiveTab }) => {
  const visibleTransactions = orders
    .slice(0, 6)
    .map((order) => ({
        title: `${order.serviceTitle} - ${order.buyerName}`,
        date: order.date || "Baru saja",
        amount: order.servicePrice,
        status: order.status === "Selesai" ? "Selesai" : "Pending",
        type: "in"
      }));
  const unavailable = () => onUnavailableAction?.("Fitur ini belum tersedia pada tahap stabilisasi dashboard seller.");

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Pendapatan</h1>
          <p className="mt-2 text-xl text-slate-600">Kelola saldo dan riwayat transaksi Anda</p>
        </div>
        <button
          onClick={unavailable}
          className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-8 text-lg font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          <Download className="h-5 w-5" />
          Tarik Saldo Belum Tersedia
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-2xl bg-purple-600 p-8 text-white">
          <p className="text-lg text-purple-100">Saldo Tersedia</p>
          <p className="mt-4 text-4xl font-black">{formatPrice(earnings?.estimated_net_revenue || 0)}</p>
          <button
            onClick={unavailable}
            className="mt-6 h-11 w-full rounded-lg bg-white font-semibold text-purple-600 transition hover:bg-purple-50"
          >
            Belum bisa ditarik
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-3 text-slate-500">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span className="text-lg">Pendapatan Bulan Ini</span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">{formatPrice(earnings?.gross_revenue || 0)}</p>
          <p className="mt-3 text-base font-medium text-slate-500">Dihitung dari pesanan seller yang selesai.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="text-2xl font-semibold text-blue-600">$</span>
            <span className="text-lg">Total Pendapatan</span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">{formatPrice(earnings?.gross_revenue || 0)}</p>
          <p className="mt-3 text-base font-medium text-slate-500">Dari {earnings?.total_orders || orders.length} transaksi</p>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-950">Riwayat Transaksi</h2>
            <div className="flex gap-2">
              <button disabled title="Filter pendapatan belum tersedia" className="h-10 cursor-not-allowed rounded-lg border border-slate-200 px-5 font-medium text-slate-400">Filter</button>
              <button disabled title="Export pendapatan belum tersedia" className="h-10 cursor-not-allowed rounded-lg border border-slate-200 px-5 font-medium text-slate-400">Export</button>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {visibleTransactions.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-base font-black text-slate-800">Belum ada transaksi seller.</p>
                <p className="mt-2 text-sm font-medium text-slate-500">Riwayat pendapatan akan muncul setelah pesanan layanan masuk.</p>
              </div>
            )}
            {visibleTransactions.map((tx) => {
              const isOut = tx.type === "out";
              return (
                <article key={tx.title} className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${isOut ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                      {isOut ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-950">{tx.title}</h3>
                      <p className="mt-1 text-base text-slate-500">{tx.date}</p>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-medium ${tx.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <p className={`shrink-0 text-2xl font-black ${isOut ? "text-blue-600" : "text-emerald-600"}`}>
                    {isOut ? "-" : "+"}
                    {formatPrice(tx.amount)}
                  </p>
                </article>
              );
            })}
          </div>

          <button disabled title="Daftar penuh transaksi belum tersedia" className="mt-7 w-full cursor-not-allowed text-center text-base font-semibold text-slate-400">
            Lihat Semua Transaksi Belum Tersedia
          </button>
        </section>

        <aside className="space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Metode Penarikan</h2>
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">Belum ada rekening penarikan</p>
                  <p className="text-base text-slate-500">Payout belum diaktifkan pada tahap ini.</p>
                </div>
              </div>
            </div>
            <button disabled title="Tambah rekening belum tersedia" className="mt-4 h-12 w-full cursor-not-allowed rounded-lg border border-dashed border-slate-300 font-semibold text-slate-400">
              Tambah Rekening Belum Tersedia
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Statistik</h2>
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              Statistik periode belum tersedia karena endpoint analitik seller belum dibuat pada tahap ini.
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Aksi Cepat</h2>
            <button
              onClick={() => setActiveTab?.("seller-services")}
              className="mt-5 h-11 w-full rounded-lg border border-slate-200 text-left font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="ml-4 inline-flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                Lihat Layanan
              </span>
            </button>
            <button
              onClick={() => setActiveTab?.("seller-orders")}
              className="mt-3 h-11 w-full rounded-lg border border-slate-200 text-left font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="ml-4 inline-flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                Kelola Pesanan
              </span>
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};
