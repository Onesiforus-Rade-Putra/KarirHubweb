import React from "react";
import { Briefcase, Camera, Sparkles, Target } from "lucide-react";

interface LandingProps {
  onExplore: (tab: string) => void;
  onSelectRole: (role: "seeker" | "seller" | "recruiter") => void;
  toast: (msg: string) => void;
}

const features = [
  {
    title: "AI Foto CV Instan",
    description:
      "Ubah foto selfie biasa menjadi pas foto profesional dengan kemeja jas atau blazer hanya dalam hitungan detik. Cepat, mudah, dan hasilnya memukau.",
    icon: Camera,
    tab: "foto-cv",
    tone: "bg-blue-100 text-blue-600"
  },
  {
    title: "Marketplace Jasa Karir",
    description:
      "Temukan dan pekerjakan mentor profesional untuk Review CV, Mock Interview, atau konsultasi karir 1-on-1 dengan sistem pembayaran Escrow yang aman.",
    icon: Target,
    tab: "jasa-karir",
    tone: "bg-purple-100 text-purple-600"
  },
  {
    title: "Portal Lowongan Kerja",
    description:
      "Akses ribuan lowongan pekerjaan dari perusahaan ternama. Lamar langsung dengan profil dan CV yang sudah dipoles sempurna.",
    icon: Briefcase,
    tab: "lowongan",
    tone: "bg-emerald-100 text-emerald-600"
  }
];

export const LandingPage: React.FC<LandingProps> = ({ onExplore, onSelectRole }) => {
  return (
    <div className="bg-white text-slate-900">
      <section className="mx-auto max-w-7xl px-8 pb-20 pt-20 text-center">
        <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-600">
          <Sparkles className="h-4 w-4" />
          Revolusi Karir Dimulai Dari Sini
        </div>

        <h1 className="mx-auto max-w-5xl text-6xl font-black leading-[1.04] tracking-normal text-slate-950">
          Wujudkan <span className="text-blue-600">Karir Impianmu</span>
          <br />
          dengan KarirHub
        </h1>
        <p className="mx-auto mt-8 max-w-3xl text-xl leading-8 text-slate-600">
          Platform lengkap untuk mengubah selfie menjadi Foto CV profesional dengan AI, temukan jasa konsultasi karir, dan lamar pekerjaan impianmu.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => onExplore("foto-cv")}
            className="rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Coba AI Foto CV Gratis
          </button>
          <button
            onClick={() => onExplore("jasa-karir")}
            className="rounded-lg border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-slate-50"
          >
            Eksplor Jasa Karir
          </button>
        </div>

        <div className="mt-20">
          <h2 className="text-4xl font-black tracking-normal text-slate-950">Solusi Lengkap Karirmu</h2>
          <p className="mx-auto mt-4 max-w-4xl text-xl leading-8 text-slate-600">
            KarirHub hadir dengan fitur-fitur inovatif untuk mempercepat langkahmu menuju pekerjaan impian.
          </p>

          <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-20 text-left md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.title}
                  onClick={() => onExplore(feature.tab)}
                  className="rounded-xl border border-slate-200 bg-white p-8 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-xl ${feature.tone}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-black tracking-normal text-slate-950">{feature.title}</h3>
                  <p className="mt-5 text-base leading-7 text-slate-600">{feature.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-8 py-28 text-center">
        <h2 className="text-4xl font-black tracking-normal text-slate-950">Siap Memulai Perjalanan Karirmu?</h2>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-slate-600">
          Bergabunglah dengan ribuan pencari kerja yang telah menemukan pekerjaan impian mereka melalui KarirHub.
        </p>
        <button
          onClick={() => onSelectRole("seeker")}
          className="mt-10 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          Mulai Sekarang - Gratis
        </button>
      </section>
    </div>
  );
};
