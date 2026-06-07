import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Image as ImageIcon,
  QrCode,
  RefreshCw,
  Shield,
  ShoppingCart,
  Sparkles,
  Trash2,
  Upload,
  Wallet,
  XCircle
} from "lucide-react";

const styles = ["Formal (Jas)", "Business Casual", "Creative Startup", "PNS / BUMN (Merah)"];
const servicePrice = 15000;
const adminFee = 375;
const totalPayment = servicePrice + adminFee;
const transactionId = "TRX-KH-20260519-001";

type StudioStep = "upload" | "checkout" | "qris" | "va" | "success" | "failed" | "detail" | "generating" | "result";
type PaymentMethod = "QRIS" | "GoPay" | "OVO" | "DANA" | "ShopeePay" | "BCA Virtual Account" | "BNI Virtual Account" | "BRI Virtual Account" | "Mandiri Virtual Account" | "Kartu Debit/Kredit";

const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

const paymentGroups: Array<{
  title: string;
  methods: Array<{ id: PaymentMethod; label: string; desc?: string; icon: React.ElementType }>;
}> = [
  {
    title: "QRIS",
    methods: [{ id: "QRIS", label: "QRIS", desc: "Bayar dengan aplikasi e-wallet atau mobile banking", icon: QrCode }]
  },
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
  {
    title: "KARTU",
    methods: [{ id: "Kartu Debit/Kredit", label: "Kartu Debit/Kredit", desc: "Visa, Mastercard, dan kartu debit/kredit lainnya", icon: CreditCard }]
  }
];

