import React, { useState } from "react";
import { Job } from "../../types";
import { Briefcase, Edit3, Eye, Filter, Plus, Search, Trash2, UserCheck, Users } from "lucide-react";

interface JobManagerProps {
  jobs: Job[];
  onUpdateJob: (job: Job) => void | Promise<void>;
  onUpdateJobStatus: (jobId: string, status: "aktif" | "draft" | "ditutup") => void | Promise<void>;
  onDeleteJob: (jobId: string) => void | Promise<void>;
  setActiveTab: (tab: string) => void;
}

const fallbackJobs: Job[] = [
  {
    id: "job-ui-1",
    title: "Senior Frontend Developer",
    company: "PT Tech Indonesia",
    companyLogo: "PT",
    location: "Jakarta",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    description: "Lowongan recruiter.",
    requirements: [],
    benefits: [],
    postedDate: "Diposting 2 minggu yang lalu",
    category: "Engineering",
    applicantsCount: 45,
    status: "aktif"
  }
];

const StatCard = ({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) => (
  <div className="flex min-h-[118px] items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-5">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

const MetricBox = ({ value, label, tone }: { value: number; label: string; tone: string }) => (
  <div className={`rounded-lg p-4 text-center ${tone}`}>
    <p className="text-3xl font-black">{value}</p>
    <p className="text-sm text-slate-600">{label}</p>
  </div>
);

export const JobManager: React.FC<JobManagerProps> = ({ jobs, onUpdateJob, onDeleteJob, setActiveTab }) => {
  const [activeFilter, setActiveFilter] = useState("semua");
  const [searchTerm, setSearchTerm] = useState("");
  const sourceJobs = jobs.length ? jobs : fallbackJobs;
  const visibleJobs = sourceJobs.filter((job) => {
    const matchesFilter = activeFilter === "semua" || job.status === activeFilter;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const editJob = (job: Job) => {
    const title = window.prompt("Nama posisi", job.title);
    if (!title) return;
    const location = window.prompt("Lokasi", job.location) || job.location;
    onUpdateJob({ ...job, title, location });
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Kelola Lowongan</h1>
          <p className="mt-2 text-xl text-slate-600">Pantau dan kelola semua lowongan pekerjaan</p>
        </div>
        <button onClick={() => setActiveTab("recruiter-post-job")} className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-emerald-600 px-8 text-lg font-semibold text-white transition hover:bg-emerald-700">
          <Plus className="h-5 w-5" />
          Buat Lowongan Baru
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Lowongan Aktif" value={`${sourceJobs.filter((job) => job.status === "aktif").length}`} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Users} label="Total Pelamar" value={`${sourceJobs.reduce((total, job) => total + job.applicantsCount, 0)}`} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Eye} label="Total Views" value="-" tone="bg-purple-50 text-purple-600" />
        <StatCard icon={UserCheck} label="Kandidat Diterima" value="-" tone="bg-orange-50 text-orange-600" />
      </div>

      <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {(["semua", "aktif", "draft", "ditutup"] as const).map((filter) => (
              <button key={filter} onClick={() => setActiveFilter(filter)} className={`h-10 rounded-lg px-4 font-semibold ${activeFilter === filter ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {filter} ({filter === "semua" ? sourceJobs.length : sourceJobs.filter((job) => job.status === filter).length})
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <label className="relative block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-11 w-72 rounded-lg border border-slate-200 pl-12 pr-4 outline-none focus:border-emerald-500" placeholder="Cari lowongan..." />
            </label>
            <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>
      </section>

      <div className="mt-7 space-y-5">
        {visibleJobs.map((job) => (
          <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-slate-950">{job.title}</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${job.status === "aktif" ? "bg-emerald-100 text-emerald-700" : job.status === "draft" ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-700"}`}>{job.status}</span>
            </div>
            <p className="mt-3 text-base text-slate-600">{job.category} | {job.location} | {job.type}</p>
            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
              <MetricBox value={job.applicantsCount} label="Pelamar" tone="bg-blue-50 text-blue-600" />
              <MetricBox value={0} label="Interview" tone="bg-purple-50 text-purple-600" />
              <MetricBox value={0} label="Diterima" tone="bg-emerald-50 text-emerald-600" />
            </div>
            <p className="mt-5 text-base text-slate-500">Diposting: {job.postedDate}</p>
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 lg:flex-row">
              <button onClick={() => setActiveTab("recruiter-applicants")} className="h-11 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
                Lihat Pelamar ({job.applicantsCount})
              </button>
              <button onClick={() => editJob(job)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50">
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50">
                <Eye className="h-4 w-4" />
                Statistik
              </button>
              <button onClick={() => onDeleteJob(job.id)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-6 font-semibold text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
                Tutup
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
