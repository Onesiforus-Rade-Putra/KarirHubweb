import React, { useState } from "react";
import { Job } from "../../types";
import { ArrowLeft, Bookmark, Briefcase, Building2, Calendar, Clock, DollarSign, Mail, MapPin, Phone, Search, Share2, User } from "lucide-react";

interface JobBoardProps {
  jobs: Job[];
  onApplyJob: (jobId: string, pitch: string) => void;
  savedJobs: string[];
  onToggleSaveJob: (jobId: string) => void;
  onNotify?: (msg: string, status?: "success" | "info" | "error") => void;
}

const formatSalary = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export const JobBoard: React.FC<JobBoardProps> = ({ jobs, onApplyJob, savedJobs, onToggleSaveJob, onNotify }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [selectedType, setSelectedType] = useState<"Semua" | Job["type"]>("Semua");
  const [selectedExperience, setSelectedExperience] = useState("Semua");
  const [sortBy, setSortBy] = useState("newest");

  const applySearch = () => {
    setAppliedSearchTerm(searchTerm.trim());
    setAppliedLocation(searchLocation.trim());
  };

  const shareJob = async (job: Job) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#job-${job.id}`;
    const shareText = `${job.title} di ${job.company} - ${shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: job.title, text: `${job.title} di ${job.company}`, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareText);
      }
      onNotify?.("Link lowongan berhasil disalin/dibagikan.", "success");
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        onNotify?.("Link lowongan disalin ke clipboard.", "success");
      } catch {
        onNotify?.("Browser tidak mengizinkan share otomatis.", "info");
      }
    }
  };

  const activeJobs = jobs
    .filter((job) => {
      const query = appliedSearchTerm.toLowerCase();
      const location = appliedLocation.toLowerCase();
      const matchesExperience =
        selectedExperience === "Semua" ||
        (selectedExperience === "Fresh Graduate" && /intern|junior|fresh/i.test(job.title + job.description)) ||
        (selectedExperience === "1-3 Tahun" && /1|2|3|junior/i.test(job.description)) ||
        (selectedExperience === "3-5 Tahun" && /3|4|5|senior/i.test(job.description)) ||
        (selectedExperience === "5+ Tahun" && /5|6|7|lead|senior/i.test(job.description));

      return (
        job.status === "aktif" &&
        (selectedType === "Semua" || job.type === selectedType) &&
        matchesExperience &&
        (job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query) || job.category.toLowerCase().includes(query)) &&
        job.location.toLowerCase().includes(location)
      );
    })
    .sort((a, b) => {
      if (sortBy === "salary-high") return b.salaryMax - a.salaryMax;
      if (sortBy === "salary-low") return a.salaryMin - b.salaryMin;
      if (sortBy === "company") return a.company.localeCompare(b.company);
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });

  if (selectedJob) {
    const similarJobs = jobs.filter((job) => job.id !== selectedJob.id).slice(0, 3);
    const isSaved = savedJobs.includes(selectedJob.id);

    return (
      <div className="min-h-screen bg-slate-50 px-8 py-14 text-slate-950">
        <div className="mx-auto max-w-[1420px]">
          <button onClick={() => setSelectedJob(null)} className="mb-10 flex items-center gap-2 text-base font-semibold text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Pencarian
          </button>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <main className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-8">
                <div className="flex gap-6">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Building2 className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-black tracking-normal">{selectedJob.title.replace("(React)", "")}</h1>
                    <p className="mt-2 text-xl text-slate-700">{selectedJob.company}</p>
                    <div className="mt-5 flex flex-wrap gap-4 text-base text-slate-600">
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{selectedJob.location.split("(")[0]}</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{selectedJob.type}</span>
                      <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{formatSalary(selectedJob.salaryMin)} - {formatSalary(selectedJob.salaryMax)}</span>
                    </div>
                    <p className="mt-6 flex items-center gap-2 text-base text-slate-600"><Clock className="h-4 w-4" />3 hari yang lalu</p>
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => onApplyJob(selectedJob.id, "Saya tertarik dengan posisi ini dan siap mengikuti proses seleksi.")}
                        className="rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white hover:bg-blue-700"
                      >
                        Apply Now
                      </button>
                      <button
                        onClick={() => onToggleSaveJob(selectedJob.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-7 py-3 text-base font-semibold"
                      >
                        <Bookmark className={`h-5 w-5 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                        Save Job
                      </button>
                      <button onClick={() => shareJob(selectedJob)} className="rounded-lg border border-slate-300 p-3" aria-label="Bagikan lowongan"><Share2 className="h-5 w-5" /></button>
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-lg border border-yellow-300 bg-yellow-50 p-5 text-yellow-800">
                  <p className="flex items-center gap-3 font-semibold"><Calendar className="h-5 w-5" />Application Deadline</p>
                  <p className="ml-8 text-sm">30 Juni 2026</p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-8">
                <h2 className="text-2xl font-black">Job Description</h2>
                <p className="mt-5 text-base leading-8 text-slate-600">{selectedJob.description}</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-8">
                <h2 className="text-2xl font-black">Requirements</h2>
                <ul className="mt-5 space-y-3 text-base leading-7 text-slate-600">
                  {selectedJob.requirements.map((item) => (
                    <li key={item} className="before:mr-3 before:text-blue-600 before:content-['•']">{item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-8">
                <h2 className="text-2xl font-black">What We Offer</h2>
                <div className="mt-5 grid gap-3 text-base leading-7 text-slate-600 md:grid-cols-2">
                  {selectedJob.benefits.map((item) => (
                    <p key={item} className="before:mr-3 before:text-emerald-600 before:content-['•']">{item}</p>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-blue-200 bg-blue-50 p-8">
                <h2 className="text-xl font-black">Interested in this position?</h2>
                <p className="mt-3 text-base text-slate-600">Submit your application now and join our team of talented professionals.</p>
                <button
                  onClick={() => onApplyJob(selectedJob.id, "Saya tertarik dengan posisi ini.")}
                  className="mt-5 rounded-lg bg-blue-600 px-8 py-3 text-base font-semibold text-white"
                >
                  Apply Now
                </button>
              </section>
            </main>

            <aside className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Company Information</h2>
                <dl className="mt-6 space-y-5 text-base">
                  <div><dt className="text-sm text-slate-500">Company Name</dt><dd className="mt-1 font-semibold">{selectedJob.company}</dd></div>
                  <div><dt className="text-sm text-slate-500">Industry</dt><dd className="mt-1 font-semibold">Technology / IT</dd></div>
                  <div><dt className="text-sm text-slate-500">Company Size</dt><dd className="mt-1 font-semibold">50-200 karyawan</dd></div>
                  <div><dt className="text-sm text-slate-500">Website</dt><dd className="mt-1 font-semibold text-blue-600">www.teknologimaju.com</dd></div>
                  <div><dt className="text-sm text-slate-500">About</dt><dd className="mt-1 text-slate-600">Perusahaan teknologi yang fokus pada pengembangan solusi digital untuk berbagai industri.</dd></div>
                </dl>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Recruiter Contact</h2>
                <div className="mt-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"><User className="h-6 w-6" /></div>
                  <div><p className="font-semibold">Sarah Johnson</p><p className="text-sm text-slate-500">HR Manager</p></div>
                </div>
                <p className="mt-5 flex items-center gap-3 text-sm text-slate-600"><Mail className="h-4 w-4" />sarah.johnson@teknologimaju.com</p>
                <p className="mt-4 flex items-center gap-3 text-sm text-slate-600"><Phone className="h-4 w-4" />+62 812 3456 7890</p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-black">Similar Jobs</h2>
                <div className="mt-5 space-y-4">
                  {similarJobs.map((job) => (
                    <button key={job.id} onClick={() => setSelectedJob(job)} className="w-full rounded-lg border border-slate-200 p-4 text-left">
                      <p className="font-black">{job.title.replace("(React)", "")}</p>
                      <p className="mt-1 text-sm text-slate-500">{job.company}</p>
                      <p className="mt-2 text-sm text-blue-600">{formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setSelectedJob(null)} className="mt-5 w-full text-sm font-semibold text-blue-600">View More Jobs</button>
              </section>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-blue-600 px-10 py-16 text-white">
        <h1 className="text-4xl font-black tracking-normal">Temukan Pekerjaan Impianmu</h1>
        <p className="mt-4 text-xl text-blue-100">Ribuan lowongan dari perusahaan ternama menantimu.</p>
        <div className="mt-10 flex flex-col gap-2 rounded-xl bg-white p-2 text-slate-950 shadow-lg lg:flex-row">
          <div className="flex flex-1 items-center gap-3 border-r border-slate-200 px-5">
            <Search className="h-5 w-5 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applySearch()} placeholder="Posisi atau kata kunci" className="h-12 w-full outline-none" />
          </div>
          <div className="flex flex-1 items-center gap-3 px-5">
            <MapPin className="h-5 w-5 text-slate-400" />
            <input value={searchLocation} onChange={(event) => setSearchLocation(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applySearch()} placeholder="Lokasi (Kota atau Provinsi)" className="h-12 w-full outline-none" />
          </div>
          <button onClick={applySearch} className="rounded-lg bg-blue-600 px-9 py-3 text-base font-semibold text-white">Cari Lowongan</button>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1536px] grid-cols-1 gap-9 px-8 py-14 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-200 bg-white p-7">
          <h2 className="text-xl font-black">Tipe Pekerjaan</h2>
          <div className="mt-5 space-y-3">
            {(["Semua", "Full-time", "Part-time", "Internship", "Remote", "Contract"] as const).map((item) => (
              <button key={item} onClick={() => setSelectedType(item)} className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold ${selectedType === item ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
                {item}
              </button>
            ))}
          </div>
          <h2 className="mt-8 text-xl font-black">Pengalaman</h2>
          <div className="mt-5 space-y-3">
            {["Semua", "Fresh Graduate", "1-3 Tahun", "3-5 Tahun", "5+ Tahun"].map((item) => (
              <button key={item} onClick={() => setSelectedExperience(item)} className={`w-full rounded-lg px-4 py-2 text-left text-sm font-semibold ${selectedExperience === item ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
                {item}
              </button>
            ))}
          </div>
        </aside>

        <main>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black">Menampilkan {activeJobs.length} Lowongan</h2>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">
              <option value="newest">Terbaru</option>
              <option value="salary-high">Gaji tertinggi</option>
              <option value="salary-low">Gaji terendah</option>
              <option value="company">Nama perusahaan</option>
            </select>
          </div>
          <div className="space-y-4">
            {activeJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-lg font-black text-slate-800">Lowongan tidak ditemukan.</p>
                <p className="mt-2 text-sm text-slate-500">Coba ubah kata kunci, lokasi, atau filter tipe pekerjaan.</p>
                <button onClick={() => { setSearchTerm(""); setSearchLocation(""); setAppliedSearchTerm(""); setAppliedLocation(""); setSelectedType("Semua"); setSelectedExperience("Semua"); }} className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
                  Reset Filter
                </button>
              </div>
            ) : activeJobs.map((job) => (
              <article key={job.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-7">
                <button onClick={() => setSelectedJob(job)} className="flex gap-5 text-left">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Briefcase className="h-8 w-8" /></div>
                  <div>
                    <h3 className="text-xl font-black">{job.title.replace("(React)", "")}</h3>
                    <p className="mt-2 text-base text-slate-600">{job.company}</p>
                    <p className="mt-3 text-sm text-slate-600">{job.location.split("(")[0]} <Briefcase className="inline h-4 w-4" /> {job.type}</p>
                    <p className="mt-5 text-sm text-slate-500">Diunggah 2 hari lalu</p>
                  </div>
                </button>
                <button onClick={() => onToggleSaveJob(job.id)} className="rounded-lg bg-slate-950 px-7 py-3 font-semibold text-white">
                  {savedJobs.includes(job.id) ? "Tersimpan" : "Simpan"}
                </button>
              </article>
            ))}
          </div>
          <p className="mt-8 text-center text-sm font-semibold text-slate-400">Pagination backend belum tersedia, semua hasil ditampilkan dalam satu halaman.</p>
        </main>
      </div>
    </div>
  );
};
