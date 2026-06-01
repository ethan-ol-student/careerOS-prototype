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
import { getApiAdapter } from "@/lib/api";
import { currentScopedKey, CACHE_BASE } from "@/lib/storage/appCache";
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
  /** Lifecycle status — see `ContextStatus`. */
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

// Per-user paint cache. `currentScopedKey` namespaces the key by the
// authenticated user+role so accounts never share cached data; the API
// stays the source of truth on conflict.

export function IntentProvider({ children }: { children: ReactNode }) {
  const [intent, setIntentState] = useState<Intent>(initialIntent);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Debounce concurrent writes so the user typing into onboarding
  // doesn't fire one PATCH per keystroke.
  const pendingPatchRef = useRef<Partial<Intent> | null>(null);
  const patchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initial load: cache → API ────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");

    // 1. Quick paint from local cache (best-effort, never authoritative).
    try {
      const cached = localStorage.getItem(currentScopedKey(CACHE_BASE.intent));
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<Intent>;
        setIntentState({ ...initialIntent, ...parsed });
      }
    } catch {
      // ignore cache errors
    }

    // 2. Authoritative fetch.
    let cancelled = false;
    (async () => {
      try {
        const api = await getApiAdapter();
        const result = await api.getCandidateProfile();
        if (cancelled) return;
        if (!result.ok) {
          setStatus("error");
          setError(result.error.message);
          setIsHydrated(true);
          return;
        }
        setIntentState(result.data.intent);
        try {
          localStorage.setItem(currentScopedKey(CACHE_BASE.intent), JSON.stringify(result.data.intent));
        } catch {
          /* ignore quota */
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load intent.",
        );
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Debounced patch flusher ──────────────────────────────────
  const flushPatch = useCallback(async () => {
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = null;
    if (!patch || Object.keys(patch).length === 0) return;
    try {
      const api = await getApiAdapter();
      const result = await api.patchIntent(patch);
      if (!result.ok) {
        setStatus("error");
        setError(result.error.message);
      }
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Failed to save intent.",
      );
    }
  }, []);

  const setIntent = useCallback(
    (updates: Partial<Intent>) => {
      // 1. Optimistic local update.
      setIntentState((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(currentScopedKey(CACHE_BASE.intent), JSON.stringify(next));
        } catch {
          /* ignore quota */
        }
        return next;
      });

      // 2. Schedule a debounced server patch. Strip `role` — which
      // side of the marketplace the user belongs to is a frontend
      // concept; the profile table they write to already implies it.
      const serverPatch: Partial<Intent> = { ...updates };
      delete serverPatch.role;
      pendingPatchRef.current = {
        ...(pendingPatchRef.current ?? {}),
        ...serverPatch,
      };
      if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
      patchTimerRef.current = setTimeout(flushPatch, 300);
    },
    [flushPatch],
  );

  const resetIntent = useCallback(() => {
    setIntentState(initialIntent);
    pendingPatchRef.current = null;
    if (patchTimerRef.current) clearTimeout(patchTimerRef.current);
    try {
      localStorage.removeItem(currentScopedKey(CACHE_BASE.intent));
    } catch {
      /* ignore */
    }
    // Server-side reset arrives with the auth phase — for now we
    // just clear the local cache so the next page load re-fetches
    // a fresh row.
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
