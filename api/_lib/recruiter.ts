import { requireUser } from "./http.js";

export async function requireRecruiter(req: any, supabaseAdmin: any) {
  const { user, error } = await requireUser(req, supabaseAdmin);

  if (!user) {
    return { user: null, profile: null, error: error || "Session tidak valid.", status: 401 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, profile: null, error: "Profil user belum tersedia.", status: 404 };
  }

  if (profile.role !== "recruiter") {
    return { user: null, profile, error: "Akses khusus recruiter.", status: 403 };
  }

  return { user, profile, error: null, status: 200 };
}

export function recruiterApplicationStatusToPublic(status: string) {
  if (status === "reviewed") return "Shortlisted";
  if (status === "interview") return "Interview";
  if (status === "accepted") return "Diterima";
  if (status === "rejected") return "Ditolak";
  return "Baru";
}

export function publicApplicantStatusToRecruiter(status: string) {
  if (status === "Shortlisted") return "reviewed";
  if (status === "Interview") return "interview";
  if (status === "Diterima") return "accepted";
  if (status === "Ditolak") return "rejected";
  return "submitted";
}
