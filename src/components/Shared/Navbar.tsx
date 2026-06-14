import React, { useState } from "react";
import { UserRole } from "../../types";
import {
  Bell,
  Briefcase,
  BriefcaseBusiness,
  Calendar,
  Camera,
  Crown,
  DollarSign,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  UserRound,
  Users,
  X
} from "lucide-react";

interface NavbarProps {
  currentRole: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  notifications?: Array<{
    id: string;
    title: string;
    description: string;
    tab?: string;
  }>;
}

const roleAccent = {
  seeker: "blue",
  seller: "purple",
  recruiter: "emerald"
} as const;

type NavItem = {
  label: string;
  tab: string;
  icon?: React.ElementType;
  primary?: boolean;
};

const seekerNav: NavItem[] = [
  { label: "Beranda", tab: "beranda", icon: Home },
  { label: "Dashboard", tab: "dashboard" },
  { label: "AI Foto CV", tab: "foto-cv", icon: Camera },
  { label: "Resume Builder", tab: "builder" },
  { label: "Jasa Karir", tab: "jasa-karir", icon: Calendar },
  { label: "Lowongan", tab: "lowongan", icon: Briefcase },
  { label: "Transaksi", tab: "transaksi" },
  { label: "Profil", tab: "profil" }
];

const publicNav: NavItem[] = [
  { label: "Beranda", tab: "beranda", icon: Home },
  { label: "AI Foto CV", tab: "foto-cv", icon: Camera },
  { label: "Jasa Karir", tab: "jasa-karir", icon: Calendar },
  { label: "Lowongan", tab: "lowongan", icon: Briefcase }
];

const sellerNav: NavItem[] = [
  { label: "Dashboard", tab: "seller-dashboard", icon: Sparkles },
  { label: "Kelola Layanan", tab: "seller-services", icon: Package },
  { label: "Pesanan", tab: "seller-orders", icon: ShoppingCart },
  { label: "Jadwal", tab: "seller-schedule", icon: Calendar },
  { label: "Pendapatan", tab: "seller-earnings", icon: DollarSign },
  { label: "Profil", tab: "profil", icon: UserRound },
  { label: "Pengaturan", tab: "settings", icon: Settings }
];

