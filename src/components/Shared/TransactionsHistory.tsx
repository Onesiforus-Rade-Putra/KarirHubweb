import React, { useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Download, Eye, HelpCircle, Search, XCircle } from "lucide-react";
import { Transaction } from "../../types";

interface TxListProps {
  transactions: Transaction[];
  toast: (msg: string, status?: string) => void;
  onSupport?: () => void;
}

const fallbackTransactions: Transaction[] = [
  {
    id: "TRX-KH-20260519-001",
    itemTitle: "AI Foto CV HD",
    category: "premium",
    price: 15375,
    date: "19 Mei 2026, 14:35 WIB",
    status: "Berhasil",
    paymentMethod: "QRIS"
  },
  {
    id: "TRX-KH-20260519-002",
    itemTitle: "Bimbingan Privat Ahli Karir",
    category: "service",
    price: 250000,
    date: "19 Mei 2026, 10:20 WIB",
    status: "Pending",
    paymentMethod: "BCA Virtual Account",
    vaNumber: "8808 1234 5678 9012"
  },
  {
    id: "TRX-KH-20260519-003",
    itemTitle: "AI Resume Optimization Pass",
    category: "premium",
    price: 49000,
    date: "18 Mei 2026, 16:05 WIB",
    status: "Gagal",
    paymentMethod: "Kartu Debit/Kredit"
  }
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);

const statusStyles = {
  Berhasil: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Gagal: "bg-red-100 text-red-700"
};

const statusIcon = {
  Berhasil: CheckCircle2,
  Pending: Clock,
  Gagal: XCircle
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-slate-200 py-4 text-base">
    <span className="text-slate-600">{label}</span>
    <span className="font-semibold text-slate-950">{value}</span>
  </div>
);

export const TransactionsHistory: React.FC<TxListProps> = ({ transactions, toast, onSupport }) => {
  const [txList, setTxList] = useState<Transaction[]>(transactions.length ? transactions : fallbackTransactions);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState<"Semua" | Transaction["status"]>("Semua");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  React.useEffect(() => {
    setTxList(transactions);
  }, [transactions]);

  const filtered = txList.filter((tx) => {
    const matchesStatus = activeStatus === "Semua" || tx.status === activeStatus;
    const term = searchTerm.toLowerCase();
    return matchesStatus && (tx.itemTitle.toLowerCase().includes(term) || tx.id.toLowerCase().includes(term));
  });

  const markPaid = (tx: Transaction) => {
    const updated: Transaction = { ...tx, status: "Berhasil", paymentMethod: tx.paymentMethod || "QRIS" };
    setTxList((prev) => prev.map((item) => (item.id === tx.id ? updated : item)));
    setSelectedTx(updated);
    toast("Pembayaran berhasil dikonfirmasi.", "success");
  };

  if (selectedTx) {
    const Icon = statusIcon[selectedTx.status];
    const ok = selectedTx.status === "Berhasil";
    const failed = selectedTx.status === "Gagal";

    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[860px]">
          <button onClick={() => setSelectedTx(null)} className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Riwayat Transaksi
          </button>

          <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h1 className="text-[40px] font-black leading-tight">Detail Transaksi</h1>
            {ok && (
              <button onClick={() => toast("Invoice berhasil diunduh.", "success")} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">
                <Download className="h-5 w-5" />
                Download Invoice
              </button>
            )}
          </div>

          <div className={`mt-8 flex items-center gap-4 rounded-xl border p-6 ${failed ? "border-red-200 bg-red-50 text-red-700" : ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
            <Icon className="h-8 w-8 shrink-0" />
            <div>
              <h2 className="text-lg font-black">{failed ? "Pembayaran Gagal" : ok ? "Pembayaran Berhasil" : "Menunggu Pembayaran"}</h2>
              <p className="mt-1 text-base">{failed ? "Transaksi tidak dapat diproses atau waktu pembayaran telah habis." : ok ? "Transaksi telah berhasil diproses" : "Selesaikan pembayaran untuk mengaktifkan layanan."}</p>
            </div>
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black">Informasi Transaksi</h2>
            <div className="mt-6">
              <DetailRow label="Nomor Transaksi" value={selectedTx.id} />
              <DetailRow label="Tanggal & Waktu" value={selectedTx.date} />
              <DetailRow label="Status" value={<span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${statusStyles[selectedTx.status]}`}><Icon className="h-4 w-4" />{selectedTx.status}</span>} />
              <DetailRow label="Metode Pembayaran" value={selectedTx.paymentMethod || "QRIS"} />
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black">Rincian Pembayaran</h2>
            <div className="mt-6">
              <DetailRow label="Nama Layanan" value={selectedTx.itemTitle} />
              <DetailRow label="Harga Layanan" value={formatPrice(Math.round(selectedTx.price / 1.025))} />
              <DetailRow label="Biaya Admin (2.5%)" value={formatPrice(selectedTx.price - Math.round(selectedTx.price / 1.025))} />
              <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-5 text-xl font-black">
                <span>Total Pembayaran</span>
                <span className="text-blue-600">{formatPrice(selectedTx.price)}</span>
              </div>
            </div>
          </section>

          {failed || selectedTx.status === "Pending" ? (
            <>
              <button onClick={() => markPaid(selectedTx)} className="mt-6 h-12 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">
                {failed ? "Coba Bayar Lagi" : "Saya Sudah Bayar"}
              </button>
              <button onClick={() => setSelectedTx(null)} className="mt-4 h-12 w-full rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">
                Ganti Metode Pembayaran
              </button>
              <button onClick={onSupport} className="mt-7 flex w-full items-center justify-center gap-2 font-semibold text-blue-600"><HelpCircle className="h-5 w-5" />Hubungi Bantuan</button>
            </>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button onClick={() => setSelectedTx(null)} className="h-12 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Kembali</button>
              <button onClick={onSupport} className="h-12 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Hubungi Bantuan</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1130px] px-8 py-12 text-left">
      <h1 className="text-[40px] font-black leading-tight text-slate-950">Riwayat Transaksi</h1>
      <p className="mt-2 text-xl text-slate-600">Pantau status pembayaran dan invoice layanan KarirHub Anda.</p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-12 w-full rounded-lg border border-slate-200 pl-12 pr-4 outline-none focus:border-blue-500" placeholder="Cari transaksi..." />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["Semua", "Berhasil", "Pending", "Gagal"] as const).map((status) => (
              <button key={status} onClick={() => setActiveStatus(status)} className={`h-10 rounded-lg px-4 font-semibold ${activeStatus === status ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filtered.map((tx) => {
            const Icon = statusIcon[tx.status];
            return (
              <article key={tx.id} className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-5 md:flex-row md:items-center">
                <div className="flex gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${statusStyles[tx.status]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{tx.itemTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">{tx.id} • {tx.date}</p>
                    <p className="mt-1 text-sm text-slate-500">{tx.paymentMethod || "QRIS"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:text-right">
                  <div>
                    <p className="text-xl font-black text-slate-950">{formatPrice(tx.price)}</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[tx.status]}`}>{tx.status}</span>
                  </div>
                  <button onClick={() => setSelectedTx(tx)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50">
                    {tx.status === "Berhasil" ? <Eye className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {tx.status === "Berhasil" ? "Detail" : tx.status === "Pending" ? "Bayar" : "Coba Lagi"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
