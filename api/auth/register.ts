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

  const { name, email, password, role, company } = req.body || {};
  const userRole = parseRole(role);

  if (!name || !email || !password || !userRole) {
    return sendError(res, 400, "Nama, email, password, dan role wajib diisi.");
  }

  if (password.length < 8) {
    return sendError(res, 400, "Password minimal harus 8 karakter.");
  }

  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      role: userRole,
    },
  });

  if (createError || !authData.user) {
    return sendError(res, 400, createError?.message || "Gagal membuat user.");
  }

  const avatarSeed = encodeURIComponent(email);
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .insert({
      id: authData.user.id,
      full_name: name,
      role: userRole,
      avatar_url: avatarUrl,
      company: userRole === "recruiter" ? company || null : null,
    })
    .select("id, full_name, role, avatar_url, company")
    .single();

  if (profileError || !profile) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return sendError(res, 500, profileError?.message || "Gagal menyimpan profil user.");
  }

  const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (sessionError || !sessionData.session) {
    return sendError(res, 500, sessionError?.message || "User dibuat, tetapi session login gagal dibuat.");
  }

  return sendJson(res, 201, {
    user: publicUser(profile, email),
    session: {
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresAt: sessionData.session.expires_at,
    },
  });
}
