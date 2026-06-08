import React, { useState } from "react";
import { Candidate } from "../../types";
import { Bookmark, Briefcase, Download, Filter, Mail, MapPin, Search, Star, Users } from "lucide-react";

interface TalentPoolProps {
  candidates: Candidate[];
  onToggleBookmarkCandidate: (id: string) => void;
  savedCandidatesOnly: boolean;
  setSavedCandidatesOnly: (val: boolean) => void;
}

const talentCards = [
  { id: "cand-1", initials: "BS", name: "Budi Santoso", title: "Senior Frontend Developer", rating: 4.8, status: "Tersedia", location: "Jakarta", exp: "5 tahun pengalaman", education: "S1 Teknik Informatika", salary: "Rp 15-20 Juta", skills: ["React", "TypeScript", "Next.js", "+1"], saved: true },
  { id: "cand-2", initials: "SA", name: "Siti Aminah", title: "Product Manager", rating: 4.9, status: "Tersedia", location: "Remote", exp: "7 tahun pengalaman", education: "S1 Manajemen", salary: "Rp 18-25 Juta", skills: ["Product Strategy", "Agile", "Jira", "+1"], saved: true },
  { id: "cand-3", initials: "AR", name: "Ahmad Rizki", title: "UI/UX Designer", rating: 4.7, status: "Tersedia", location: "Bandung", exp: "3 tahun pengalaman", education: "S1 Desain Komunikasi Visual", salary: "Rp 10-15 Juta", skills: ["Figma", "Adobe XD", "UI Design", "+1"], saved: false },
  { id: "cand-4", initials: "DL", name: "Dewi Lestari", title: "Backend Engineer", rating: 4.8, status: "Tidak Tersedia", location: "Surabaya", exp: "6 tahun pengalaman", education: "S1 Sistem Informasi", salary: "Rp 16-22 Juta", skills: ["Node.js", "PostgreSQL", "Docker", "+1"], saved: true },
  { id: "cand-5", initials: "RH", name: "Rudi Hartono", title: "Full Stack Developer", rating: 5, status: "Tersedia", location: "Jakarta", exp: "8 tahun pengalaman", education: "S2 Ilmu Komputer", salary: "Rp 20-28 Juta", skills: ["React", "Node.js", "MongoDB", "+1"], saved: false },
  { id: "cand-6", initials: "MS", name: "Maya Sari", title: "Data Scientist", rating: 4.6, status: "Tersedia", location: "Remote", exp: "4 tahun pengalaman", education: "S2 Statistika", salary: "Rp 14-20 Juta", skills: ["Python", "Machine Learning", "TensorFlow", "+1"], saved: false }
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

const candidateInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KH";

export const TalentPool: React.FC<TalentPoolProps> = ({ candidates, onToggleBookmarkCandidate, savedCandidatesOnly, setSavedCandidatesOnly }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState<"Semua" | "Tersedia" | "Tidak Tersedia">("Semua");
  const sourceCandidates = candidates.length
    ? candidates.map((candidate) => ({
        id: candidate.id,
        initials: candidateInitials(candidate.name),
        name: candidate.name,
        title: candidate.title,
        rating: candidate.rating,
        status: candidate.status,
        location: "-",
        exp: `${candidate.experienceYears} tahun pengalaman`,
        education: candidate.education,
        salary: candidate.expectedSalary ? `Rp ${candidate.expectedSalary.toLocaleString("id-ID")}` : "-",
        skills: candidate.skills.length ? candidate.skills.slice(0, 4) : ["KarirHub"],
        saved: candidate.savedByRecruiter
      }))
    : talentCards;

  const visible = sourceCandidates.filter((candidate) => {
    const matchSaved = savedCandidatesOnly ? candidate.saved : true;
    const matchAvailability = availabilityFilter === "Semua" || candidate.status === availabilityFilter;
    const term = searchTerm.toLowerCase();
    return matchSaved && matchAvailability && (candidate.name.toLowerCase().includes(term) || candidate.title.toLowerCase().includes(term) || candidate.skills.join(" ").toLowerCase().includes(term));
  });

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div>
        <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Talent Pool</h1>
        <p className="mt-2 text-xl text-slate-600">Cari dan simpan kandidat potensial untuk kebutuhan rekrutmen Anda</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Kandidat" value={`${sourceCandidates.length}`} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Bookmark} label="Kandidat Tersimpan" value={`${sourceCandidates.filter((candidate) => candidate.saved).length}`} tone="bg-purple-50 text-purple-600" />
        <StatCard icon={Star} label="Rating Rata-rata" value="4.8" tone="bg-orange-50 text-orange-600" />
        <StatCard icon={Briefcase} label="Tersedia" value="5" tone="bg-blue-50 text-blue-600" />
      </div>

      <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative block flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="h-12 w-full rounded-lg border border-slate-200 pl-12 pr-4 outline-none focus:border-emerald-500" placeholder="Cari berdasarkan nama, posisi, atau skill..." />
          </label>
          <button onClick={() => setAdvancedOpen((open) => !open)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 px-8 font-semibold text-slate-800 hover:bg-slate-50">
            <Filter className="h-5 w-5" />
            Filter Lanjutan
          </button>
        </div>
        {advancedOpen && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-700">Status kandidat</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["Semua", "Tersedia", "Tidak Tersedia"] as const).map((status) => (
                <button key={status} onClick={() => setAvailabilityFilter(status)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${availabilityFilter === status ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setSavedCandidatesOnly(false)} className={`h-10 rounded-lg px-4 font-semibold ${!savedCandidatesOnly ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>Semua Kandidat ({sourceCandidates.length})</button>
          <button onClick={() => setSavedCandidatesOnly(true)} className={`h-10 rounded-lg px-4 font-semibold ${savedCandidatesOnly ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>Tersimpan ({sourceCandidates.filter((candidate) => candidate.saved).length})</button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-slate-600">Filter cepat:</span>
          {["Frontend Developer", "Backend Developer", "Full Stack", "Designer", "Product Manager"].map((tag) => (
            <button key={tag} onClick={() => setSearchTerm(tag)} className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600 hover:bg-slate-200">
              {tag}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {visible.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-black text-slate-800">Kandidat tidak ditemukan.</p>
            <p className="mt-2 text-sm text-slate-500">Coba ubah kata kunci, status, atau filter tersimpan.</p>
          </div>
        ) : visible.map((candidate) => (
          <article key={candidate.id} className="relative rounded-2xl border border-slate-200 bg-white p-7">
            <button onClick={() => onToggleBookmarkCandidate(candidate.id)} className={`absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-lg ${candidate.saved ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>
              <Bookmark className={`h-5 w-5 ${candidate.saved ? "fill-amber-500" : ""}`} />
            </button>
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700">{candidate.initials}</div>
              <h2 className="mt-5 text-xl font-black text-slate-950">{candidate.name}</h2>
              <p className="mt-2 text-base text-slate-600">{candidate.title}</p>
              <p className="mt-3 inline-flex items-center gap-1 font-semibold text-slate-800"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{candidate.rating}</p>
              <div><span className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium ${candidate.status === "Tersedia" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{candidate.status}</span></div>
            </div>
            <div className="mt-7 space-y-3 text-base text-slate-600">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{candidate.location}</p>
              <p className="flex items-center gap-2"><Briefcase className="h-4 w-4" />{candidate.exp}</p>
              <p>{candidate.education}</p>
              <div>
                <p className="text-sm text-slate-500">Ekspektasi Gaji</p>
                <p className="font-black text-emerald-600">{candidate.salary}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-500">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {candidate.skills.map((skill) => <span key={skill} className="rounded bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-700">{skill}</span>)}
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="h-11 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700">Lihat Profil</button>
              <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><Mail className="h-4 w-4" /></button>
              <button className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" /></button>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-2xl bg-emerald-700 p-8 text-white">
        <h2 className="text-3xl font-black">Akses Lebih Banyak Kandidat dengan Premium</h2>
        <p className="mt-3 max-w-4xl text-lg text-emerald-50">Upgrade ke paket Premium untuk mendapatkan akses unlimited ke database talent pool dan fitur filtering lanjutan.</p>
        <button className="mt-7 h-12 rounded-lg bg-white px-8 font-semibold text-emerald-700">Upgrade Sekarang</button>
      </section>
    </div>
  );
};
