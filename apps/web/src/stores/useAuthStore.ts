import { create } from "zustand";

// ============================================================================
// TYPES
// ============================================================================

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  onboardingCompleted: boolean;
  activeCourse: {
    id: string;
    targetLanguage: string;
    nativeLanguage: string;
    level: string;
  } | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  profile: ProfileData | null;
  isLoading: boolean;

  // Actions
  register: (
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<ProfileData | null>;
  initialize: () => Promise<void>;
}

// ============================================================================
// HELPERS
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getStoredToken(): string | null {
  return localStorage.getItem("lingoloop_token");
}

function setStoredToken(token: string) {
  localStorage.setItem("lingoloop_token", token);
}

function clearStoredToken() {
  localStorage.removeItem("lingoloop_token");
}

// ============================================================================
// STORE
// ============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: null,
  profile: null,
  isLoading: true,

  register: async (email, password, name) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Registration failed");
    }

    const json = await res.json();
    // Backend wraps in { success, data: { accessToken, user } }
    const payload = json.data ?? json;
    setStoredToken(payload.accessToken);
    set({ token: payload.accessToken, user: payload.user });
  },

  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Login failed");
    }

    const json = await res.json();
    // Backend wraps in { success, data: { accessToken, user } }
    const payload = json.data ?? json;
    setStoredToken(payload.accessToken);
    set({ token: payload.accessToken, user: payload.user });
  },

  logout: () => {
    clearStoredToken();
    set({ token: null, user: null, profile: null });
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return null;

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // Token is invalid — clear it
      clearStoredToken();
      set({ token: null, user: null, profile: null });
      return null;
    }

    const json = await res.json();
    // Backend wraps in { success, data: { ...profile } }
    const profile: ProfileData = json.data ?? json;
    set({
      profile,
      user: { id: profile.id, email: profile.email, name: profile.name },
    });
    return profile;
  },

  initialize: async () => {
    const { token, fetchProfile } = get();
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      await fetchProfile();
    } catch {
      clearStoredToken();
      set({ token: null, user: null, profile: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));

// ============================================================================
// SELECTOR HOOKS
// ============================================================================

export const useIsAuthenticated = () =>
  useAuthStore((s) => !!s.token);

export const useAuthUser = () =>
  useAuthStore((s) => s.user);

export const useAuthProfile = () =>
  useAuthStore((s) => s.profile);

export const useAuthToken = () =>
  useAuthStore((s) => s.token);

