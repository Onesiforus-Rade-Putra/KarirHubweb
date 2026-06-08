import React, { useState, useEffect } from "react";
import { UserRole, Job, Candidate, CareerService, Transaction, ServiceOrder, ConsultationSession, Applicant } from "./types";
import {
  INITIAL_JOBS,
  INITIAL_CANDIDATES,
  INITIAL_SERVICES,
  INITIAL_TRANSACTIONS,
  INITIAL_ORDERS,
  INITIAL_SESSIONS,
  INITIAL_APPLICANTS
} from "./data/mockData";

// Shared Components
import { Navbar } from "./components/Shared/Navbar";
import { Footer } from "./components/Shared/Footer";
import { Auth } from "./components/Shared/Auth";
import { LandingPage } from "./components/Shared/LandingPage";
import { TransactionsHistory } from "./components/Shared/TransactionsHistory";
import { UserProfile } from "./components/Shared/UserProfile";
import { HelpPage, PrivacyPage, SettingsPage, TermsPage } from "./components/Shared/StaticPages";

// Job Seeker Components
import { SeekerDashboard } from "./components/JobSeeker/SeekerDashboard";
import { AIPhotoStudio } from "./components/JobSeeker/AIPhotoStudio";
import { ATSBuilder } from "./components/JobSeeker/ATSBuilder";
import { Marketplace } from "./components/JobSeeker/Marketplace";
import { JobBoard } from "./components/JobSeeker/JobBoard";

// Seller Components
import { SellerDashboard } from "./components/Seller/SellerDashboard";
import { ServiceManager } from "./components/Seller/ServiceManager";
import { OrderManager } from "./components/Seller/OrderManager";
import { ConsultationScheduler } from "./components/Seller/ConsultationScheduler";
import { SellerEarnings } from "./components/Seller/SellerEarnings";

// Recruiter Components
import { RecruiterDashboard } from "./components/Recruiter/RecruiterDashboard";
import { JobManager } from "./components/Recruiter/JobManager";
import { JobPoster } from "./components/Recruiter/JobPoster";
import { ApplicantTracker } from "./components/Recruiter/ApplicantTracker";
import { TalentPool } from "./components/Recruiter/TalentPool";
import { RecruiterUpgrade } from "./components/Recruiter/RecruiterUpgrade";

import { Info, X } from "lucide-react";
import { clearAuthToken, getCurrentUser } from "./lib/authApi";
import {
  createApplication,
  createAIPhotoRequest,
  createOrder,
  createRecruiterJob,
  createTransaction,
  createSellerService,
  deleteRecruiterJob,
  deleteSellerService,
  fetchApplications,
  fetchJobs,
  fetchOrders,
  fetchRecruiterApplicants,
  fetchRecruiterJobs,
  fetchRecruiterStats,
  fetchRecruiterTalentPool,
  fetchSellerEarnings,
  fetchSellerOrders,
  fetchSellerServices,
  fetchServices,
  fetchTransactions,
  RecruiterStatsSummary,
  SellerEarningsSummary,
  updateRecruiterApplicant,
  updateRecruiterJob,
  updateSellerOrder,
  updateSellerService
} from "./lib/karirHubApi";

const SAVED_JOBS_STORAGE_KEY = "karirhub_saved_jobs";

