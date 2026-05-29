const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: "Healthcare Professional" | "Administrator" | "Public Health Society";
  organization?: string;
  phone_number?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserPublic {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization?: string;
  phone_number?: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || "Something went wrong");
  }
  return json as T;
}

export async function signup(data: SignupRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<TokenResponse>(res);
  localStorage.setItem("auth_token", result.access_token);
  localStorage.setItem("auth_user", JSON.stringify(result.user));
  return result;
}

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<TokenResponse>(res);
  localStorage.setItem("auth_token", result.access_token);
  localStorage.setItem("auth_user", JSON.stringify(result.user));
  return result;
}

export async function getMe(): Promise<UserPublic> {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("No token found");
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    logout();
    throw new Error("Session expired. Please log in again.");
  }
  return handleResponse<UserPublic>(res);
}

export function logout(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("auth_token");
}

export function getStoredUser(): UserPublic | null {
  try {
    const user = localStorage.getItem("auth_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}