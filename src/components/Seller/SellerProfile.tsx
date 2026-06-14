import React, { useEffect, useMemo, useState } from "react";
import { Award, Briefcase, Edit3, FileText, Loader2, Plus, Save, Trash2, Upload, UserRound, X } from "lucide-react";
import { fetchSellerProfile, SellerProfilePayload, updateSellerProfile } from "../../lib/karirHubApi";

type Experience = SellerProfilePayload["experiences"][number];
type Certificate = SellerProfilePayload["certificates"][number];
type Portfolio = SellerProfilePayload["portfolios"][number];

const emptySellerProfile: SellerProfilePayload = {
  basic: { photoUrl: "", fullName: "", tagline: "", bio: "" },
  specializations: ["CV & Resume", "Interview Preparation", "Career Coaching"],
  experiences: [],
  certificates: [],
  portfolios: []
};

const inputClass = "h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50";
const textareaClass = "w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50";

export const SellerProfile: React.FC<{ currentUser: any; toast: (msg: string, status?: string) => void }> = ({ currentUser, toast }) => {
  const [profile, setProfile] = useState<SellerProfilePayload>(emptySellerProfile);
  const [initialProfile, setInitialProfile] = useState<SellerProfilePayload>(emptySellerProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [experienceForm, setExperienceForm] = useState<Experience | null>(null);
  const [certificateForm, setCertificateForm] = useState<Certificate | null>(null);
  const [portfolioForm, setPortfolioForm] = useState<Portfolio | null>(null);

  const initials = useMemo(() => (profile.basic.fullName || currentUser?.name || "JD").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(), [profile.basic.fullName, currentUser?.name]);

  const loadProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { profile: loaded } = await fetchSellerProfile();
      const next = { ...emptySellerProfile, ...loaded, basic: { ...emptySellerProfile.basic, ...loaded.basic, fullName: loaded.basic.fullName || currentUser?.name || "" } };
      setProfile(next);
      setInitialProfile(next);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal memuat profil seller." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateBasic = (patch: Partial<SellerProfilePayload["basic"]>) => setProfile((prev) => ({ ...prev, basic: { ...prev.basic, ...patch } }));

  const saveAll = async () => {
    setSaving(true);
    setMessage({ type: "info", text: "Menyimpan profil seller..." });
    try {
      const { profile: saved } = await updateSellerProfile(profile);
      setProfile(saved);
      setInitialProfile(saved);
      setMessage({ type: "success", text: "Profil seller berhasil disimpan." });
      toast("Profil seller berhasil disimpan.", "success");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan profil seller.";
      setMessage({ type: "error", text });
      toast(text, "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Foto harus JPG/PNG maksimal 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateBasic({ photoUrl: String(reader.result || "") });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || profile.specializations.includes(value)) return;
    setProfile((prev) => ({ ...prev, specializations: [...prev.specializations, value] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => setProfile((prev) => ({ ...prev, specializations: prev.specializations.filter((item) => item !== tag) }));
  const removeItem = (type: "experiences" | "certificates" | "portfolios", id: string) => {
    if (!window.confirm("Hapus data ini?")) return;
    setProfile((prev) => ({ ...prev, [type]: prev[type].filter((item: any) => item.id !== id) }));
  };

  const upsertList = <T extends { id: string }>(key: "experiences" | "certificates" | "portfolios", item: T) => {
    setProfile((prev) => {
      const exists = (prev[key] as any[]).some((entry) => entry.id === item.id && item.id);
      const nextItem = { ...item, id: item.id || `local-${Date.now()}` };
      return { ...prev, [key]: exists ? (prev[key] as any[]).map((entry) => entry.id === item.id ? nextItem : entry) : [nextItem, ...(prev[key] as any[])] };
    });
  };

  if (loading) return <Loading label="Memuat profil seller..." />;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-left text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black text-slate-950">Profil Seller</h1>
        <p className="mt-2 text-lg font-medium text-slate-500">Kelola informasi profil dan kredensial Anda</p>
        {message && <StatusBox type={message.type} text={message.text} />}

        <Section icon={UserRound} title="Profil Dasar" tone="purple">
          <label className="mb-3 block text-xs font-black text-slate-500">Foto Profil</label>
          <div className="mb-7 flex flex-wrap items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-purple-100 text-3xl font-black text-purple-700">
              {profile.basic.photoUrl ? <img src={profile.basic.photoUrl} alt="Foto profil" className="h-full w-full object-cover" /> : initials}
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-black text-white hover:bg-purple-700">
              <Upload className="h-4 w-4" />
              Upload Foto
              <input type="file" accept="image/png,image/jpeg" onChange={uploadPhoto} className="hidden" />
            </label>
            <p className="text-xs font-semibold text-slate-400">JPG, PNG maksimal 2MB. Preview lokal dipakai sampai Storage siap.</p>
          </div>
          <div className="space-y-5">
            <Field label="Nama Lengkap"><input className={inputClass} value={profile.basic.fullName} onChange={(e) => updateBasic({ fullName: e.target.value })} /></Field>
            <Field label="Tagline Profesional"><input className={inputClass} value={profile.basic.tagline} onChange={(e) => updateBasic({ tagline: e.target.value })} placeholder="Contoh: Senior HR Professional with 10+ Years Experience" /></Field>
            <Field label="Bio"><textarea className={textareaClass} rows={6} value={profile.basic.bio} onChange={(e) => updateBasic({ bio: e.target.value })} placeholder="Ceritakan tentang diri Anda, keahlian, dan pengalaman..." /></Field>
            <TagEditor label="Spesialisasi" tone="purple" tags={profile.specializations} input={tagInput} setInput={setTagInput} addTag={addTag} removeTag={removeTag} addLabel="Tambah Spesialisasi" />
          </div>
        </Section>

        <ListSection icon={Briefcase} title="Pengalaman" tone="purple" addLabel="Tambah Pengalaman" onAdd={() => setExperienceForm({ id: "", position: "", company: "", startDate: "", endDate: "", description: "" })}>
          {profile.experiences.length === 0 ? <Empty label="Belum ada pengalaman." /> : profile.experiences.map((item) => (
            <ProfileItem key={item.id} title={item.position} subtitle={item.company} meta={`${item.startDate} - ${item.endDate || "Sekarang"}`} body={item.description} onEdit={() => setExperienceForm(item)} onDelete={() => removeItem("experiences", item.id)} />
          ))}
        </ListSection>

        <ListSection icon={Award} title="Sertifikat" tone="purple" addLabel="Tambah Sertifikat" onAdd={() => setCertificateForm({ id: "", name: "", issuer: "", year: "" })}>
          {profile.certificates.length === 0 ? <Empty label="Belum ada sertifikat." /> : profile.certificates.map((item) => (
            <ProfileItem key={item.id} title={item.name} subtitle={item.issuer} meta={item.year} onEdit={() => setCertificateForm(item)} onDelete={() => removeItem("certificates", item.id)} />
          ))}
        </ListSection>

        <ListSection icon={FileText} title="Portfolio" tone="purple" addLabel="Tambah Portfolio" onAdd={() => setPortfolioForm({ id: "", title: "", description: "", link: "" })}>
          {profile.portfolios.length === 0 ? <Empty label="Belum ada portfolio." /> : profile.portfolios.map((item) => (
            <ProfileItem key={item.id} title={item.title} subtitle={item.description} meta={item.link} onEdit={() => setPortfolioForm(item)} onDelete={() => removeItem("portfolios", item.id)} />
          ))}
        </ListSection>

        <div className="mt-10 grid gap-3 sm:grid-cols-[1fr_96px]">
          <button onClick={saveAll} disabled={saving} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-purple-600 text-sm font-black text-white hover:bg-purple-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Semua Perubahan
          </button>
          <button onClick={() => setProfile(initialProfile)} disabled={saving} className="h-14 rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50">Batal</button>
        </div>
      </div>

      {experienceForm && <ExperienceModal value={experienceForm} setValue={setExperienceForm} onSubmit={(item) => { upsertList("experiences", item); setExperienceForm(null); }} />}
      {certificateForm && <CertificateModal value={certificateForm} setValue={setCertificateForm} onSubmit={(item) => { upsertList("certificates", item); setCertificateForm(null); }} />}
      {portfolioForm && <PortfolioModal value={portfolioForm} setValue={setPortfolioForm} onSubmit={(item) => { upsertList("portfolios", item); setPortfolioForm(null); }} />}
    </div>
  );
};

const Loading = ({ label }: { label: string }) => <div className="flex min-h-[420px] items-center justify-center gap-3 text-sm font-black text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-2 block text-xs font-black text-slate-500">{label}</span>{children}</label>;
const StatusBox = ({ type, text }: { type: "success" | "error" | "info"; text: string }) => <div className={`mt-6 rounded-lg border px-4 py-3 text-sm font-bold ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{text}</div>;
const Empty = ({ label }: { label: string }) => <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-400">{label}</div>;

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; tone: "purple"; children: React.ReactNode }) => (
  <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div className="mb-7 flex items-center gap-3"><Icon className="h-6 w-6 text-purple-600" /><h2 className="text-2xl font-black text-slate-900">{title}</h2></div>
    {children}
  </section>
);

const ListSection = ({ icon: Icon, title, addLabel, onAdd, children }: { icon: React.ElementType; title: string; tone: "purple"; addLabel: string; onAdd: () => void; children: React.ReactNode }) => (
  <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><Icon className="h-6 w-6 text-purple-600" /><h2 className="text-2xl font-black text-slate-900">{title}</h2></div>
      <button onClick={onAdd} className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-black text-white hover:bg-purple-700"><Plus className="h-4 w-4" />{addLabel}</button>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const TagEditor = ({ label, tags, input, setInput, addTag, removeTag, addLabel }: { label: string; tone: "purple"; tags: string[]; input: string; setInput: (value: string) => void; addTag: () => void; removeTag: (tag: string) => void; addLabel: string }) => (
  <div>
    <p className="mb-3 text-xs font-black text-slate-500">{label}</p>
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-black text-purple-700">{tag}<button onClick={() => removeTag(tag)}><Trash2 className="h-3.5 w-3.5" /></button></span>)}
    </div>
    <div className="mt-3 flex max-w-md gap-2">
      <input className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-purple-500" value={input} onChange={(e) => setInput(e.target.value)} placeholder={addLabel} />
      <button onClick={addTag} className="h-10 rounded-lg px-3 text-sm font-black text-purple-600 hover:bg-purple-50">+ {addLabel}</button>
    </div>
  </div>
);

const ProfileItem = ({ title, subtitle, meta, body, onEdit, onDelete }: { title: string; subtitle?: string; meta?: string; body?: string; onEdit: () => void; onDelete: () => void }) => (
  <article className="rounded-lg border border-slate-200 p-5">
    <div className="flex justify-between gap-4">
      <div><h3 className="font-black text-slate-900">{title}</h3>{subtitle && <p className="mt-1 font-semibold text-slate-500">{subtitle}</p>}{meta && <p className="mt-2 text-sm font-semibold text-slate-400">{meta}</p>}{body && <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>}</div>
      <div className="flex gap-2"><button onClick={onEdit} className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><Edit3 className="mx-auto h-4 w-4" /></button><button onClick={onDelete} className="h-9 w-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 className="mx-auto h-4 w-4" /></button></div>
    </div>
  </article>
);

const Modal = ({ title, onSubmit, onCancel, children }: { title: string; onSubmit: (event: React.FormEvent) => void; onCancel: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <form onSubmit={onSubmit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button type="button" onClick={onCancel}><X className="h-5 w-5" /></button></div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="h-11 rounded-lg border border-slate-200 px-5 font-bold text-slate-600">Batal</button><button type="submit" className="h-11 rounded-lg bg-purple-600 px-5 font-bold text-white">Simpan</button></div>
    </form>
  </div>
);

const ExperienceModal = ({ value, setValue, onSubmit }: { value: Experience; setValue: (value: Experience | null) => void; onSubmit: (value: Experience) => void }) => (
  <Modal title="Pengalaman" onCancel={() => setValue(null)} onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
    <Field label="Posisi"><input required className={inputClass} value={value.position} onChange={(e) => setValue({ ...value, position: e.target.value })} /></Field>
    <Field label="Perusahaan"><input required className={inputClass} value={value.company} onChange={(e) => setValue({ ...value, company: e.target.value })} /></Field>
    <Field label="Tanggal Mulai"><input className={inputClass} value={value.startDate} onChange={(e) => setValue({ ...value, startDate: e.target.value })} /></Field>
    <Field label="Tanggal Selesai"><input className={inputClass} value={value.endDate} onChange={(e) => setValue({ ...value, endDate: e.target.value })} /></Field>
    <label className="md:col-span-2"><span className="mb-2 block text-xs font-black text-slate-500">Deskripsi</span><textarea className={textareaClass} rows={4} value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} /></label>
  </Modal>
);

const CertificateModal = ({ value, setValue, onSubmit }: { value: Certificate; setValue: (value: Certificate | null) => void; onSubmit: (value: Certificate) => void }) => (
  <Modal title="Sertifikat" onCancel={() => setValue(null)} onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
    <Field label="Nama Sertifikat"><input required className={inputClass} value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></Field>
    <Field label="Institusi Penerbit"><input required className={inputClass} value={value.issuer} onChange={(e) => setValue({ ...value, issuer: e.target.value })} /></Field>
    <Field label="Tahun"><input className={inputClass} value={value.year} onChange={(e) => setValue({ ...value, year: e.target.value })} /></Field>
  </Modal>
);

const PortfolioModal = ({ value, setValue, onSubmit }: { value: Portfolio; setValue: (value: Portfolio | null) => void; onSubmit: (value: Portfolio) => void }) => (
  <Modal title="Portfolio" onCancel={() => setValue(null)} onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
    <Field label="Judul Portfolio"><input required className={inputClass} value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} /></Field>
    <Field label="Link Opsional"><input className={inputClass} value={value.link} onChange={(e) => setValue({ ...value, link: e.target.value })} /></Field>
    <label className="md:col-span-2"><span className="mb-2 block text-xs font-black text-slate-500">Deskripsi</span><textarea className={textareaClass} rows={4} value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} /></label>
  </Modal>
);
