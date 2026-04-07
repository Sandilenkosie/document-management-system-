import { create } from "zustand";
import type {
  RegisterRequestPayload,
  RegisterResponsePayload,
  LoginRequestPayload,
  LoginResponsePayload,
} from "../type/Auth";
import { apiClient } from "../api/client";

const AUTH_TOKEN_KEY = "authToken";
const AUTH_REMEMBER_KEY = "authRememberMe";
const AUTH_ACTIVITY_KEY = "lastActivityAt";

function getStoredToken(): string | null {
  const rememberFlag = localStorage.getItem(AUTH_REMEMBER_KEY);

  if (rememberFlag === "true") {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  if (rememberFlag === "false") {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
  }

  // Backward compatibility for older sessions before remember-me was added.
  const legacyLocalToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (legacyLocalToken) {
    localStorage.setItem(AUTH_REMEMBER_KEY, "true");
    return legacyLocalToken;
  }

  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

interface AuthState {
  user: RegisterResponsePayload | LoginResponsePayload["user"] | null;
  token: string | null;
  isAuthInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  register: (payload: RegisterRequestPayload) => Promise<void>;
  login: (payload: LoginRequestPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthInitialized: false,
  isLoading: false,
  error: null,

  register: async (payload: RegisterRequestPayload) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.register({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: payload.role,
      });

      // Store token
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      localStorage.setItem(AUTH_REMEMBER_KEY, "true");
      localStorage.setItem(AUTH_ACTIVITY_KEY, Date.now().toString());
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      apiClient.setToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isAuthInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      set({
        error: message,
        isLoading: false,
      });
      throw new Error(message);
    }
  },

  login: async (payload: LoginRequestPayload) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.login(payload);

      // Persist token based on remember-me preference.
      const rememberMe = Boolean(payload.rememberMe);
      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        localStorage.setItem(AUTH_REMEMBER_KEY, "true");
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
      } else {
        sessionStorage.setItem(AUTH_TOKEN_KEY, response.token);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.setItem(AUTH_REMEMBER_KEY, "false");
      }
      localStorage.setItem(AUTH_ACTIVITY_KEY, Date.now().toString());
      apiClient.setToken(response.token);

      set({
        user: response.user,
        token: response.token,
        isAuthInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      set({
        error: message,
        isLoading: false,
      });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    localStorage.removeItem(AUTH_ACTIVITY_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    apiClient.setToken("");
    set({
      user: null,
      token: null,
      isAuthInitialized: true,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },

  initializeAuth: async () => {
    try {
      const token = getStoredToken();

      if (token) {
        apiClient.setToken(token);
        const response = await apiClient.getCurrentUser();
        localStorage.setItem(AUTH_ACTIVITY_KEY, Date.now().toString());
        set({
          user: response.user,
          token,
          isAuthInitialized: true,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthInitialized: true,
        });
      }
    } catch (error) {
      // Token is invalid, clear it
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_REMEMBER_KEY);
      localStorage.removeItem(AUTH_ACTIVITY_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      apiClient.setToken("");
      set({
        user: null,
        token: null,
        isAuthInitialized: true,
      });
    }
  },
}));

export default useAuthStore;
