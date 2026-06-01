"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { scopedCacheKey, CACHE_BASE } from "@/lib/storage/appCache";
import type { ContextStatus } from "@/lib/types/contextStatus";

/**
 * Advanced-onboarding personalization payload returned by
 * `GET /api/me/onboarding`. The keys mirror the `CandidatesAI`
 * Prisma model — see `prisma/schema.prisma`.
 */
export interface CandidatesAIData {
  careerStage: string;
  careerStageMeaning: string;
  targetRoles: string[];
  interestedIndustries: string[];
  opportunityTypes: string[];
  locationPreference: string | null;
  availability: string | null;
  currentSkills: string[];
  skillLevels: Record<string, "beginner" | "intermediate" | "expert"> | null;
  projects: string[];
  skillsToImprove: string[];
  weeklyLearningTime: string | null;
  desiredNextMove: string;
  longTermGoal: string | null;
  timeline: string | null;
  careerConfidence: "low" | "medium" | "high" | null;
  mainBlocker: string | null;
  applicationsSent: string | null;
  interviewExperience: string | null;
  rejectionsOrChallenges: string | null;
  resumeConfidence: "low" | "medium" | "high" | null;
  portfolioConfidence: "low" | "medium" | "high" | null;
  interviewConfidence: "low" | "medium" | "high" | null;
  dashboardPersonalizationSummary: string | null;
  onboardingCompleted: boolean;
}


/**
 * Fetches the signed-in candidate's CandidatesAI row. Lightweight,
 * read-only, intended for dashboard personalization. Returns null
 * while loading; consumers should treat null as "no data yet".
 */
export function useCandidatesAI(): {
  data: CandidatesAIData | null;
  status: ContextStatus;
  error: string | null;
} {
  const { user, status: authStatus } = useAuth();
  const [data, setData] = useState<CandidatesAIData | null>(null);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only candidate users have CandidatesAI rows.
    if (authStatus !== "ready") return;
    if (!user || user.role !== "candidate") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Guard reset for non-candidate users; one-time on auth resolution.
      setData(null);
      setStatus("idle");
      return;
    }

    // Cache-first paint, then authoritative fetch.
    try {
      const cached = localStorage.getItem(scopedCacheKey(CACHE_BASE.candidatesAI, user));
      if (cached) setData(JSON.parse(cached) as CandidatesAIData);
    } catch {
      /* ignore */
    }
    setStatus("loading");

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/onboarding", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: CandidatesAIData; error?: { message?: string } }
          | null;
        if (cancelled) return;
        if (!body?.ok || !body.data) {
          setStatus("error");
          setError(body?.error?.message ?? `HTTP ${res.status}`);
          return;
        }
        setData(body.data);
        try {
          localStorage.setItem(scopedCacheKey(CACHE_BASE.candidatesAI, user), JSON.stringify(body.data));
        } catch {
          /* ignore */
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load profile.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, user]);

  return { data, status, error };
}
