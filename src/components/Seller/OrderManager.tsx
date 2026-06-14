import React, { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Mail, PackageCheck, RefreshCw, Search, X, XCircle } from "lucide-react";

import { ServiceOrder } from "../../types";

type SellerOrderStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
type StatusFilter = "all" | "pending" | "processing" | "completed" | "cancelled";

interface OrderManagerProps {
  orders?: ServiceOrder[];
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void | Promise<void>;
  onUpdateOrderStatus?: (payload: {
    orderId: string;
    orderStatus: SellerOrderStatus;
    sellerNotes?: string;
    resultUrl?: string;
  }) => void | Promise<void>;
}

type ActionDraft = {
  order: ServiceOrder;
  orderStatus: SellerOrderStatus;
  title: string;
  description: string;
  requireNotes?: boolean;
  requireResultUrl?: boolean;
  notesLabel: string;
  notesPlaceholder: string;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const normalizedStatus = (order: ServiceOrder): SellerOrderStatus => {
  if (order.orderStatus) return order.orderStatus;
  if (order.status === "Selesai") return "completed";
  if (order.status === "Dibatalkan") return "cancelled";
  if (order.status === "Sedang Diproses") return "in_progress";
  return "pending";
};

const statusLabel = (status: SellerOrderStatus) => {
  if (status === "pending") return "Baru/Pending";
  if (status === "accepted") return "Diterima";
  if (status === "in_progress") return "Diproses";
  if (status === "completed") return "Selesai";
  return "Dibatalkan";
};

const statusTone = (status: SellerOrderStatus) => {
  if (status === "pending") return "bg-blue-100 text-blue-700";
  if (status === "accepted") return "bg-indigo-100 text-indigo-700";
  if (status === "in_progress") return "bg-amber-100 text-amber-700";
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
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
  <div className="flex min-h-[126px] items-center gap-7 rounded-lg border border-slate-200 bg-white px-7">
    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-base font-medium text-slate-500">{label}</p>
      <p className="mt-5 text-3xl font-black leading-none text-slate-950">{value}</p>
    </div>
  </div>
);

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-lg bg-slate-50 p-4">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <div className="mt-2 text-base font-bold text-slate-900">{value || "-"}</div>
  </div>
);

