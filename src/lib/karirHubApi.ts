import { Applicant, Candidate, CareerService, ConsultationSession, Job, ResumeData, SellerAvailability, ServiceOrder, Transaction } from "../types";
import { getAuthToken } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detailText = typeof payload.details === "string" ? ` (${payload.details})` : "";
    throw new Error(`${path}: ${payload.error || "Permintaan ke server gagal."}${detailText}`);
  }

  return payload as T;
}

export async function fetchServices() {
  return apiRequest<{ services: CareerService[] }>("/api/services");
}

export async function fetchJobs() {
  return apiRequest<{ jobs: Job[] }>("/api/jobs");
}

export async function fetchOrders() {
  return apiRequest<{ orders: ServiceOrder[] }>("/api/orders");
}

export async function createOrder(payload: {
  serviceId: string;
  buyerName?: string;
  buyerEmail?: string;
  requirements?: string;
}) {
  return apiRequest<{ order: ServiceOrder }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchTransactions() {
  return apiRequest<{ transactions: Transaction[] }>("/api/transactions");
}

export async function createTransaction(payload: {
  orderId?: string;
  serviceId?: string;
  buyerName?: string;
  buyerEmail?: string;
  requirements?: string;
  itemTitle: string;
  category: Transaction["category"];
  price: number;
  status: Transaction["status"];
  paymentMethod?: string;
}) {
  return apiRequest<{ transaction: Transaction }>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchApplications() {
  return apiRequest<{ applications: Applicant[] }>("/api/applications");
}

export async function createApplication(payload: {
  jobId: string;
  pitch: string;
  candidateTitle?: string;
}) {
  return apiRequest<{ application: Applicant }>("/api/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createAIPhotoRequest(payload: {
  style: string;
  sourceImageUrl?: string;
  resultImageUrl?: string;
  status?: "requested" | "generated" | "paid" | "failed";
}) {
  return apiRequest<{ request: { id: string } }>("/api/ai-photo", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type AIPhotoStyle = "corporate" | "smart_casual" | "fresh_graduate";
export type AIPhotoBackground = "white" | "light_gray" | "office";
export type AIPhotoAttire = "formal" | "blazer" | "smart_casual";

export async function editAIPhoto(payload: {
  image: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  style: AIPhotoStyle;
  background: AIPhotoBackground;
  attire: AIPhotoAttire;
}) {
  return apiRequest<{ success: true; imageBase64: string; mimeType: "image/png" | "image/jpeg" | "image/webp" }>("/api/ai/photo/edit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface SellerEarningsSummary {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  gross_revenue: number;
  platform_commission: number;
  platform_commission_rate: number;
  net_revenue: number;
  estimated_net_revenue: number;
  available_balance: number;
  held_balance: number;
  total_withdrawn: number;
}

export interface SellerEarningHistoryItem {
  id: string;
  orderId: string;
  serviceTitle: string;
  buyerName: string;
  date: string;
  orderStatus: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  status: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
}

export interface SellerPayoutAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SellerWithdrawal {
  id: string;
  payoutAccountId: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  note: string;
  requestedAt: string;
  processedAt: string | null;
  paidAt: string | null;
  account: null | {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
}

export interface SellerEarningsPayload {
  earnings: SellerEarningsSummary;
  history: SellerEarningHistoryItem[];
  payoutAccounts: SellerPayoutAccount[];
  withdrawals: SellerWithdrawal[];
  filters: {
    period: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export interface RecruiterStatsSummary {
  total_jobs: number;
  active_jobs: number;
  closed_jobs: number;
  total_applicants: number;
  applicants_reviewed: number;
  applicants_interview: number;
}

export async function fetchSellerServices() {
  return apiRequest<{ services: CareerService[] }>("/api/seller/services");
}

export async function createSellerService(payload: Partial<CareerService>) {
  return apiRequest<{ service: CareerService }>("/api/seller/services", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSellerService(payload: Partial<CareerService> & { id: string }) {
  return apiRequest<{ service: CareerService }>("/api/seller/services", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteSellerService(id: string) {
  return apiRequest<{ service: CareerService }>(`/api/seller/services?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchSellerOrders() {
  return apiRequest<{ orders: ServiceOrder[] }>("/api/seller/orders");
}

export async function updateSellerOrder(payload: {
  id: string;
  orderStatus: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  sellerNotes?: string;
  resultUrl?: string;
}) {
  return apiRequest<{ order: ServiceOrder }>("/api/seller/orders", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchSellerEarnings(filters: { period?: string; status?: string; startDate?: string; endDate?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return apiRequest<SellerEarningsPayload>(`/api/seller/earnings${query ? `?${query}` : ""}`);
}

export async function createSellerPayoutAccount(payload: {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}) {
  return apiRequest<{ payoutAccount: SellerPayoutAccount }>("/api/seller/payout-accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSellerPayoutAccount(payload: Partial<SellerPayoutAccount> & { id: string }) {
  return apiRequest<{ payoutAccount: SellerPayoutAccount }>("/api/seller/payout-accounts", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteSellerPayoutAccount(id: string) {
  return apiRequest<{ ok: boolean }>(`/api/seller/payout-accounts?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function createSellerWithdrawal(payload: {
  payoutAccountId: string;
  amount: number;
  note?: string;
}) {
  return apiRequest<{ withdrawal: SellerWithdrawal; message: string }>("/api/seller/withdrawals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function downloadSellerEarningsCsv(filters: { period?: string; status?: string; startDate?: string; endDate?: string } = {}) {
  const token = getAuthToken();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const response = await fetch(`${API_BASE_URL}/api/seller/earnings/export${params.toString() ? `?${params.toString()}` : ""}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    try {
      const payload = JSON.parse(text);
      throw new Error(payload.error || "Export laporan gagal.");
    } catch (error) {
      if (error instanceof Error && error.message !== text) throw error;
      throw new Error(text || "Export laporan gagal.");
    }
  }
  return text;
}

export async function fetchSellerSessions() {
  return apiRequest<{ sessions: ConsultationSession[] }>("/api/seller/sessions");
}

export async function updateSellerSession(payload: {
  id: string;
  status?: "pending" | "confirmed" | "rejected" | "rescheduled" | "completed" | "cancelled";
  sellerNotes?: string;
  rejectionReason?: string;
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  meetingUrl?: string;
}) {
  return apiRequest<{ session: ConsultationSession }>("/api/seller/sessions", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function rescheduleSellerSession(sessionId: string, payload: {
  scheduledDate: string;
  startTime: string;
  endTime: string;
  sellerNotes?: string;
}) {
  return apiRequest<{ session: ConsultationSession }>(`/api/seller/sessions/${encodeURIComponent(sessionId)}/reschedule`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSellerSessionMeetingLink(sessionId: string, meetingUrl: string) {
  return apiRequest<{ session: ConsultationSession }>(`/api/seller/sessions/${encodeURIComponent(sessionId)}/meeting-link`, {
    method: "PATCH",
    body: JSON.stringify({ meetingUrl }),
  });
}

export async function fetchSellerAvailability() {
  return apiRequest<{ availability: SellerAvailability[] }>("/api/seller/availability");
}

export async function createSellerAvailability(payload: Omit<SellerAvailability, "id">) {
  return apiRequest<{ availability: SellerAvailability }>("/api/seller/availability", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSellerAvailability(payload: Partial<SellerAvailability> & { id: string }) {
  return apiRequest<{ availability: SellerAvailability }>("/api/seller/availability", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchRecruiterJobs() {
  return apiRequest<{ jobs: Job[] }>("/api/recruiter/jobs");
}

export async function createRecruiterJob(payload: Job) {
  return apiRequest<{ job: Job }>("/api/recruiter/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRecruiterJob(payload: Partial<Job> & { id: string }) {
  return apiRequest<{ job: Job }>("/api/recruiter/jobs", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteRecruiterJob(id: string) {
  return apiRequest<{ job: Job }>(`/api/recruiter/jobs?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchRecruiterApplicants() {
  return apiRequest<{ applicants: Applicant[] }>("/api/recruiter/applicants");
}

export async function updateRecruiterApplicant(payload: {
  id: string;
  applicationStatus: "submitted" | "reviewed" | "interview" | "accepted" | "rejected";
  recruiterNotes?: string;
}) {
  return apiRequest<{ applicant: Applicant }>("/api/recruiter/applicants", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchRecruiterTalentPool() {
  return apiRequest<{ candidates: Candidate[] }>("/api/recruiter/talent-pool");
}

export async function fetchRecruiterStats() {
  return apiRequest<{ stats: RecruiterStatsSummary }>("/api/recruiter/stats");
}

export interface ResumeDraftPayload {
  resume: ResumeData;
  certifications: Array<{ id: string; name: string; issuer: string; year: string }>;
  languages: Array<{ id: string; lang: string; level: string }>;
  portfolioLink: string;
}

export async function fetchResumeDraft() {
  return apiRequest<{
    draft: null | {
      id: string;
      resume_data: ResumeDraftPayload;
      generated_resume?: unknown;
      updated_at: string;
    };
    purchase?: ResumePurchase | null;
  }>("/api/resume-builder/draft");
}

export async function saveResumeDraft(payload: ResumeDraftPayload) {
  return apiRequest<{ draft: { id: string; resume_data: ResumeDraftPayload; updated_at: string } }>("/api/resume-builder/draft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateResume(payload: ResumeDraftPayload) {
  return apiRequest<{ generatedResume: unknown; draft?: { id: string; resume_data: ResumeDraftPayload; updated_at: string }; draftId?: string; resumeId?: string }>("/api/resume-builder/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function enhanceResumeExperience(payload: { text: string; jobTitle?: string }) {
  return apiRequest<{ enhancedText: string }>("/api/resume-builder/enhance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchResumeKeywordSuggestions(payload: { jobTitle?: string; skills: string[] }) {
  return apiRequest<{ keywords: string[] }>("/api/resume-builder/keywords", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ResumeAiAction = "summary" | "enhance_bullets" | "keywords" | "skills";

export interface ResumeAiData {
  professionalSummary: string;
  enhancedBullets: string[];
  suggestedKeywords: string[];
  suggestedSkills: string[];
}

export async function requestResumeAI(payload: {
  action: ResumeAiAction;
  resumeData: Record<string, unknown>;
  targetRole: string;
  jobDescription?: string;
}) {
  return apiRequest<{ success: true; data: ResumeAiData }>("/api/ai/resume", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ResumePurchase {
  id: string;
  resumeDraftId: string;
  amount: number;
  adminFee: number;
  total: number;
  status: "pending" | "paid" | "failed";
  packageId: "pdf" | "pdf-html" | "all";
  formats: Array<"pdf" | "html">;
  paymentMethod: string;
  paymentReference: string;
  paymentInstructions: string[];
  paymentProvider: string;
  checkoutUrl: string;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export async function createResumeCheckout(payload: { draftId: string; resumeId?: string; packageId: "pdf" | "pdf-html" | "all"; paymentMethod: string }) {
  return apiRequest<{ purchase: ResumePurchase; message: string }>("/api/resume-builder/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchResumePaymentStatus(purchaseId: string) {
  return apiRequest<{ purchase: ResumePurchase; message: string }>(`/api/resume-builder/payment-status/${encodeURIComponent(purchaseId)}`);
}

export async function simulateResumePaymentSuccess(purchaseId: string) {
  return apiRequest<{ purchase: ResumePurchase; message: string }>(`/api/resume-builder/simulate-payment-success/${encodeURIComponent(purchaseId)}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function downloadResumeExport(purchaseId: string, format: "pdf" | "html") {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/resume-builder/download/${encodeURIComponent(purchaseId)}?format=${encodeURIComponent(format)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    try {
      const payload = JSON.parse(text);
      throw new Error(payload.error || "Download resume gagal.");
    } catch (error) {
      if (error instanceof Error && error.message !== text) throw error;
      throw new Error(text || "Download resume gagal.");
    }
  }
  return text;
}

export interface ProfileExperience {
  id: string;
  role: string;
  company: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface ProfileEducation {
  id: string;
  school: string;
  degree: string;
  period?: string;
}

export interface ProfileCertification {
  id: string;
  name: string;
  issuer: string;
}

export interface ProfileCvFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType?: string;
  downloadUrl?: string;
  source: "supabase-storage" | "local-metadata";
  createdAt: string;
}

export interface UserProfileSettings {
  language: string;
  region: string;
  emailNotifications: boolean;
  productNotifications: boolean;
  paymentMethods: Array<{
    id: string;
    label: string;
    detail: string;
    primary?: boolean;
  }>;
}

export interface UserProfilePayload {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    company?: string;
  };
  details: {
    title: string;
    location: string;
    phone: string;
    website: string;
    about: string;
  };
  experiences: ProfileExperience[];
  educations: ProfileEducation[];
  certifications: ProfileCertification[];
  skills: string[];
  cvFiles: ProfileCvFile[];
  settings: UserProfileSettings;
}

export async function fetchUserProfile() {
  return apiRequest<{ profile: UserProfilePayload }>("/api/profile");
}

export async function updateUserProfile(payload: Partial<UserProfilePayload>) {
  return apiRequest<{ profile: UserProfilePayload }>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function saveCvMetadata(payload: {
  fileName: string;
  fileSize: number;
  fileType?: string;
  downloadUrl?: string;
}) {
  return apiRequest<{ cvFile: ProfileCvFile }>("/api/profile/cv", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteCvMetadata(id: string) {
  return apiRequest<{ ok: boolean }>(`/api/profile/cv?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function fetchUserSettings() {
  return apiRequest<{ settings: UserProfileSettings; user: UserProfilePayload["user"] }>("/api/settings");
}

export async function updateUserSettings(payload: Partial<UserProfileSettings>) {
  return apiRequest<{ settings: UserProfileSettings }>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface SellerProfilePayload {
  basic: {
    photoUrl: string;
    fullName: string;
    tagline: string;
    bio: string;
  };
  specializations: string[];
  experiences: Array<{ id: string; position: string; company: string; startDate: string; endDate: string; description: string }>;
  certificates: Array<{ id: string; name: string; issuer: string; year: string }>;
  portfolios: Array<{ id: string; title: string; description: string; link: string }>;
}

export interface RecruiterProfilePayload {
  company: {
    logoUrl: string;
    companyName: string;
    industry: string;
    companySize: string;
    companyEmail: string;
    phone: string;
    website: string;
    about: string;
  };
  benefits: string[];
  locations: Array<{ id: string; name: string; address: string; city: string; officeType: "Head Office" | "Branch Office" }>;
  teamMembers: Array<{ id: string; name: string; position: string; email: string }>;
}

export async function fetchSellerProfile() {
  return apiRequest<{ profile: SellerProfilePayload }>("/api/seller/profile");
}

export async function updateSellerProfile(payload: SellerProfilePayload) {
  return apiRequest<{ profile: SellerProfilePayload }>("/api/seller/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchRecruiterProfile() {
  return apiRequest<{ profile: RecruiterProfilePayload }>("/api/recruiter/profile");
}

export async function updateRecruiterProfile(payload: RecruiterProfilePayload) {
  return apiRequest<{ profile: RecruiterProfilePayload }>("/api/recruiter/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
