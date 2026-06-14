import React, { useMemo, useState } from "react";
import { ConsultationSession, SellerAvailability } from "../../types";
import { AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, ExternalLink, Plus, RefreshCw, Video, X, XCircle } from "lucide-react";

type SessionStatus = "pending" | "confirmed" | "rejected" | "rescheduled" | "completed" | "cancelled";
type SessionAction = "confirm" | "reject" | "complete" | "reschedule" | "meeting";

interface ScheduleProps {
  sessions: ConsultationSession[];
  availability: SellerAvailability[];
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void | Promise<void>;
  onUpdateSessionStatus: (payload: {
    id: string;
    status?: SessionStatus;
    sellerNotes?: string;
    rejectionReason?: string;
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    meetingUrl?: string;
  }) => void | Promise<void>;
  onRescheduleSession: (id: string, payload: { scheduledDate: string; startTime: string; endTime: string; sellerNotes?: string }) => void | Promise<void>;
  onSaveMeetingLink: (id: string, meetingUrl: string) => void | Promise<void>;
  onSaveAvailability: (payload: Omit<SellerAvailability, "id"> | SellerAvailability) => void | Promise<void>;
}

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const fullDayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const isoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonth = (date: Date) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
const formatDate = (value?: string) => {
  if (!value) return "Belum dijadwalkan";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(date);
};

const normalizeStatus = (status: ConsultationSession["status"]): SessionStatus => {
  if (status === "Mendatang") return "confirmed";
  if (status === "Selesai") return "completed";
  if (status === "Dibatalkan") return "cancelled";
  if (status === "Rescheduled") return "rescheduled";
  return status as SessionStatus;
};

const statusLabel = (status: SessionStatus) => {
  if (status === "pending") return "Menunggu Konfirmasi";
  if (status === "confirmed") return "Terkonfirmasi";
  if (status === "rescheduled") return "Rescheduled";
  if (status === "completed") return "Selesai";
  if (status === "rejected") return "Ditolak";
  return "Dibatalkan";
};

const statusTone = (status: SessionStatus) => {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "confirmed") return "bg-emerald-100 text-emerald-700";
  if (status === "rescheduled") return "bg-blue-100 text-blue-700";
  if (status === "completed") return "bg-slate-100 text-slate-700";
  return "bg-red-100 text-red-700";
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "KH";

