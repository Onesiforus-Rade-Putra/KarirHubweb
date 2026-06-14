import React, { useState } from "react";
import { CareerService } from "../../types";
import { Box, DollarSign, Edit3, Eye, Plus, Star, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

interface ServiceManagerProps {
  services: CareerService[];
  onAddService: (newSrv: CareerService) => void | Promise<void>;
  onUpdateService: (updatedSrv: CareerService) => void | Promise<void>;
  onDeleteService: (id: string) => void | Promise<void>;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(price);

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

export const ServiceManager: React.FC<ServiceManagerProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService
}) => {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const reviewedServices = services.filter((item) => item.reviewsCount > 0 && item.rating > 0);
  const averageRating = reviewedServices.length
    ? (reviewedServices.reduce((total, item) => total + item.rating, 0) / reviewedServices.length).toFixed(1)
    : "-";

  const handleAdd = async () => {
    const srv: CareerService = {
      id: `service-${Date.now()}`,
      title: "Layanan Karir Baru",
      providerName: "Seller KarirHub",
      providerAvatar: "KH",
      category: "consulting",
      rating: 5,
      reviewsCount: 0,
      price: 250000,
      duration: "3 hari",
      description: "Layanan baru untuk pelanggan KarirHub.",
      active: true
    };
    setIsAdding(true);
    try {
      await onAddService(srv);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleService = async (id: string) => {
    const service = services.find((item) => item.id === id);
    if (!service) return;
    setPendingId(id);
    try {
      await onUpdateService({ ...service, active: !service.active });
    } finally {
      setPendingId(null);
    }
  };

  const editService = async (service: CareerService) => {
    const title = window.prompt("Nama layanan", service.title);
    if (!title) return;

    const priceText = window.prompt("Harga layanan", String(service.price));
    const price = Number(priceText);
    if (!price) return;

    const updated = { ...service, title, price };
    setPendingId(service.id);
    try {
      await onUpdateService(updated);
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingId(id);
    try {
      await onDeleteService(id);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Kelola Layanan</h1>
          <p className="mt-2 text-xl text-slate-600">Atur dan kelola layanan yang Anda tawarkan</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-purple-600 px-8 text-lg font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-5 w-5" />
          {isAdding ? "Menyimpan..." : "Tambah Layanan"}
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Box} label="Total Layanan" value={`${services.length}`} tone="bg-purple-50 text-purple-600" />
        <StatCard icon={ToggleRight} label="Layanan Aktif" value={`${services.filter((item) => item.active).length}`} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={DollarSign} label="Total Review" value={`${services.reduce((total, item) => total + item.reviewsCount, 0)}`} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Star} label="Rating Rata-rata" value={averageRating} tone="bg-orange-50 text-orange-600" />
      </div>

      <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-8">
        <div className="space-y-7">
          {services.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-base font-black text-slate-800">Belum ada layanan.</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Gunakan tombol Tambah Layanan untuk membuat layanan seller pertama Anda.</p>
            </div>
          )}

          {services.map((service) => (
            <article key={service.id} className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-slate-950">{service.title}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    service.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {service.active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <p className="mt-3 text-base font-medium text-slate-500">{service.category}</p>
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
                <div className="rounded-lg bg-emerald-50 p-4">
                  <p className="text-sm text-slate-500">Terjual</p>
                  <p className="mt-2 text-xl font-black text-emerald-600">Belum tersedia</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4">
                  <p className="text-sm text-slate-500">Rating</p>
                  <p className="mt-2 flex items-center gap-1 text-xl font-black text-orange-600">
                    <Star className="h-5 w-5 fill-orange-500" />
                    {service.rating} ({service.reviewsCount})
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 lg:flex-row">
                <div className="flex flex-wrap gap-3">
                  <button disabled={pendingId === service.id} onClick={() => editService(service)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                    <Edit3 className="h-4 w-4" />
                    Edit Layanan
                  </button>
                  <button
                    disabled={pendingId === service.id}
                    onClick={() => toggleService(service.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {service.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {service.active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    disabled={pendingId === service.id}
                    onClick={() => handleDelete(service.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 px-6 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
                <button disabled title="Statistik layanan belum tersedia" className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-400">
                  <Eye className="h-4 w-4" />
                  Statistik belum tersedia
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
