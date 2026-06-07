export const allowedRoles = ["seeker", "seller", "recruiter"] as const;

export type UserRole = (typeof allowedRoles)[number];

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.APP_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function applyCors(req: any, res: any) {
  const origin = req.headers.origin;
  const isAllowed = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  res.setHeader("Access-Control-Allow-Origin", isAllowed ? origin || "*" : allowedOrigins[0]);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}

export function sendJson(res: any, status: number, body: unknown) {
  res.status(status).json(body);
}

export function sendError(res: any, status: number, message: string, details?: unknown) {
  sendJson(res, status, { error: message, details });
}

export function parseRole(value: unknown): UserRole | null {
  if (typeof value !== "string") {
    return null;
  }

  return allowedRoles.includes(value as UserRole) ? (value as UserRole) : null;
}

export function getBearerToken(req: any) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireUser(req: any, supabaseAdmin: any) {
  const token = getBearerToken(req);

  if (!token) {
    return { user: null, error: "Bearer token wajib dikirim." };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: error?.message || "Session tidak valid." };
  }

  return { user: data.user, error: null };
}