const StatCard = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) => (
  <div className="flex min-h-[142px] items-center gap-7 rounded-lg border border-slate-200 bg-white px-7">
    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-6 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

export const ConsultationScheduler: React.FC<ScheduleProps> = ({
  sessions,
  availability,
  isLoading,
  error,
  onRetry,
  onUpdateSessionStatus,
  onRescheduleSession,
  onSaveMeetingLink,
  onSaveAvailability,
}) => {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [action, setAction] = useState<{ type: SessionAction; session: ConsultationSession } | null>(null);
  const [sellerNotes, setSellerNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [scheduledDate, setScheduledDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [availabilityFormOpen, setAvailabilityFormOpen] = useState(false);
  const [availabilityDraft, setAvailabilityDraft] = useState<Omit<SellerAvailability, "id"> | SellerAvailability>({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    active: true,
  });

  const counts = useMemo(() => {
    const statuses = sessions.map((session) => normalizeStatus(session.status));
    return {
      total: sessions.length,
      confirmed: statuses.filter((status) => status === "confirmed" || status === "rescheduled").length,
      pending: statuses.filter((status) => status === "pending").length,
      today: sessions.filter((session) => (session.scheduledDate || session.date) === isoDate(new Date())).length,
    };
  }, [sessions]);

  const calendarCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, (_, index) => ({ key: `empty-${index}`, day: 0, date: "" })),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);
        return { key: isoDate(date), day: index + 1, date: isoDate(date) };
      }),
    ];
  }, [visibleMonth]);

  const sessionDates = useMemo(() => new Set(sessions.map((session) => session.scheduledDate || session.date).filter(Boolean)), [sessions]);
  const filteredSessions = useMemo(() => {
    const dated = sessions.filter((session) => (session.scheduledDate || session.date) === selectedDate);
    return dated.length ? dated : sessions;
  }, [selectedDate, sessions]);

  const openAction = (type: SessionAction, session: ConsultationSession) => {
    setAction({ type, session });
    setSellerNotes(session.sellerNotes || "");
    setRejectionReason(session.rejectionReason || "");
    setScheduledDate(session.scheduledDate || session.date || selectedDate);
    setStartTime(session.startTime || "09:00");
    setEndTime(session.endTime || "10:00");
    setMeetingUrl(session.meetingUrl || "");
    setFormError(null);
    setMessage(null);
  };

  const submitAction = async () => {
    if (!action) return;
    setPendingId(action.session.id);
    setFormError(null);
    setMessage(null);

    try {
      if (action.type === "confirm") {
        await onUpdateSessionStatus({ id: action.session.id, status: "confirmed", sellerNotes });
        setMessage("Sesi konsultasi berhasil dikonfirmasi.");
      }
      if (action.type === "reject") {
        if (!rejectionReason.trim()) throw new Error("Alasan penolakan wajib diisi.");
        await onUpdateSessionStatus({ id: action.session.id, status: "rejected", rejectionReason, sellerNotes });
        setMessage("Sesi konsultasi berhasil ditolak.");
      }
      if (action.type === "complete") {
        await onUpdateSessionStatus({ id: action.session.id, status: "completed", sellerNotes });
        setMessage("Sesi konsultasi ditandai selesai.");
      }
      if (action.type === "reschedule") {
        if (!scheduledDate || !startTime || !endTime) throw new Error("Tanggal dan jam reschedule wajib diisi.");
        await onRescheduleSession(action.session.id, { scheduledDate, startTime, endTime, sellerNotes });
        setMessage("Sesi konsultasi berhasil di-reschedule.");
      }
      if (action.type === "meeting") {
        if (!meetingUrl.trim()) throw new Error("Link meeting wajib diisi.");
        await onSaveMeetingLink(action.session.id, meetingUrl.trim());
        setMessage("Link meeting berhasil disimpan.");
      }
      setAction(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Gagal memperbarui jadwal.");
    } finally {
      setPendingId(null);
    }
  };

  const submitAvailability = async () => {
    setFormError(null);
    setMessage(null);
    try {
      if (!availabilityDraft.startTime || !availabilityDraft.endTime) throw new Error("Jam mulai dan selesai wajib diisi.");
      await onSaveAvailability(availabilityDraft);
      setAvailabilityFormOpen(false);
      setAvailabilityDraft({ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", active: true });
      setMessage("Ketersediaan berhasil disimpan.");
    } catch (availabilityError) {
      setFormError(availabilityError instanceof Error ? availabilityError.message : "Gagal menyimpan ketersediaan.");
    }
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Jadwal Konsultasi</h1>
          <p className="mt-2 text-xl text-slate-600">Kelola sesi konsultasi dari order layanan seller.</p>
        </div>
        <button onClick={() => onRetry()} disabled={isLoading} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Coba Lagi
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Calendar} label="Total Sesi" value={`${counts.total}`} tone="bg-purple-50 text-purple-600" />
        <StatCard icon={CheckCircle2} label="Terkonfirmasi" value={`${counts.confirmed}`} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Menunggu" value={`${counts.pending}`} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={Clock} label="Hari Ini" value={`${counts.today}`} tone="bg-blue-50 text-blue-600" />
      </div>

      {(message || formError || error) && (
        <div className="mt-8 space-y-3">
          {message && (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
              <p className="font-semibold">{message}</p>
            </div>
          )}
          {formError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <p className="font-semibold">{formError}</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                <p className="font-semibold">{error}</p>
              </div>
              <button onClick={() => onRetry()} className="h-10 rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700">Coba Lagi</button>
            </div>
          )}
        </div>
      )}

      <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-7">
          <h2 className="text-xl font-black text-slate-950">Kalender</h2>
          <div className="mt-7 flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">{formatMonth(visibleMonth)}</p>
            <div className="flex gap-3">
              <button onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} className="rounded-lg p-2 text-slate-900 hover:bg-slate-50" aria-label="Bulan sebelumnya">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} className="rounded-lg p-2 text-slate-900 hover:bg-slate-50" aria-label="Bulan berikutnya">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-7 gap-3 text-center text-sm font-medium text-slate-500">
            {dayNames.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="mt-5 grid grid-cols-7 gap-3 text-center">
            {calendarCells.map((cell) => {
              if (!cell.day) return <span key={cell.key} />;
              const selected = cell.date === selectedDate;
              const highlighted = sessionDates.has(cell.date);
              return (
                <button
                  key={cell.key}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-base font-medium ${
                    selected ? "bg-purple-600 text-white" : highlighted ? "bg-purple-100 text-purple-700" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <button onClick={() => setAvailabilityFormOpen(true)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 font-semibold text-white transition hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              Atur Ketersediaan
            </button>
          </div>

          <div className="mt-6">
            <h3 className="font-black text-slate-900">Ketersediaan</h3>
            <div className="mt-3 space-y-3">
              {availability.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm font-medium text-slate-500">Belum ada ketersediaan.</p>}
              {availability.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => {
                    setAvailabilityDraft(slot);
                    setAvailabilityFormOpen(true);
                  }}
                  className="w-full rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50"
                >
                  <p className="font-bold text-slate-900">{fullDayNames[slot.dayOfWeek]}</p>
                  <p className="mt-1 text-sm text-slate-500">{slot.startTime} - {slot.endTime} - {slot.active ? "Aktif" : "Nonaktif"}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-7">
          <h2 className="text-xl font-black text-slate-950">Daftar Sesi Konsultasi</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Menampilkan sesi pada tanggal terpilih. Jika kosong, semua sesi ditampilkan.</p>

          <div className="mt-6 space-y-5">
            {isLoading && [0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-lg bg-slate-100" />)}
            {!isLoading && sessions.length === 0 && !error && (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-base font-black text-slate-800">Belum ada sesi konsultasi.</p>
                <p className="mt-2 text-sm font-medium text-slate-500">Sesi akan dibuat otomatis dari order layanan konsultasi milik Anda.</p>
              </div>
            )}
            {!isLoading && sessions.length > 0 && filteredSessions.map((item) => {
              const status = normalizeStatus(item.status);
              const dateValue = item.scheduledDate || item.date;
              const start = item.startTime || "";
              const end = item.endTime || "";
              return (
                <article key={item.id} className="rounded-lg border border-slate-200 p-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-base font-black text-purple-700">
                      {initials(item.clientName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-slate-950">{item.clientName}</h3>
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusTone(status)}`}>{statusLabel(status)}</span>
                      </div>
                      <p className="mt-2 text-base text-slate-600">{item.serviceTitle}</p>
                      <p className="mt-3 flex flex-wrap items-center gap-1 text-base text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(dateValue)}
                        <Clock className="ml-1 h-4 w-4" />
                        {start && end ? `${start} - ${end}` : "Jam belum diatur"}
                        <Video className="ml-1 h-4 w-4" />
                        Online
                      </p>
                      {item.meetingUrl && (
                        <div className="mt-5 rounded-lg bg-blue-50 p-4 text-base">
                          <p className="text-sm text-slate-500">Link Meeting:</p>
                          <a className="inline-flex items-center gap-2 font-semibold text-blue-600" href={item.meetingUrl} target="_blank" rel="noreferrer">
                            {item.meetingUrl}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      )}
                      {(item.sellerNotes || item.rejectionReason) && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                          {item.sellerNotes && <p><span className="font-bold">Catatan:</span> {item.sellerNotes}</p>}
                          {item.rejectionReason && <p className="mt-1"><span className="font-bold">Alasan:</span> {item.rejectionReason}</p>}
                        </div>
                      )}
                      <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap">
                        {status === "pending" && (
                          <>
                            <button disabled={pendingId === item.id} onClick={() => openAction("confirm", item)} className="h-11 rounded-lg bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">Konfirmasi</button>
                            <button disabled={pendingId === item.id} onClick={() => openAction("reject", item)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-5 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                              <XCircle className="h-4 w-4" />
                              Tolak
                            </button>
                          </>
                        )}
                        {(status === "confirmed" || status === "rescheduled") && (
                          <>
                            {item.meetingUrl ? (
                              <a href={item.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700">
                                <Video className="h-4 w-4" />
                                Mulai Meeting
                              </a>
                            ) : (
                              <button onClick={() => openAction("meeting", item)} className="h-11 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700">Simpan Link Meeting</button>
                            )}
                            <button onClick={() => openAction("complete", item)} className="h-11 rounded-lg border border-emerald-200 px-5 font-semibold text-emerald-700 hover:bg-emerald-50">Tandai Selesai</button>
                          </>
                        )}
                        <button disabled={pendingId === item.id} onClick={() => openAction("reschedule", item)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Reschedule</button>
                        {item.meetingUrl && <button onClick={() => openAction("meeting", item)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">Ubah Link</button>}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {availabilityFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">Atur Ketersediaan</h2>
              <button onClick={() => setAvailabilityFormOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Tutup form ketersediaan">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">Hari</span>
                <select value={availabilityDraft.dayOfWeek} onChange={(event) => setAvailabilityDraft((prev) => ({ ...prev, dayOfWeek: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4">
                  {fullDayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Mulai</span>
                <input type="time" value={availabilityDraft.startTime} onChange={(event) => setAvailabilityDraft((prev) => ({ ...prev, startTime: event.target.value }))} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Selesai</span>
                <input type="time" value={availabilityDraft.endTime} onChange={(event) => setAvailabilityDraft((prev) => ({ ...prev, endTime: event.target.value }))} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" />
              </label>
              <label className="flex items-center gap-3 sm:col-span-2">
                <input type="checkbox" checked={availabilityDraft.active} onChange={(event) => setAvailabilityDraft((prev) => ({ ...prev, active: event.target.checked }))} className="h-5 w-5" />
                <span className="font-semibold text-slate-700">Aktif</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setAvailabilityFormOpen(false)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">Batal</button>
              <button onClick={submitAvailability} className="h-11 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {action.type === "confirm" && "Konfirmasi Sesi"}
                  {action.type === "reject" && "Tolak Sesi"}
                  {action.type === "complete" && "Tandai Selesai"}
                  {action.type === "reschedule" && "Reschedule Sesi"}
                  {action.type === "meeting" && "Simpan Link Meeting"}
                </h2>
                <p className="mt-2 text-slate-600">{action.session.clientName} - {action.session.serviceTitle}</p>
              </div>
              <button onClick={() => setAction(null)} disabled={pendingId === action.session.id} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label="Tutup modal">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {action.type === "reject" && (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Alasan penolakan</span>
                  <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3" placeholder="Jelaskan alasan penolakan." />
                </label>
              )}
              {action.type === "reschedule" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="block sm:col-span-3">
                    <span className="text-sm font-bold text-slate-700">Tanggal</span>
                    <input type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Mulai</span>
                    <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">Selesai</span>
                    <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" />
                  </label>
                </div>
              )}
              {action.type === "meeting" && (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Link meeting</span>
                  <input value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" placeholder="https://meet.google.com/..." />
                </label>
              )}
              {action.type !== "meeting" && (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Catatan seller</span>
                  <textarea value={sellerNotes} onChange={(event) => setSellerNotes(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3" placeholder="Tambahkan catatan untuk sesi ini." />
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button disabled={pendingId === action.session.id} onClick={() => setAction(null)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Batal</button>
              <button disabled={pendingId === action.session.id} onClick={submitAction} className="h-11 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700 disabled:opacity-60">
                {pendingId === action.session.id ? "Menyimpan..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
