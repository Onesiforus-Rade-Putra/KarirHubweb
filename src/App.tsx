import React, { useState, useEffect } from "react";
import { UserRole, Job, Candidate, CareerService, Transaction, ServiceOrder, ConsultationSession, Applicant, SellerAvailability } from "./types";
import {
  INITIAL_JOBS,
  INITIAL_CANDIDATES,
  INITIAL_SERVICES,
  INITIAL_TRANSACTIONS,
  INITIAL_ORDERS,
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
import { SellerProfile } from "./components/Seller/SellerProfile";

// Recruiter Components
import { RecruiterDashboard } from "./components/Recruiter/RecruiterDashboard";
import { JobManager } from "./components/Recruiter/JobManager";
import { JobPoster } from "./components/Recruiter/JobPoster";
import { ApplicantTracker } from "./components/Recruiter/ApplicantTracker";
import { TalentPool } from "./components/Recruiter/TalentPool";
import { RecruiterUpgrade } from "./components/Recruiter/RecruiterUpgrade";
import { RecruiterProfile } from "./components/Recruiter/RecruiterProfile";

import { Info, X } from "lucide-react";
import { clearAuthToken, getCurrentUser } from "./lib/authApi";
import {
  createApplication,
  createAIPhotoRequest,
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
  fetchSellerAvailability,
  fetchSellerEarnings,
  fetchSellerOrders,
  fetchSellerServices,
  fetchSellerSessions,
  fetchServices,
  fetchTransactions,
  RecruiterStatsSummary,
  SellerEarningsSummary,
  createSellerAvailability,
  rescheduleSellerSession,
  updateRecruiterApplicant,
  updateRecruiterJob,
  updateSellerAvailability,
  updateSellerOrder,
  updateSellerService,
  updateSellerSession,
  updateSellerSessionMeetingLink
} from "./lib/karirHubApi";

const SAVED_JOBS_STORAGE_KEY = "karirhub_saved_jobs";
type SellerDashboardErrors = {
  services?: string;
  orders?: string;
  earnings?: string;
};

type RecruiterDashboardErrors = {
  jobs?: string;
  applicants?: string;
  talentPool?: string;
  stats?: string;
};

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
  const [recruiterJobs, setRecruiterJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [recruiterCandidates, setRecruiterCandidates] = useState<Candidate[]>([]);
  const [services, setServices] = useState<CareerService[]>(INITIAL_SERVICES);
  const [sellerServices, setSellerServices] = useState<CareerService[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [orders, setOrders] = useState<ServiceOrder[]>(INITIAL_ORDERS);
  const [sellerOrders, setSellerOrders] = useState<ServiceOrder[]>([]);
  const [sellerEarnings, setSellerEarnings] = useState<SellerEarningsSummary | null>(null);
  const [sellerDashboardLoading, setSellerDashboardLoading] = useState(false);
  const [sellerDashboardErrors, setSellerDashboardErrors] = useState<SellerDashboardErrors>({});
  const [sellerServicesLoading, setSellerServicesLoading] = useState(false);
  const [sellerServicesError, setSellerServicesError] = useState<string | null>(null);
  const [sellerOrdersLoading, setSellerOrdersLoading] = useState(false);
  const [sellerOrdersError, setSellerOrdersError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [sellerAvailability, setSellerAvailability] = useState<SellerAvailability[]>([]);
  const [sellerScheduleLoading, setSellerScheduleLoading] = useState(false);
  const [sellerScheduleError, setSellerScheduleError] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [recruiterApplicants, setRecruiterApplicants] = useState<Applicant[]>([]);
  const [recruiterStats, setRecruiterStats] = useState<RecruiterStatsSummary | null>(null);
  const [recruiterDashboardLoading, setRecruiterDashboardLoading] = useState(false);
  const [recruiterDashboardErrors, setRecruiterDashboardErrors] = useState<RecruiterDashboardErrors>({});

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

  const loadSellerDashboard = async () => {
    if (!currentUser || currentUser.role !== "seller") return;

    setSellerDashboardLoading(true);
    setSellerServicesLoading(true);
    setSellerOrdersLoading(true);
    setSellerDashboardErrors({});

    const [servicesResult, ordersResult, earningsResult] = await Promise.allSettled([fetchSellerServices(), fetchSellerOrders(), fetchSellerEarnings()]);
    const nextErrors: SellerDashboardErrors = {};

    if (servicesResult.status === "fulfilled") {
      setSellerServices(servicesResult.value.services);
      setSellerServicesError(null);
    } else {
      nextErrors.services = servicesResult.reason instanceof Error ? servicesResult.reason.message : "GET /api/seller/services gagal.";
      setSellerServicesError(nextErrors.services);
    }

    if (ordersResult.status === "fulfilled") {
      setSellerOrders(ordersResult.value.orders);
      setSellerOrdersError(null);
    } else {
      nextErrors.orders = ordersResult.reason instanceof Error ? ordersResult.reason.message : "GET /api/seller/orders gagal.";
      setSellerOrdersError(nextErrors.orders);
    }

    if (earningsResult.status === "fulfilled") {
      setSellerEarnings(earningsResult.value.earnings);
    } else {
      nextErrors.earnings = earningsResult.reason instanceof Error ? earningsResult.reason.message : "GET /api/seller/earnings gagal.";
    }

    setSellerDashboardErrors(nextErrors);
    setSellerDashboardLoading(false);
    setSellerServicesLoading(false);
    setSellerOrdersLoading(false);
  };

  const loadSellerServices = async () => {
    if (!currentUser || currentUser.role !== "seller") return;

    setSellerServicesLoading(true);
    setSellerServicesError(null);
    try {
      const { services } = await fetchSellerServices();
      setSellerServices(services);
    } catch (error) {
      const message = error instanceof Error ? error.message : "GET /api/seller/services gagal.";
      setSellerServicesError(message);
      throw error;
    } finally {
      setSellerServicesLoading(false);
    }
  };

  const loadSellerOrders = async () => {
    if (!currentUser || currentUser.role !== "seller") return;

    setSellerOrdersLoading(true);
    setSellerOrdersError(null);
    try {
      const { orders } = await fetchSellerOrders();
      setSellerOrders(orders);
    } catch (error) {
      const message = error instanceof Error ? error.message : "GET /api/seller/orders gagal.";
      setSellerOrdersError(message);
      throw error;
    } finally {
      setSellerOrdersLoading(false);
    }
  };

  const loadSellerSchedule = async () => {
    if (!currentUser || currentUser.role !== "seller") return;

    setSellerScheduleLoading(true);
    setSellerScheduleError(null);
    try {
      const [sessionResult, availabilityResult] = await Promise.all([fetchSellerSessions(), fetchSellerAvailability()]);
      setSessions(sessionResult.sessions);
      setSellerAvailability(availabilityResult.availability);
    } catch (error) {
      const message = error instanceof Error ? error.message : "GET /api/seller/sessions gagal.";
      setSellerScheduleError(message);
      throw error;
    } finally {
      setSellerScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== "seller") return;

    loadSellerDashboard();
    loadSellerSchedule().catch(() => undefined);
  }, [currentUser]);

  const loadRecruiterDashboard = async () => {
    if (!currentUser || currentUser.role !== "recruiter") return;

    setRecruiterDashboardLoading(true);
    setRecruiterDashboardErrors({});

    const [jobsResult, applicantsResult, talentResult, statsResult] = await Promise.allSettled([
      fetchRecruiterJobs(),
      fetchRecruiterApplicants(),
      fetchRecruiterTalentPool(),
      fetchRecruiterStats()
    ]);
    const nextErrors: RecruiterDashboardErrors = {};

    if (jobsResult.status === "fulfilled") {
      setRecruiterJobs(jobsResult.value.jobs);
    } else {
      nextErrors.jobs = jobsResult.reason instanceof Error ? jobsResult.reason.message : "GET /api/recruiter/jobs gagal.";
    }

    if (applicantsResult.status === "fulfilled") {
      setRecruiterApplicants(applicantsResult.value.applicants);
    } else {
      nextErrors.applicants = applicantsResult.reason instanceof Error ? applicantsResult.reason.message : "GET /api/recruiter/applicants gagal.";
    }

    if (talentResult.status === "fulfilled") {
      setRecruiterCandidates(talentResult.value.candidates);
    } else {
      nextErrors.talentPool = talentResult.reason instanceof Error ? talentResult.reason.message : "GET /api/recruiter/talent-pool gagal.";
    }

    if (statsResult.status === "fulfilled") {
      setRecruiterStats(statsResult.value.stats);
    } else {
      nextErrors.stats = statsResult.reason instanceof Error ? statsResult.reason.message : "GET /api/recruiter/stats gagal.";
    }

    setRecruiterDashboardErrors(nextErrors);
    setRecruiterDashboardLoading(false);
  };

  useEffect(() => {
    loadRecruiterDashboard();
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
      const serviceId = order.serviceId || services.find((item) => item.id === order.id)?.id;
      if (!serviceId) throw new Error("Layanan tidak valid untuk checkout.");

      await createTransaction({
        serviceId,
        buyerName: order.buyerName,
        buyerEmail: order.buyerEmail,
        requirements: order.requirements,
        itemTitle: tx.itemTitle,
        category: tx.category,
        price: tx.price,
        status: tx.status,
        paymentMethod: tx.paymentMethod
      });

      const [transactionResult, orderResult] = await Promise.all([fetchTransactions(), fetchOrders()]);
      setTransactions(transactionResult.transactions);
      setOrders(orderResult.orders);
      if (currentUser.role === "seller") {
        loadSellerOrders().catch(() => undefined);
      }
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
  const handleAddService = async (newSrv: Partial<CareerService>) => {
    if (!currentUser) {
      triggerToast("Silakan login sebagai seller untuk menambah layanan.", "error");
      return;
    }

    try {
      await createSellerService(newSrv);
      await loadSellerServices();
      triggerToast("Layanan karir berhasil disimpan dan dimuat ulang dari database.", "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan layanan ke database.", "error");
      throw error;
    }
  };

  const handleUpdateService = async (updatedSrv: Partial<CareerService> & { id: string }) => {
    try {
      await updateSellerService(updatedSrv);
      await loadSellerServices();
      triggerToast("Data layanan berhasil diperbarui dan dimuat ulang dari database.", "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal memperbarui layanan di database.", "error");
      throw error;
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteSellerService(id);
      await loadSellerServices();
      triggerToast("Layanan berhasil dipindahkan ke arsip.", "info");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal menonaktifkan layanan di database.", "error");
      throw error;
    }
  };

  // Seller Order status management
  const handleUpdateOrderStatus = async (payload: {
    orderId: string;
    orderStatus: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
    sellerNotes?: string;
    resultUrl?: string;
  }) => {
    try {
      await updateSellerOrder({
        id: payload.orderId,
        orderStatus: payload.orderStatus,
        sellerNotes: payload.sellerNotes,
        resultUrl: payload.resultUrl,
      });
      await loadSellerOrders();
      fetchSellerEarnings().then(({ earnings }) => setSellerEarnings(earnings)).catch(() => undefined);
      triggerToast(`Pesanan ${payload.orderId} berhasil diperbarui dari database.`, "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : `Gagal memperbarui pesanan ${payload.orderId}.`, "error");
      throw error;
    }
  };

  const handleUpdateSessionStatus = async (payload: {
    id: string;
    status?: "pending" | "confirmed" | "rejected" | "rescheduled" | "completed" | "cancelled";
    sellerNotes?: string;
    rejectionReason?: string;
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    meetingUrl?: string;
  }) => {
    try {
      await updateSellerSession(payload);
      await loadSellerSchedule();
      triggerToast("Jadwal konsultasi berhasil diperbarui.", "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal memperbarui jadwal konsultasi.", "error");
      throw error;
    }
  };

  const handleRescheduleSession = async (id: string, payload: { scheduledDate: string; startTime: string; endTime: string; sellerNotes?: string }) => {
    try {
      await rescheduleSellerSession(id, payload);
      await loadSellerSchedule();
      triggerToast("Jadwal konsultasi berhasil di-reschedule.", "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal reschedule jadwal konsultasi.", "error");
      throw error;
    }
  };

  const handleSaveMeetingLink = async (id: string, meetingUrl: string) => {
    try {
      await updateSellerSessionMeetingLink(id, meetingUrl);
      await loadSellerSchedule();
      triggerToast("Link meeting berhasil disimpan.", "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan link meeting.", "error");
      throw error;
    }
  };

  const handleSaveAvailability = async (payload: Omit<SellerAvailability, "id"> | SellerAvailability) => {
    try {
      if ("id" in payload && payload.id) {
        await updateSellerAvailability(payload);
      } else {
        await createSellerAvailability(payload);
      }
      await loadSellerSchedule();
      triggerToast("Ketersediaan seller berhasil disimpan.", "success");
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan ketersediaan seller.", "error");
      throw error;
    }
  };

  // Tarik Saldo
  const handleUnavailableSellerAction = (message = "Fitur ini belum tersedia pada tahap stabilisasi dashboard seller.") => {
    triggerToast(message, "info");
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
      triggerToast(error instanceof Error ? error.message : "Gagal menyimpan lowongan ke database.", "error");
      throw error;
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
      triggerToast(error instanceof Error ? error.message : "Gagal memperbarui lowongan di database.", "error");
      throw error;
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
      triggerToast(error instanceof Error ? error.message : "Gagal menutup lowongan di database.", "error");
      throw error;
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
      triggerToast(error instanceof Error ? error.message : `Gagal memperbarui status pelamar ke: ${status}`, "error");
      throw error;
    }
  };

  // Recruiter bookmark talents
  const handleToggleBookmarkCandidate = (id: string) => {
    triggerToast(`Bookmark kandidat ${id} belum tersedia pada tahap stabilisasi recruiter.`, "info");
  };

  const handleUpdateUserName = (newName: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, name: newName });
    }
  };

  const sellerNotifications = currentRole === "seller"
    ? [
        ...sellerOrders
          .filter((order) => (order.orderStatus || (order.status === "Baru" ? "pending" : "")) === "pending")
          .slice(0, 3)
          .map((order) => ({
            id: `order-${order.id}`,
            title: "Pesanan baru menunggu respons",
            description: `${order.serviceTitle} dari ${order.buyerName}`,
            tab: "seller-orders",
          })),
        ...sessions
          .filter((session) => session.status === "pending")
          .slice(0, 2)
          .map((session) => ({
            id: `session-${session.id}`,
            title: "Jadwal konsultasi menunggu konfirmasi",
            description: `${session.serviceTitle} dengan ${session.clientName}`,
            tab: "seller-schedule",
          })),
        ...(sellerEarnings?.held_balance
          ? [{
              id: "seller-held-balance",
              title: "Saldo tertahan penarikan",
              description: `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(sellerEarnings.held_balance)} sedang diproses.`,
              tab: "seller-earnings",
            }]
          : []),
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-800">
      {/* Main Navbar */}
      <Navbar
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogout={handleLogout}
        notifications={sellerNotifications}
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

        {activeTab === "profil" && currentRole === "seeker" && (
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
            onHelp={() => setActiveTab("bantuan")}
            onLogout={handleLogout}
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
                isLoading={sellerDashboardLoading}
                errors={sellerDashboardErrors}
                onRetry={loadSellerDashboard}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "seller-services" && (
              <ServiceManager
                services={sellerServices}
                orders={sellerOrders}
                isLoading={sellerServicesLoading}
                error={sellerServicesError}
                onRetry={loadSellerServices}
                onAddService={handleAddService}
                onUpdateService={handleUpdateService}
                onDeleteService={handleDeleteService}
              />
            )}

            {activeTab === "seller-orders" && (
              <OrderManager
                orders={sellerOrders}
                isLoading={sellerOrdersLoading}
                error={sellerOrdersError}
                onRetry={loadSellerOrders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {activeTab === "seller-schedule" && (
              <ConsultationScheduler
                sessions={sessions}
                availability={sellerAvailability}
                isLoading={sellerScheduleLoading}
                error={sellerScheduleError}
                onRetry={loadSellerSchedule}
                onUpdateSessionStatus={handleUpdateSessionStatus}
                onRescheduleSession={handleRescheduleSession}
                onSaveMeetingLink={handleSaveMeetingLink}
                onSaveAvailability={handleSaveAvailability}
              />
            )}

            {activeTab === "seller-earnings" && (
              <SellerEarnings
                earnings={sellerEarnings}
                orders={sellerOrders}
                onUnavailableAction={handleUnavailableSellerAction}
                toast={(msg, st) => triggerToast(msg, st as any)}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "profil" && (
              <SellerProfile
                currentUser={currentUser}
                toast={(msg, st) => triggerToast(msg, st as any)}
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
                isLoading={recruiterDashboardLoading}
                errors={recruiterDashboardErrors}
                onRetry={loadRecruiterDashboard}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "recruiter-jobs" && (
              <JobManager
                jobs={recruiterJobs}
                isLoading={recruiterDashboardLoading}
                error={recruiterDashboardErrors.jobs}
                onRetry={loadRecruiterDashboard}
                onUpdateJob={handleUpdateJob}
                onUpdateJobStatus={handleUpdateJobStatus}
                onDeleteJob={handleDeleteJob}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "recruiter-post-job" && (
              <JobPoster
                onAddJob={handleAddJob}
                currentUser={currentUser}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "recruiter-applicants" && (
              <ApplicantTracker
                applicants={recruiterApplicants}
                isLoading={recruiterDashboardLoading}
                error={recruiterDashboardErrors.applicants}
                onRetry={loadRecruiterDashboard}
                onUpdateApplicantStatus={handleUpdateApplicantStatus}
              />
            )}

            {activeTab === "recruiter-talent" && (
              <TalentPool
                candidates={recruiterCandidates}
                isLoading={recruiterDashboardLoading}
                error={recruiterDashboardErrors.talentPool}
                onRetry={loadRecruiterDashboard}
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

            {activeTab === "profil" && (
              <RecruiterProfile
                currentUser={currentUser}
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
