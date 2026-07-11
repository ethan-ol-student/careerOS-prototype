"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useIntent } from "@/lib/context/IntentContext";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { useCandidatesAI } from "@/lib/hooks/useCandidatesAI";
import { FALLBACK_PHASE, normalizeCareerPhase } from "./phaseConfig";
import type {
  CandidateDashboardData,
  CandidateDashboardPayload,
} from "./types";

/**
 * Resolves the signed-in candidate into a single render-ready
 * dashboard payload.
 *
 * The phase is read from the backend (`CandidatesAI.careerStage` via
 * `useCandidatesAI`, which is the source of truth — local cache only
 * paints first). Auth, intent, and portfolio contexts are composed in
 * so phase widgets get one typed object instead of four hooks.
 *
 * Safety: returns `loading` until auth resolves, never fabricates a
 * phase, and surfaces `needsSetup` when onboarding hasn't run — so the
 * wrapper can route the user to onboarding instead of guessing data.
 */
export function useCandidateDashboard(): CandidateDashboardPayload {
  const { user, candidateOnboardingCompleted, status: authStatus } = useAuth();
  const { intent, status: intentStatus } = useIntent();
  const { portfolio, status: portfolioStatus } = usePortfolio();
  const { data: ai, status: aiStatus, error: aiError } = useCandidatesAI();

  return useMemo<CandidateDashboardPayload>(() => {
    // 1. Wait for auth to settle before deciding anything.
    if (authStatus === "idle" || authStatus === "loading") {
      return { status: "loading", error: null, data: null, needsSetup: false };
    }
    if (authStatus === "error") {
      return {
        status: "error",
        error: "We couldn't verify your session. Please sign in again.",
        data: null,
        needsSetup: false,
      };
    }
    // AppShell already redirects non-candidates; render a calm loading
    // state here rather than flashing an error during that redirect.
    if (!user || user.role !== "candidate") {
      return { status: "loading", error: null, data: null, needsSetup: false };
    }

    // Wait for the data contexts too, so the dashboard never paints
    // with a half-hydrated name/portfolio right after login.
    if (
      intentStatus === "idle" ||
      intentStatus === "loading" ||
      portfolioStatus === "idle" ||
      portfolioStatus === "loading"
    ) {
      return { status: "loading", error: null, data: null, needsSetup: false };
    }

    // 2. Resolve the phase from backend data (cache-first via the hook).
    const rawPhase = ai?.careerStage ?? "";
    const normalized = normalizeCareerPhase(rawPhase);

    if (!ai && aiStatus === "loading") {
      return { status: "loading", error: null, data: null, needsSetup: false };
    }
    if (!ai && aiStatus === "error") {
      return {
        status: "error",
        error: aiError ?? "Failed to load your profile.",
        data: null,
        needsSetup: false,
      };
    }

    // 3. No usable phase + onboarding not complete → setup required.
    const onboardingDone =
      candidateOnboardingCompleted || !!ai?.onboardingCompleted;
    if (!normalized && !onboardingDone) {
      return { status: "ready", error: null, data: null, needsSetup: true };
    }

    // 4. Onboarded but phase unreadable → safe fallback (never crash).
    const phase = normalized ?? FALLBACK_PHASE;

    const name = intent.name || user.name || "there";
    const firstName = name.split(" ")[0] || "there";

    const data: CandidateDashboardData = {
      userId: user.id,
      name,
      firstName,
      phase,
      rawPhase,
      ai: ai ?? null,
      field: intent.field || "",
      targetJob: intent.targetJob || "",
      targetRoles: ai?.targetRoles ?? [],
      currentSkills: ai?.currentSkills ?? [],
      skillsToImprove: ai?.skillsToImprove ?? [],
      projects: ai?.projects ?? [],
      desiredNextMove: ai?.desiredNextMove ?? "",
      longTermGoal: ai?.longTermGoal ?? "",
      portfolio: {
        headline: portfolio.headline,
        summary: portfolio.summary,
        skills: portfolio.skills,
        projectCount: portfolio.projects.length,
        certificateCount: portfolio.certificates.length,
        awardCount: portfolio.awards.length,
        experienceCount: portfolio.experiences.length,
        totalAdditions: portfolio.totalAdditions,
        hasBio: portfolio.bio.trim().length > 0,
      },
    };

    return { status: "ready", error: null, data, needsSetup: false };
  }, [
    authStatus,
    user,
    candidateOnboardingCompleted,
    intent,
    intentStatus,
    portfolio,
    portfolioStatus,
    ai,
    aiStatus,
    aiError,
  ]);
}
