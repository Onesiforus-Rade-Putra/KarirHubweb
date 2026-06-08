import React, { useEffect, useMemo, useState } from "react";
import { Award, Briefcase, Download, Edit3, FileText, GraduationCap, Loader2, MapPin, Plus, RefreshCw, Save, Trash2, Upload, X } from "lucide-react";
import {
  deleteCvMetadata,
  fetchUserProfile,
  ProfileCertification,
  ProfileCvFile,
  ProfileEducation,
  ProfileExperience,
  saveCvMetadata,
  updateUserProfile,
  UserProfilePayload
} from "../../lib/karirHubApi";

interface ProfileProps {
  currentUser: any;
  onUpdateName: (newName: string) => void;
  toast: (msg: string, status?: string) => void;
}

const emptyProfile = (currentUser: any): UserProfilePayload => ({
  user: {
    id: currentUser?.id || "local",
    name: currentUser?.name || "Pengguna KarirHub",
    email: currentUser?.email || "",
    role: currentUser?.role || "seeker",
    avatar: currentUser?.avatar,
    company: currentUser?.company
  },
  details: {
    title: "",
    location: "",
    phone: "",
    website: "",
    about: ""
  },
  experiences: [],
  educations: [],
  certifications: [],
  skills: [],
  cvFiles: [],
  settings: {
    language: "id",
    region: "ID",
    emailNotifications: true,
    productNotifications: false,
    paymentMethods: []
  }
});

const cvStorageKey = (userId: string, cvId: string) => `karirhub_cv_file_${userId}_${cvId}`;
const localCvListKey = (userId: string) => `karirhub_cv_metadata_${userId}`;