const recruiterNav: NavItem[] = [
  { label: "Dashboard", tab: "recruiter-dashboard", icon: Sparkles },
  { label: "Post Lowongan", tab: "recruiter-post-job", icon: BriefcaseBusiness, primary: true },
  { label: "Kelola Lowongan", tab: "recruiter-jobs", icon: Briefcase },
  { label: "Pelamar", tab: "recruiter-applicants", icon: Users },
  { label: "Talent Pool", tab: "recruiter-talent", icon: FileText },
  { label: "Premium", tab: "recruiter-upgrade", icon: Crown },
  { label: "Profil", tab: "profil", icon: UserRound },
  { label: "Pengaturan", tab: "settings", icon: Settings }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  notifications = []
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isAuthenticated = Boolean(user);
  const effectiveRole: UserRole = isAuthenticated ? currentRole : "seeker";
  const navItems = !isAuthenticated
    ? publicNav
    : currentRole === "seller"
      ? sellerNav
      : currentRole === "recruiter"
        ? recruiterNav
        : seekerNav;
  const accent = roleAccent[effectiveRole];
  const brandText =
    isAuthenticated && currentRole === "seller" ? "KarirHub Seller" : isAuthenticated && currentRole === "recruiter" ? "KarirHub Recruiter" : "KarirHub";
  const displayName = user?.name || user?.company || "Pengguna KarirHub";
  const displaySubtitle = currentRole === "seller" ? "Seller" : currentRole === "recruiter" ? "Recruiter" : "Pencari Kerja";
  const initials = displayName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "KH";

  const activeClass = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600"
  }[accent];

  const primaryClass = {
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    purple: "bg-purple-600 text-white hover:bg-purple-700",
    emerald: "bg-emerald-600 text-white hover:bg-emerald-700"
  }[accent];
  const unreadCount = notifications.length;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1536px] items-center justify-between px-5 sm:px-8">
        <button
          onClick={() => {
            setActiveTab(isAuthenticated && currentRole === "seller" ? "seller-dashboard" : isAuthenticated && currentRole === "recruiter" ? "recruiter-dashboard" : "beranda");
            setMobileOpen(false);
          }}
          className="flex shrink-0 items-center gap-2 text-left"
        >
          <Sparkles
            className={`h-7 w-7 ${
              effectiveRole === "seller" ? "text-purple-600" : effectiveRole === "recruiter" ? "text-emerald-600" : "text-blue-600"
            }`}
          />
          <span className="text-[22px] font-black tracking-normal text-slate-950">
            {isAuthenticated && brandText.includes(" ") ? (
              <>
                KarirHub{" "}
                <span className={currentRole === "seller" ? "text-purple-600" : "text-emerald-600"}>
                  {currentRole === "seller" ? "Seller" : "Recruiter"}
                </span>
              </>
            ) : (
              brandText
            )}
          </span>
        </button>

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            const cls = item.primary
              ? activeTab === item.tab
                ? primaryClass
                : primaryClass
              : isActive
                ? activeClass
                : "text-slate-700 hover:bg-slate-50 hover:text-slate-950";

            return (
              <button
                key={`${item.tab}-${item.label}`}
                onClick={() => setActiveTab(item.tab)}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-base font-medium leading-tight transition ${cls}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className={item.label === "Kelola Layanan" || item.label === "Kelola Lowongan" || item.label === "Post Lowongan" || item.label === "Talent Pool" ? "max-w-[86px]" : "whitespace-nowrap"}>{item.label}</span>
              </button>
            );
          })}

          {!isAuthenticated && (
            <div className="ml-3 flex items-center gap-2">
              <button
                onClick={() => setActiveTab("login")}
                className="h-10 rounded-lg px-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                Masuk
              </button>
              <button
                onClick={() => setActiveTab("daftar")}
                className="h-10 rounded-lg bg-blue-600 px-5 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                Daftar
              </button>
            </div>
          )}

          {isAuthenticated && (currentRole === "seller" || currentRole === "recruiter") && (
            <div className="relative ml-2">
              <button
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative rounded-full p-2 text-slate-600 hover:bg-slate-50"
                aria-label="Buka notifikasi"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-5 w-5" />
                <span className={`absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${unreadCount > 0 ? "bg-red-500" : "bg-slate-300"}`} />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <p className="text-sm font-black text-slate-950">Notifikasi</p>
                    <button onClick={() => setNotificationsOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {notifications.length === 0 && (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="font-black text-slate-800">Belum ada notifikasi baru.</p>
                        <p className="mt-1 font-medium text-slate-500">Pesanan, jadwal, dan status saldo seller akan muncul di sini saat ada pembaruan.</p>
                      </div>
                    )}
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.tab) setActiveTab(item.tab);
                          setNotificationsOpen(false);
                        }}
                        className="w-full rounded-lg bg-slate-50 p-3 text-left hover:bg-slate-100"
                      >
                        <span className="block text-sm font-black text-slate-900">{item.title}</span>
                        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.description}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setNotificationsOpen(false);
                    }}
                    className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Atur Notifikasi
                  </button>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setActiveTab("profil")}
              className={`ml-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                accent === "blue" ? "bg-blue-100 text-blue-700" : accent === "purple" ? "bg-purple-600 text-white" : "bg-emerald-600 text-white"
              }`}
              title="Profil"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </button>
          )}

          {isAuthenticated && (currentRole === "seller" || currentRole === "recruiter") && (
            <div className="hidden min-w-[82px] leading-tight lg:block">
              <p className="max-w-[150px] truncate text-sm font-bold text-slate-950">{displayName}</p>
              <p className="text-xs text-slate-500">{displaySubtitle}</p>
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={onLogout}
              className="ml-2 flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg p-2 text-slate-700 md:hidden"
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-sm md:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;

              return (
                <button
                  key={`mobile-${item.tab}-${item.label}`}
                  onClick={() => {
                    setActiveTab(item.tab);
                    setMobileOpen(false);
                  }}
                  className={`flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${
                    isActive ? activeClass : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </button>
              );
            })}

            {!isAuthenticated ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setActiveTab("login");
                    setMobileOpen(false);
                  }}
                  className="h-10 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Masuk
                </button>
                <button
                  onClick={() => {
                    setActiveTab("daftar");
                    setMobileOpen(false);
                  }}
                  className="h-10 rounded-lg bg-blue-600 font-semibold text-white"
                >
                  Daftar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onLogout();
                  setMobileOpen(false);
                }}
                className="mt-2 flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
