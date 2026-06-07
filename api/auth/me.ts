import { applyCors, getBearerToken, sendError, sendJson } from "../_lib/http";
import { supabaseAdmin } from "../_lib/supabase";

function publicUser(profile: any, email: string) {
  return {
    id: profile.id,
    name: profile.full_name,
    email,
    role: profile.role,
    avatar: profile.avatar_url,
    company: profile.company,
  };
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  if (req.method !== "GET") {
    return sendError(res, 405, "Method not allowed");
  }

  const token = getBearerToken(req);

  if (!token) {
    return sendError(res, 401, "Bearer token wajib dikirim.");
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authData.user) {
    return sendError(res, 401, authError?.message || "Session tidak valid.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    return sendError(res, 404, profileError?.message || "Profil user belum tersedia.");
  }

  return sendJson(res, 200, {
    user: publicUser(profile, authData.user.email || ""),
  });
}
