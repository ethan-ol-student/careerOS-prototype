"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type { AuthRole, AuthUser } from "@/lib/auth/types";
import type { ContextStatus } from "@/lib/types/contextStatus";
import {
  clearAllAppCache,
  reconcileActiveUser,
  setActiveScope,
} from "@/lib/storage/appCache";

interface AuthContextValue {
  user: AuthUser | null;
  candidateOnboardingCompleted: boolean;
  employerOnboardingCompleted: boolean;
  status: ContextStatus;
  error: string | null;
  refresh: () => Promise<void>;
  signup: (payload: SignupInput) => Promise<{ ok: boolean; error?: string }>;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: AuthRole;
  name?: string;
  organizationName?: string;
  careerGoal?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

async function call<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as
      | ApiEnvelope<T>
      | null;
    if (!res.ok || !body) {
      return {
        ok: false,
        error: { message: body?.error?.message ?? `HTTP ${res.status}` },
      };
    }
    return body;
  } catch (err) {
    return {
      ok: false,
      error: {
        message: err instanceof Error ? err.message : "Network error.",
      },
    };
  }
}

interface AuthMeResponse {
  user: AuthUser | null;
  candidateOnboardingCompleted: boolean;
  employerOnboardingCompleted: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [candidateOnboardingCompleted, setCandidateOnb] = useState(false);
  const [employerOnboardingCompleted, setEmployerOnb] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    const result = await call<AuthMeResponse>("/api/auth/me");
    if (!result.ok || !result.data) {
      setUser(null);
      setActiveScope(null);
      setCandidateOnb(false);
      setEmployerOnb(false);
      setStatus("error");
      setError(result.error?.message ?? "Failed to fetch auth state.");
      return;
    }
    // Detect an account switch on this browser and purge stale caches
    // before any provider can paint the previous user's data, then
    // publish the active scope so provider caches are user-scoped.
    if (result.data.user) {
      reconcileActiveUser(result.data.user.id);
    }
    setActiveScope(result.data.user);
    setUser(result.data.user);
    setCandidateOnb(result.data.candidateOnboardingCompleted);
    setEmployerOnb(result.data.employerOnboardingCompleted);
    setError(null);
    setStatus("ready");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time auth bootstrap; refresh() flips status loading→ready.
    void refresh();
  }, [refresh]);

  const signup = useCallback(
    async (payload: SignupInput) => {
      const result = await call<{ user: AuthUser }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!result.ok || !result.data) {
        return { ok: false, error: result.error?.message ?? "Sign up failed." };
      }
      // Hydrate full auth state (incl. onboarding flags) from the
      // server so routing is correct immediately after sign-up — same
      // reasoning as login() below.
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await call<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    if (!result.ok || !result.data) {
      return { ok: false, error: result.error?.message ?? "Login failed." };
    }
    // Hydrate the FULL auth state (user + onboarding flags + cache
    // scope + account-switch purge) from the source of truth before
    // returning. The login response only carries `user`, so without
    // this the onboarding flags stayed stale and the post-login
    // redirect bounced already-onboarded users back into onboarding
    // until a manual reload re-ran refresh(). refresh() performs the
    // reconcile/scope/flag updates itself.
    await refresh();
    return { ok: true };
  }, [refresh]);

  const logout = useCallback(async () => {
    await call("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCandidateOnb(false);
    setEmployerOnb(false);
    // Privacy: clear EVERY app-owned local cache/draft/marker (paint
    // caches, scoped per-user keys, onboarding drafts, milestone
    // overrides, …) so the next user on this browser starts clean.
    // DB records are never touched.
    clearAllAppCache();
    setActiveScope(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      candidateOnboardingCompleted,
      employerOnboardingCompleted,
      status,
      error,
      refresh,
      signup,
      login,
      logout,
    }),
    [
      user,
      candidateOnboardingCompleted,
      employerOnboardingCompleted,
      status,
      error,
      refresh,
      signup,
      login,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