const readSavedJobs = () => {
  if (typeof window === "undefined") return ["job-1", "job-3"];
  try {
    const stored = window.localStorage.getItem(SAVED_JOBS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : ["job-1", "job-3"];
  } catch {
    return ["job-1", "job-3"];
  }
};

export default function App() {
  // Global React persistent simulation db states
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [recruiterJobs, setRecruiterJobs] = useState<Job[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [recruiterCandidates, setRecruiterCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [services, setServices] = useState<CareerService[]>(INITIAL_SERVICES);
  const [sellerServices, setSellerServices] = useState<CareerService[]>(INITIAL_SERVICES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [sellerOrders, setSellerOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [sellerEarnings, setSellerEarnings] = useState<SellerEarningsSummary | null>(null);
  const [sessions, setSessions] = useState<ConsultationSession[]>(INITIAL_SESSIONS);
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [recruiterApplicants, setRecruiterApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStatsSummary | null>(null);

  // User details & Navigation
  const [currentRole, setCurrentRole] = useState<UserRole>("seeker");
  const [activeTab, setActiveTab] = useState<string>("beranda");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Bookmark / Save statuses
  const [savedJobs, setSavedJobs] = useState<string[]>(readSavedJobs);
  const [savedCandidatesOnly, setSavedCandidatesOnly] = useState<boolean>(false);

  // Toast State
  const [toastMsg, setToastMsg] = useState("");
  const [toastStatus, setToastStatus] = useState<"success" | "info" | "error">("success");

  const triggerToast = (msg: string, status: "success" | "info" | "error" = "success") => {
    setToastMsg(msg);
    setToastStatus(status);
  };

  useEffect(() => {
    if (toastMsg) {
      const tm = setTimeout(() => setToastMsg(""), 3500);
      return () => clearTimeout(tm);
    }
  }, [toastMsg]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(savedJobs));
    } catch {
      // Bookmark tetap berjalan di state walau storage browser tidak tersedia.
    }
  }, [savedJobs]);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (!user) return;
        setCurrentUser(user);
        setCurrentRole(user.role);
        setActiveTab(user.role === "seeker" ? "dashboard" : user.role === "seller" ? "seller-dashboard" : "recruiter-dashboard");
      })
      .catch(() => {
        triggerToast("Session login sudah tidak valid. Silakan masuk ulang.", "info");
      });
  }, []);

  useEffect(() => {
    fetchServices()
      .then(({ services }) => setServices(services))
      .catch(() => triggerToast("Marketplace masih memakai data cadangan karena API services belum siap.", "info"));

    fetchJobs()
      .then(({ jobs }) => setJobs(jobs))
      .catch(() => triggerToast("Lowongan masih memakai data cadangan karena API jobs belum siap.", "info"));
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    Promise.all([fetchTransactions(), fetchOrders(), fetchApplications()])
      .then(([txResult, orderResult, appResult]) => {
        setTransactions(txResult.transactions);
        setOrders(orderResult.orders);
        setApplicants((prev) => {
          const merged = [...appResult.applications];
          prev.forEach((item) => {
            if (!merged.some((existing) => existing.id === item.id)) {
              merged.push(item);
            }
          });
          return merged;
        });
      })
      .catch(() => triggerToast("Beberapa riwayat akun belum bisa diambil dari database.", "info"));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "seller") return;

    Promise.all([fetchSellerServices(), fetchSellerOrders(), fetchSellerEarnings()])
      .then(([serviceResult, orderResult, earningsResult]) => {
        setSellerServices(serviceResult.services);
        setSellerOrders(orderResult.orders);
        setSellerEarnings(earningsResult.earnings);
      })
      .catch(() => triggerToast("Dashboard seller masih memakai data cadangan karena API seller belum siap.", "info"));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "recruiter") return;

    Promise.all([fetchRecruiterJobs(), fetchRecruiterApplicants(), fetchRecruiterTalentPool(), fetchRecruiterStats()])
      .then(([jobResult, applicantResult, talentResult, statsResult]) => {
        setRecruiterJobs(jobResult.jobs);
        setRecruiterApplicants(applicantResult.applicants);
        setRecruiterCandidates(talentResult.candidates);
        setRecruiterStats(statsResult.stats);
      })
      .catch(() => triggerToast("Dashboard recruiter masih memakai data cadangan karena API recruiter belum siap.", "info"));
  }, [currentUser]);

  // Auth handler
  const handleAuthSuccess = (role: UserRole, userDetails: any) => {
    setCurrentRole(role);
    setCurrentUser(userDetails);
    triggerToast(`Selamat datang ${userDetails.name}! Berhasil masuk sebagai ${role === "seeker" ? "Pencari Kerja" : role === "seller" ? "Pakar Karir" : "Perekrut Mitra"}.`, "success");
    
    // Redirect based on role choice
    if (role === "seeker") {
      setActiveTab("dashboard");
    } else if (role === "seller") {
      setActiveTab("seller-dashboard");
    } else {
      setActiveTab("recruiter-dashboard");
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setCurrentRole("seeker");
    setActiveTab("beranda");
    triggerToast("Anda berhasil keluar dari sistem KarirHub.", "info");
  };

  const handleSelectRoleFromLanding = (role: UserRole) => {
    setCurrentRole(role);
    setActiveTab("daftar");
    triggerToast(`Silakan daftar sebagai ${role === "seeker" ? "Pencari Kerja" : role === "seller" ? "Mitra Seller" : "Mitra Recruiter"}.`, "info");
  };

  // Job Board Apply handler
  const handleApplyJob = async (jobId: string, pitch: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    if (!currentUser) {
      triggerToast("Silakan login dulu untuk melamar lowongan.", "error");
      setActiveTab("login");
      return;
    }

    try {
      const { application } = await createApplication({
        jobId,
        pitch,
        candidateTitle: "Job Seeker"
      });

      const newApplicant = { ...application, jobTitle: application.jobTitle || job.title };
      setJobs(jobs.map((j) => j.id === jobId ? { ...j, applicantsCount: j.applicantsCount + 1 } : j));
      setApplicants([newApplicant, ...applicants.filter((app) => app.id !== newApplicant.id)]);
      triggerToast(`Lamaran kerja berhasil terkirim ke ${job.company}!`, "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal mengirim lamaran.", "error");
    }
  };

  // Saved Loker bookmarks
  const handleToggleSaveJob = (jobId: string) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs((prev) => prev.filter((id) => id !== jobId));
      triggerToast("Postingan lowongan dihapus dari daftar simpanan.", "info");
    } else {
      setSavedJobs((prev) => [...prev, jobId]);
      triggerToast("Postingan lowongan disimpan ke tab Anda.", "success");
    }
  };

  // Buying service from marketplace handler
  const handleAddTransactionOrder = async (tx: Transaction, order: ServiceOrder) => {
    if (!currentUser) {
      triggerToast("Silakan login dulu untuk membuat order.", "error");
      setActiveTab("login");
      throw new Error("Silakan login dulu untuk membuat order.");
    }

    try {
      const service = services.find((item) => item.title === order.serviceTitle);
      const { order: savedOrder } = await createOrder({
        serviceId: service?.id || order.id,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        requirements: order.requirements
      });
      const { transaction } = await createTransaction({
        orderId: savedOrder.id,
        itemTitle: tx.itemTitle,
        category: tx.category,
        price: tx.price,
        status: tx.status,
        paymentMethod: tx.paymentMethod
      });

      setTransactions([transaction, ...transactions]);
      setOrders([savedOrder, ...orders]);
      triggerToast(`Transaksi berhasil dikonfirmasi! Pesanan dimasukkan dalam database bimbingan.`, "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan transaksi.", "error");
      throw error;
    }
  };

  const handleAIPhotoRequest = async (payload: {
    style: string;
    sourceImageUrl?: string;
    resultImageUrl?: string;
    paymentMethod?: string;
  }) => {
    if (!currentUser) {
      triggerToast("Silakan login dulu untuk menyimpan request AI Foto CV.", "error");
      setActiveTab("login");
      return;
    }

    try {
      await createAIPhotoRequest({
        style: payload.style,
        sourceImageUrl: payload.sourceImageUrl,
        resultImageUrl: payload.resultImageUrl,
        status: "paid"
      });
      const { transaction } = await createTransaction({
        itemTitle: "AI Foto CV HD",
        category: "premium",
        price: 15375,
        status: "Berhasil",
        paymentMethod: payload.paymentMethod || "QRIS"
      });
      setTransactions([transaction, ...transactions]);
      triggerToast("Request AI Foto CV tersimpan di database.", "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan request AI Foto CV.", "error");
    }
  };

  // Seller Layanan Management
  const handleAddService = async (newSrv: CareerService) => {
    if (!currentUser) {
      triggerToast("Silakan login sebagai seller untuk menambah layanan.", "error");
      return;
    }

    try {
      const { service } = await createSellerService(newSrv);
      setSellerServices([service, ...sellerServices]);
      setServices([service, ...services]);
      triggerToast(`Layanan Karir '${service.title}' dipublikasi ke marketplace pencari kerja!`, "success");
    } catch (error) {
      setSellerServices([newSrv, ...sellerServices]);
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan layanan ke database.", "error");
    }
  };

  const handleUpdateService = async (updatedSrv: CareerService) => {
    try {
      const { service } = await updateSellerService(updatedSrv);
      setSellerServices(sellerServices.map((s) => s.id === service.id ? service : s));
      setServices(services.map((s) => s.id === service.id ? service : s));
      triggerToast("Data layanan berhasil diperbarui.", "success");
    } catch (error) {
      setSellerServices(sellerServices.map((s) => s.id === updatedSrv.id ? updatedSrv : s));
      triggerToast(error instanceof Error ? error.message : "Gagal memperbarui layanan di database.", "error");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const { service } = await deleteSellerService(id);
      setSellerServices(sellerServices.map((s) => s.id === id ? service : s));
      setServices(services.map((s) => s.id === id ? service : s));
      triggerToast("Layanan karir dinonaktifkan.", "info");
    } catch (error) {
      setSellerServices(sellerServices.map((s) => s.id === id ? { ...s, active: false } : s));
      triggerToast(error instanceof Error ? error.message : "Gagal menonaktifkan layanan di database.", "error");
    }
  };

  // Seller Order status management
  const handleUpdateOrderStatus = async (orderId: string, status: ServiceOrder["status"], resultUrl?: string) => {
    const orderStatus = status === "Baru" ? "pending" : status === "Sedang Diproses" ? "in_progress" : status === "Selesai" ? "completed" : "cancelled";

    try {
      const { order } = await updateSellerOrder({ id: orderId, orderStatus, resultUrl });
      setSellerOrders(sellerOrders.map((o) => o.id === orderId ? order : o));
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status, resultUrl } : o));
      fetchSellerEarnings().then(({ earnings }) => setSellerEarnings(earnings)).catch(() => undefined);
      triggerToast(`Pesanan ${orderId} diperbarui menjadi status: ${status}`, "success");
    } catch (error) {
      setSellerOrders(sellerOrders.map((o) => o.id === orderId ? { ...o, status, resultUrl } : o));
      triggerToast(error instanceof Error ? error.message : `Pesanan ${orderId} diperbarui secara lokal.`, "info");
    }
  };

  const handleUpdateSessionStatus = (sesId: string, status: ConsultationSession["status"]) => {
    setSessions(sessions.map((s) => s.id === sesId ? { ...s, status } : s));
    triggerToast("Jadwal janji pertemuan ditandai selesai.", "success");
  };

  // Tarik Saldo
  const handleWithdrawFunds = (amount: number, bank: string, accountNo: string) => {
    const wdId = `WD-${Math.floor(100 + Math.random() * 900)}`;
    triggerToast(`Pengajuan transfer Rp ${amount.toLocaleString()} ke ${bank} terkonfirmasi!`, "success");
  };

  // Recruiter Job post management
  const refreshRecruiterStats = () => {
    fetchRecruiterStats().then(({ stats }) => setRecruiterStats(stats)).catch(() => undefined);
  };

  const handleAddJob = async (newJob: Job) => {
    if (!currentUser) {
      triggerToast("Silakan login sebagai recruiter untuk membuat lowongan.", "error");
      return;
    }

    try {
      const { job } = await createRecruiterJob(newJob);
      setRecruiterJobs([job, ...recruiterJobs]);
      if (job.status === "aktif") setJobs([job, ...jobs]);
      refreshRecruiterStats();
      triggerToast(`Lowongan '${job.title}' resmi beredar aktif di portal pencarian kerja!`, "success");
    } catch (error) {
      setRecruiterJobs([newJob, ...recruiterJobs]);
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan lowongan ke database.", "error");
    }
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    try {
      const { job } = await updateRecruiterJob(updatedJob);
      setRecruiterJobs(recruiterJobs.map((j) => j.id === job.id ? job : j));
      setJobs(jobs.map((j) => j.id === job.id ? job : j));
      refreshRecruiterStats();
      triggerToast("Lowongan berhasil diperbarui.", "success");
    } catch (error) {
      setRecruiterJobs(recruiterJobs.map((j) => j.id === updatedJob.id ? updatedJob : j));
      triggerToast(error instanceof Error ? error.message : "Gagal memperbarui lowongan di database.", "error");
    }
  };

  const handleUpdateJobStatus = async (jobId: string, status: Job["status"]) => {
    const job = recruiterJobs.find((item) => item.id === jobId) || jobs.find((item) => item.id === jobId);
    if (!job) return;
    await handleUpdateJob({ ...job, status });
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { job } = await deleteRecruiterJob(jobId);
      setRecruiterJobs(recruiterJobs.map((j) => j.id === jobId ? job : j));
      setJobs(jobs.map((j) => j.id === jobId ? job : j));
      refreshRecruiterStats();
      triggerToast("Postingan iklan loker ditutup.", "info");
    } catch (error) {
      setRecruiterJobs(recruiterJobs.map((j) => j.id === jobId ? { ...j, status: "ditutup" } : j));
      triggerToast(error instanceof Error ? error.message : "Gagal menutup lowongan di database.", "error");
    }
  };

  // Recruiter Applicant statuses
  const handleUpdateApplicantStatus = async (appId: string, status: Applicant["status"]) => {
    const applicationStatus = status === "Shortlisted" ? "reviewed" : status === "Interview" ? "interview" : status === "Diterima" ? "accepted" : status === "Ditolak" ? "rejected" : "submitted";

    try {
      const { applicant } = await updateRecruiterApplicant({ id: appId, applicationStatus });
      setRecruiterApplicants(recruiterApplicants.map((a) => a.id === appId ? applicant : a));
      setApplicants(applicants.map((a) => a.id === appId ? { ...a, status } : a));
      refreshRecruiterStats();
      triggerToast(`Status pelamar dipindahkan ke: ${status}`, "success");
    } catch (error) {
      setRecruiterApplicants(recruiterApplicants.map((a) => a.id === appId ? { ...a, status } : a));
      triggerToast(error instanceof Error ? error.message : `Status pelamar dipindahkan lokal ke: ${status}`, "info");
    }
  };

  // Recruiter bookmark talents
  const handleToggleBookmarkCandidate = (id: string) => {
    setRecruiterCandidates(
      recruiterCandidates.map((c) => c.id === id ? { ...c, savedByRecruiter: !c.savedByRecruiter } : c)
    );
    triggerToast("Bookmark kandidat diperbarui untuk sesi ini.", "success");
  };

  const handleUpdateUserName = (newName: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name: newName });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-800">
      {/* Main Navbar */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Content Center Frame */}
      <main className="flex-grow">
        {/* Dynamic tabs render depending on state */}
        {activeTab === "beranda" && (
          <LandingPage
            onExplore={(tab: string) => setActiveTab(tab)}
            onSelectRole={handleSelectRoleFromLanding}
            toast={(msg) => triggerToast(msg, "info")}
          />
        )}

        {activeTab === "login" && (
          <Auth
            mode="login"
            onAuthSuccess={handleAuthSuccess}
            onSwitchMode={(m) => setActiveTab(m)}
          />
        )}

        {activeTab === "daftar" && (
          <Auth
            mode="daftar"
            onAuthSuccess={handleAuthSuccess}
            onSwitchMode={(m) => setActiveTab(m)}
          />
        )}

        {activeTab === "transaksi" && (
          <TransactionsHistory
            transactions={transactions}
            toast={(msg, st) => triggerToast(msg, st as any)}
            onSupport={() => setActiveTab("bantuan")}
          />
        )}

        {activeTab === "profil" && (
          <UserProfile
            currentUser={currentUser}
            onUpdateName={handleUpdateUserName}
            toast={(msg, st) => triggerToast(msg, st as any)}
          />
        )}

        {activeTab === "settings" && (
          <SettingsPage
            currentUser={currentUser}
            toast={(msg, st) => triggerToast(msg, st as any)}
          />
        )}

        {activeTab === "bantuan" && <HelpPage toast={(msg, st) => triggerToast(msg, st as any)} />}

        {activeTab === "ketentuan" && <TermsPage />}

        {activeTab === "privasi" && <PrivacyPage />}

        {/* ==================== PENCARI KERJA WORKFLOWS ==================== */}
        {currentRole === "seeker" && (
          <>
            {activeTab === "dashboard" && (
              <SeekerDashboard
                currentUser={currentUser}
                jobs={jobs}
                applicants={applicants}
                savedJobs={savedJobs}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "foto-cv" && <AIPhotoStudio onSaveRequest={handleAIPhotoRequest} onSupport={() => setActiveTab("bantuan")} />}

            {activeTab === "builder" && <ATSBuilder />}

            {activeTab === "jasa-karir" && (
              <Marketplace
                services={services}
                onAddTransaction={handleAddTransactionOrder}
                currentUser={currentUser}
                onSupport={() => setActiveTab("bantuan")}
              />
            )}

            {activeTab === "lowongan" && (
              <JobBoard
                jobs={jobs}
                onApplyJob={handleApplyJob}
                savedJobs={savedJobs}
                onToggleSaveJob={handleToggleSaveJob}
                onNotify={(msg, st) => triggerToast(msg, st)}
              />
            )}
          </>
        )}

        {/* ==================== EXPERT SELLER WORKFLOWS ==================== */}
        {currentRole === "seller" && (
          <>
            {activeTab === "seller-dashboard" && (
              <SellerDashboard
                currentUser={currentUser}
                orders={sellerOrders}
                services={sellerServices}
                earnings={sellerEarnings}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "seller-services" && (
              <ServiceManager
                services={sellerServices}
                onAddService={handleAddService}
                onUpdateService={handleUpdateService}
                onDeleteService={handleDeleteService}
              />
            )}

            {activeTab === "seller-orders" && (
              <OrderManager
                orders={sellerOrders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {activeTab === "seller-schedule" && (
              <ConsultationScheduler
                sessions={sessions}
                onUpdateSessionStatus={handleUpdateSessionStatus}
              />
            )}

            {activeTab === "seller-earnings" && (
              <SellerEarnings
                earnings={sellerEarnings}
                orders={sellerOrders}
                onWithdrawFunds={handleWithdrawFunds}
                toast={(msg, st) => triggerToast(msg, st as any)}
                setActiveTab={setActiveTab}
              />
            )}
          </>
        )}

        {/* ==================== RECRUITER WORKFLOWS ==================== */}
        {currentRole === "recruiter" && (
          <>
            {activeTab === "recruiter-dashboard" && (
              <RecruiterDashboard
                currentUser={currentUser}
                jobs={recruiterJobs}
                applicants={recruiterApplicants}
                stats={recruiterStats}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "recruiter-jobs" && (
              <JobManager
                jobs={recruiterJobs}
                onUpdateJob={handleUpdateJob}
                onUpdateJobStatus={handleUpdateJobStatus}
                onDeleteJob={handleDeleteJob}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "recruiter-post-job" && (
              <JobPoster
                onAddJob={handleAddJob}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "recruiter-applicants" && (
              <ApplicantTracker
                applicants={recruiterApplicants}
                onUpdateApplicantStatus={handleUpdateApplicantStatus}
              />
            )}

            {activeTab === "recruiter-talent" && (
              <TalentPool
                candidates={recruiterCandidates}
                onToggleBookmarkCandidate={handleToggleBookmarkCandidate}
                savedCandidatesOnly={savedCandidatesOnly}
                setSavedCandidatesOnly={setSavedCandidatesOnly}
              />
            )}

            {activeTab === "recruiter-upgrade" && (
              <RecruiterUpgrade
                toast={(msg, st) => triggerToast(msg, st as any)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer layout */}
      <Footer setActiveTab={setActiveTab} />

      {/* TOAST SYSTEM POPUP */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-4 animate-in fade-in slide-in-from-bottom-5 duration-155 text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold">
              {toastStatus === "success" ? "OK" : toastStatus === "error" ? "!" : <Info className="w-3.5 h-3.5" />}
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold leading-normal">{toastMsg}</p>
            </div>
            <button
              onClick={() => setToastMsg("")}
              className="text-slate-400 hover:text-white text-xs leading-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
