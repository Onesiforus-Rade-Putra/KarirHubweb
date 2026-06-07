export type UserRole = "seeker" | "seller" | "recruiter";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: "Full-time" | "Part-time" | "Remote" | "Contract" | "Internship";
  salaryMin: number;
  salaryMax: number;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  category: string;
  applicantsCount: number;
  status: "aktif" | "draft" | "ditutup";
}

export interface Candidate {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  experienceYears: number;
  education: string;
  expectedSalary: number;
  skills: string[];
  status: "Tersedia" | "Tidak Tersedia";
  bio: string;
  savedByRecruiter: boolean;
  email: string;
}

export interface CareerService {
  id: string;
  title: string;
  providerName: string;
  providerAvatar: string;
  category: "cv-review" | "mock-interview" | "consulting";
  rating: number;
  reviewsCount: number;
  price: number;
  duration: string;
  description: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  itemTitle: string;
  category: "service" | "premium";
  price: number;
  date: string;
  status: "Berhasil" | "Pending" | "Gagal";
  paymentMethod?: string;
  vaNumber?: string;
}

export interface ServiceOrder {
  id: string;
  buyerName: string;
  buyerEmail: string;
  serviceTitle: string;
  servicePrice: number;
  date: string;
  status: "Baru" | "Sedang Diproses" | "Selesai" | "Dibatalkan";
  requirements?: string;
  resultUrl?: string; // e.g. review file or message
}

export interface ConsultationSession {
  id: string;
  clientName: string;
  serviceTitle: string;
  date: string;
  timeSlot: string;
  status: "Mendatang" | "Selesai" | "Dibatalkan" | "Rescheduled";
  meetingUrl: string;
}

export interface Applicant {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateTitle: string;
  candidateEmail: string;
  candidateRating: number;
  candidateExperience: number;
  status: "Baru" | "Shortlisted" | "Interview" | "Diterima" | "Ditolak";
  appliedDate: string;
  resumeSummary: string;
}

export interface ResumeData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  summary: string;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: string[];
  template: "modern" | "corporate" | "minimalist";
}