export const OrderManager: React.FC<OrderManagerProps> = ({
  orders: incomingOrders = [],
  isLoading,
  error,
  onRetry,
  onUpdateOrderStatus,
}) => {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [actionDraft, setActionDraft] = useState<ActionDraft | null>(null);
  const [sellerNotes, setSellerNotes] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const counts = useMemo(() => {
    const normalized = incomingOrders.map(normalizedStatus);
    return {
      all: incomingOrders.length,
      pending: normalized.filter((status) => status === "pending").length,
      processing: normalized.filter((status) => status === "accepted" || status === "in_progress").length,
      completed: normalized.filter((status) => status === "completed").length,
      cancelled: normalized.filter((status) => status === "cancelled").length,
    };
  }, [incomingOrders]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return incomingOrders.filter((order) => {
      const status = normalizedStatus(order);
      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "pending" && status === "pending") ||
        (activeFilter === "processing" && (status === "accepted" || status === "in_progress")) ||
        (activeFilter === "completed" && status === "completed") ||
        (activeFilter === "cancelled" && status === "cancelled");
      const matchSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.serviceTitle.toLowerCase().includes(term) ||
        order.buyerName.toLowerCase().includes(term) ||
        order.buyerEmail.toLowerCase().includes(term);
      return matchFilter && matchSearch;
    });
  }, [activeFilter, incomingOrders, searchTerm]);

  const openAction = (order: ServiceOrder, orderStatus: SellerOrderStatus) => {
    const currentNotes = order.sellerNotes || "";
    const draftMap: Record<SellerOrderStatus, Omit<ActionDraft, "order" | "orderStatus">> = {
      pending: {
        title: "Kembalikan ke Pending",
        description: "Status akan dikembalikan ke pending.",
        notesLabel: "Seller notes",
        notesPlaceholder: "Tambahkan catatan internal untuk pesanan ini.",
      },
      accepted: {
        title: "Terima Pesanan",
        description: "Pesanan akan ditandai diterima. Anda bisa mulai memprosesnya setelah ini.",
        notesLabel: "Seller notes",
        notesPlaceholder: "Contoh: Terima kasih, saya akan meninjau kebutuhan Anda hari ini.",
      },
      in_progress: {
        title: "Ubah Status Menjadi Diproses",
        description: "Pesanan akan masuk tahap pengerjaan.",
        notesLabel: "Seller notes",
        notesPlaceholder: "Contoh: Pesanan sedang diproses dan estimasi selesai besok.",
      },
      completed: {
        title: "Selesaikan Pesanan",
        description: "Pesanan akan ditandai selesai. Tambahkan hasil atau link file layanan jika ada.",
        requireResultUrl: true,
        notesLabel: "Seller notes",
        notesPlaceholder: "Contoh: Hasil review sudah selesai, silakan cek link berikut.",
      },
      cancelled: {
        title: "Tolak Pesanan",
        description: "Pesanan akan dibatalkan. Alasan penolakan wajib diisi.",
        requireNotes: true,
        notesLabel: "Alasan penolakan",
        notesPlaceholder: "Jelaskan alasan penolakan kepada pelanggan.",
      },
    };

    setActionDraft({ order, orderStatus, ...draftMap[orderStatus] });
    setSellerNotes(currentNotes);
    setResultUrl(order.resultUrl || "");
    setFormError(null);
    setMessage(null);
  };

  const submitAction = async () => {
    if (!actionDraft) return;
    const notes = sellerNotes.trim();
    const result = resultUrl.trim();
    if (actionDraft.requireNotes && !notes) {
      setFormError("Alasan penolakan wajib diisi.");
      return;
    }
    if (actionDraft.requireResultUrl && !result) {
      setFormError("Result URL wajib diisi saat menyelesaikan pesanan.");
      return;
    }

    setPendingId(actionDraft.order.id);
    setFormError(null);
    setMessage(null);
    try {
      await onUpdateOrderStatus?.({
        orderId: actionDraft.order.id,
        orderStatus: actionDraft.orderStatus,
        sellerNotes: notes || undefined,
        resultUrl: result || undefined,
      });
      setMessage(`Pesanan ${actionDraft.order.id} berhasil diperbarui.`);
      setActionDraft(null);
      setSelectedOrder(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Gagal memperbarui pesanan.");
    } finally {
      setPendingId(null);
    }
  };

  const contactButton = (order: ServiceOrder) => {
    if (order.buyerEmail) {
      return (
        <a href={`mailto:${order.buyerEmail}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
          <Mail className="h-4 w-4" />
          Hubungi Pelanggan
        </a>
      );
    }
    return (
      <button disabled title="Email pelanggan belum tersedia" className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 font-semibold text-slate-400">
        <Mail className="h-4 w-4" />
        Hubungi belum tersedia
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Pesanan Masuk</h1>
          <p className="mt-2 text-xl text-slate-600">Kelola pesanan dari layanan seller yang tersimpan di database.</p>
        </div>
        <button
          onClick={() => onRetry()}
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Coba Lagi
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Baru/Pending" value={`${counts.pending}`} tone="bg-blue-100 text-blue-600" />
        <StatCard icon={PackageCheck} label="Diproses" value={`${counts.processing}`} tone="bg-amber-100 text-amber-600" />
        <StatCard icon={CheckCircle2} label="Selesai" value={`${counts.completed}`} tone="bg-emerald-100 text-emerald-600" />
        <StatCard icon={XCircle} label="Dibatalkan" value={`${counts.cancelled}`} tone="bg-red-100 text-red-600" />
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
              <button onClick={() => onRetry()} className="h-10 rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700">
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      )}

      <section className="mt-9 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Semua", count: counts.all },
              { id: "pending", label: "Baru/Pending", count: counts.pending },
              { id: "processing", label: "Diproses", count: counts.processing },
              { id: "completed", label: "Selesai", count: counts.completed },
              { id: "cancelled", label: "Dibatalkan", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as StatusFilter)}
                className={`h-10 rounded-lg px-4 font-semibold ${
                  activeFilter === tab.id ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 pl-12 pr-4 outline-none focus:border-purple-500 lg:w-80"
              placeholder="Cari pesanan..."
            />
          </label>
        </div>
      </section>

      <div className="mt-7 space-y-5">
        {isLoading && (
          <div className="grid gap-5">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {!isLoading && filteredOrders.length === 0 && !error && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-base font-black text-slate-800">{incomingOrders.length ? "Pesanan tidak ditemukan." : "Belum ada pesanan."}</p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {incomingOrders.length ? "Coba ubah kata kunci atau filter status." : "Pesanan dari layanan seller Anda akan muncul di halaman ini."}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredOrders.map((order) => {
            const status = normalizedStatus(order);
            return (
              <article key={order.id} className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div className="flex min-w-0 gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-base font-black text-purple-700">
                      {initials(order.buyerName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-950">{order.serviceTitle}</h2>
                        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusTone(status)}`}>{statusLabel(status)}</span>
                      </div>
                      <p className="mt-2 text-base text-slate-600">Pelanggan: {order.buyerName}</p>
                      <p className="mt-1 text-base text-slate-500">Order ID: {order.id}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-2xl font-black text-purple-600">{formatPrice(order.servicePrice)}</p>
                    <p className="mt-2 text-sm text-slate-500">{formatDate(order.date)}</p>
                  </div>
                </div>

                {(order.requirements || order.sellerNotes || order.resultUrl) && (
                  <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-base text-slate-700">
                    {order.requirements && <p><span className="font-bold">Catatan pelanggan:</span> {order.requirements}</p>}
                    {order.sellerNotes && <p className="mt-2"><span className="font-bold">Seller notes:</span> {order.sellerNotes}</p>}
                    {order.resultUrl && <p className="mt-2"><span className="font-bold">Hasil:</span> {order.resultUrl}</p>}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                  <button onClick={() => setSelectedOrder(order)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">
                    Detail Pesanan
                  </button>
                  {status === "pending" && (
                    <>
                      <button disabled={pendingId === order.id} onClick={() => openAction(order, "accepted")} className="h-11 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                        Terima Pesanan
                      </button>
                      <button disabled={pendingId === order.id} onClick={() => openAction(order, "cancelled")} className="h-11 rounded-lg border border-red-200 px-5 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
                        Tolak Pesanan
                      </button>
                    </>
                  )}
                  {status === "accepted" && (
                    <button disabled={pendingId === order.id} onClick={() => openAction(order, "in_progress")} className="h-11 rounded-lg bg-amber-600 px-5 font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
                      Mulai Diproses
                    </button>
                  )}
                  {status === "in_progress" && (
                    <button disabled={pendingId === order.id} onClick={() => openAction(order, "completed")} className="h-11 rounded-lg bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                      Selesaikan Pesanan
                    </button>
                  )}
                  {contactButton(order)}
                </div>
              </article>
            );
          })}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Detail Pesanan</h2>
                <p className="mt-1 text-slate-500">Nomor pesanan {selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Tutup detail pesanan">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailRow label="Nomor pesanan" value={selectedOrder.id} />
              <DetailRow label="Nama layanan" value={selectedOrder.serviceTitle} />
              <DetailRow label="Nama pembeli" value={selectedOrder.buyerName} />
              <DetailRow label="Tanggal pesanan" value={formatDate(selectedOrder.date)} />
              <DetailRow label="Total pembayaran" value={formatPrice(selectedOrder.servicePrice)} />
              <DetailRow label="Status" value={<span className={`rounded-full px-3 py-1 text-sm ${statusTone(normalizedStatus(selectedOrder))}`}>{statusLabel(normalizedStatus(selectedOrder))}</span>} />
              <div className="md:col-span-2">
                <DetailRow label="Catatan pelanggan" value={selectedOrder.requirements || "-"} />
              </div>
              <div className="md:col-span-2">
                <DetailRow label="Seller notes" value={selectedOrder.sellerNotes || "-"} />
              </div>
              <div className="md:col-span-2">
                <DetailRow
                  label="Hasil atau file layanan"
                  value={
                    selectedOrder.resultUrl ? (
                      <a href={selectedOrder.resultUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-800">
                        {selectedOrder.resultUrl}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {contactButton(selectedOrder)}
              <button onClick={() => setSelectedOrder(null)} className="h-11 rounded-lg bg-slate-900 px-5 font-semibold text-white hover:bg-slate-800">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {actionDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{actionDraft.title}</h2>
                <p className="mt-2 text-slate-600">{actionDraft.description}</p>
              </div>
              <button onClick={() => setActionDraft(null)} disabled={pendingId === actionDraft.order.id} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50" aria-label="Tutup konfirmasi">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">{actionDraft.notesLabel}</span>
                <textarea
                  value={sellerNotes}
                  onChange={(event) => setSellerNotes(event.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  placeholder={actionDraft.notesPlaceholder}
                />
              </label>

              {(actionDraft.orderStatus === "completed" || actionDraft.order.resultUrl) && (
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Result URL</span>
                  <input
                    value={resultUrl}
                    onChange={(event) => setResultUrl(event.target.value)}
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    placeholder="https://..."
                  />
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button disabled={pendingId === actionDraft.order.id} onClick={() => setActionDraft(null)} className="h-11 rounded-lg border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                Batal
              </button>
              <button disabled={pendingId === actionDraft.order.id} onClick={submitAction} className="h-11 rounded-lg bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                {pendingId === actionDraft.order.id ? "Menyimpan..." : "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
