export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthRegister {
  email: string;
  profileName: string;
  password: string;
  invitationId?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface GoogleLoginRequest {
  token: string;
}

export interface RegisterResponse {
  email: string;
  message: string;
}
