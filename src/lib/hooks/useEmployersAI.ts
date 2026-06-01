"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { scopedCacheKey, CACHE_BASE } from "@/lib/storage/appCache";
import type { ContextStatus } from "@/lib/types/contextStatus";

export interface EmployersAIData {
  companyType: string;
  industries: string[];
  teamFocus: string[];
  hiringReasons: string[];
  hiringTimeline: string;
  targetRoles: string[];
  futureRoleDirections: string[];
  candidateGreenFlags: string[];
  requiredSkills: string[];
  trainableSkills: string[];
  strongFitTypes: string[];
  workArrangement: string;
  hiringLocation: string;
  hiringIntentSummary: string | null;
  futurePathSummary: string | null;
  bestCandidateTypeSummary: string | null;
  onboardingCompleted: boolean;
}

/**
 * Read-only hook for the signed-in employer's `EmployersAI` row.
 * Used by the marketplace personalization card. Returns null while
 * loading or for non-employer users.
 */
export function useEmployersAI(): {
  data: EmployersAIData | null;
  status: ContextStatus;
  error: string | null;
} {
  const { user, status: authStatus } = useAuth();
  const [data, setData] = useState<EmployersAIData | null>(null);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!user || user.role !== "employer") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Guard reset for non-employer users.
      setData(null);
      setStatus("idle");
      return;
    }

    try {
      const cached = localStorage.getItem(scopedCacheKey(CACHE_BASE.employersAI, user));
      if (cached) setData(JSON.parse(cached) as EmployersAIData);
    } catch {
      /* ignore */
    }
    setStatus("loading");

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/employer/onboarding-data", {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: EmployersAIData; error?: { message?: string } }
          | null;
        if (cancelled) return;
        if (!body?.ok || !body.data) {
          setStatus("error");
          setError(body?.error?.message ?? `HTTP ${res.status}`);
          return;
        }
        setData(body.data);
        try {
          localStorage.setItem(scopedCacheKey(CACHE_BASE.employersAI, user), JSON.stringify(body.data));
        } catch {
          /* ignore */
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load employer data.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, user]);

  return { data, status, error };
}
