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
import type { EmployerGoal } from "@/lib/candidates/types";
import type { ContextStatus } from "@/lib/types/contextStatus";

interface EmployerContextValue {
  goal: EmployerGoal;
  isHydrated: boolean;
  /** Lifecycle status — see `ContextStatus`. */
  status: ContextStatus;
  /** Optional human-readable error message when `status === "error"`. */
  error: string | null;
  /** True after the employer has completed onboarding at least once. */
  hasCompletedOnboarding: boolean;
  setGoal: (updates: Partial<EmployerGoal>) => void;
  resetGoal: () => void;
  /** Mark onboarding as completed (called at end of analyzing flow). */
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

const STORAGE_KEY = "career-os-employer-goal";
const COMPLETED_KEY = "career-os-employer-onboarded";

export function EmployerProvider({ children }: { children: ReactNode }) {
  const [goal, setGoalState] = useState<EmployerGoal>(initialGoal);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Hydrate once on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<EmployerGoal>;
        setGoalState({ ...initialGoal, ...parsed });
      }
      const completed = localStorage.getItem(COMPLETED_KEY);
      if (completed === "1") setHasCompletedOnboarding(true);
      setStatus("ready");
    } catch (err) {
      console.warn("Employer goal hydration failed:", err);
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Employer goal hydration failed",
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
    } catch (err) {
      console.warn("Employer goal save failed:", err);
    }
  }, [goal, isHydrated]);

  const setGoal = useCallback((updates: Partial<EmployerGoal>) => {
    setGoalState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetGoal = useCallback(() => {
    setGoalState(initialGoal);
    setHasCompletedOnboarding(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COMPLETED_KEY);
    } catch (err) {
      console.warn("Employer goal reset failed:", err);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    try {
      localStorage.setItem(COMPLETED_KEY, "1");
    } catch (err) {
      console.warn("Employer onboarding flag save failed:", err);
    }
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
  if (!ctx)
    throw new Error("useEmployer must be used inside EmployerProvider");
  return ctx;
}
