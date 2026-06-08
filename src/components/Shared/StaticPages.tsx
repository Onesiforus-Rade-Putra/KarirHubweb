import React, { useEffect, useState } from "react";
import { Bell, CreditCard, FileText, HelpCircle, Loader2, Lock, Mail, Plus, Shield, Trash2, UserRound } from "lucide-react";
import { fetchUserSettings, updateUserSettings, UserProfileSettings } from "../../lib/karirHubApi";

const PageShell = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="mx-auto max-w-5xl px-6 py-12 text-left text-slate-950">
    <div className="mb-8">
      <h1 className="text-[40px] font-black leading-tight">{title}</h1>
      <p className="mt-3 text-lg leading-7 text-slate-600">{subtitle}</p>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">{children}</div>
  </div>
);

export const SettingsPage: React.FC<{ currentUser: any; toast: (msg: string, status?: string) => void }> = ({ currentUser, toast }) => {
  const [settings, setSettings] = useState<UserProfileSettings>({
    language: "id",
    region: "ID",
    emailNotifications: true,
    productNotifications: false,
    paymentMethods: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [paymentLabel, setPaymentLabel] = useState("");
  const [paymentDetail, setPaymentDetail] = useState("");

  useEffect(() => {
    fetchUserSettings()
      .then(({ settings: loaded }) => {
        setSettings(loaded);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Pengaturan belum bisa dimuat dari server.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveSettings = async (next: UserProfileSettings, message = "Pengaturan berhasil disimpan.") => {
    setSettings(next);
    setIsSaving(true);
    try {
      const { settings: saved } = await updateUserSettings(next);
      setSettings(saved);
      setError("");
      toast(message, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pengaturan tersimpan lokal untuk sesi ini.");
      toast("Pengaturan tersimpan lokal untuk sesi ini.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const addPaymentMethod = (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentLabel.trim() || !paymentDetail.trim()) return;
    const next = {
      ...settings,
      paymentMethods: [
        ...settings.paymentMethods,
        {
          id: `local-${Date.now()}`,
          label: paymentLabel.trim(),
          detail: paymentDetail.trim(),
          primary: settings.paymentMethods.length === 0
        }
      ]
    };
    setPaymentLabel("");
    setPaymentDetail("");
    saveSettings(next, "Metode pembayaran disimpan.");
  };

  if (isLoading) {
    return (
      <PageShell title="Pengaturan" subtitle="Kelola preferensi dasar akun KarirHub Anda.">
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          Memuat pengaturan...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Pengaturan" subtitle="Kelola preferensi dasar akun KarirHub Anda.">
      {error && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{error}</div>}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-black">Akun</h2>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">Nama</p>
          <p className="mt-1 text-base font-bold text-slate-900">{currentUser?.name || "Pengguna KarirHub"}</p>
          <p className="mt-4 text-sm font-semibold text-slate-500">Email</p>
          <p className="mt-1 text-base font-bold text-slate-900">{currentUser?.email || "Belum tersedia"}</p>
          <p className="mt-4 text-sm font-semibold text-slate-500">Role</p>
          <p className="mt-1 text-base font-bold capitalize text-slate-900">{currentUser?.role || "seeker"}</p>
        </section>

        <section className="rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-black">Notifikasi</h2>
          </div>
          {[
            ["Update email penting", "emailNotifications"],
            ["Info produk dan tips karir", "productNotifications"]
          ].map(([label, key]) => {
            const enabled = Boolean(settings[key as "emailNotifications" | "productNotifications"]);
            return (
            <button
              key={label as string}
              type="button"
              onClick={() => {
                saveSettings({ ...settings, [key as string]: !enabled } as UserProfileSettings);
              }}
              className="mt-5 flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 text-left"
              disabled={isSaving}
            >
              <span className="font-semibold text-slate-700">{label as string}</span>
              <span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? "bg-blue-600" : "bg-slate-300"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} />
              </span>
            </button>
          );
          })}
        </section>
      </div>

      <section className="mt-5 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <UserRound className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-black">Bahasa dan Region</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-bold text-slate-600">Bahasa</span>
            <select value={settings.language} onChange={(event) => saveSettings({ ...settings, language: event.target.value })} className="h-11 w-full rounded-lg border border-slate-200 px-3 font-semibold text-slate-700">
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-bold text-slate-600">Region</span>
            <select value={settings.region} onChange={(event) => saveSettings({ ...settings, region: event.target.value })} className="h-11 w-full rounded-lg border border-slate-200 px-3 font-semibold text-slate-700">
              <option value="ID">Indonesia</option>
              <option value="SG">Singapore</option>
              <option value="MY">Malaysia</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-black">Metode Pembayaran Lokal</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">Data ini hanya preferensi sederhana, belum terhubung payment gateway atau webhook.</p>
        <form onSubmit={addPaymentMethod} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input value={paymentLabel} onChange={(event) => setPaymentLabel(event.target.value)} placeholder="Nama metode, contoh: BCA" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
          <input value={paymentDetail} onChange={(event) => setPaymentDetail(event.target.value)} placeholder="Detail, contoh: **** 1234" className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
          <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white">
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </form>
        {settings.paymentMethods.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-400">Belum ada metode pembayaran.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {settings.paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <p className="font-black text-slate-900">{method.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{method.detail}</p>
                </div>
                <button onClick={() => saveSettings({ ...settings, paymentMethods: settings.paymentMethods.filter((item) => item.id !== method.id) }, "Metode pembayaran dihapus.")} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-black">Keamanan</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Perubahan password tidak diaktifkan pada tahap ini agar alur register/login/logout tetap aman. Penghapusan akun permanen juga dinonaktifkan; gunakan halaman Bantuan untuk membuat request manual.
        </p>
      </section>
    </PageShell>
  );
};

export const HelpPage: React.FC<{ toast: (msg: string, status?: string) => void }> = ({ toast }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submitHelp = (event: React.FormEvent) => {
    event.preventDefault();
    setSubject("");
    setMessage("");
    toast("Permintaan bantuan dicatat untuk sesi ini. Integrasi tiket backend bisa ditambahkan nanti.", "success");
  };

  return (
    <PageShell title="Bantuan" subtitle="Cari bantuan cepat atau kirim pertanyaan ke tim KarirHub.">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submitHelp} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-600">Topik</span>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} required className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-blue-500" placeholder="Contoh: Pembayaran belum terkonfirmasi" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-600">Pesan</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={6} className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Tuliskan kendala yang ingin dibantu..." />
          </label>
          <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-6 font-semibold text-white hover:bg-blue-700">
            <Mail className="h-4 w-4" />
            Kirim Bantuan
          </button>
        </form>

        <aside className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <HelpCircle className="h-8 w-8 text-blue-600" />
          <h2 className="mt-4 text-lg font-black">Kontak Cepat</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Untuk tahap ini form bantuan masih lokal, jadi tidak membuat endpoint baru atau tabel baru.</p>
          <p className="mt-4 text-sm font-bold text-blue-700">support@karirhub.example</p>
        </aside>
      </div>
    </PageShell>
  );
};

export const TermsPage: React.FC = () => (
  <PageShell title="Ketentuan" subtitle="Ringkasan ketentuan penggunaan layanan KarirHub.">
    <div className="space-y-5 text-sm leading-7 text-slate-600">
      <p><FileText className="mr-2 inline h-4 w-4 text-blue-600" />KarirHub membantu pengguna mencari lowongan, mengelola profil karir, dan membeli layanan karir dari seller.</p>
      <p>Pengguna bertanggung jawab atas kebenaran data profil, CV, portofolio, dan informasi lamaran yang dikirim melalui platform.</p>
      <p>Fitur pembayaran, invoice, dan verifikasi otomatis yang belum terhubung backend produksi ditampilkan sebagai alur aplikasi dan perlu integrasi lanjutan sebelum digunakan secara komersial penuh.</p>
    </div>
  </PageShell>
);

export const PrivacyPage: React.FC = () => (
  <PageShell title="Privasi" subtitle="Ringkasan cara KarirHub menangani data pengguna.">
    <div className="space-y-5 text-sm leading-7 text-slate-600">
      <p><Shield className="mr-2 inline h-4 w-4 text-emerald-600" />Data akun, profil karir, lamaran, transaksi, dan draft resume digunakan untuk menjalankan fitur KarirHub.</p>
      <p>Data yang disimpan lokal seperti bookmark lowongan digunakan untuk menjaga pengalaman pengguna antar refresh tanpa menambah perubahan database pada tahap ini.</p>
      <p>Integrasi penyimpanan file, tiket bantuan, dan preferensi notifikasi permanen memerlukan endpoint dan kebijakan database terpisah pada tahap berikutnya.</p>
    </div>
  </PageShell>
);
