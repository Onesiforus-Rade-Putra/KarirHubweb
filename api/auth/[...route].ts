import { applyCors, parseRole, requireUser, sendError, sendJson } from "../_lib/http.js";
import { supabaseAdmin, supabaseAnon } from "../_lib/supabase.js";

function routeValueToString(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join("/");
  return typeof value === "string" ? value : "";
}

function normalizeAuthRoute(req: any) {
  const query = req.query || {};
  const routeFromQuery = routeValueToString(query.route || query.slug || query.path || query["0"]).replace(/^\/+/, "");

  let pathname = "/";
  try {
    pathname = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`).pathname;
  } catch {
    pathname = "/";
  }

  if (pathname === "/" || pathname === "/api/auth" || pathname === "/api/auth/") {
    pathname = routeFromQuery ? `/api/auth/${routeFromQuery}` : "/api/auth";
  }

  pathname = pathname.replace(/\/+$/, "");
  return pathname.replace(/^\/api\/auth\/?/, "");
}

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

async function register(req: any, res: any) {
  const { email, password, role, company } = req.body || {};
  const name = req.body?.name || req.body?.fullName || req.body?.full_name;
  const userRole = parseRole(role);

  if (!name || !email || !password || !userRole) {
    return sendError(res, 400, "Nama, email, password, dan role wajib diisi.");
  }

  if (password.length < 6) {
    return sendError(res, 400, "Password minimal 6 karakter.");
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
    const message = createError?.message?.toLowerCase().includes("already")
      ? "Email sudah terdaftar."
      : createError?.message || "Gagal membuat user.";
    return sendError(res, 400, message);
  }

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .upsert({
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

  const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({ email, password });

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

async function login(req: any, res: any) {
  const { email, password, role } = req.body || {};
  const selectedRole = role ? parseRole(role) : null;

  if (!email || !password) return sendError(res, 400, "Email dan password wajib diisi.");
  if (role && !selectedRole) return sendError(res, 400, "Role tidak valid.");

  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (authError || !authData.user || !authData.session) {
    return sendError(res, 401, authError?.message || "Email atau password salah.");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) return sendError(res, 404, profileError?.message || "Profil user belum tersedia.");
  if (selectedRole && profile.role !== selectedRole) return sendError(res, 403, "Role akun tidak sesuai dengan pilihan login.");

  return sendJson(res, 200, {
    user: publicUser(profile, authData.user.email || email),
    session: {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: authData.session.expires_at,
    },
  });
}

async function me(req: any, res: any) {
  const { user, error } = await requireUser(req, supabaseAdmin);
  if (!user) return sendError(res, 401, error || "Session tidak valid.");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, role, avatar_url, company")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return sendError(res, 404, profileError?.message || "Profil user belum tersedia.");
  return sendJson(res, 200, { user: publicUser(profile, user.email || "") });
}

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const route = normalizeAuthRoute(req);

  try {
    if (route === "register" && req.method === "POST") return register(req, res);
    if (route === "login" && req.method === "POST") return login(req, res);
    if (route === "logout" && req.method === "POST") return sendJson(res, 200, { ok: true });
    if (route === "me" && req.method === "GET") return me(req, res);

    return sendError(res, 404, `Endpoint /api/auth/${route} tidak ditemukan.`);
  } catch (error) {
    return sendError(res, 500, "Terjadi kesalahan server.", error instanceof Error ? error.message : error);
  }
}
