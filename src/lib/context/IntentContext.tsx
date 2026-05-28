"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode,
} from "react";
import type { ContextStatus } from "@/lib/types/contextStatus";

/**
 * Role distinguishes which side of the marketplace the current
 * intent belongs to. Most candidate-side surfaces check for the
 * strict equality `intent.role === "candidate"`; the employer side
 * has a parallel shell + context (`EmployerContext`) and is
 * recognized here so that shared navigation/context logic can avoid
 * mixing the two flows.
 */
export type Role = "candidate" | "employer" | null;

export interface Intent {
  role: Role;
  stage: string;
  goals: string[];
  name: string;
  field: string;
  /** Target job title the user is aiming for. Required after onboarding. */
  targetJob: string;
}

const initialIntent: Intent = {
  role: null,
  stage: "",
  goals: [],
  name: "",
  field: "",
  targetJob: "",
};

interface IntentContextValue {
  intent: Intent;
  isHydrated: boolean;
  /** Lifecycle status — see `ContextStatus`. Local-only today, but
   * shaped so a real API can fill in `loading`/`error` later. */
  status: ContextStatus;
  /** Optional human-readable error message when `status === "error"`. */
  error: string | null;
  setIntent: (updates: Partial<Intent>) => void;
  resetIntent: () => void;
  /** True when the current intent is a candidate. */
  isCandidate: boolean;
  /** True when the current intent is an employer. */
  isEmployer: boolean;
}

const IntentContext = createContext<IntentContextValue | undefined>(undefined);
const STORAGE_KEY = "career-os-intent";

export function IntentProvider({ children }: { children: ReactNode }) {
  const [intent, setIntentState] = useState<Intent>(initialIntent);
  const [isHydrated, setIsHydrated] = useState(false);
  // `status` mirrors what a future API-backed provider will surface.
  // While we're localStorage-only it transitions `idle → loading →
  // ready` during the mount hydration. `error` stays null unless the
  // adapter explicitly sets it.
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Intent>;
        setIntentState({ ...initialIntent, ...parsed });
      }
      setStatus("ready");
    } catch (err) {
      console.warn("Intent hydration failed:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Intent hydration failed");
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    } catch (err) {
      console.warn("Intent save failed:", err);
    }
  }, [intent, isHydrated]);

  const setIntent = useCallback((updates: Partial<Intent>) => {
    setIntentState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetIntent = useCallback(() => {
    setIntentState(initialIntent);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn("Intent reset failed:", err);
    }
  }, []);

  const value = useMemo<IntentContextValue>(
    () => ({
      intent,
      isHydrated,
      status,
      error,
      setIntent,
      resetIntent,
      isCandidate: intent.role === "candidate",
      isEmployer: intent.role === "employer",
    }),
    [intent, isHydrated, status, error, setIntent, resetIntent],
  );

  return (
    <IntentContext.Provider value={value}>
      {children}
    </IntentContext.Provider>
  );
}

export function useIntent() {
  const context = useContext(IntentContext);
  if (!context) throw new Error("useIntent must be used inside IntentProvider");
  return context;
}
