import React from "react";
import { Check, Crown, X } from "lucide-react";

interface UpgradeProps {
  toast: (msg: string, status?: string) => void;
}

const plans = [
  {
    name: "Basic",
    description: "Untuk memulai rekrutmen Anda",
    price: "Rp 0",
    period: "Free Forever",
    badge: "Paket Saat Ini",
    button: "Paket Aktif",
    disabled: true,
    features: ["Post hingga 3 lowongan aktif", "Akses 50 kandidat per bulan", "Review pelamar basic", "Email support"],
    missing: ["Talent pool database", "Filter lanjutan", "Priority support", "Analytics dashboard"]
  },
  {
    name: "Professional",
    description: "Untuk kebutuhan rekrutmen reguler",
    price: "Rp 500.000",
    period: "per bulan",
    badge: "Paling Populer",
    button: "Upgrade ke Professional",
    popular: true,
    features: ["Post hingga 15 lowongan aktif", "Akses 500 kandidat per bulan", "Talent pool database", "Filter & search lanjutan", "Review pelamar detail", "Priority email support", "Basic analytics"],
    missing: ["Analytics dashboard lengkap", "Dedicated account manager"]
  },
  {
    name: "Enterprise",
    description: "Untuk perusahaan dengan kebutuhan tinggi",
    price: "Rp 1.500.000",
    period: "per bulan",
    button: "Upgrade ke Enterprise",
    features: ["Unlimited lowongan aktif", "Unlimited akses kandidat", "Full talent pool database", "Advanced filter & AI matching", "Review pelamar lengkap dengan insights", "24/7 priority support", "Analytics dashboard lengkap", "Dedicated account manager", "Custom integrations", "API access"],
    missing: []
  }
];

export const RecruiterUpgrade: React.FC<UpgradeProps> = ({ toast }) => {
  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="text-center">
        <h1 className="inline-flex items-center gap-3 text-[40px] font-black leading-tight tracking-normal text-slate-950">
          <Crown className="h-8 w-8 text-amber-500" />
          Upgrade Paket
        </h1>
        <p className="mt-3 text-xl text-slate-600">Pilih paket yang sesuai dengan kebutuhan rekrutmen Anda</p>
      </div>

      <section className="mt-10 flex items-center justify-between rounded-2xl bg-emerald-700 p-7 text-white">
        <div>
          <p className="text-lg text-emerald-100">Paket Saat Ini</p>
          <h2 className="mt-2 text-2xl font-black">Basic</h2>
          <p className="mt-2 text-lg text-emerald-100">Free Forever</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black">Rp 0</p>
          <p className="text-lg text-emerald-100">per bulan</p>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={`relative rounded-2xl border bg-white p-8 ${plan.popular ? "border-emerald-600 shadow-xl shadow-emerald-100" : "border-slate-200"}`}>
            {plan.badge && <span className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1 text-sm font-semibold text-white ${plan.popular ? "bg-emerald-600" : "bg-slate-600"}`}>{plan.badge}</span>}
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-950">{plan.name}</h2>
              <p className="mt-4 text-base text-slate-600">{plan.description}</p>
              <p className="mt-6 text-4xl font-black text-slate-950">{plan.price}</p>
              <p className="mt-2 text-base text-slate-500">{plan.period}</p>
            </div>
            <ul className="mt-8 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-base text-slate-600">
                  <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                  {feature}
                </li>
              ))}
              {plan.missing.length > 0 && <li className="border-t border-slate-200 pt-4" />}
              {plan.missing.map((feature) => (
                <li key={feature} className="flex gap-3 text-base text-slate-400">
                  <span className="h-5 w-5 shrink-0 rounded-full border border-slate-300" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => !plan.disabled && toast(`Simulasi upgrade ke paket ${plan.name} berhasil diproses.`, "success")}
              className={`mt-8 h-12 w-full rounded-lg font-semibold ${plan.disabled ? "bg-slate-200 text-slate-500" : plan.popular ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-950 text-white hover:bg-slate-800"}`}
            >
              {plan.button}
            </button>
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-2xl font-black text-slate-950">Perbandingan Fitur</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-base text-slate-700">
                <th className="py-4 font-black">Fitur</th>
                <th className="py-4 text-center font-black">Basic</th>
                <th className="py-4 text-center font-black">Professional</th>
                <th className="py-4 text-center font-black">Enterprise</th>
              </tr>
            </thead>
            <tbody className="text-base text-slate-600">
              {[
                ["Lowongan Aktif", "3", "15", "Unlimited"],
                ["Akses Kandidat/Bulan", "50", "500", "Unlimited"],
                ["Talent Pool Database", "x", "check", "check"],
                ["Advanced Filter", "x", "check", "check"],
                ["Analytics Dashboard", "x", "x", "check"],
                ["API Access", "x", "x", "check"]
              ].map((row) => (
                <tr key={row[0]} className="border-b border-slate-100">
                  <td className="py-4">{row[0]}</td>
                  {row.slice(1).map((cell, index) => (
                    <td key={`${row[0]}-${index}`} className="py-4 text-center">
                      {cell === "check" ? <Check className="mx-auto h-5 w-5 text-emerald-600" /> : cell === "x" ? <X className="mx-auto h-5 w-5 text-slate-300" /> : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-2xl font-black text-slate-950">Riwayat Pembayaran</h2>
        <div className="mt-6 space-y-4">
          {["1/5/2026", "1/4/2026"].map((date) => (
            <article key={date} className="flex items-center justify-between rounded-xl border border-slate-200 p-5">
              <div>
                <h3 className="text-lg font-black text-slate-950">Paket Professional</h3>
                <p className="mt-1 text-slate-500">{date}</p>
                <p className="mt-1 text-slate-500">Berlaku hingga 1/6/2026</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-950">Rp 500.000</p>
                <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">Berhasil</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
