"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { httpAdapter as api } from "@/lib/api/httpAdapter";
import { useAuth } from "@/lib/context/AuthContext";
import { currentScopedKey, CACHE_BASE } from "@/lib/storage/appCache";
import type { EmployerGoal } from "@/lib/candidates/types";
import type { ContextStatus } from "@/lib/types/contextStatus";

interface EmployerContextValue {
  goal: EmployerGoal;
  isHydrated: boolean;
  status: ContextStatus;
  error: string | null;
  hasCompletedOnboarding: boolean;
  setGoal: (updates: Partial<EmployerGoal>) => void;
  resetGoal: () => void;
  completeOnboarding: () => void;
}

const initialGoal: EmployerGoal = {
  talentType: "",
  role: "",
  priorities: [],
  locationPreference: "",
};

const EmployerContext = createContext<EmployerContextValue | undefined>(
  undefined,
);


export function EmployerProvider({ children }: { children: ReactNode }) {
  const [goal, setGoalState] = useState<EmployerGoal>(initialGoal);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Auth-keyed hydration: re-runs on login/logout so a fresh sign-in
  // gets data without a manual reload (providers mount at the root).
  const { user, status: authStatus } = useAuth();
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  const pendingRef = useRef<Partial<EmployerGoal> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!userId || userRole !== "employer") {
      // Signed out (or candidate side) — nothing to fetch, clean slate.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auth-keyed reset
      setGoalState(initialGoal);
      setHasCompletedOnboarding(false);
      setStatus("idle");
      setError(null);
      setIsHydrated(true);
      return;
    }
     
    setStatus("loading");
    try {
      const cached = localStorage.getItem(currentScopedKey(CACHE_BASE.employerGoal));
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<EmployerGoal>;
        setGoalState({ ...initialGoal, ...parsed });
      }
      if (localStorage.getItem(currentScopedKey(CACHE_BASE.employerOnboarded)) === "1") {
        setHasCompletedOnboarding(true);
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await api.getEmployerProfile();
        if (cancelled) return;
        if (!result.ok) {
          // 401/403 is fine for a candidate user — silent fallback.
          setStatus("error");
          setError(result.error.message);
          setIsHydrated(true);
          return;
        }
        setGoalState(result.data.goal);
        setHasCompletedOnboarding(result.data.hasCompletedOnboarding);
        try {
          localStorage.setItem(currentScopedKey(CACHE_BASE.employerGoal), JSON.stringify(result.data.goal));
          localStorage.setItem(
            currentScopedKey(CACHE_BASE.employerOnboarded),
            result.data.hasCompletedOnboarding ? "1" : "0",
          );
        } catch {
          /* ignore */
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load employer goal.",
        );
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, userId, userRole]);

  const flushPatch = useCallback(async () => {
    const patch = pendingRef.current;
    pendingRef.current = null;
    if (!patch || Object.keys(patch).length === 0) return;
    try {
      const result = await api.patchEmployerGoal(patch);
      if (!result.ok) {
        setStatus("error");
        setError(result.error.message);
        return;
      }
      setError(null);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Couldn't save your hiring goal.",
      );
    }
  }, []);

  const setGoal = useCallback(
    (updates: Partial<EmployerGoal>) => {
      setGoalState((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(currentScopedKey(CACHE_BASE.employerGoal), JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      pendingRef.current = { ...(pendingRef.current ?? {}), ...updates };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushPatch, 300);
    },
    [flushPatch],
  );

  const resetGoal = useCallback(() => {
    setGoalState(initialGoal);
    setHasCompletedOnboarding(false);
    pendingRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(currentScopedKey(CACHE_BASE.employerGoal));
      localStorage.removeItem(currentScopedKey(CACHE_BASE.employerOnboarded));
    } catch {
      /* ignore */
    }
    // Server reset is implicit on logout; we don't actively wipe
    // employer rows here.
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.employerOnboarded), "1");
    } catch {
      /* ignore */
    }
    void (async () => {
      try {
        await api.completeEmployerOnboarding();
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const value = useMemo<EmployerContextValue>(
    () => ({
      goal,
      isHydrated,
      status,
      error,
      hasCompletedOnboarding,
      setGoal,
      resetGoal,
      completeOnboarding,
    }),
    [
      goal,
      isHydrated,
      status,
      error,
      hasCompletedOnboarding,
      setGoal,
      resetGoal,
      completeOnboarding,
    ],
  );

  return (
    <EmployerContext.Provider value={value}>
      {children}
    </EmployerContext.Provider>
  );
}

export function useEmployer() {
  const ctx = useContext(EmployerContext);
  if (!ctx) throw new Error("useEmployer must be used inside EmployerProvider");
  return ctx;
}
