import React, { useEffect, useMemo, useState } from "react";
import { Building2, Edit3, Loader2, MapPin, Plus, Save, Trash2, Upload, Users, X } from "lucide-react";
import { fetchRecruiterProfile, RecruiterProfilePayload, updateRecruiterProfile } from "../../lib/karirHubApi";

type Location = RecruiterProfilePayload["locations"][number];
type TeamMember = RecruiterProfilePayload["teamMembers"][number];

const emptyRecruiterProfile: RecruiterProfilePayload = {
  company: { logoUrl: "", companyName: "", industry: "", companySize: "", companyEmail: "", phone: "", website: "", about: "" },
  benefits: [],
  locations: [],
  teamMembers: []
};

const inputClass = "h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50";
const textareaClass = "w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50";

export const RecruiterProfile: React.FC<{ currentUser: any; toast: (msg: string, status?: string) => void }> = ({ currentUser, toast }) => {
  const [profile, setProfile] = useState<RecruiterProfilePayload>(emptyRecruiterProfile);
  const [initialProfile, setInitialProfile] = useState<RecruiterProfilePayload>(emptyRecruiterProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [benefitInput, setBenefitInput] = useState("");
  const [locationForm, setLocationForm] = useState<Location | null>(null);
  const [teamForm, setTeamForm] = useState<TeamMember | null>(null);

  const initials = useMemo(() => (profile.company.companyName || currentUser?.company || currentUser?.name || "KH").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(), [profile.company.companyName, currentUser?.company, currentUser?.name]);

  const loadProfile = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { profile: loaded } = await fetchRecruiterProfile();
      const next = { ...emptyRecruiterProfile, ...loaded, company: { ...emptyRecruiterProfile.company, ...loaded.company, companyName: loaded.company.companyName || currentUser?.company || "" } };
      setProfile(next);
      setInitialProfile(next);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Gagal memuat profil recruiter." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const updateCompany = (patch: Partial<RecruiterProfilePayload["company"]>) => setProfile((prev) => ({ ...prev, company: { ...prev.company, ...patch } }));

  const saveAll = async () => {
    setSaving(true);
    setMessage({ type: "info", text: "Menyimpan profil perusahaan..." });
    try {
      const { profile: saved } = await updateRecruiterProfile(profile);
      setProfile(saved);
      setInitialProfile(saved);
      setMessage({ type: "success", text: "Profil perusahaan berhasil disimpan." });
      toast("Profil perusahaan berhasil disimpan.", "success");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Gagal menyimpan profil recruiter.";
      setMessage({ type: "error", text });
      toast(text, "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo harus PNG/JPG maksimal 2MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateCompany({ logoUrl: String(reader.result || "") });
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const addBenefit = () => {
    const value = benefitInput.trim();
    if (!value || profile.benefits.includes(value)) return;
    setProfile((prev) => ({ ...prev, benefits: [...prev.benefits, value] }));
    setBenefitInput("");
  };

  const removeBenefit = (benefit: string) => setProfile((prev) => ({ ...prev, benefits: prev.benefits.filter((item) => item !== benefit) }));
  const removeItem = (type: "locations" | "teamMembers", id: string) => {
    if (!window.confirm("Hapus data ini?")) return;
    setProfile((prev) => ({ ...prev, [type]: prev[type].filter((item: any) => item.id !== id) }));
  };

  const upsertList = <T extends { id: string }>(key: "locations" | "teamMembers", item: T) => {
    setProfile((prev) => {
      const exists = (prev[key] as any[]).some((entry) => entry.id === item.id && item.id);
      const nextItem = { ...item, id: item.id || `local-${Date.now()}` };
      return { ...prev, [key]: exists ? (prev[key] as any[]).map((entry) => entry.id === item.id ? nextItem : entry) : [nextItem, ...(prev[key] as any[])] };
    });
  };

  if (loading) return <Loading label="Memuat profil recruiter..." />;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-left text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black text-slate-950">Profil Perusahaan</h1>
        <p className="mt-2 text-lg font-medium text-slate-500">Kelola informasi dan profil perusahaan Anda</p>
        {message && <StatusBox type={message.type} text={message.text} />}

        <Section icon={Building2} title="Informasi Perusahaan">
          <label className="mb-3 block text-xs font-black text-slate-500">Logo Perusahaan</label>
          <div className="mb-7 flex flex-wrap items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-emerald-100 text-2xl font-black text-emerald-700">
              {profile.company.logoUrl ? <img src={profile.company.logoUrl} alt="Logo perusahaan" className="h-full w-full object-cover" /> : initials}
            </div>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700">
              <Upload className="h-4 w-4" />
              Upload Logo
              <input type="file" accept="image/png,image/jpeg" onChange={uploadLogo} className="hidden" />
            </label>
            <p className="text-xs font-semibold text-slate-400">PNG, JPG maksimal 2MB. Preview lokal dipakai sampai Storage siap.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama Perusahaan"><input required className={inputClass} value={profile.company.companyName} onChange={(e) => updateCompany({ companyName: e.target.value })} /></Field>
            <Field label="Industri"><input className={inputClass} value={profile.company.industry} onChange={(e) => updateCompany({ industry: e.target.value })} /></Field>
            <Field label="Ukuran Perusahaan"><input className={inputClass} value={profile.company.companySize} onChange={(e) => updateCompany({ companySize: e.target.value })} /></Field>
            <Field label="Email Perusahaan"><input className={inputClass} value={profile.company.companyEmail} onChange={(e) => updateCompany({ companyEmail: e.target.value })} /></Field>
            <Field label="Nomor Telepon"><input className={inputClass} value={profile.company.phone} onChange={(e) => updateCompany({ phone: e.target.value })} /></Field>
            <Field label="Website Perusahaan"><input className={inputClass} value={profile.company.website} onChange={(e) => updateCompany({ website: e.target.value })} /></Field>
            <label className="md:col-span-2"><span className="mb-2 block text-xs font-black text-slate-500">Tentang Perusahaan</span><textarea className={textareaClass} rows={6} value={profile.company.about} onChange={(e) => updateCompany({ about: e.target.value })} placeholder="Ceritakan tentang perusahaan Anda, visi, misi, dan budaya kerja..." /></label>
          </div>

          <TagEditor tags={profile.benefits} input={benefitInput} setInput={setBenefitInput} addTag={addBenefit} removeTag={removeBenefit} />
        </Section>

        <ListSection icon={MapPin} title="Lokasi Kantor" addLabel="Tambah Lokasi Kantor" onAdd={() => setLocationForm({ id: "", name: "", address: "", city: "", officeType: "Branch Office" })}>
          {profile.locations.length === 0 ? <Empty label="Belum ada lokasi kantor." /> : profile.locations.map((item) => (
            <ProfileItem key={item.id} title={item.name} badge={item.officeType} subtitle={item.address} meta={item.city} onEdit={() => setLocationForm(item)} onDelete={() => removeItem("locations", item.id)} />
          ))}
        </ListSection>

        <ListSection icon={Users} title="Tim Rekrutmen" addLabel="Tambah Anggota Tim" onAdd={() => setTeamForm({ id: "", name: "", position: "", email: "" })}>
          {profile.teamMembers.length === 0 ? <Empty label="Belum ada anggota tim." /> : profile.teamMembers.map((item) => (
            <ProfileItem key={item.id} title={item.name} subtitle={item.position} meta={item.email} avatar={item.name} onEdit={() => setTeamForm(item)} onDelete={() => removeItem("teamMembers", item.id)} />
          ))}
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">Info: Anggota tim dapat mengakses dashboard recruiter dan mengelola lowongan serta pelamar.</div>
        </ListSection>

        <div className="mt-10 grid gap-3 sm:grid-cols-[1fr_96px]">
          <button onClick={saveAll} disabled={saving} className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Semua Perubahan
          </button>
          <button onClick={() => setProfile(initialProfile)} disabled={saving} className="h-14 rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50">Batal</button>
        </div>
      </div>

      {locationForm && <LocationModal value={locationForm} setValue={setLocationForm} onSubmit={(item) => { upsertList("locations", item); setLocationForm(null); }} />}
      {teamForm && <TeamModal value={teamForm} setValue={setTeamForm} onSubmit={(item) => { upsertList("teamMembers", item); setTeamForm(null); }} />}
    </div>
  );
};

const Loading = ({ label }: { label: string }) => <div className="flex min-h-[420px] items-center justify-center gap-3 text-sm font-black text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-2 block text-xs font-black text-slate-500">{label}</span>{children}</label>;
const StatusBox = ({ type, text }: { type: "success" | "error" | "info"; text: string }) => <div className={`mt-6 rounded-lg border px-4 py-3 text-sm font-bold ${type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>{text}</div>;
const Empty = ({ label }: { label: string }) => <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm font-bold text-slate-400">{label}</div>;

const Section = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
  <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div className="mb-7 flex items-center gap-3"><Icon className="h-6 w-6 text-emerald-600" /><h2 className="text-2xl font-black text-slate-900">{title}</h2></div>
    {children}
  </section>
);

const ListSection = ({ icon: Icon, title, addLabel, onAdd, children }: { icon: React.ElementType; title: string; addLabel: string; onAdd: () => void; children: React.ReactNode }) => (
  <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><Icon className="h-6 w-6 text-emerald-600" /><h2 className="text-2xl font-black text-slate-900">{title}</h2></div>
      <button onClick={onAdd} className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"><Plus className="h-4 w-4" />{addLabel}</button>
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

const TagEditor = ({ tags, input, setInput, addTag, removeTag }: { tags: string[]; input: string; setInput: (value: string) => void; addTag: () => void; removeTag: (tag: string) => void }) => (
  <div className="mt-7">
    <p className="mb-3 text-xs font-black text-slate-500">Benefit & Fasilitas</p>
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-black text-emerald-700">{tag}<button onClick={() => removeTag(tag)}><Trash2 className="h-3.5 w-3.5" /></button></span>)}
    </div>
    <div className="mt-3 flex max-w-md gap-2"><input className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tambah Benefit" /><button onClick={addTag} className="h-10 rounded-lg px-3 text-sm font-black text-emerald-600 hover:bg-emerald-50">+ Tambah Benefit</button></div>
  </div>
);

const ProfileItem = ({ title, subtitle, meta, badge, avatar, onEdit, onDelete }: { title: string; subtitle?: string; meta?: string; badge?: string; avatar?: string; onEdit: () => void; onDelete: () => void }) => {
  const initials = avatar ? avatar.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "";
  return (
    <article className="rounded-lg border border-slate-200 p-5">
      <div className="flex justify-between gap-4">
        <div className="flex gap-4">
          {avatar && <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">{initials}</div>}
          <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{title}</h3>{badge && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">{badge}</span>}</div>{subtitle && <p className="mt-1 font-semibold text-slate-500">{subtitle}</p>}{meta && <p className="mt-2 text-sm font-semibold text-slate-400">{meta}</p>}</div>
        </div>
        <div className="flex gap-2"><button onClick={onEdit} className="h-9 w-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><Edit3 className="mx-auto h-4 w-4" /></button><button onClick={onDelete} className="h-9 w-9 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"><Trash2 className="mx-auto h-4 w-4" /></button></div>
      </div>
    </article>
  );
};

const Modal = ({ title, onSubmit, onCancel, children }: { title: string; onSubmit: (event: React.FormEvent) => void; onCancel: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <form onSubmit={onSubmit} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{title}</h2><button type="button" onClick={onCancel}><X className="h-5 w-5" /></button></div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onCancel} className="h-11 rounded-lg border border-slate-200 px-5 font-bold text-slate-600">Batal</button><button type="submit" className="h-11 rounded-lg bg-emerald-600 px-5 font-bold text-white">Simpan</button></div>
    </form>
  </div>
);

const LocationModal = ({ value, setValue, onSubmit }: { value: Location; setValue: (value: Location | null) => void; onSubmit: (value: Location) => void }) => (
  <Modal title="Lokasi Kantor" onCancel={() => setValue(null)} onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
    <Field label="Nama Lokasi"><input required className={inputClass} value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></Field>
    <Field label="Kota"><input className={inputClass} value={value.city} onChange={(e) => setValue({ ...value, city: e.target.value })} /></Field>
    <label className="md:col-span-2"><span className="mb-2 block text-xs font-black text-slate-500">Alamat</span><textarea className={textareaClass} rows={3} value={value.address} onChange={(e) => setValue({ ...value, address: e.target.value })} /></label>
    <Field label="Tipe"><select className={inputClass} value={value.officeType} onChange={(e) => setValue({ ...value, officeType: e.target.value as Location["officeType"] })}><option>Head Office</option><option>Branch Office</option></select></Field>
  </Modal>
);

const TeamModal = ({ value, setValue, onSubmit }: { value: TeamMember; setValue: (value: TeamMember | null) => void; onSubmit: (value: TeamMember) => void }) => (
  <Modal title="Anggota Tim Rekrutmen" onCancel={() => setValue(null)} onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
    <Field label="Nama Anggota"><input required className={inputClass} value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></Field>
    <Field label="Posisi / Jabatan"><input className={inputClass} value={value.position} onChange={(e) => setValue({ ...value, position: e.target.value })} /></Field>
    <Field label="Email"><input type="email" className={inputClass} value={value.email} onChange={(e) => setValue({ ...value, email: e.target.value })} /></Field>
  </Modal>
);
