import React, { useState } from "react";
import { CareerService, ServiceOrder, Transaction } from "../../types";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  HelpCircle,
  QrCode,
  Search,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Wallet,
  XCircle
} from "lucide-react";

interface MarketplaceProps {
  services: CareerService[];
  onAddTransaction: (tx: Transaction, order: ServiceOrder) => void | Promise<void>;
  currentUser: any;
  onSupport?: () => void;
}

type Stage = "browse" | "checkout" | "qris" | "va" | "success" | "failed" | "detail";
type PaymentMethod =
  | "QRIS"
  | "GoPay"
  | "OVO"
  | "DANA"
  | "ShopeePay"
  | "BCA Virtual Account"
  | "BNI Virtual Account"
  | "BRI Virtual Account"
  | "Mandiri Virtual Account"
  | "Kartu Debit/Kredit";

const paymentGroups: Array<{
  title: string;
  methods: Array<{ id: PaymentMethod; label: string; desc?: string; icon: React.ElementType }>;
}> = [
  { title: "QRIS", methods: [{ id: "QRIS", label: "QRIS", desc: "Bayar dengan aplikasi e-wallet atau mobile banking", icon: QrCode }] },
  {
    title: "E-WALLET",
    methods: [
      { id: "GoPay", label: "GoPay", icon: Wallet },
      { id: "OVO", label: "OVO", icon: Wallet },
      { id: "DANA", label: "DANA", icon: Wallet },
      { id: "ShopeePay", label: "ShopeePay", icon: Wallet }
    ]
  },
  {
    title: "VIRTUAL ACCOUNT",
    methods: [
      { id: "BCA Virtual Account", label: "BCA Virtual Account", icon: Building2 },
      { id: "BNI Virtual Account", label: "BNI Virtual Account", icon: Building2 },
      { id: "BRI Virtual Account", label: "BRI Virtual Account", icon: Building2 },
      { id: "Mandiri Virtual Account", label: "Mandiri Virtual Account", icon: Building2 }
    ]
  },
  { title: "KARTU", methods: [{ id: "Kartu Debit/Kredit", label: "Kartu Debit/Kredit", desc: "Visa, Mastercard, dan kartu debit/kredit lainnya", icon: CreditCard }] }
];

const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-slate-200 py-4 text-base">
    <span className="text-slate-600">{label}</span>
    <span className="font-semibold text-slate-950">{value}</span>
  </div>
);

const Notice = ({ tone, title, desc }: { tone: "success" | "danger"; title: string; desc: string }) => {
  const ok = tone === "success";
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-6 ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
      {ok ? <CheckCircle2 className="h-8 w-8 shrink-0" /> : <XCircle className="h-8 w-8 shrink-0" />}
      <div>
        <h3 className="text-lg font-black">{title}</h3>
        <p className="mt-1 text-base">{desc}</p>
      </div>
    </div>
  );
};

