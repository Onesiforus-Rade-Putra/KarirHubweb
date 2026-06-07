import React from "react";
import { Applicant, Job } from "../../types";
import { Bookmark, Briefcase, Calendar, CheckCircle2, Clock, Eye, FileText, Send, TrendingUp } from "lucide-react";

interface SeekerDashboardProps {
  currentUser: any;
  jobs: Job[];
  applicants: Applicant[];
  savedJobs: string[];
  setActiveTab: (tab: string) => void;
}

const statusTone: Record<string, string> = {
  Baru: "bg-blue-100 text-blue-700",
  Shortlisted: "bg-yellow-100 text-yellow-700",
  Interview: "bg-emerald-100 text-emerald-700",
  Diterima: "bg-emerald-100 text-emerald-700",
  Ditolak: "bg-red-100 text-red-700"
};

export const SeekerDashboard: React.FC<SeekerDashboardProps> = ({
  currentUser,
  jobs,
  applicants,
  savedJobs,
  setActiveTab
}) => {
  const userApplicants = applicants.filter(
    (app) => app.candidateEmail.toLowerCase() === (currentUser?.email || "").toLowerCase()
  );
  const applicationRows =
    userApplicants.length > 0
      ? userApplicants
      : [
          {
            id: "demo-1",
            jobId: "job-1",
            jobTitle: "Software Engineer - Frontend",
            candidateName: "John Doe",
            candidateTitle: "Software Engineer",
            candidateEmail: currentUser?.email || "john.doe@email.com",
            candidateRating: 4.8,
            candidateExperience: 5,
            status: "Interview",
            appliedDate: "3 hari yang lalu",
            resumeSummary: "PT Teknologi Maju Bersama"
          },
          {
            id: "demo-2",
            jobId: "job-2",
            jobTitle: "UI/UX Designer",
            candidateName: "John Doe",
            candidateTitle: "Software Engineer",
            candidateEmail: currentUser?.email || "john.doe@email.com",
            candidateRating: 4.8,
            candidateExperience: 5,
            status: "Shortlisted",
            appliedDate: "5 hari yang lalu",
            resumeSummary: "Startup Indonesia"
          },
          {
            id: "demo-3",
            jobId: "job-5",
            jobTitle: "Product Manager",
            candidateName: "John Doe",
            candidateTitle: "Software Engineer",
            candidateEmail: currentUser?.email || "john.doe@email.com",
            candidateRating: 4.8,
            candidateExperience: 5,
            status: "Ditolak",
            appliedDate: "1 minggu yang lalu",
            resumeSummary: "Tech Company"
          }
        ];

  const saved = jobs.filter((job) => savedJobs.includes(job.id));
  const savedRows = saved.length > 0 ? saved : jobs.slice(0, 3);
  const recommendations = jobs.slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 px-8 py-16 text-slate-950">
      <div className="mx-auto max-w-[1440px]">
        <h1 className="text-4xl font-black tracking-normal">Dashboard</h1>
        <p className="mt-3 text-xl text-slate-600">Selamat datang kembali, John!</p>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          {[
            { label: "Profil Dilihat", value: "245", icon: Eye, tone: "bg-blue-100 text-blue-600" },
            { label: "Lamaran Dikirim", value: "12", icon: Send, tone: "bg-emerald-100 text-emerald-600" },
            { label: "Interview Dijadwalkan", value: "3", icon: Calendar, tone: "bg-purple-100 text-purple-600" },
            { label: "Respon Rate", value: "42%", icon: TrendingUp, tone: "bg-orange-100 text-orange-600" }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-black leading-none">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <main className="space-y-8">
            <section className="rounded-xl border border-slate-200 bg-white p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black">Lamaran Terbaru</h2>
                <button onClick={() => setActiveTab("lowongan")} className="text-sm font-semibold text-blue-600">
                  Lihat Semua
                </button>
              </div>
              <div className="space-y-4">
                {applicationRows.map((app) => (
                  <div key={app.id} className="rounded-lg border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black">{app.jobTitle}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{app.resumeSummary}</p>
                        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="h-4 w-4" />
                          {app.appliedDate}
                        </p>
                      </div>
                      <span className={`rounded-full px-4 py-1 text-sm font-semibold ${statusTone[app.status] || "bg-slate-100 text-slate-600"}`}>
                        {app.status === "Shortlisted" ? "Sedang Direview" : app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                    <Bookmark className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-black">Lamaran yang Disimpan</h2>
                </div>
                <button onClick={() => setActiveTab("lowongan")} className="text-sm font-semibold text-blue-600">
                  Lihat Semua
                </button>
              </div>
              <div className="space-y-4">
                {savedRows.slice(0, 3).map((job) => (
                  <div key={job.id} className="rounded-lg border border-slate-200 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-black">{job.title.replace("(React)", "")}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{job.company}</p>
                        <p className="mt-4 text-sm text-slate-500">
                          {job.location.split("(")[0]} · {job.type} · Rp {Math.round(job.salaryMin / 1000000)}-{Math.round(job.salaryMax / 1000000)} Juta
                        </p>
                        <p className="mt-2 text-sm text-slate-500">Disimpan 2 hari yang lalu</p>
                      </div>
                      <Bookmark className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    </div>
                    <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                      <button onClick={() => setActiveTab("lowongan")} className="rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white">
                        Lamar Sekarang
                      </button>
                      <button onClick={() => setActiveTab("lowongan")} className="rounded-lg border border-slate-300 px-5 text-sm font-semibold">
                        Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-black">Lowongan Rekomendasi</h2>
                <button onClick={() => setActiveTab("lowongan")} className="text-sm font-semibold text-blue-600">
                  Lihat Semua
                </button>
              </div>
              <div className="space-y-4">
                {recommendations.map((job) => (
                  <div key={job.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-5">
                    <div>
                      <h3 className="text-lg font-black">{job.title.replace("(React)", "")}</h3>
                      <p className="mt-1 text-sm text-slate-500">{job.company}</p>
                      <p className="mt-4 text-sm text-slate-500">{job.location.split("(")[0]} · {job.type}</p>
                    </div>
                    <button onClick={() => setActiveTab("lowongan")} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
                      Lamar
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black">Kelengkapan Profil</h2>
                <span className="font-black">75%</span>
              </div>
              <div className="mt-5 h-2 rounded-full bg-slate-200">
                <div className="h-2 w-3/4 rounded-full bg-blue-600" />
              </div>
              <div className="mt-5 space-y-3 text-sm font-semibold">
                <p className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" /> Informasi dasar lengkap
                </p>
                <p className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" /> Pengalaman kerja ditambahkan
                </p>
                <p className="text-slate-500">Upload foto profil</p>
                <p className="text-slate-500">Upload CV terbaru</p>
              </div>
              <button onClick={() => setActiveTab("profil")} className="mt-5 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white">
                Lengkapi Profil
              </button>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black">Aksi Cepat</h2>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Buat Foto CV AI", tab: "foto-cv", icon: FileText, tone: "bg-blue-100 text-blue-600" },
                  { label: "AI Resume Builder", tab: "builder", icon: FileText, tone: "bg-indigo-100 text-indigo-600" },
                  { label: "Konsultasi Karir", tab: "jasa-karir", icon: Calendar, tone: "bg-purple-100 text-purple-600" },
                  { label: "Cari Lowongan", tab: "lowongan", icon: Briefcase, tone: "bg-emerald-100 text-emerald-600" }
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => setActiveTab(action.tab)}
                      className="flex w-full items-center gap-4 rounded-lg border border-slate-200 p-4 text-left text-sm font-black hover:bg-slate-50"
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};
