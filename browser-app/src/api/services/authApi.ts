import type {
  LoginRequest,
  AuthRegister,
  AuthResponse,
  GoogleLoginRequest,
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

export const authApi = {
  login: (data: LoginRequest) => post<AuthResponse>("/api/auth/login", data),

  register: (data: AuthRegister) =>
    post<AuthResponse>("/api/auth/register", data),

  refresh: (refreshToken: string) =>
    post<AuthResponse>("/api/auth/refresh", { refreshToken }),

  googleLogin: (data: GoogleLoginRequest) =>
    post<AuthResponse>("/api/auth/google", data),
};
