import { requireUser } from "./http.js";

function sellerRequestInfo(req: any) {
  let pathname = "";
  try {
    pathname = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`).pathname;
  } catch {
    pathname = req.url || "";
  }

  return {
    method: req.method,
    pathname,
    hasAuthorization: Boolean(req.headers.authorization),
  };
}

export async function requireSeller(req: any, supabaseAdmin: any) {
  const { user, error } = await requireUser(req, supabaseAdmin);

  if (!user) {
    console.error("[seller auth error] requireSeller missing/invalid user", {
      ...sellerRequestInfo(req),
      error,
    });
    return { user: null, profile: null, error: error || "Session tidak valid.", status: 401 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[seller auth error] requireSeller failed to read user_profiles", {
      ...sellerRequestInfo(req),
      userId: user.id,
      message: profileError?.message,
      details: profileError?.details,
      hint: profileError?.hint,
      code: profileError?.code,
    });
    return { user: null, profile: null, error: "Profil user belum tersedia.", status: 404 };
  }

  if (profile.role !== "seller") {
    console.error("[seller auth error] requireSeller role mismatch", {
      ...sellerRequestInfo(req),
      userId: user.id,
      role: profile.role,
      expectedRole: "seller",
    });
    return { user: null, profile, error: "Akses khusus seller.", status: 403 };
  }

  return { user, profile, error: null, status: 200 };
}

export function parseServiceCategory(value: unknown) {
  if (value === "cv-review" || value === "mock-interview" || value === "consulting") {
    return value;
  }

  if (typeof value === "string") {
    const text = value.toLowerCase();
    if (text.includes("interview")) return "mock-interview";
    if (text.includes("coach") || text.includes("consult") || text.includes("branding") || text.includes("linkedin")) return "consulting";
  }

  return "cv-review";
}

export function sellerOrderStatusToPublic(status: string) {
  if (status === "accepted" || status === "in_progress") return "Sedang Diproses";
  if (status === "completed") return "Selesai";
  if (status === "cancelled") return "Dibatalkan";
  return "Baru";
}

export function publicOrderStatusToSeller(status: string) {
  if (status === "Sedang Diproses") return "in_progress";
  if (status === "Selesai") return "completed";
  if (status === "Dibatalkan") return "cancelled";
  return "pending";
}
