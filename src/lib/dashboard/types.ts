/**
 * Type contract for the phase-driven Candidate dashboard.
 *
 * One unified dashboard route (`/candidate/dashboard`) renders the
 * four-question cockpit (`CockpitDashboard`). The user's phase comes
 * from the backend (`CandidatesAI.careerStage`) and is normalized into
 * the `CareerPhase` union below; per-phase config is now display
 * metadata only (label/purpose/accent/density).
 */

import type { CandidatesAIData } from "@/lib/hooks/useCandidatesAI";
import type { ContextStatus } from "@/lib/types/contextStatus";

/**
 * Canonical career-phase identifiers used throughout the dashboard.
 *
 * NOTE: the database stores hyphenated values on `CandidatesAI.careerStage`
 * (`young-adult`, `early-career`, …). Always pass raw values through
 * `normalizeCareerPhase()` (see `phaseConfig.ts`) before indexing the
 * registry / config maps with them.
 */
export const CAREER_PHASES = [
  "student",
  "young_adult",
  "early_career",
  "mid_career",
  "senior_career",
  "executive",
] as const;

export type CareerPhase = (typeof CAREER_PHASES)[number];

/** Accent tokens available to phase widgets (matches the design system). */
export type PhaseAccent = "luminous" | "clover";

/**
 * Age-adaptive UI density (Feature 14). "vibrant" = the visual, gamified
 * default for younger phases; "calm" = the editorial, higher-readability
 * 30–55+ experience. Resolved per user in `uiDensity.ts` — phase default
 * plus a settings override, never locked to age.
 */
export type UiDensity = "calm" | "vibrant";

/** Static display metadata for one phase. */
export interface PhaseDashboardConfig {
  phase: CareerPhase;
  /** Human label, e.g. "Young Adult". */
  label: string;
  /** One-line purpose (used by the judge demo data builder). */
  purpose: string;
  /** Accent token for phase-tinted UI. */
  accent: PhaseAccent;
  /** Default UI density for this phase (user-overridable in Settings). */
  density: UiDensity;
}

/** Compact portfolio snapshot derived from `usePortfolio`. */
export interface DashboardPortfolioSummary {
  headline: string;
  summary: string;
  skills: string[];
  projectCount: number;
  certificateCount: number;
  awardCount: number;
  experienceCount: number;
  totalAdditions: number;
  hasBio: boolean;
}

/**
 * Normalized, render-ready bundle handed to every phase dashboard.
 * Composed from auth + intent + CandidatesAI + portfolio so phase
 * widgets never reach into individual contexts directly.
 */
export interface CandidateDashboardData {
  /** Authenticated user id — scopes any per-user local state. */
  userId: string;
  name: string;
  firstName: string;
  /** Normalized phase (registry key). */
  phase: CareerPhase;
  /** Raw value as stored in the DB (for debugging / display). */
  rawPhase: string;
  /** Full advanced-onboarding row, or null if not loaded. */
  ai: CandidatesAIData | null;
  field: string;
  targetJob: string;
  targetRoles: string[];
  currentSkills: string[];
  skillsToImprove: string[];
  projects: string[];
  desiredNextMove: string;
  longTermGoal: string;
  portfolio: DashboardPortfolioSummary;
}

/** What `useCandidateDashboard()` returns to `MainDashboardWrapper`. */
export interface CandidateDashboardPayload {
  status: ContextStatus;
  error: string | null;
  data: CandidateDashboardData | null;
  /** True when the phase is missing and onboarding isn't complete. */
  needsSetup: boolean;
}
