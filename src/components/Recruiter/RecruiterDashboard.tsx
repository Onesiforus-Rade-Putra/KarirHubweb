import React from "react";
import { Applicant, Job } from "../../types";
import { RecruiterStatsSummary } from "../../lib/karirHubApi";
import { Briefcase, CheckCircle2, FileText, Plus, TrendingUp, UserPlus, Users } from "lucide-react";

interface RecruiterDashboardProps {
  currentUser: any;
  jobs: Job[];
  applicants: Applicant[];
  stats: RecruiterStatsSummary | null;
  setActiveTab: (tab: string) => void;
}

const activeJobs = [
  { title: "Senior Frontend Developer", category: "Engineering", applicants: 45, interviews: 12, accepted: 2, posted: "Diposting 2 minggu yang lalu" },
  { title: "Product Manager", category: "Product", applicants: 78, interviews: 8, accepted: 0, posted: "Diposting 1 minggu yang lalu" },
  { title: "UI/UX Designer", category: "Design", applicants: 92, interviews: 15, accepted: 1, posted: "Diposting 3 minggu yang lalu" }
];

const recentApplicants = [
  { initials: "BS", name: "Budi Santoso", role: "Senior Frontend Developer", exp: "5 tahun", time: "2 jam yang lalu", status: "Menunggu Review", tone: "bg-amber-100 text-amber-700" },
  { initials: "SA", name: "Siti Aminah", role: "Product Manager", exp: "7 tahun", time: "5 jam yang lalu", status: "Interview Dijadwalkan", tone: "bg-emerald-100 text-emerald-700" },
  { initials: "AR", name: "Ahmad Rizki", role: "UI/UX Designer", exp: "3 tahun", time: "1 hari yang lalu", status: "Shortlisted", tone: "bg-purple-100 text-purple-700" }
];

