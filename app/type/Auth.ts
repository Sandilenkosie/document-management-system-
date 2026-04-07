export type UserRole = "USER" | "REVIEWER" | "MANAGER" | "ADMIN";

export interface RegisterRequestPayload {
  id?: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface RegisterResponsePayload {
  id?: string;
  email: string;
  role?: UserRole;
}

export interface LoginRequestPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponsePayload {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface SendVerificationEmailPayload {
  email: string;
}

export interface SendVerificationEmailResponsePayload {
  message: string;
  success: boolean;
}
