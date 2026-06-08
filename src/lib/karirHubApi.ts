import { Applicant, Candidate, CareerService, Job, ResumeData, ServiceOrder, Transaction } from "../types";
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
    throw new Error(payload.error || "Permintaan ke server gagal.");
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

export interface SellerEarningsSummary {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  gross_revenue: number;
  estimated_net_revenue: number;
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

export async function fetchSellerEarnings() {
  return apiRequest<{ earnings: SellerEarningsSummary }>("/api/seller/earnings");
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
  }>("/api/resume-builder/draft");
}

export async function saveResumeDraft(payload: ResumeDraftPayload) {
  return apiRequest<{ draft: { id: string; resume_data: ResumeDraftPayload; updated_at: string } }>("/api/resume-builder/draft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateResume(payload: ResumeDraftPayload) {
  return apiRequest<{ generatedResume: unknown; draft: { id: string; resume_data: ResumeDraftPayload; updated_at: string } }>("/api/resume-builder/generate", {
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
