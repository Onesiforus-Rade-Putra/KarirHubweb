import React, { useState } from "react";
import { Applicant } from "../../types";
import { Calendar, CheckCircle2, Clock, Download, Mail, Search, Star, XCircle } from "lucide-react";

interface TrackerProps {
  applicants: Applicant[];
  onUpdateApplicantStatus: (appId: string, status: Applicant["status"]) => void | Promise<void>;
}

const fallbackApplicants: Applicant[] = [
  {
    id: "app-ui-1",
    jobId: "job-ui-1",
    jobTitle: "Senior Frontend Developer",
    candidateName: "Budi Santoso",
    candidateTitle: "Frontend Developer",
    candidateEmail: "budi.santoso@email.com",
    candidateRating: 4.5,
    candidateExperience: 5,
    status: "Baru",
    appliedDate: "Baru saja",
    resumeSummary: "React, TypeScript, Next.js"
  }
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KH";

const statusTone = (status: string) => {
  if (status === "Baru") return "bg-blue-100 text-blue-700";
  if (status === "Shortlisted") return "bg-purple-100 text-purple-700";
  if (status === "Interview") return "bg-amber-100 text-amber-700";
  if (status === "Diterima") return "bg-emerald-100 text-emerald-700";
  return "bg-red-100 text-red-700";
};

const StatCard = ({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) => (
  <div className="flex min-h-[122px] items-center gap-6 rounded-2xl border border-slate-200 bg-white px-6">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-5 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

export const ApplicantTracker: React.FC<TrackerProps> = ({ applicants, onUpdateApplicantStatus }) => {
  const [activeTab, setActiveTab] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const sourceApplicants = applicants.length ? applicants : fallbackApplicants;

  const visible = sourceApplicants.filter((app) => {
    const matchTab = activeTab === "Semua" || app.status === activeTab;
    const term = searchTerm.toLowerCase();
    return matchTab && (app.candidateName.toLowerCase().includes(term) || app.jobTitle.toLowerCase().includes(term) || app.candidateTitle.toLowerCase().includes(term));
  });

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div>
        <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Daftar Pelamar</h1>
        <p className="mt-2 text-xl text-slate-600">Review dan kelola kandidat yang melamar</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Clock} label="Baru" value={`${sourceApplicants.filter((app) => app.status === "Baru").length}`} tone="bg-blue-100 text-blue-600" />
        <StatCard icon={Star} label="Shortlisted" value={`${sourceApplicants.filter((app) => app.status === "Shortlisted").length}`} tone="bg-purple-100 text-purple-600" />
        <StatCard icon={Calendar} label="Interview" value={`${sourceApplicants.filter((app) => app.status === "Interview").length}`} tone="bg-amber-100 text-amber-600" />
        <StatCard icon={CheckCircle2} label="Diterima" value={`${sourceApplicants.filter((app) => app.status === "Diterima").length}`} tone="bg-emerald-100 text-emerald-600" />
        <StatCard icon={XCircle} label="Ditolak" value={`${sourceApplicants.filter((app) => app.status === "Ditolak").length}`} tone="bg-red-100 text-red-600" />
      </div>

      <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {["Semua", "Baru", "Shortlisted", "Interview", "Diterima", "Ditolak"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`h-10 rounded-lg px-4 font-semibold ${activeTab === tab ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {tab} ({tab === "Semua" ? sourceApplicants.length : sourceApplicants.filter((app) => app.status === tab).length})
              </button>
            ))}
          </div>
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-11 w-72 rounded-lg border border-slate-200 pl-12 pr-4 outline-none focus:border-emerald-500" placeholder="Cari pelamar..." />
          </label>
        </div>
      </section>

      <div className="mt-7 space-y-5">
        {visible.map((app) => (
          <article key={app.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-5">
              <div className="flex gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xl font-black text-emerald-700">{initials(app.candidateName)}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-950">{app.candidateName}</h2>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusTone(app.status)}`}>{app.status}</span>
                    <span className="inline-flex items-center gap-1 text-base font-semibold text-slate-700"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{app.candidateRating}</span>
                  </div>
                  <p className="mt-2 text-lg text-slate-600">{app.jobTitle || app.candidateTitle}</p>
                  <p className="mt-1 text-base text-slate-500">{app.candidateEmail}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">{app.appliedDate}</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Pengalaman</p>
                <p className="mt-1 font-black text-slate-800">{app.candidateExperience} tahun</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Ringkasan</p>
                <p className="mt-1 font-black text-slate-800">{app.resumeSummary || "-"}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 lg:flex-row">
              <button className="h-11 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700">Lihat Profil Lengkap</button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" />Download CV</button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50"><Mail className="h-4 w-4" />Email</button>
              {app.status === "Baru" && <button onClick={() => onUpdateApplicantStatus(app.id, "Shortlisted")} className="h-11 rounded-lg bg-purple-600 px-6 font-semibold text-white">Shortlist</button>}
              {app.status === "Shortlisted" && <button onClick={() => onUpdateApplicantStatus(app.id, "Interview")} className="h-11 rounded-lg bg-amber-600 px-6 font-semibold text-white">Jadwalkan Interview</button>}
              {app.status === "Interview" && <button onClick={() => onUpdateApplicantStatus(app.id, "Diterima")} className="h-11 rounded-lg bg-emerald-600 px-6 font-semibold text-white">Terima</button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