const formatSize = (size: number) => {
  if (!size) return "Ukuran tidak tersedia";
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const SectionCard = ({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const TextInput = ({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-bold text-slate-500">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      placeholder={placeholder}
      className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
    />
  </label>
);

export const UserProfile: React.FC<ProfileProps> = ({ currentUser, onUpdateName, toast }) => {
  const [profile, setProfile] = useState<UserProfilePayload>(() => emptyProfile(currentUser));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfile(currentUser));
  const [experienceForm, setExperienceForm] = useState<ProfileExperience | null>(null);
  const [educationForm, setEducationForm] = useState<ProfileEducation | null>(null);
  const [certificationForm, setCertificationForm] = useState<ProfileCertification | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const userId = profile.user.id || currentUser?.id || "local";

  const initials = useMemo(
    () =>
      (profile.user.name || "KH")
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [profile.user.name]
  );

  const loadProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      const { profile: loaded } = await fetchUserProfile();
      const localCv = readLocalCvMetadata(loaded.user.id);
      const mergedCv = [...loaded.cvFiles];
      localCv.forEach((item) => {
        if (!mergedCv.some((existing) => existing.id === item.id)) mergedCv.push(item);
      });
      setProfile({ ...loaded, cvFiles: mergedCv });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil.");
      setProfile((prev) => ({ ...prev, cvFiles: readLocalCvMetadata(prev.user.id) }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const readLocalCvMetadata = (id: string): ProfileCvFile[] => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(localCvListKey(id)) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeLocalCvMetadata = (id: string, files: ProfileCvFile[]) => {
    window.localStorage.setItem(localCvListKey(id), JSON.stringify(files.filter((item) => item.id.startsWith("local-"))));
  };

  const persistProfile = async (next: UserProfilePayload, successMessage: string) => {
    setIsSaving(true);
    setError("");
    try {
      const { profile: saved } = await updateUserProfile(next);
      const localCv = readLocalCvMetadata(saved.user.id);
      setProfile({ ...saved, cvFiles: [...saved.cvFiles, ...localCv.filter((item) => !saved.cvFiles.some((cv) => cv.id === item.id))] });
      onUpdateName(saved.user.name);
      toast(successMessage, "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan profil.");
      toast(err instanceof Error ? err.message : "Gagal menyimpan profil.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const openProfileEditor = () => {
    setProfileForm(profile);
    setIsEditingProfile(true);
  };

  const submitProfile = (event: React.FormEvent) => {
    event.preventDefault();
    setIsEditingProfile(false);
    persistProfile(profileForm, "Profil berhasil disimpan.");
  };

  const upsertExperience = (event: React.FormEvent) => {
    event.preventDefault();
    if (!experienceForm) return;
    const exists = profile.experiences.some((item) => item.id === experienceForm.id);
    const next = {
      ...profile,
      experiences: exists
        ? profile.experiences.map((item) => (item.id === experienceForm.id ? experienceForm : item))
        : [{ ...experienceForm, id: `local-${Date.now()}` }, ...profile.experiences]
    };
    setExperienceForm(null);
    persistProfile(next, "Pengalaman berhasil disimpan.");
  };

  const upsertEducation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!educationForm) return;
    const exists = profile.educations.some((item) => item.id === educationForm.id);
    const next = {
      ...profile,
      educations: exists
        ? profile.educations.map((item) => (item.id === educationForm.id ? educationForm : item))
        : [{ ...educationForm, id: `local-${Date.now()}` }, ...profile.educations]
    };
    setEducationForm(null);
    persistProfile(next, "Pendidikan berhasil disimpan.");
  };

  const upsertCertification = (event: React.FormEvent) => {
    event.preventDefault();
    if (!certificationForm) return;
    const exists = profile.certifications.some((item) => item.id === certificationForm.id);
    const next = {
      ...profile,
      certifications: exists
        ? profile.certifications.map((item) => (item.id === certificationForm.id ? certificationForm : item))
        : [{ ...certificationForm, id: `local-${Date.now()}` }, ...profile.certifications]
    };
    setCertificationForm(null);
    persistProfile(next, "Sertifikasi berhasil disimpan.");
  };

  const deleteItem = (type: "experiences" | "educations" | "certifications", id: string) => {
    const next = { ...profile, [type]: profile[type].filter((item: any) => item.id !== id) };
    persistProfile(next as UserProfilePayload, "Data berhasil dihapus.");
  };

  const addSkill = (event: React.FormEvent) => {
    event.preventDefault();
    const skill = skillInput.trim();
    if (!skill || profile.skills.includes(skill)) {
      setSkillInput("");
      return;
    }
    setSkillInput("");
    persistProfile({ ...profile, skills: [...profile.skills, skill] }, "Skill berhasil ditambahkan.");
  };

  const removeSkill = (skill: string) => {
    persistProfile({ ...profile, skills: profile.skills.filter((item) => item !== skill) }, "Skill berhasil dihapus.");
  };

  const uploadCv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"].includes(file.type)) {
      toast("Format CV harus PDF atau DOC/DOCX.", "error");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast("Fallback lokal dibatasi 4MB sampai Supabase Storage disiapkan.", "error");
      return;
    }

    setIsUploadingCv(true);
    try {
      const { cvFile } = await saveCvMetadata({ fileName: file.name, fileSize: file.size, fileType: file.type });
      await storeCvLocally(file, cvFile.id, profile.user.id);
      setProfile((prev) => ({ ...prev, cvFiles: [cvFile, ...prev.cvFiles] }));
      toast("Metadata CV tersimpan. File disimpan lokal sampai Supabase Storage disiapkan.", "success");
    } catch {
      const localCv: ProfileCvFile = {
        id: `local-${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        source: "local-metadata",
        createdAt: new Date().toISOString()
      };
      await storeCvLocally(file, localCv.id, profile.user.id);
      const nextFiles = [localCv, ...profile.cvFiles];
      writeLocalCvMetadata(profile.user.id, nextFiles);
      setProfile((prev) => ({ ...prev, cvFiles: nextFiles }));
      toast("API CV belum siap. CV disimpan lokal di browser sebagai fallback aman.", "info");
    } finally {
      setIsUploadingCv(false);
      event.target.value = "";
    }
  };

  const storeCvLocally = (file: File, cvId: string, id: string) =>
    new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          window.localStorage.setItem(cvStorageKey(id, cvId), String(reader.result || ""));
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const downloadCv = (cv: ProfileCvFile) => {
    if (cv.downloadUrl) {
      window.open(cv.downloadUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const dataUrl = window.localStorage.getItem(cvStorageKey(profile.user.id, cv.id));
    if (!dataUrl) {
      const fallback = new Blob(
        [
          `CV metadata KarirHub\n\nNama file: ${cv.fileName}\nUkuran: ${formatSize(cv.fileSize)}\nSumber: ${cv.source}\n\nFile asli tidak tersedia di browser ini karena Supabase Storage belum dikonfigurasi.`
        ],
        { type: "text/plain" }
      );
      const fallbackUrl = URL.createObjectURL(fallback);
      const fallbackAnchor = document.createElement("a");
      fallbackAnchor.href = fallbackUrl;
      fallbackAnchor.download = `${cv.fileName}.metadata.txt`;
      fallbackAnchor.click();
      URL.revokeObjectURL(fallbackUrl);
      toast("File asli tidak tersedia di browser ini. Metadata CV diunduh sebagai fallback.", "info");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = cv.fileName;
    anchor.click();
  };

  const deleteCv = async (cv: ProfileCvFile) => {
    try {
      if (!cv.id.startsWith("local-")) await deleteCvMetadata(cv.id);
    } catch {
      toast("Metadata CV di server gagal dihapus, menghapus tampilan lokal.", "info");
    }
    window.localStorage.removeItem(cvStorageKey(profile.user.id, cv.id));
    const nextFiles = profile.cvFiles.filter((item) => item.id !== cv.id);
    writeLocalCvMetadata(profile.user.id, nextFiles);
    setProfile((prev) => ({ ...prev, cvFiles: nextFiles }));
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-6 py-24 text-slate-600">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Memuat profil dari database...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 text-left text-slate-950">
      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          <span>{error}</span>
          <button onClick={loadProfile} className="inline-flex items-center gap-1 text-amber-900">
            <RefreshCw className="h-4 w-4" />
            Coba lagi
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-blue-600" />
        <div className="-mt-12 flex flex-col gap-5 px-6 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-3xl font-black text-white shadow">
              {initials}
            </div>
            <div>
              <h1 className="text-3xl font-black">{profile.user.name}</h1>
              <p className="mt-1 font-bold text-blue-600">{profile.details.title || "Tambahkan headline karir"}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                <span>{profile.user.email}</span>
                {profile.details.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.details.location}</span>}
              </div>
            </div>
          </div>
          <button onClick={openProfileEditor} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700">
            <Edit3 className="h-4 w-4" />
            Edit Profil
          </button>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SectionCard title="Informasi Pribadi">
            {profile.details.about ? (
              <p className="text-sm leading-7 text-slate-600">{profile.details.about}</p>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-400">Belum ada ringkasan profil.</p>
            )}
            <div className="mt-5 grid gap-4 text-sm md:grid-cols-3">
              <InfoLabel label="Telepon" value={profile.details.phone || "-"} />
              <InfoLabel label="Website" value={profile.details.website || "-"} />
              <InfoLabel label="Lokasi" value={profile.details.location || "-"} />
            </div>
          </SectionCard>

          <SectionCard
            title="Pengalaman"
            action={<SmallAction onClick={() => setExperienceForm({ id: "", role: "", company: "", startDate: "", endDate: "", isCurrent: false, description: "" })} label="Tambah" />}
          >
            {experienceForm && (
              <ProfileForm onSubmit={upsertExperience} onCancel={() => setExperienceForm(null)}>
                <TextInput label="Role" value={experienceForm.role} onChange={(value) => setExperienceForm({ ...experienceForm, role: value })} required />
                <TextInput label="Perusahaan" value={experienceForm.company} onChange={(value) => setExperienceForm({ ...experienceForm, company: value })} required />
                <TextInput label="Mulai" value={experienceForm.startDate || ""} onChange={(value) => setExperienceForm({ ...experienceForm, startDate: value })} placeholder="Jan 2024" />
                <TextInput label="Selesai" value={experienceForm.endDate || ""} onChange={(value) => setExperienceForm({ ...experienceForm, endDate: value })} placeholder="Sekarang / Des 2025" />
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-bold text-slate-500">Deskripsi</span>
                  <textarea value={experienceForm.description || ""} onChange={(event) => setExperienceForm({ ...experienceForm, description: event.target.value })} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                </label>
              </ProfileForm>
            )}
            <ListEmpty visible={profile.experiences.length === 0} label="Belum ada pengalaman kerja." />
            <div className="space-y-4">
              {profile.experiences.map((item) => (
                <ListItem key={item.id} icon={Briefcase} title={item.role} subtitle={`${item.company} - ${[item.startDate, item.isCurrent ? "Sekarang" : item.endDate].filter(Boolean).join(" - ")}`} body={item.description} onEdit={() => setExperienceForm(item)} onDelete={() => deleteItem("experiences", item.id)} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Pendidikan"
            action={<SmallAction onClick={() => setEducationForm({ id: "", school: "", degree: "", period: "" })} label="Tambah" />}
          >
            {educationForm && (
              <ProfileForm onSubmit={upsertEducation} onCancel={() => setEducationForm(null)}>
                <TextInput label="Sekolah / Universitas" value={educationForm.school} onChange={(value) => setEducationForm({ ...educationForm, school: value })} required />
                <TextInput label="Gelar / Jurusan" value={educationForm.degree} onChange={(value) => setEducationForm({ ...educationForm, degree: value })} required />
                <TextInput label="Periode" value={educationForm.period || ""} onChange={(value) => setEducationForm({ ...educationForm, period: value })} placeholder="2018 - 2022" />
              </ProfileForm>
            )}
            <ListEmpty visible={profile.educations.length === 0} label="Belum ada riwayat pendidikan." />
            <div className="space-y-4">
              {profile.educations.map((item) => (
                <ListItem key={item.id} icon={GraduationCap} title={item.school} subtitle={item.degree} body={item.period} onEdit={() => setEducationForm(item)} onDelete={() => deleteItem("educations", item.id)} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Sertifikasi"
            action={<SmallAction onClick={() => setCertificationForm({ id: "", name: "", issuer: "" })} label="Tambah" />}
          >
            {certificationForm && (
              <ProfileForm onSubmit={upsertCertification} onCancel={() => setCertificationForm(null)}>
                <TextInput label="Nama Sertifikasi" value={certificationForm.name} onChange={(value) => setCertificationForm({ ...certificationForm, name: value })} required />
                <TextInput label="Issuer" value={certificationForm.issuer} onChange={(value) => setCertificationForm({ ...certificationForm, issuer: value })} required />
              </ProfileForm>
            )}
            <ListEmpty visible={profile.certifications.length === 0} label="Belum ada sertifikasi." />
            <div className="space-y-4">
              {profile.certifications.map((item) => (
                <ListItem key={item.id} icon={Award} title={item.name} subtitle={item.issuer} onEdit={() => setCertificationForm(item)} onDelete={() => deleteItem("certifications", item.id)} />
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard title="Skill">
            <form onSubmit={addSkill} className="flex gap-2">
              <input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} placeholder="Tambah skill" className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
              <button type="submit" disabled={isSaving} className="rounded-lg bg-blue-600 px-4 text-sm font-bold text-white">
                <Plus className="h-4 w-4" />
              </button>
            </form>
            {profile.skills.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-400">Belum ada skill.</p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="text-blue-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="CV">
            <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center hover:bg-slate-100">
              {isUploadingCv ? <Loader2 className="h-7 w-7 animate-spin text-blue-600" /> : <Upload className="h-7 w-7 text-blue-600" />}
              <span className="mt-3 text-sm font-black text-slate-800">Upload CV</span>
              <span className="mt-1 text-xs text-slate-500">PDF/DOC/DOCX, max 4MB untuk fallback lokal</span>
              <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={uploadCv} className="hidden" />
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">Storage Supabase belum dikonfigurasi di tahap ini. Metadata disimpan ke database; isi file fallback disimpan lokal di browser untuk download.</p>
            <ListEmpty visible={profile.cvFiles.length === 0} label="Belum ada CV tersimpan." />
            <div className="mt-4 space-y-3">
              {profile.cvFiles.map((cv) => (
                <div key={cv.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 h-5 w-5 text-blue-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-slate-900">{cv.fileName}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{formatSize(cv.fileSize)} - {cv.source === "local-metadata" ? "Fallback lokal" : "Storage"}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => downloadCv(cv)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-bold text-white">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button onClick={() => deleteCv(cv)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 text-sm font-bold text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-black text-amber-900">Hapus akun dinonaktifkan</h2>
            <p className="mt-2 text-sm leading-6 text-amber-800">Penghapusan permanen belum diaktifkan pada tahap ini. Gunakan halaman Bantuan untuk membuat request manual.</p>
          </section>
        </aside>
      </div>

      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={submitProfile} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black">Edit Profil</h2>
              <button type="button" onClick={() => setIsEditingProfile(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Nama" value={profileForm.user.name} onChange={(value) => setProfileForm({ ...profileForm, user: { ...profileForm.user, name: value } })} required />
              <TextInput label="Headline" value={profileForm.details.title} onChange={(value) => setProfileForm({ ...profileForm, details: { ...profileForm.details, title: value } })} />
              <TextInput label="Lokasi" value={profileForm.details.location} onChange={(value) => setProfileForm({ ...profileForm, details: { ...profileForm.details, location: value } })} />
              <TextInput label="Telepon" value={profileForm.details.phone} onChange={(value) => setProfileForm({ ...profileForm, details: { ...profileForm.details, phone: value } })} />
              <TextInput label="Website" value={profileForm.details.website} onChange={(value) => setProfileForm({ ...profileForm, details: { ...profileForm.details, website: value } })} />
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-500">Tentang</span>
                <textarea value={profileForm.details.about} onChange={(event) => setProfileForm({ ...profileForm, details: { ...profileForm.details, about: event.target.value } })} rows={5} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setIsEditingProfile(false)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700">Batal</button>
              <button type="submit" disabled={isSaving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 font-semibold text-white">
                <Save className="h-4 w-4" />
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const InfoLabel = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-slate-50 p-4">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 font-bold text-slate-800">{value}</p>
  </div>
);

const SmallAction = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button onClick={onClick} className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-50 px-3 text-sm font-bold text-blue-700 hover:bg-blue-100">
    <Plus className="h-4 w-4" />
    {label}
  </button>
);

const ProfileForm = ({ onSubmit, onCancel, children }: { onSubmit: (event: React.FormEvent) => void; onCancel: () => void; children: React.ReactNode }) => (
  <form onSubmit={onSubmit} className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
    <div className="grid gap-4 md:grid-cols-2">{children}</div>
    <div className="mt-4 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">Batal</button>
      <button type="submit" className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white">Simpan</button>
    </div>
  </form>
);

const ListEmpty = ({ visible, label }: { visible: boolean; label: string }) =>
  visible ? <p className="rounded-xl border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-400">{label}</p> : null;

const ListItem = ({
  icon: Icon,
  title,
  subtitle,
  body,
  onEdit,
  onDelete
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  body?: string;
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <article className="flex gap-4 rounded-xl border border-slate-200 p-4">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
      <Icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="font-black text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>}
      {body && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{body}</p>}
    </div>
    <div className="flex gap-1">
      <button onClick={onEdit} className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-50" title="Edit"><Edit3 className="mx-auto h-4 w-4" /></button>
      <button onClick={onDelete} className="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50" title="Hapus"><Trash2 className="mx-auto h-4 w-4" /></button>
    </div>
  </article>
);
