import React, { useMemo, useState } from "react";
import { CareerService } from "../../types";
import { AlertCircle, Archive, Box, CheckCircle2, Edit3, Eye, Plus, RefreshCw, Star, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";

type ServiceFormValues = {
  title: string;
  category: CareerService["category"];
  description: string;
  price: string;
  duration: string;
  active: boolean;
};

type ServiceFilter = "active" | "archived" | "all";

interface ServiceManagerProps {
  services: CareerService[];
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void | Promise<void>;
  onAddService: (newSrv: Partial<CareerService>) => void | Promise<void>;
  onUpdateService: (updatedSrv: Partial<CareerService> & { id: string }) => void | Promise<void>;
  onDeleteService: (id: string) => void | Promise<void>;
}

const CATEGORY_OPTIONS: Array<{ value: CareerService["category"]; label: string }> = [
  { value: "cv-review", label: "Review CV" },
  { value: "mock-interview", label: "Mock Interview" },
  { value: "consulting", label: "Konsultasi Karir" },
];

const emptyForm: ServiceFormValues = {
  title: "",
  category: "cv-review",
  description: "",
  price: "",
  duration: "",
  active: true,
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

const categoryLabel = (category: CareerService["category"]) => CATEGORY_OPTIONS.find((item) => item.value === category)?.label || category;

const formFromService = (service: CareerService): ServiceFormValues => ({
  title: service.title,
  category: service.category,
  description: service.description,
  price: String(service.price),
  duration: service.duration,
  active: service.active,
});

const payloadFromForm = (form: ServiceFormValues) => ({
  title: form.title.trim(),
  category: form.category,
  description: form.description.trim(),
  price: Number(form.price),
  duration: form.duration.trim(),
  active: form.active,
});

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
  <div className="flex min-h-[118px] items-center gap-5 rounded-lg border border-slate-200 bg-white px-6 py-5">
    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

const FieldLabel: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-sm font-bold text-slate-700">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

export const ServiceManager: React.FC<ServiceManagerProps> = ({
  services,
  isLoading,
  error,
  onRetry,
  onAddService,
  onUpdateService,
  onDeleteService,
}) => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState<"closed" | "add" | "edit">("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CareerService | null>(null);
  const [filter, setFilter] = useState<ServiceFilter>("active");

  const reviewedServices = services.filter((item) => item.reviewsCount > 0 && item.rating > 0);
  const averageRating = reviewedServices.length
    ? (reviewedServices.reduce((total, item) => total + item.rating, 0) / reviewedServices.length).toFixed(1)
    : "-";
  const activeServices = useMemo(() => services.filter((item) => item.active).length, [services]);
  const archivedServices = useMemo(() => services.filter((item) => !item.active).length, [services]);
  const visibleServices = useMemo(() => {
    if (filter === "active") return services.filter((item) => item.active);
    if (filter === "archived") return services.filter((item) => !item.active);
    return services;
  }, [filter, services]);

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormMode("add");
    setFormError(null);
    setMessage(null);
  };

  const openEditForm = (service: CareerService) => {
    setForm(formFromService(service));
    setEditingId(service.id);
    setFormMode("edit");
    setFormError(null);
    setMessage(null);
  };

  const closeForm = () => {
    if (isSubmitting) return;
    setFormMode("closed");
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const validateForm = () => {
    const payload = payloadFromForm(form);
    if (!payload.title) return "Nama layanan wajib diisi.";
    if (!payload.description) return "Deskripsi layanan wajib diisi.";
    if (!payload.duration) return "Durasi pengerjaan wajib diisi.";
    if (!Number.isFinite(payload.price) || payload.price <= 0) return "Harga wajib berupa angka lebih dari 0.";
    return null;
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setMessage(null);
    try {
      const payload = payloadFromForm(form);
      if (formMode === "edit" && editingId) {
        await onUpdateService({ ...payload, id: editingId });
        setMessage("Layanan berhasil diperbarui dari server.");
      } else {
        await onAddService(payload);
        setMessage("Layanan baru berhasil disimpan dari server.");
      }
      setFormMode("closed");
      setEditingId(null);
      setForm(emptyForm);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Permintaan layanan gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = async (service: CareerService) => {
    setPendingId(service.id);
    setMessage(null);
    setFormError(null);
    try {
      await onUpdateService({ id: service.id, active: !service.active });
      setMessage(service.active ? "Layanan berhasil dipindahkan ke arsip." : "Layanan berhasil diaktifkan kembali.");
    } catch (toggleError) {
      setFormError(toggleError instanceof Error ? toggleError.message : "Gagal mengubah status layanan.");
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setPendingId(deleteTarget.id);
    setMessage(null);
    setFormError(null);
    try {
      await onDeleteService(deleteTarget.id);
      setMessage("Layanan berhasil dipindahkan ke arsip.");
      setDeleteTarget(null);
    } catch (deleteError) {
      setFormError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus layanan.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Kelola Layanan</h1>
          <p className="mt-2 text-xl text-slate-600">Atur layanan seller yang tersimpan di database.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onRetry()}
            disabled={isLoading}
            className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-slate-200 px-6 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            Coba Lagi
          </button>
          <button
            onClick={openAddForm}
            disabled={isLoading || isSubmitting}
            className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-purple-600 px-8 text-lg font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" />
            Tambah Layanan
          </button>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Box} label="Total Layanan" value={`${services.length}`} tone="bg-purple-50 text-purple-600" />
        <StatCard icon={ToggleRight} label="Layanan Aktif" value={`${activeServices}`} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Archive} label="Arsip" value={`${archivedServices}`} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Star} label="Rating Rata-rata" value={averageRating} tone="bg-orange-50 text-orange-600" />
      </div>

      <div className="mt-8 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {[
          { id: "active", label: `Aktif (${activeServices})` },
          { id: "archived", label: `Nonaktif/Arsip (${archivedServices})` },
          { id: "all", label: `Semua (${services.length})` },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as ServiceFilter)}
            className={`h-11 rounded-lg px-5 font-semibold transition ${
              filter === item.id ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
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
              <button onClick={() => onRetry()} className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700">
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      )}

      {formMode !== "closed" && (
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-950">{formMode === "edit" ? "Edit Layanan" : "Tambah Layanan"}</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Data akan disimpan melalui endpoint seller dan dimuat ulang dari backend.</p>
            </div>
            <button onClick={closeForm} disabled={isSubmitting} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label="Tutup form">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={submitForm} className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <FieldLabel label="Nama layanan">
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="h-12 w-full rounded-lg border border-slate-200 px-4 font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                placeholder="Contoh: Review CV ATS Profesional"
              />
            </FieldLabel>

            <FieldLabel label="Kategori">
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as CareerService["category"] }))}
                className="h-12 w-full rounded-lg border border-slate-200 px-4 font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldLabel>

            <FieldLabel label="Harga">
              <input
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value.replace(/[^\d]/g, "") }))}
                inputMode="numeric"
                className="h-12 w-full rounded-lg border border-slate-200 px-4 font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                placeholder="250000"
              />
            </FieldLabel>

            <FieldLabel label="Durasi pengerjaan">
              <input
                value={form.duration}
                onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                className="h-12 w-full rounded-lg border border-slate-200 px-4 font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                placeholder="3 hari"
              />
            </FieldLabel>

            <div className="lg:col-span-2">
              <FieldLabel label="Deskripsi">
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder="Jelaskan cakupan layanan, output, dan kebutuhan dari pembeli."
                />
              </FieldLabel>
            </div>

            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-4">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="font-semibold text-slate-700">Aktifkan layanan setelah disimpan</span>
            </label>

            <div className="flex flex-wrap justify-end gap-3 lg:col-span-2">
              <button type="button" onClick={closeForm} disabled={isSubmitting} className="h-12 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                Batal
              </button>
              <button type="submit" disabled={isSubmitting} className="h-12 rounded-lg bg-purple-600 px-7 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Menyimpan..." : formMode === "edit" ? "Simpan Perubahan" : "Simpan Layanan"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-9 rounded-lg border border-slate-200 bg-white p-8">
        {isLoading && (
          <div className="grid gap-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {!isLoading && visibleServices.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-lg font-black text-slate-800">
              {filter === "archived" ? "Belum ada layanan arsip." : filter === "all" ? "Belum ada layanan." : "Belum ada layanan aktif."}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {filter === "active"
                ? "Tambahkan layanan baru atau aktifkan kembali layanan dari tab arsip."
                : "Data kosong dari backend tidak diganti dengan dummy."}
            </p>
            {filter !== "archived" && (
              <button onClick={openAddForm} className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700">
                <Plus className="h-4 w-4" />
                Tambah Layanan
              </button>
            )}
          </div>
        )}

        {!isLoading && visibleServices.length > 0 && (
          <div className="space-y-7">
            {visibleServices.map((service) => (
              <article key={service.id} className="rounded-lg border border-slate-200 bg-white p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-950">{service.title}</h2>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${service.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {service.active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mt-3 text-base font-medium text-slate-500">{categoryLabel(service.category)}</p>
                <p className="mt-2 text-lg text-slate-700">{service.description}</p>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="rounded-lg bg-purple-50 p-4">
                    <p className="text-sm text-slate-500">Harga</p>
                    <p className="mt-2 text-xl font-black text-purple-600">{formatPrice(service.price)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-slate-500">Durasi</p>
                    <p className="mt-2 text-xl font-black text-blue-600">{service.duration}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Terjual</p>
                    <p className="mt-2 text-xl font-black text-slate-400">Belum tersedia</p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-4">
                    <p className="text-sm text-slate-500">Rating</p>
                    <p className="mt-2 flex items-center gap-1 text-xl font-black text-orange-600">
                      <Star className="h-5 w-5 fill-orange-500" />
                      {service.reviewsCount > 0 ? `${service.rating} (${service.reviewsCount})` : "Belum tersedia"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 lg:flex-row">
                  <div className="flex flex-wrap gap-3">
                    <button disabled={pendingId === service.id || isSubmitting} onClick={() => openEditForm(service)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                      <Edit3 className="h-4 w-4" />
                      Edit Layanan
                    </button>
                    <button
                      disabled={pendingId === service.id || isSubmitting}
                      onClick={() => toggleService(service)}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {service.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                      {pendingId === service.id ? "Memproses..." : service.active ? "Nonaktifkan" : "Aktifkan Kembali"}
                    </button>
                    {service.active && (
                      <button
                        disabled={pendingId === service.id || isSubmitting}
                        onClick={() => setDeleteTarget(service)}
                        className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 px-6 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </button>
                    )}
                  </div>
                  <button disabled title="Statistik layanan belum tersedia" className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-400">
                    <Eye className="h-4 w-4" />
                    Statistik belum tersedia
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-slate-950">Pindahkan ke arsip?</h2>
            <p className="mt-3 text-slate-600">
              Layanan <span className="font-bold text-slate-900">{deleteTarget.title}</span> akan dinonaktifkan dan pindah ke tab Nonaktif/Arsip.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button disabled={pendingId === deleteTarget.id} onClick={() => setDeleteTarget(null)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                Batal
              </button>
              <button disabled={pendingId === deleteTarget.id} onClick={confirmDelete} className="h-11 rounded-lg bg-red-600 px-5 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {pendingId === deleteTarget.id ? "Memindahkan..." : "Pindahkan ke Arsip"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
