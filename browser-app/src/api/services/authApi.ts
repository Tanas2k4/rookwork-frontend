import type {
  LoginRequest,
  AuthRegister,
  AuthResponse,
  GoogleLoginRequest,
  RegisterResponse,
} from "../contracts/auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = "";
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        errorMessage = parsed.message || parsed.error || "";
      }
    } catch {
      // not JSON
    }
    throw new Error(errorMessage || text || `Request failed: ${res.status}`);
  }

  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const authApi = {
  login: (data: LoginRequest) => post<AuthResponse>("/api/auth/login", data),

  register: (data: AuthRegister) =>
    post<RegisterResponse>("/api/auth/register", data),

  verifyOtp: (email: string, otp: string, invitationId?: string) =>
    post<AuthResponse>("/api/auth/verify-otp", { email, otp, invitationId }),

  resendOtp: (email: string) =>
    post<{ message: string }>(`/api/auth/resend-otp?email=${encodeURIComponent(email)}`, {}),

  refresh: (refreshToken: string) =>
    post<AuthResponse>("/api/auth/refresh", { refreshToken }),

  googleLogin: (data: GoogleLoginRequest) =>
    post<AuthResponse>("/api/auth/google", data),

  checkEmail: (email: string) =>
    get<boolean>(`/api/auth/check-email?email=${encodeURIComponent(email)}`),
};
