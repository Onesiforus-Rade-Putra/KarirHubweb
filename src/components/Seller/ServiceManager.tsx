import React, { useState } from "react";
import { CareerService } from "../../types";
import { Box, DollarSign, Edit3, Eye, Plus, Star, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";

interface ServiceManagerProps {
  services: CareerService[];
  onAddService: (newSrv: CareerService) => void | Promise<void>;
  onUpdateService: (updatedSrv: CareerService) => void | Promise<void>;
  onDeleteService: (id: string) => void | Promise<void>;
}

const sellerServices = [
  {
    id: "seller-service-1",
    title: "Review CV Profesional",
    category: "CV & Resume",
    description: "Review mendalam CV Anda dengan saran perbaikan dari profesional HR",
    price: 250000,
    duration: "3 hari",
    sold: 78,
    rating: 4.9,
    reviews: 56,
    active: true
  },
  {
    id: "seller-service-2",
    title: "Mock Interview",
    category: "Interview Preparation",
    description: "Simulasi interview dengan feedback detail untuk persiapan optimal",
    price: 350000,
    duration: "60 menit",
    sold: 23,
    rating: 4.7,
    reviews: 18,
    active: true
  },
  {
    id: "seller-service-3",
    title: "Career Coaching Premium",
    category: "Coaching",
    description: "Konsultasi karir mendalam dengan strategi pengembangan karir personal",
    price: 500000,
    duration: "90 menit",
    sold: 45,
    rating: 4.8,
    reviews: 32,
    active: true
  },
  {
    id: "seller-service-4",
    title: "Optimasi LinkedIn Profile",
    category: "Personal Branding",
    description: "Optimasi profil LinkedIn untuk meningkatkan visibilitas profesional Anda",
    price: 300000,
    duration: "5 hari",
    sold: 12,
    rating: 4.6,
    reviews: 9,
    active: false
  }
];

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
  const [items, setItems] = useState(() => services.length ? services : sellerServices.map((service) => ({
    id: service.id,
    title: service.title,
    providerName: "John Doe",
    providerAvatar: "JD",
    category: service.title.includes("Mock") ? "mock-interview" as const : service.title.includes("Career") ? "consulting" as const : "cv-review" as const,
    rating: service.rating,
    reviewsCount: service.reviews,
    price: service.price,
    duration: service.duration,
    description: service.description,
    active: service.active
  })));

  React.useEffect(() => {
    if (services.length) setItems(services);
  }, [services]);

  const handleAdd = () => {
    const srv: CareerService = {
      id: `service-${Date.now()}`,
      title: "Layanan Karir Baru",
      providerName: "John Doe",
      providerAvatar: "JD",
      category: "consulting",
      rating: 5,
      reviewsCount: 0,
      price: 250000,
      duration: "3 hari",
      description: "Layanan baru untuk pelanggan KarirHub.",
      active: true
    };
    onAddService(srv);
    setItems((prev) => [srv, ...prev]);
  };

  const toggleService = async (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, active: !item.active };
        onUpdateService(updated);
        return updated;
      })
    );
  };

  const editService = (service: CareerService) => {
    const title = window.prompt("Nama layanan", service.title);
    if (!title) return;

    const priceText = window.prompt("Harga layanan", String(service.price));
    const price = Number(priceText);
    if (!price) return;

    const updated = { ...service, title, price };
    setItems((prev) => prev.map((item) => (item.id === service.id ? updated : item)));
    onUpdateService(updated);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    onDeleteService(id);
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
          className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-purple-600 px-8 text-lg font-semibold text-white transition hover:bg-purple-700"
        >
          <Plus className="h-5 w-5" />
          Tambah Layanan
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Box} label="Total Layanan" value={`${items.length}`} tone="bg-purple-50 text-purple-600" />
        <StatCard icon={ToggleRight} label="Layanan Aktif" value={`${items.filter((item) => item.active).length}`} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={DollarSign} label="Total Terjual" value={`${items.reduce((total, item: any) => total + (item.sold || 0), 0)}`} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Star} label="Rating Rata-rata" value="4.8" tone="bg-orange-50 text-orange-600" />
      </div>

      <section className="mt-9 rounded-2xl border border-slate-200 bg-white p-8">
        <div className="space-y-7">
          {items.map((service) => (
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
                  <p className="mt-2 text-xl font-black text-emerald-600">{(service as any).sold || 0}x</p>
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
                  <button onClick={() => editService(service)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700">
                    <Edit3 className="h-4 w-4" />
                    Edit Layanan
                  </button>
                  <button
                    onClick={() => toggleService(service.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {service.active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {service.active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-200 px-6 font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-6 font-semibold text-slate-700 hover:bg-slate-50">
                  <Eye className="h-4 w-4" />
                  Lihat Statistik
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
