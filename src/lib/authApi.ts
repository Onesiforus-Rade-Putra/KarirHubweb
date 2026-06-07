import { UserRole } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_TOKEN_KEY = "karirhub_access_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company?: string;
}

interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface AuthResponse {
  user: AuthUser;
  session?: AuthSession;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Permintaan ke server gagal.");
  }

  return payload as T;
}

export function saveAuthToken(token?: string) {
  if (!token) return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const result = await apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  saveAuthToken(result.session?.accessToken);
  return result;
}

export async function loginUser(payload: {
  email: string;
  password: string;
  role: UserRole;
}) {
  const result = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  saveAuthToken(result.session?.accessToken);
  return result;
}

export async function getCurrentUser() {
  const token = getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const result = await apiRequest<AuthResponse>("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return result.user;
  } catch (error) {
    clearAuthToken();
    throw error;
  }
}
