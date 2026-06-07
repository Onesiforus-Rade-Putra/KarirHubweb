import { applyCors, parseRole, sendError, sendJson } from "../_lib/http";
import { supabaseAdmin, supabaseAnon } from "../_lib/supabase";

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

  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed");
  }

  const { email, password, role } = req.body || {};
  const selectedRole = role ? parseRole(role) : null;

  if (!email || !password) {
    return sendError(res, 400, "Email dan password wajib diisi.");
  }

  if (role && !selectedRole) {
    return sendError(res, 400, "Role tidak valid.");
  }

  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user || !authData.session) {
    return sendError(res, 401, authError?.message || "Email atau password salah.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    return sendError(res, 404, profileError?.message || "Profil user belum tersedia.");
  }

  if (selectedRole && profile.role !== selectedRole) {
    return sendError(res, 403, "Role akun tidak sesuai dengan pilihan login.");
  }

  return sendJson(res, 200, {
    user: publicUser(profile, authData.user.email || email),
    session: {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: authData.session.expires_at,
    },
  });
}