const StatCard = ({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) => (
  <div className="flex min-h-[108px] items-center gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-5">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

const MetricBox = ({ value, label, tone }: { value: number; label: string; tone: string }) => (
  <div className={`rounded-lg p-4 text-center ${tone}`}>
    <p className="text-2xl font-black">{value}</p>
    <p className="text-sm text-slate-600">{label}</p>
  </div>
);

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KH";

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ jobs, applicants, stats, setActiveTab }) => {
  const visibleJobs = jobs.length
    ? jobs.filter((job) => job.status === "aktif").slice(0, 3).map((job) => ({
        title: job.title,
        category: job.category,
        applicants: job.applicantsCount,
        interviews: applicants.filter((app) => app.jobId === job.id && app.status === "Interview").length,
        accepted: applicants.filter((app) => app.jobId === job.id && app.status === "Diterima").length,
        posted: `Diposting ${job.postedDate}`
      }))
    : activeJobs;

  const visibleApplicants = applicants.length
    ? applicants.slice(0, 3).map((app) => ({
        initials: initials(app.candidateName),
        name: app.candidateName,
        role: app.jobTitle || app.candidateTitle,
        exp: `${app.candidateExperience} tahun`,
        time: app.appliedDate,
        status: app.status,
        tone: app.status === "Interview" ? "bg-emerald-100 text-emerald-700" : app.status === "Shortlisted" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
      }))
    : recentApplicants;

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div>
        <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Dashboard Recruiter</h1>
        <p className="mt-2 text-xl text-slate-600">Kelola lowongan dan kandidat Anda</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Lowongan Aktif" value={`${stats?.active_jobs ?? jobs.filter((job) => job.status === "aktif").length}`} tone="bg-blue-100 text-blue-600" />
        <StatCard icon={Users} label="Total Pelamar" value={`${stats?.total_applicants ?? applicants.length}`} tone="bg-emerald-100 text-emerald-600" />
        <StatCard icon={UserPlus} label="Pelamar Baru" value={`${applicants.filter((app) => app.status === "Baru").length}`} tone="bg-purple-100 text-purple-600" />
        <StatCard icon={CheckCircle2} label="Kandidat Diterima" value={`${applicants.filter((app) => app.status === "Diterima").length}`} tone="bg-orange-100 text-orange-600" />
      </div>

      <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="space-y-9">
          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">Lowongan Aktif</h2>
              <button onClick={() => setActiveTab("recruiter-post-job")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700">
                <Plus className="h-4 w-4" />
                Buat Lowongan Baru
              </button>
            </div>

            <div className="mt-7 space-y-4">
              {visibleJobs.map((job) => (
                <article key={job.title} className="rounded-xl border border-slate-200 p-5">
                  <h3 className="text-xl font-black text-slate-950">{job.title}</h3>
                  <p className="mt-2 text-base text-slate-600">{job.category}</p>
                  <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <MetricBox value={job.applicants} label="Pelamar" tone="bg-blue-50 text-blue-600" />
                    <MetricBox value={job.interviews} label="Interview" tone="bg-purple-50 text-purple-600" />
                    <MetricBox value={job.accepted} label="Diterima" tone="bg-emerald-50 text-emerald-600" />
                  </div>
                  <div className="mt-5 flex items-center gap-3 text-base text-slate-500">
                    <span>{job.posted}</span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">Aktif</span>
                  </div>
                  <div className="mt-4 flex gap-3 border-t border-slate-200 pt-4">
                    <button onClick={() => setActiveTab("recruiter-applicants")} className="h-10 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700">
                      Lihat Pelamar
                    </button>
                    <button onClick={() => setActiveTab("recruiter-jobs")} className="h-10 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                      Edit
                    </button>
                    <button onClick={() => setActiveTab("recruiter-jobs")} className="h-10 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                      Statistik
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">Pelamar Terbaru</h2>
              <button onClick={() => setActiveTab("recruiter-applicants")} className="font-semibold text-emerald-600 hover:text-emerald-700">
                Lihat Semua
              </button>
            </div>
            <div className="mt-7 space-y-4">
              {visibleApplicants.map((app) => (
                <article key={app.name} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">{app.initials}</div>
                      <div>
                        <h3 className="text-lg font-black text-slate-950">{app.name}</h3>
                        <p className="text-base text-slate-600">{app.role}</p>
                        <p className="text-sm text-slate-500">Pengalaman: {app.exp}</p>
                        <p className="mt-2 text-sm text-slate-500">{app.time}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${app.tone}`}>{app.status}</span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="h-10 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700">Lihat Profil</button>
                    <button className="h-10 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">Jadwalkan Interview</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Pipeline Rekrutmen</h2>
            {[
              ["Aplikasi Baru", "28", "82%", "bg-blue-600"],
              ["Dalam Review", "45", "65%", "bg-amber-600"],
              ["Interview", "12", "35%", "bg-purple-600"],
              ["Offer Stage", "5", "15%", "bg-emerald-600"]
            ].map(([label, value, width, color]) => (
              <div key={label} className="mt-6">
                <div className="flex justify-between text-base">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-black text-slate-950">{value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${color}`} style={{ width }} />
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">Aksi Cepat</h2>
            {[
              [Briefcase, "Buat Lowongan Baru", "recruiter-post-job", "bg-emerald-100 text-emerald-600"],
              [FileText, "Template Job Desc", "recruiter-post-job", "bg-blue-100 text-blue-600"],
              [Users, "Database Kandidat", "recruiter-talent", "bg-purple-100 text-purple-600"],
              [TrendingUp, "Laporan Rekrutmen", "recruiter-upgrade", "bg-orange-100 text-orange-600"]
            ].map(([Icon, label, tab, tone]) => (
              <button key={label as string} onClick={() => setActiveTab(tab as string)} className="mt-4 flex h-16 w-full items-center gap-4 rounded-lg border border-slate-200 px-4 text-left font-semibold text-slate-800 hover:bg-slate-50">
                {React.createElement(Icon as React.ElementType, { className: `h-10 w-10 rounded-lg p-2.5 ${tone}` })}
                {label as string}
              </button>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
};
