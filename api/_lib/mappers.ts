export function mapService(row: any) {
  return {
    id: row.id,
    title: row.title,
    providerName: row.provider_name,
    providerAvatar: row.provider_avatar,
    category: row.category,
    rating: Number(row.rating || 0),
    reviewsCount: row.reviews_count,
    price: row.price,
    duration: row.duration,
    description: row.description,
    active: row.status ? row.status === "active" : row.active,
  };
}

export function mapJob(row: any) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    companyLogo: row.company_logo,
    location: row.location,
    type: row.type,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    description: row.description,
    requirements: row.requirements || [],
    benefits: row.benefits || [],
    postedDate: row.posted_date,
    category: row.category,
    applicantsCount: row.applicants_count,
    status: row.status,
  };
}

export function mapOrder(row: any) {
  return {
    id: row.id,
    serviceId: row.service_id,
    transactionId: row.transactions?.[0]?.id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    serviceTitle: row.service_title,
    servicePrice: row.service_price,
    date: row.created_at?.slice(0, 10),
    status: row.status,
    requirements: row.requirements,
    resultUrl: row.result_url,
  };
}

export function mapSellerOrder(row: any) {
  const serviceTitle = row.service_title || row.services?.title || "";
  return {
    id: row.id,
    serviceId: row.service_id || row.services?.id,
    transactionId: row.transactions?.[0]?.id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    serviceTitle,
    servicePrice: row.service_price,
    price: row.service_price,
    date: row.created_at?.slice(0, 10),
    status: row.status,
    orderStatus: row.order_status,
    requirements: row.requirements,
    sellerNotes: row.seller_notes,
    resultUrl: row.result_url,
  };
}

export function mapTransaction(row: any) {
  return {
    id: row.id,
    itemTitle: row.item_title,
    category: row.category,
    price: row.price,
    date: new Date(row.created_at).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
      timeZoneName: "short",
    }),
    status: row.status,
    paymentMethod: row.payment_method,
    vaNumber: row.va_number,
  };
}

export function mapApplication(row: any) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.jobs?.title || row.job_title || "",
    candidateName: row.candidate_name,
    candidateTitle: row.candidate_title || "",
    candidateEmail: row.candidate_email,
    candidateRating: Number(row.candidate_rating || 0),
    candidateExperience: row.candidate_experience || 0,
    status: row.status,
    appliedDate: row.created_at?.slice(0, 10),
    resumeSummary: row.resume_summary || "",
  };
}

export function mapRecruiterApplication(row: any) {
  const statusMap: Record<string, string> = {
    submitted: "Baru",
    reviewed: "Shortlisted",
    interview: "Interview",
    accepted: "Diterima",
    rejected: "Ditolak",
  };

  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.jobs?.title || "",
    candidateName: row.candidate_name,
    candidateTitle: row.candidate_title || row.jobs?.title || "Job Seeker",
    candidateEmail: row.candidate_email,
    candidateRating: Number(row.candidate_rating || 0),
    candidateExperience: row.candidate_experience || 0,
    status: statusMap[row.application_status] || row.status || "Baru",
    appliedDate: row.created_at?.slice(0, 10),
    resumeSummary: row.resume_summary || "",
  };
}

export function mapTalentCandidate(row: any) {
  const name = row.candidate_name || row.user_profiles?.full_name || "Kandidat KarirHub";
  return {
    id: row.user_id || row.id,
    name,
    avatar: row.user_profiles?.avatar_url || "",
    title: row.candidate_title || row.jobs?.title || "Job Seeker",
    rating: Number(row.candidate_rating || 4.5),
    experienceYears: row.candidate_experience || 0,
    education: "Data dari lamaran KarirHub",
    expectedSalary: 0,
    skills: row.resume_summary ? row.resume_summary.split(/[,.]/).slice(0, 4).map((item: string) => item.trim()).filter(Boolean) : ["KarirHub Applicant"],
    status: "Tersedia",
    bio: row.resume_summary || "Kandidat pernah melamar lowongan recruiter.",
    savedByRecruiter: false,
    email: row.candidate_email || "",
  };
}