export const Marketplace: React.FC<MarketplaceProps> = ({ services, onAddTransaction, currentUser, onSupport }) => {
  const [selectedService, setSelectedService] = useState<CareerService | null>(null);
  const [stage, setStage] = useState<Stage>("browse");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [createdTx, setCreatedTx] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const categories = [
    { id: "all", label: "Semua" },
    { id: "cv-review", label: "Review CV" },
    { id: "mock-interview", label: "Mock Interview" },
    { id: "consulting", label: "Career Coaching" },
    { id: "linkedin", label: "LinkedIn Opt." },
    { id: "psychosomatic", label: "Tes Psikologi" }
  ];

  const getCategoryMatch = (srv: CareerService) => {
    const text = `${srv.title} ${srv.description}`.toLowerCase();
    if (text.includes("linkedin")) return "linkedin";
    if (text.includes("psikologi") || text.includes("tes")) return "psychosomatic";
    if (text.includes("interview") || text.includes("wawancara")) return "mock-interview";
    if (text.includes("coaching") || text.includes("konsultasi")) return "consulting";
    return "cv-review";
  };

  const filteredServices = services.filter((srv) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = srv.title.toLowerCase().includes(query) || srv.description.toLowerCase().includes(query) || srv.providerName.toLowerCase().includes(query);
    return matchesSearch && (selectedFilter === "all" || getCategoryMatch(srv) === selectedFilter);
  });

  const adminFee = selectedService ? Math.round(selectedService.price * 0.025) : 0;
  const totalPayment = selectedService ? selectedService.price + adminFee : 0;
  const transactionId = createdTx?.id || "TRX-KH-20260519-001";
  const vaNumber = createdTx?.vaNumber || "8808 1234 5678 9012";

  const startCheckout = (service: CareerService) => {
    setSelectedService(service);
    setPaymentMethod("QRIS");
    setCreatedTx(null);
    setStage("checkout");
  };

  const createPendingTx = () => {
    if (!selectedService) return null;
    const tx: Transaction = {
      id: `TRX-KH-${Date.now().toString().slice(-9)}`,
      itemTitle: selectedService.title,
      category: "service",
      price: totalPayment,
      date: "19 Mei 2026, 14:35 WIB",
      status: "Pending",
      paymentMethod,
      vaNumber: paymentMethod.includes("Virtual Account") ? "8808 1234 5678 9012" : undefined
    };
    setCreatedTx(tx);
    return tx;
  };

  const continuePayment = () => {
    createPendingTx();
    setStage(paymentMethod.includes("Virtual Account") ? "va" : "qris");
  };

  const markSuccess = async () => {
    if (!selectedService) return;
    const baseTx = createdTx || createPendingTx();
    if (!baseTx) return;

    const paidTx: Transaction = { ...baseTx, status: "Berhasil" };
    const order: ServiceOrder = {
      id: `ORD-${Date.now().toString().slice(-5)}`,
      buyerName: currentUser?.name || "Budi Santoso",
      buyerEmail: currentUser?.email || "budi.santoso@email.com",
      serviceTitle: selectedService.title,
      servicePrice: selectedService.price,
      date: "2026-05-19",
      status: "Baru",
      requirements: "Pesanan dibuat dari checkout Jasa Karir."
    };
    try {
      await onAddTransaction(paidTx, order);
      setCreatedTx(paidTx);
      setStage("success");
    } catch {
      setCreatedTx(baseTx);
    }
  };

  if (stage === "checkout" && selectedService) {
    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[1130px]">
          <button onClick={() => setStage("browse")} className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <h1 className="mt-8 text-[40px] font-black leading-tight">Checkout Pesanan</h1>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-xl border border-slate-200 bg-white p-8">
              <h2 className="text-2xl font-black">Pilih Metode Pembayaran</h2>
              <div className="mt-8 space-y-7">
                {paymentGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-3 text-sm font-black tracking-wide text-slate-600">{group.title}</p>
                    <div className="space-y-3">
                      {group.methods.map((method) => {
                        const Icon = method.icon;
                        const selected = paymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id)}
                            className={`flex min-h-[84px] w-full items-center justify-between rounded-xl border px-4 text-left transition ${selected ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"}`}
                          >
                            <span className="flex items-center gap-4">
                              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <Icon className="h-6 w-6" />
                              </span>
                              <span>
                                <span className="block text-base font-black text-slate-950">{method.label}</span>
                                {method.desc && <span className="mt-1 block text-sm text-slate-600">{method.desc}</span>}
                              </span>
                            </span>
                            <span className={`h-5 w-5 rounded-full border-2 ${selected ? "border-blue-600 bg-blue-600 shadow-[inset_0_0_0_4px_white]" : "border-slate-300"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-xl border border-slate-200 bg-white p-8">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black">{selectedService.title}</h2>
                  <p className="mt-2 text-base leading-6 text-slate-600">{selectedService.providerName}</p>
                </div>
              </div>
              <div className="mt-7 border-t border-slate-200 pt-5">
                <div className="flex justify-between py-3 text-base"><span className="text-slate-600">Harga layanan</span><span className="font-semibold">{formatPrice(selectedService.price)}</span></div>
                <div className="flex justify-between py-3 text-base"><span className="text-slate-600">Biaya admin (2.5%)</span><span className="font-semibold">{formatPrice(adminFee)}</span></div>
                <div className="mt-2 flex justify-between border-t border-slate-200 py-5 text-xl font-black"><span>Total</span><span className="text-blue-600">{formatPrice(totalPayment)}</span></div>
              </div>
              <button onClick={continuePayment} className="h-12 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Bayar Sekarang</button>
              <button onClick={() => setStage("browse")} className="mt-3 h-12 w-full rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Kembali</button>
              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500"><Shield className="h-4 w-4" />Pembayaran aman</p>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if ((stage === "qris" || stage === "va") && selectedService) {
    const isQris = stage === "qris";
    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[760px]">
          <button onClick={() => setStage("checkout")} className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <div className="mt-8 text-center">
            <h1 className="text-[40px] font-black leading-tight">{isQris ? "Selesaikan Pembayaran" : "Pembayaran Virtual Account"}</h1>
            <p className="mt-3 text-xl text-slate-600">{isQris ? "Scan QRIS berikut menggunakan e-wallet atau mobile banking Anda" : "Transfer ke nomor Virtual Account berikut untuk menyelesaikan pembayaran"}</p>
          </div>
          <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 py-4 text-center font-black text-amber-800">
            <Clock className="mr-2 inline h-5 w-5" />
            Batas waktu pembayaran: {isQris ? "23:57" : "24 jam"}
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
            {isQris ? (
              <div className="text-center">
                <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <QrCode className="h-32 w-32" />
                </div>
                <p className="mt-7 text-base text-slate-500">Total Pembayaran</p>
                <p className="mt-2 text-3xl font-black text-blue-600">{formatPrice(totalPayment)}</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 text-blue-600"><Building2 className="h-8 w-8" /></div>
                  <div>
                    <p className="text-base text-slate-600">Bank</p>
                    <h2 className="text-2xl font-black">{paymentMethod}</h2>
                  </div>
                </div>
                <div className="mt-7 border-t border-slate-200 pt-6">
                  <p className="text-base text-slate-600">Nomor Virtual Account</p>
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <span className="font-mono text-2xl font-black tracking-wide">{vaNumber}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(vaNumber.replaceAll(" ", ""));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 font-semibold text-white"
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? "Tersalin" : "Salin"}
                    </button>
                  </div>
                  <p className="mt-7 text-base text-slate-500">Total Pembayaran</p>
                  <p className="mt-2 text-3xl font-black text-blue-600">{formatPrice(totalPayment)}</p>
                </div>
              </div>
            )}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <p className="text-base text-slate-600">Status<br /><span className="font-semibold text-amber-600">Menunggu Pembayaran</span></p>
                <p className="text-base text-slate-600">Nomor Transaksi<br /><span className="font-semibold text-slate-950">{transactionId}</span></p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-xl font-black">Cara Pembayaran</h2>
            <ol className="mt-5 space-y-3 text-base text-slate-600">
              {(isQris
                ? ["Buka aplikasi e-wallet atau mobile banking.", "Pilih menu Scan QRIS.", "Scan QR Code yang tersedia.", "Pastikan nominal pembayaran sesuai.", "Konfirmasi pembayaran."]
                : ["Buka mobile banking atau ATM.", "Pilih menu transfer Virtual Account.", "Masukkan nomor Virtual Account.", "Pastikan nama merchant: KarirHub.", "Lakukan pembayaran sesuai nominal."]
              ).map((item, index) => (
                <li key={item} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-600">{index + 1}</span>{item}</li>
              ))}
            </ol>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <button onClick={() => setStage("checkout")} className="h-12 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Ganti Metode Pembayaran</button>
            <button onClick={markSuccess} className="h-12 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Saya Sudah Bayar</button>
          </div>
          <button onClick={() => setStage("failed")} className="mx-auto mt-5 block text-sm font-semibold text-slate-500 hover:text-red-600">Simulasikan Pembayaran Gagal</button>
          <p className="mt-5 text-center text-sm text-slate-500">Pembayaran akan diverifikasi otomatis oleh sistem.</p>
        </div>
      </div>
    );
  }

  if ((stage === "success" || stage === "failed") && selectedService) {
    const ok = stage === "success";
    return (
      <div className="min-h-screen bg-slate-50 px-8 py-16 text-slate-950">
        <div className="mx-auto max-w-[980px] text-center">
          <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${ok ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
            {ok ? <CheckCircle2 className="h-16 w-16" /> : <XCircle className="h-16 w-16" />}
          </div>
          <h1 className="mt-7 text-[40px] font-black">{ok ? "Pembayaran Berhasil!" : "Pembayaran Gagal"}</h1>
          <p className="mt-3 text-xl text-slate-600">{ok ? "Transaksi Anda telah berhasil diproses" : "Maaf, transaksi Anda tidak dapat diselesaikan"}</p>
          <div className="mt-9 text-left">
            <Notice
              tone={ok ? "success" : "danger"}
              title={ok ? "Pesanan jasa karir sudah aktif" : "Transaksi Gagal"}
              desc={ok ? "Pesanan Anda masuk ke seller dan akan segera diproses." : "Transaksi tidak dapat diproses atau waktu pembayaran telah habis."}
            />
          </div>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-left">
            <h2 className="text-xl font-black">Detail Transaksi</h2>
            <div className="mt-5">
              <DetailRow label="Nomor Transaksi" value={transactionId} />
              {ok && <DetailRow label="Layanan" value={selectedService.title} />}
              {ok && <DetailRow label="Metode Pembayaran" value={paymentMethod} />}
              <DetailRow label="Total Pembayaran" value={<span className={ok ? "text-blue-600" : ""}>{formatPrice(totalPayment)}</span>} />
              {ok && <DetailRow label="Tanggal" value="19 Mei 2026" />}
              <DetailRow label="Status" value={<span className={`rounded-full px-3 py-1 text-sm ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{ok ? "Berhasil" : "Gagal"}</span>} />
            </div>
          </section>
          {ok ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <button onClick={() => setStage("browse")} className="h-12 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Kembali ke Marketplace</button>
                <button onClick={() => setStage("detail")} className="h-12 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Lihat Pesanan</button>
              </div>
              <button onClick={() => setStage("detail")} className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-600"><Download className="h-4 w-4" />Download Invoice</button>
            </>
          ) : (
            <>
              <button onClick={continuePayment} className="mt-6 h-12 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Coba Bayar Lagi</button>
              <button onClick={() => setStage("checkout")} className="mt-4 h-12 w-full rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Ganti Metode Pembayaran</button>
              <button onClick={onSupport} className="mt-7 inline-flex items-center justify-center gap-2 font-semibold text-blue-600"><HelpCircle className="h-5 w-5" />Hubungi Bantuan</button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (stage === "detail" && selectedService) {
    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[860px]">
          <button onClick={() => setStage("success")} className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Riwayat Transaksi
          </button>
          <div className="mt-8 flex items-center justify-between">
            <h1 className="text-[40px] font-black">Detail Transaksi</h1>
            <button className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-6 font-semibold text-white"><Download className="h-5 w-5" />Download Invoice</button>
          </div>
          <div className="mt-8"><Notice tone="success" title="Pembayaran Berhasil" desc="Transaksi telah berhasil diproses" /></div>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black">Informasi Transaksi</h2>
            <div className="mt-6">
              <DetailRow label="Nomor Transaksi" value={transactionId} />
              <DetailRow label="Tanggal & Waktu" value="19 Mei 2026, 14:35 WIB" />
              <DetailRow label="Status" value={<span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">Berhasil</span>} />
              <DetailRow label="Metode Pembayaran" value={paymentMethod} />
            </div>
          </section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black">Rincian Pembayaran</h2>
            <div className="mt-6">
              <DetailRow label="Nama Layanan" value={selectedService.title} />
              <DetailRow label="Harga Layanan" value={formatPrice(selectedService.price)} />
              <DetailRow label="Biaya Admin (2.5%)" value={formatPrice(adminFee)} />
              <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-5 text-xl font-black"><span>Total Pembayaran</span><span className="text-blue-600">{formatPrice(totalPayment)}</span></div>
            </div>
          </section>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <button onClick={() => setStage("browse")} className="h-12 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Kembali</button>
            <button onClick={onSupport} className="h-12 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Hubungi Bantuan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-4">Marketplace Jasa Karir</h1>
        <p className="text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">Temukan mentor ahli untuk Review CV, Mock Interview, dan Konsultasi Karir.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row gap-3 items-center mb-6 shadow-xs max-w-7xl mx-auto">
        <div className="relative flex-grow w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input type="text" placeholder="Cari jasa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-transparent text-sm text-slate-800 focus:outline-none placeholder-slate-400 font-medium" />
        </div>
        <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition font-semibold text-slate-700 text-sm w-full sm:w-auto justify-center cursor-pointer">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          Filter
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-10">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setSelectedFilter(cat.id)} className={`px-5 py-2.5 rounded-full text-xs font-bold border transition ${selectedFilter === cat.id ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
          <p className="font-bold text-slate-500">Jasa tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredServices.map((srv) => (
            <div key={srv.id} className="bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="bg-slate-100/70 rounded-2xl h-28 flex items-center justify-center border-b border-slate-100/20 relative mb-4 overflow-hidden">
                  <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">S</div>
                  <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">Seller Profesional</span>
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2 min-h-[32px] mb-2">{srv.title}</h3>
                <div className="flex items-center gap-1 text-[11px] text-slate-550 mb-4 font-semibold">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 stroke-none" />
                  <span>{srv.rating} ({srv.reviewsCount} ulasan)</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50 border border-slate-100 -mx-5 -mb-5 p-4 rounded-b-3xl mt-2">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none mb-1">Mulai dari</span>
                  <span className="text-xs font-black text-slate-900 leading-none">{formatPrice(srv.price)}</span>
                </div>
                <button onClick={() => startCheckout(srv)} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer">
                  Pesan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 flex justify-center items-center gap-1.5">
        {["Back", "1", "2", ".....", "5", "Next"].map((item) => (
          <button key={item} className={`px-4 py-2 text-xs font-bold rounded-lg ${item === "....." ? "bg-transparent text-blue-600" : "bg-blue-600 text-white hover:bg-blue-700"}`}>{item}</button>
        ))}
      </div>
    </div>
  );
};
