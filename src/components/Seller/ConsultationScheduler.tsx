import React from "react";
import { ConsultationSession } from "../../types";
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Video, XCircle } from "lucide-react";

interface ScheduleProps {
  sessions: ConsultationSession[];
  onUpdateSessionStatus: (id: string, status: "Mendatang" | "Selesai" | "Dibatalkan" | "Rescheduled") => void;
}

const scheduleItems = [
  {
    id: "SES-301",
    initials: "BS",
    clientName: "Budi Santoso",
    serviceTitle: "Career Coaching Premium",
    status: "Terkonfirmasi",
    statusTone: "bg-emerald-100 text-emerald-700",
    dateLine: "Rabu, 10 Juni 2026",
    timeLine: "10:00 - 11:30 (90 menit)",
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    needsConfirm: false
  },
  {
    id: "SES-302",
    initials: "SA",
    clientName: "Siti Aminah",
    serviceTitle: "Mock Interview",
    status: "Menunggu Konfirmasi",
    statusTone: "bg-amber-100 text-amber-700",
    dateLine: "Rabu, 10 Juni 2026",
    timeLine: "14:00 - 15:00 (60 menit)",
    meetingUrl: "",
    needsConfirm: true
  },
  {
    id: "SES-303",
    initials: "AR",
    clientName: "Ahmad Rizki",
    serviceTitle: "Career Coaching Premium",
    status: "Terkonfirmasi",
    statusTone: "bg-emerald-100 text-emerald-700",
    dateLine: "Jumat, 12 Juni 2026",
    timeLine: "09:00 - 10:30 (90 menit)",
    meetingUrl: "https://meet.google.com/xyz-uvwx-rst",
    needsConfirm: false
  },
  {
    id: "SES-304",
    initials: "DL",
    clientName: "Dewi Lestari",
    serviceTitle: "Mock Interview",
    status: "Menunggu Konfirmasi",
    statusTone: "bg-amber-100 text-amber-700",
    dateLine: "Sabtu, 13 Juni 2026",
    timeLine: "15:00 - 16:00 (60 menit)",
    meetingUrl: "",
    needsConfirm: true
  }
];

const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
const highlightedDays = [6, 10, 12, 13];

const StatCard = ({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) => (
  <div className="flex min-h-[142px] items-center gap-7 rounded-2xl border border-slate-200 bg-white px-7">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-6 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

export const ConsultationScheduler: React.FC<ScheduleProps> = ({ onUpdateSessionStatus }) => {
  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div>
        <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Jadwal Konsultasi</h1>
        <p className="mt-2 text-xl text-slate-600">Kelola jadwal sesi mentoring dan coaching Anda</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} label="Total Sesi" value="4" tone="bg-purple-50 text-purple-600" />
        <StatCard icon={CheckCircle2} label="Terkonfirmasi" value="2" tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Menunggu" value="2" tone="bg-amber-50 text-amber-600" />
        <StatCard icon={Clock} label="Hari Ini" value="2" tone="bg-blue-50 text-blue-600" />
      </div>

      <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-xl font-black text-slate-950">Kalender</h2>
          <div className="mt-7 flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">Juni 2026</p>
            <div className="flex gap-3">
              <button className="rounded-lg p-2 text-slate-900 hover:bg-slate-50" aria-label="Bulan sebelumnya">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-2 text-slate-900 hover:bg-slate-50" aria-label="Bulan berikutnya">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-7 gap-3 text-center text-sm font-medium text-slate-500">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-7 gap-3 text-center">
            {calendarDays.map((day) => {
              const selected = day === 6;
              const highlighted = highlightedDays.includes(day);
              return (
                <button
                  key={day}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-medium ${
                    selected
                      ? "bg-purple-600 text-white"
                      : highlighted
                        ? "bg-purple-100 text-purple-700"
                        : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <button className="h-11 w-full rounded-lg bg-purple-600 font-semibold text-white transition hover:bg-purple-700">
              Atur Ketersediaan
            </button>
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-xl font-black text-slate-950">Jadwal Mendatang</h2>
          <div className="mt-6 space-y-5">
            {scheduleItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-base font-black text-purple-700">
                    {item.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-950">{item.clientName}</h3>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${item.statusTone}`}>{item.status}</span>
                    </div>
                    <p className="mt-2 text-base text-slate-600">{item.serviceTitle}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-1 text-base text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {item.dateLine}
                      <Clock className="ml-1 h-4 w-4" />
                      {item.timeLine}
                      <Video className="ml-1 h-4 w-4" />
                      Online
                    </p>
                    {item.meetingUrl && (
                      <div className="mt-5 rounded-lg bg-blue-50 p-4 text-base">
                        <p className="text-sm text-slate-500">Link Meeting:</p>
                        <a className="font-semibold text-blue-600" href={item.meetingUrl} target="_blank" rel="noreferrer">
                          {item.meetingUrl}
                        </a>
                      </div>
                    )}
                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row">
                      {item.needsConfirm ? (
                        <>
                          <button
                            onClick={() => onUpdateSessionStatus(item.id, "Mendatang")}
                            className="h-11 flex-1 rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                          >
                            Konfirmasi
                          </button>
                          <button className="h-11 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50">
                            Reschedule
                          </button>
                          <button
                            onClick={() => onUpdateSessionStatus(item.id, "Dibatalkan")}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-6 font-semibold text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Tolak
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 font-semibold text-white hover:bg-purple-700">
                            <Video className="h-4 w-4" />
                            Mulai Meeting
                          </button>
                          <button className="h-11 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50">
                            Reschedule
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
