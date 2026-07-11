/**
 * Phase config — display metadata per career phase (label, purpose,
 * accent, age-adaptive density default) plus the raw→canonical phase
 * normalizer. The old goal-header/focus-widget/milestone config died
 * with the registry-pattern dashboards (replaced by the cockpit).
 */

import type { CareerPhase, PhaseDashboardConfig } from "./types";

/**
 * Safe fallback phase. Per product assumptions the prototype centers
 * on the "young adult" portfolio/readiness experience, so an
 * unreadable-but-onboarded phase resolves here rather than erroring.
 */
export const FALLBACK_PHASE: CareerPhase = "young_adult";

/**
 * Maps a raw `careerStage` string (any casing / hyphen / underscore /
 * legacy short form) to a canonical `CareerPhase`, or null if it's not
 * recognized. The DB stores hyphenated values (`young-adult`, …); the
 * schema comment also references short forms (`early`/`mid`/`senior`),
 * so both are handled.
 */
export function normalizeCareerPhase(
  raw: string | null | undefined,
): CareerPhase | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  switch (key) {
    case "student":
      return "student";
    case "young_adult":
    case "youngadult":
    case "young":
      return "young_adult";
    case "early_career":
    case "earlycareer":
    case "early":
      return "early_career";
    case "mid_career":
    case "midcareer":
    case "mid":
      return "mid_career";
    case "senior_career":
    case "seniorcareer":
    case "senior":
      return "senior_career";
    case "executive":
    case "exec":
    case "executive_and_beyond":
    case "executive_&_beyond":
      return "executive";
    default:
      return null;
  }
}

export const PHASE_CONFIG: Record<CareerPhase, PhaseDashboardConfig> = {
  student: {
    phase: "student",
    label: "Student",
    purpose:
      "Explore directions, log what you're curious about, and start your first proof of skill.",
    accent: "luminous",
    density: "vibrant",
  },
  young_adult: {
    phase: "young_adult",
    label: "Young Adult",
    purpose:
      "Build a portfolio, grow real skills, and get ready for internships and first roles.",
    accent: "luminous",
    density: "vibrant",
  },
  early_career: {
    phase: "early_career",
    label: "Early Career",
    purpose:
      "Land the right job, close skill gaps deliberately, and grow your market value.",
    accent: "luminous",
    density: "vibrant",
  },
  mid_career: {
    phase: "mid_career",
    label: "Mid-Career",
    purpose:
      "Prevent stagnation: keep skills relevant, know your worth, and plan the next move.",
    accent: "clover",
    density: "calm",
  },
  senior_career: {
    phase: "senior_career",
    label: "Senior Career",
    purpose:
      "Move into leadership, advisory, and mentorship — convert depth into direction.",
    accent: "clover",
    density: "calm",
  },
  executive: {
    phase: "executive",
    label: "Executive",
    purpose:
      "Convert experience into legacy and influence — boards, advisory, and giving back.",
    accent: "clover",
    density: "calm",
  },
};

export function getPhaseConfig(phase: CareerPhase): PhaseDashboardConfig {
  return PHASE_CONFIG[phase];
}
