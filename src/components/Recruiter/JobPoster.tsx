import React, { useState } from "react";
import { Job } from "../../types";
import { Briefcase, FileText, MapPin } from "lucide-react";

interface JobPosterProps {
  onAddJob: (newJob: Job) => void | Promise<void>;
  currentUser: any;
  setActiveTab: (tab: string) => void;
}

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-sm font-semibold text-slate-600">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    <div className="mt-2">{children}</div>
  </label>
);

const inputClass = "h-12 w-full rounded-lg border border-slate-200 px-4 text-base outline-none transition focus:border-emerald-500";
const textareaClass = "w-full rounded-lg border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-emerald-500";

const initials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KH";

export const JobPoster: React.FC<JobPosterProps> = ({ onAddJob, currentUser, setActiveTab }) => {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<Job["type"]>("Full-time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");
  const [closingDate, setClosingDate] = useState("");

  const publish = async (status: Job["status"]) => {
    if (!title || !location || !description) return;
    const companyName = currentUser?.company || "";
    await onAddJob({
      id: `job-${Date.now()}`,
      title,
      company: companyName,
      companyLogo: initials(companyName || currentUser?.name || ""),
      location,
      type,
      salaryMin: Number(salaryMin || 0),
      salaryMax: Number(salaryMax || 0),
      category: department || "Engineering",
      postedDate: new Date().toISOString().slice(0, 10),
      applicantsCount: 0,
      status,
      description,
      requirements: requirements.split("\n").filter(Boolean),
      benefits: benefits.split("\n").filter(Boolean)
    });
    setActiveTab("recruiter-jobs");
  };

  return (
    <div className="mx-auto max-w-[900px] px-8 py-12 text-left">
      <div>
        <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Post Lowongan Baru</h1>
        <p className="mt-2 text-xl text-slate-600">Buat lowongan pekerjaan dan temukan kandidat terbaik</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          publish("aktif").catch(() => undefined);
        }}
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-8"
      >
        <section>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <Briefcase className="h-5 w-5 text-emerald-600" />
            Informasi Dasar
          </h2>
          <div className="mt-6 space-y-5">
            <Field label="Nama Posisi" required>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="Contoh: Senior Frontend Developer" />
            </Field>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Departemen">
                <input value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass} />
              </Field>
              <Field label="Level">
                <input value={level} onChange={(event) => setLevel(event.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Detail Pekerjaan
          </h2>
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="Lokasi" required>
                <input value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass} placeholder="Jakarta, Indonesia" />
              </Field>
              <Field label="Tipe Pekerjaan" required>
                <select value={type} onChange={(event) => setType(event.target.value as Job["type"])} className={inputClass}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </Field>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Mode Kerja</p>
              <div className="mt-3 flex gap-8 font-semibold text-slate-600">
                <label><input className="mr-2" name="mode" type="radio" />On-site</label>
                <label><input className="mr-2" name="mode" type="radio" />Remote</label>
                <label><input className="mr-2" name="mode" type="radio" />Hybrid</label>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Rentang Gaji</p>
              <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2">
                <input value={salaryMin} onChange={(event) => setSalaryMin(event.target.value)} className={inputClass} placeholder="Min (Rp)" type="number" />
                <input value={salaryMax} onChange={(event) => setSalaryMax(event.target.value)} className={inputClass} placeholder="Max (Rp)" type="number" />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" />Sembunyikan gaji</label>
            </div>
          </div>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <FileText className="h-5 w-5 text-emerald-600" />
            Deskripsi Pekerjaan
          </h2>
          <div className="mt-6 space-y-6">
            <Field label="Deskripsi" required>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={7} className={textareaClass} placeholder="Jelaskan tentang posisi ini, tanggung jawab utama, dan apa yang akan dikerjakan..." />
            </Field>
            <Field label="Requirements" required>
              <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} rows={6} className={textareaClass} placeholder="List persyaratan dan kualifikasi yang dibutuhkan..." />
            </Field>
            <p className="text-sm text-slate-500">Gunakan bullet points untuk kemudahan membaca. Contoh:<br />- Minimal 3 tahun pengalaman dengan React<br />- Mahir dalam TypeScript dan Next.js</p>
            <Field label="Benefits">
              <textarea value={benefits} onChange={(event) => setBenefits(event.target.value)} rows={5} className={textareaClass} placeholder="Benefit dan fasilitas yang ditawarkan..." />
            </Field>
          </div>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-black text-slate-950">Pengaturan Tambahan</h2>
          <div className="mt-6 space-y-5">
            <Field label="Tanggal Penutupan Lamaran">
              <input value={closingDate} onChange={(event) => setClosingDate(event.target.value)} className={inputClass} type="date" />
            </Field>
            <label className="flex gap-3">
              <input type="checkbox" />
              <span><span className="block font-semibold text-slate-700">Publikasikan langsung</span><span className="text-slate-500">Lowongan akan langsung tampil setelah dibuat</span></span>
            </label>
            <label className="flex gap-3">
              <input type="checkbox" />
              <span><span className="block font-semibold text-slate-700">Terima lamaran via email</span><span className="text-slate-500">Kandidat dapat melamar langsung via email</span></span>
            </label>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row">
          <button type="submit" className="h-12 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700">Publikasikan Lowongan</button>
          <button type="button" onClick={() => publish("draft").catch(() => undefined)} className="h-12 rounded-lg border border-slate-200 px-8 font-semibold text-slate-700 hover:bg-slate-50">Simpan sebagai Draft</button>
          <button type="button" onClick={() => setActiveTab("recruiter-dashboard")} className="h-12 rounded-lg border border-slate-200 px-8 font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
        </div>
      </form>
    </div>
  );
};
