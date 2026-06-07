import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CreditCard, Download, Landmark, Layers, TrendingUp } from "lucide-react";
import { ServiceOrder } from "../../types";
import { SellerEarningsSummary } from "../../lib/karirHubApi";

interface EarningsProps {
  earnings?: SellerEarningsSummary | null;
  orders?: ServiceOrder[];
  onWithdrawFunds?: (amount: number, bank: string, accountNo: string) => void;
  toast?: (msg: string, status?: string) => void;
  setActiveTab?: (tab: string) => void;
}

const transactions = [
  { title: "Review CV Profesional - Budi Santoso", date: "2026-06-05 14:30", amount: 250000, status: "Selesai", type: "in" },
  { title: "Mock Interview - Siti Aminah", date: "2026-06-04 10:15", amount: 350000, status: "Selesai", type: "in" },
  { title: "Penarikan ke Bank BCA - 1234567890", date: "2026-06-03 09:00", amount: 5000000, status: "Selesai", type: "out" },
  { title: "Career Coaching Premium - Ahmad Rizki", date: "2026-06-02 16:45", amount: 500000, status: "Selesai", type: "in" },
  { title: "Optimasi LinkedIn Profile - Dewi Lestari", date: "2026-06-01 11:20", amount: 300000, status: "Pending", type: "in" }
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);

export const SellerEarnings: React.FC<EarningsProps> = ({ earnings, orders = [], onWithdrawFunds, toast, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const visibleTransactions = orders.length
    ? orders.slice(0, 6).map((order) => ({
        title: `${order.serviceTitle} - ${order.buyerName}`,
        date: order.date || "Baru saja",
        amount: order.servicePrice,
        status: order.status === "Selesai" ? "Selesai" : "Pending",
        type: "in"
      }))
    : transactions;

  const handleWithdraw = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!value) return;
    onWithdrawFunds?.(value, "Bank BCA", "1234567890");
    toast?.(`Penarikan ${formatPrice(value)} berhasil diajukan.`, "success");
    setAmount("");
    setIsOpen(false);
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Pendapatan</h1>
          <p className="mt-2 text-xl text-slate-600">Kelola saldo dan riwayat transaksi Anda</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-purple-600 px-8 text-lg font-semibold text-white transition hover:bg-purple-700"
        >
          <Download className="h-5 w-5" />
          Tarik Saldo
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-2xl bg-purple-600 p-8 text-white">
          <p className="text-lg text-purple-100">Saldo Tersedia</p>
          <p className="mt-4 text-4xl font-black">{formatPrice(earnings?.estimated_net_revenue || 0)}</p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-6 h-11 w-full rounded-lg bg-white font-semibold text-purple-600 transition hover:bg-purple-50"
          >
            Tarik Saldo
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-3 text-slate-500">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span className="text-lg">Pendapatan Bulan Ini</span>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-950">{formatPrice(earnings?.gross_revenue || 0)}</p>
          <p className="mt-3 text-base font-medium text-emerald-600">+23% dari bulan lalu</p>
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
              <button className="h-10 rounded-lg border border-slate-200 px-5 font-medium text-slate-700 hover:bg-slate-50">Filter</button>
              <button className="h-10 rounded-lg border border-slate-200 px-5 font-medium text-slate-700 hover:bg-slate-50">Export</button>
            </div>
          </div>

          <div className="mt-7 space-y-5">
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

          <button className="mt-7 w-full text-center text-base font-semibold text-purple-600 hover:text-purple-700">
            Lihat Semua Transaksi
          </button>
        </section>

        <aside className="space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Metode Penarikan</h2>
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">Bank BCA</p>
                  <p className="text-base text-slate-500">**** **** **** 7890</p>
                  <span className="mt-2 inline-flex rounded bg-emerald-100 px-2 py-1 text-sm font-medium text-emerald-700">Default</span>
                </div>
              </div>
            </div>
            <button className="mt-4 h-12 w-full rounded-lg border border-dashed border-slate-300 font-semibold text-slate-700 hover:bg-slate-50">
              + Tambah Rekening Baru
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Statistik</h2>
            {[
              ["Minggu Ini", "Rp 1,8 Jt", "45%"],
              ["Bulan Ini", "Rp 8,2 Jt", "76%"],
              ["Tahun Ini", "Rp 45,5 Jt", "88%"]
            ].map(([label, value, width]) => (
              <div key={label} className="mt-5">
                <div className="flex justify-between text-base">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-black text-slate-950">{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-purple-600" style={{ width }} />
                </div>
              </div>
            ))}
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleWithdraw} className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl">
            <h2 className="text-2xl font-black text-slate-950">Tarik Saldo</h2>
            <p className="mt-2 text-slate-500">Dana akan ditransfer ke Bank BCA default.</p>
            <label className="mt-6 block text-sm font-semibold text-slate-600">Nominal</label>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 font-semibold outline-none focus:border-purple-500"
              placeholder="1000000"
              required
            />
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setIsOpen(false)} className="h-11 flex-1 rounded-lg border border-slate-200 font-semibold text-slate-700">
                Batal
              </button>
              <button type="submit" className="h-11 flex-1 rounded-lg bg-purple-600 font-semibold text-white">
                Ajukan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
