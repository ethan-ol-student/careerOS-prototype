/**
 * Type contract for the phase-driven Candidate dashboard.
 *
 * One unified dashboard route (`/candidate/dashboard`) renders a
 * persistent shell and then selects a phase-specific inner view via
 * the Registry Pattern (see `PhaseDashboardRegistry`). The user's
 * phase comes from the backend (`CandidatesAI.careerStage`) and is
 * normalized into the `CareerPhase` union below.
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

/**
 * Lightweight descriptor for a phase's "focus widgets" — the headline
 * areas a phase is about. Rendered as a quick overview in the shell /
 * phase indicator. The actual interactive widgets are React components
 * composed inside each phase dashboard.
 */
export interface PhaseWidget {
  id: string;
  label: string;
  hint?: string;
}

/**
 * A single criterion a candidate must satisfy to transition to the
 * next phase. `derive` lets a milestone read its completion straight
 * from real candidate data when the backend supports it; milestones
 * without a `derive` fall back to manual (local) check state.
 */
export interface TransitionMilestone {
  id: string;
  label: string;
  description?: string;
  /**
   * Optional predicate that derives completion from real candidate
   * data (portfolio / onboarding answers). When present the checkbox
   * reflects live data unless the user explicitly overrides it.
   */
  derive?: (data: CandidateDashboardData) => boolean;
}

/**
 * Explicit user overrides for milestone check state, keyed by
 * milestone id. Stored locally today (see `useMilestoneProgress`);
 * shaped so a future `/api/me/milestones` route can persist it 1:1.
 */
export type MilestoneProgress = Record<string, boolean>;

/** Static config that describes one phase's dashboard. */
export interface PhaseDashboardConfig {
  phase: CareerPhase;
  /** Human label, e.g. "Young Adult". */
  label: string;
  /** Rough age band shown beside the label, e.g. "18–22". */
  ageHint: string;
  /** Main goal header for the phase, e.g. "Discover interests and paths". */
  goalHeader: string;
  /** One-line purpose surfaced in the phase indicator. */
  purpose: string;
  /** Accent used for the phase indicator / progress meter. */
  accent: PhaseAccent;
  /** Default UI density for this phase (user-overridable in Settings). */
  density: UiDensity;
  /** Headline focus areas for the phase (overview only). */
  focusWidgets: PhaseWidget[];
  /** Criteria required to transition out of this phase. */
  milestones: TransitionMilestone[];
  /** The phase a candidate moves to next, or null for the terminal phase. */
  nextPhase: CareerPhase | null;
  /** True for the terminal phase (executive). */
  isFinal: boolean;
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

/** Props every phase-specific dashboard component receives. */
export interface PhaseDashboardProps {
  data: CandidateDashboardData;
}
