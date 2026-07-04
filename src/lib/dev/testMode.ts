/**
 * Developer / Test Mode — shared, framework-agnostic contract.
 *
 * This module is PURE (no server-only imports) so it can be imported by
 * both client components and server routes. The single environment gate
 * (`isTestModeEnabled`) lives here; everything dev-only checks it.
 *
 * SECURITY: test mode is unlocked ONLY when
 * `NEXT_PUBLIC_ENABLE_TEST_MODE === "true"`. In production this flag is
 * unset, so the test route 404s, the dev API routes 404, and the
 * `admin123` account is never seeded — there is no production backdoor.
 */

import { CAREER_PHASES, type CareerPhase } from "@/lib/dashboard/types";

/** The single source of truth for whether dev/test mode is active. */
export function isTestModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_TEST_MODE === "true";
}

/**
 * Judge Demo gate — DECOUPLED from full test mode so production can run
 * the judge experience (homepage button, /judge hub, demo-login for the
 * two seeded demo accounts) WITHOUT exposing the dev harness
 * (/dev/test-mode, the admin123 account, seed/reset/state routes, which
 * all stay behind `isTestModeEnabled`). Test mode implies judge demo so
 * local dev needs only one flag.
 */
export function isJudgeDemoEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_JUDGE_DEMO === "true" || isTestModeEnabled()
  );
}

// ── Dev-only test account (seeded ONLY when test mode is enabled) ───
export const TEST_ADMIN_USERNAME = "admin123";
/**
 * DEV-ONLY plaintext, intentionally weak for fast local testing. It is
 * hashed with bcrypt before storage and only ever written by the
 * flag-gated `/api/dev/seed` route — never in production logic.
 */
export const TEST_ADMIN_PASSWORD = "admin";
export const TEST_ADMIN_EMAIL = "admin123@dev.local";
export const TEST_ADMIN_NAME = "Dev Tester";
export const TEST_ORG_NAME = "Dev Test Co.";

export const ALL_PHASES = CAREER_PHASES;

/** Canonical phase → the hyphenated value the real onboarding flow stores. */
export const PHASE_TO_DB_STAGE: Record<CareerPhase, string> = {
  student: "student",
  young_adult: "young-adult",
  early_career: "early-career",
  mid_career: "mid-career",
  senior_career: "senior-career",
  executive: "executive",
};

export type DevUserMode = "candidate" | "employer";

// ── Shared request/response contracts (typed end-to-end) ────────────

/** Partial state update applied to the test account by `/api/dev/state`. */
export interface DevStatePatch {
  role?: DevUserMode;
  candidateOnboardingCompleted?: boolean;
  candidateAdvancedData?: "present" | "missing";
  careerPhase?: CareerPhase;
  employerOnboardingCompleted?: boolean;
  employerAIData?: "present" | "missing";
}

/** Discrete mock-data actions handled by `/api/dev/data`. */
export type DevDataAction =
  | "candidate.portfolio.fill"
  | "candidate.portfolio.empty"
  | "candidate.skills.fill"
  | "candidate.skills.empty"
  | "candidate.chapters.fill"
  | "candidate.chapters.empty"
  | "candidate.notifications.fill"
  | "candidate.notifications.read"
  | "candidate.notifications.empty"
  | "employer.saved.fill"
  | "employer.saved.empty"
  | "employer.notifications.fill"
  | "employer.notifications.read"
  | "employer.notifications.empty"
  | "employer.messages.fill"
  | "employer.messages.empty"
  | "employer.invites.fill"
  | "employer.invites.accept"
  | "employer.invites.empty";

export type DevResetScope = "candidate" | "employer" | "all";

/** Snapshot of the test account, returned by `GET /api/dev/status`. */
export interface DevStatus {
  testModeEnabled: boolean;
  account: {
    username: string;
    email: string;
    name: string | null;
    role: DevUserMode;
  };
  session: {
    signedIn: boolean;
    role: DevUserMode | null;
    isTestAccount: boolean;
  };
  candidate: {
    onboardingCompleted: boolean;
    careerStage: string;
    phase: CareerPhase | null;
    hasAdvancedData: boolean;
    skills: number;
    portfolioFilled: boolean;
    chapters: number;
    notificationsTotal: number;
    notificationsUnread: number;
  };
  employer: {
    onboardingCompleted: boolean;
    hasAIData: boolean;
    saved: number;
    invites: number;
    notificationsTotal: number;
    notificationsUnread: number;
    conversations: number;
  };
  sampleCandidateId: string | null;
}

/**
 * Best-effort client cache clear. Dev mutations change DB state directly,
 * so we drop the `career-os-*` paint caches to avoid stale first-paint on
 * the next product page. No-op on the server.
 */
export function clearClientCaches(): void {
  if (typeof window === "undefined") return;
  const KEYS = [
    "career-os-intent-cache",
    "career-os-intent",
    "career-os-portfolio-cache",
    "career-os-portfolio",
    "career-os-candidates-ai-cache",
    "career-os-events",
    "career-os-candidate-notifications",
    "career-os-candidate-onboarding-draft",
    "career-os-employer-goal",
    "career-os-employer-onboarded",
    "career-os-employer-saved",
    "career-os-employer-invited",
    "career-os-employer-notifications",
    "career-os-employer-chats",
  ];
  try {
    for (const k of KEYS) localStorage.removeItem(k);
    // Drop the per-user milestone override caches too.
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("career-os-milestones::")) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
}