const Row = ({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) => (
  <div className="flex items-center justify-between border-b border-slate-200 py-4 text-base">
    <span className="text-slate-600">{label}</span>
    <span className={strong ? "font-black text-slate-950" : "font-semibold text-slate-950"}>{value}</span>
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

interface AIPhotoStudioProps {
  onSaveRequest?: (payload: {
    style: string;
    sourceImageUrl?: string;
    resultImageUrl?: string;
    paymentMethod?: string;
  }) => void | Promise<void>;
}

export const AIPhotoStudio: React.FC<AIPhotoStudioProps> = ({ onSaveRequest }) => {
  const [step, setStep] = useState<StudioStep>("upload");
  const [selectedStyle, setSelectedStyle] = useState("Formal (Jas)");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [copied, setCopied] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (step !== "generating") return;

    setProgress(0);
    const timer = setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          clearInterval(timer);
          setTimeout(() => setStep("result"), 500);
          return 100;
        }
        return value + 10;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [step]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCamera = () => {
    setUploadedImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600");
  };

  const handleGenerate = () => {
    if (!uploadedImage) {
      setUploadedImage("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600");
    }
    setHasPaid(false);
    setStep("generating");
  };

  const markPaid = async () => {
    await onSaveRequest?.({
      style: selectedStyle,
      sourceImageUrl: uploadedImage || undefined,
      resultImageUrl: resultImage,
      paymentMethod
    });
    setHasPaid(true);
    setStep("success");
  };

  const continuePayment = () => {
    if (paymentMethod.includes("Virtual Account")) {
      setStep("va");
      return;
    }
    setStep("qris");
  };

  const resultImage =
    selectedStyle === "Business Casual"
      ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=700"
      : selectedStyle === "Creative Startup"
        ? "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=700"
        : selectedStyle === "PNS / BUMN (Merah)"
          ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=700"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700";

  if (step === "checkout") {
    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[1130px]">
          <button onClick={() => setStep("result")} className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-950">
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
                  <h2 className="text-xl font-black">AI Foto CV HD</h2>
                  <p className="mt-2 text-base leading-6 text-slate-600">Foto CV profesional berbasis AI siap digunakan untuk CV dan LinkedIn</p>
                </div>
              </div>
              <div className="mt-7 border-t border-slate-200 pt-5">
                <div className="flex justify-between py-3 text-base"><span className="text-slate-600">Harga layanan</span><span className="font-semibold">{formatPrice(servicePrice)}</span></div>
                <div className="flex justify-between py-3 text-base"><span className="text-slate-600">Biaya admin (2.5%)</span><span className="font-semibold">{formatPrice(adminFee)}</span></div>
                <div className="mt-2 flex justify-between border-t border-slate-200 py-5 text-xl font-black"><span>Total</span><span className="text-blue-600">{formatPrice(totalPayment)}</span></div>
              </div>
              <button onClick={continuePayment} className="h-12 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Bayar Sekarang</button>
              <button onClick={() => setStep("result")} className="mt-3 h-12 w-full rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Kembali</button>
              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500"><Shield className="h-4 w-4" />Pembayaran aman</p>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (step === "qris" || step === "va") {
    const isQris = step === "qris";
    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[760px]">
          <button onClick={() => setStep("checkout")} className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-950">
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
                    <span className="font-mono text-2xl font-black tracking-wide">8808 1234 5678 9012</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("8808123456789012");
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
            <button onClick={() => setStep("checkout")} className="h-12 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Ganti Metode Pembayaran</button>
            <button
              onClick={markPaid}
              className="h-12 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700"
            >
              Saya Sudah Bayar
            </button>
          </div>
          <button onClick={() => setStep("failed")} className="mx-auto mt-5 block text-sm font-semibold text-slate-500 hover:text-red-600">Simulasikan Pembayaran Gagal</button>
          <p className="mt-5 text-center text-sm text-slate-500">Pembayaran akan diverifikasi otomatis oleh sistem.</p>
        </div>
      </div>
    );
  }

  if (step === "success" || step === "failed") {
    const ok = step === "success";
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
              title={ok ? "Layanan Anda sudah aktif" : "Transaksi Gagal"}
              desc={ok ? "Silakan download hasil foto CV HD Anda." : "Transaksi tidak dapat diproses atau waktu pembayaran telah habis."}
            />
          </div>

          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-left">
            <h2 className="text-xl font-black">Detail Transaksi</h2>
            <div className="mt-5">
              <Row label="Nomor Transaksi" value={transactionId} />
              {ok && <Row label="Layanan" value="AI Foto CV HD" />}
              {ok && <Row label="Metode Pembayaran" value={paymentMethod} />}
              <Row label="Total Pembayaran" value={<span className={ok ? "text-blue-600" : ""}>{formatPrice(totalPayment)}</span>} />
              {ok && <Row label="Tanggal" value="19 Mei 2026" />}
              <Row label="Status" value={<span className={`rounded-full px-3 py-1 text-sm ${ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{ok ? "Berhasil" : "Gagal"}</span>} />
            </div>
          </section>

          {ok ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <button onClick={() => setStep("result")} className="h-12 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Kembali ke Preview</button>
                <a href={resultImage} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">
                  <Download className="h-4 w-4" />
                  Download Foto
                </a>
              </div>
              <button onClick={() => setStep("detail")} className="mt-7 inline-flex items-center gap-2 font-semibold text-blue-600"><Download className="h-4 w-4" />Download Invoice</button>
            </>
          ) : (
            <>
              <button onClick={() => continuePayment()} className="mt-6 h-12 w-full rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Coba Bayar Lagi</button>
              <button onClick={() => setStep("checkout")} className="mt-4 h-12 w-full rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Ganti Metode Pembayaran</button>
              <p className="mt-7 font-semibold text-blue-600">Hubungi Bantuan</p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (step === "detail") {
    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[860px]">
          <button onClick={() => setStep("success")} className="inline-flex items-center gap-2 text-base font-medium text-slate-600 hover:text-slate-950">
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
              <Row label="Nomor Transaksi" value={transactionId} />
              <Row label="Tanggal & Waktu" value="19 Mei 2026, 14:35 WIB" />
              <Row label="Status" value={<span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">Berhasil</span>} />
              <Row label="Metode Pembayaran" value={paymentMethod} />
            </div>
          </section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-black">Rincian Pembayaran</h2>
            <div className="mt-6">
              <Row label="Nama Layanan" value="AI Foto CV HD" />
              <Row label="Harga Layanan" value={formatPrice(servicePrice)} />
              <Row label="Biaya Admin (2.5%)" value={formatPrice(adminFee)} />
              <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-5 text-xl font-black"><span>Total Pembayaran</span><span className="text-blue-600">{formatPrice(totalPayment)}</span></div>
            </div>
          </section>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <button onClick={() => setStep("success")} className="h-12 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">Kembali</button>
            <button className="h-12 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700">Hubungi Bantuan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-8 pb-24 pt-16 text-slate-950">
      <div className="mx-auto max-w-[1390px]">
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-black tracking-normal">AI Foto CV Instan</h1>
          <p className="mt-5 text-xl leading-8 text-slate-600">Ubah selfie biasa menjadi pas foto profesional dengan kemeja jas atau blazer dalam hitungan detik.</p>
        </div>

        {step === "upload" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.9fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-8">
              <h2 className="text-2xl font-black tracking-normal">Unggah Selfie Anda</h2>
              <div className="relative mt-7 flex min-h-[735px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <input id="selfie-file-input" type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 cursor-pointer opacity-0" />
                {uploadedImage ? (
                  <div className="relative z-10 flex flex-col items-center">
                    <img src={uploadedImage} alt="Preview selfie" className="h-80 w-64 rounded-xl object-cover shadow-sm" />
                    <button onClick={(event) => { event.stopPropagation(); setUploadedImage(null); }} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                      Hapus Foto
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10 max-w-sm">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Upload className="h-10 w-10" /></div>
                    <h3 className="mt-5 text-xl font-black">Unggah Selfie Anda</h3>
                    <p className="mt-3 text-base leading-6 text-slate-600">Pastikan wajah terlihat jelas, tidak blur, dan pencahayaan cukup. Format JPG, PNG, max 10MB.</p>
                    <div className="mt-4 flex justify-center gap-3">
                      <button type="button" onClick={(event) => { event.stopPropagation(); handleCamera(); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700"><Camera className="h-4 w-4" />Buka Kamera</button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); document.getElementById("selfie-file-input")?.click(); }} className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-950 hover:bg-slate-50">Pilih File</button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-8">
              <h2 className="text-2xl font-black tracking-normal">Pilih Gaya Foto</h2>
              <p className="mt-7 max-w-md text-base leading-7 text-slate-600">Pilih preset pakaian dan latar belakang yang sesuai untuk industri incaran Anda.</p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {styles.map((style) => (
                  <button key={style} onClick={() => setSelectedStyle(style)} className={`rounded-xl border p-4 text-center transition ${selectedStyle === style ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ImageIcon className="h-12 w-12" /></div>
                    <p className="mt-4 text-sm font-semibold text-slate-950">{style}</p>
                  </button>
                ))}
              </div>
              <button onClick={handleGenerate} className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-4 text-base font-semibold text-white hover:bg-blue-700">
                <Sparkles className="h-5 w-5" />
                Generate Foto CV
              </button>
            </section>
          </div>
        )}

        {step === "generating" && (
          <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-14 text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <h2 className="mt-6 text-2xl font-black">Mengolah Foto dengan AI</h2>
            <div className="mx-auto mt-6 h-2 max-w-md rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} /></div>
            <p className="mt-3 text-sm font-semibold text-slate-500">{progress}% selesai</p>
          </section>
        )}

        {step === "result" && (
          <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-2xl font-black">Preview Hasil Foto CV AI Anda</h2>
            <p className="mt-3 text-base text-slate-600">
              Lihat hasilnya dulu. Pembayaran hanya diperlukan jika Anda ingin download versi HD.
            </p>
            <img src={resultImage} alt="Hasil Foto CV" className="mx-auto mt-8 h-[420px] w-80 rounded-xl object-cover" />
            {!hasPaid && (
              <div className="mx-auto mt-5 max-w-sm rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                Preview gratis. Download HD: {formatPrice(totalPayment)}
              </div>
            )}
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button onClick={() => setStep("upload")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" />Kembali / Ulangi</button>
              {hasPaid ? (
                <a href={resultImage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"><Download className="h-4 w-4" />Download Foto HD</a>
              ) : (
                <button onClick={() => setStep("checkout")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
                  <Download className="h-4 w-4" />
                  Bayar untuk Download
                </button>
              )}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-8">
          <h2 className="text-xl font-black">Tips untuk Hasil Terbaik</h2>
          <div className="mt-5 grid gap-4 text-base text-slate-600 md:grid-cols-2">
            <p><span className="mr-3 text-blue-600">•</span>Gunakan foto dengan pencahayaan yang baik dan merata</p>
            <p><span className="mr-3 text-blue-600">•</span>Pastikan wajah menghadap kamera secara langsung</p>
            <p><span className="mr-3 text-blue-600">•</span>Hindari menggunakan filter atau edit berlebihan</p>
            <p><span className="mr-3 text-blue-600">•</span>Background polos akan memberikan hasil yang lebih baik</p>
          </div>
        </section>
      </div>
    </div>
  );
};
