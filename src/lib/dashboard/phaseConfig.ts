/**
 * Phase registry config — the single source of truth for each career
 * phase's goal header, purpose, focus areas, and transition milestones.
 *
 * Milestone `derive` predicates read real candidate data where the
 * backend already has the signal (portfolio + onboarding answers).
 * Milestones without a `derive` are manual (local) check state until a
 * dedicated progress endpoint exists.
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
    ageHint: "13–17",
    goalHeader: "Discover interests and paths",
    purpose: "Explore directions, log what you're curious about, and start your first proof of skill.",
    accent: "luminous",
    density: "vibrant",
    focusWidgets: [
      { id: "exploration", label: "Exploration tools", hint: "Find directions that fit" },
      { id: "subject-logs", label: "Subject logs", hint: "Track what you're studying" },
      { id: "early-skills", label: "Early skill tracking", hint: "Seed your first skills" },
    ],
    milestones: [
      {
        id: "student-field",
        label: "Select a general field or direction",
        description: "Pick at least one industry or target direction to explore.",
        derive: (d) =>
          d.field.trim().length > 0 ||
          (d.ai?.interestedIndustries?.length ?? 0) > 0 ||
          d.targetRoles.length > 0,
      },
      {
        id: "student-proof",
        label: "Start early proof of a skill",
        description: "Log a skill or a small project as your first piece of evidence.",
        derive: (d) =>
          d.currentSkills.length > 0 ||
          d.projects.length > 0 ||
          d.portfolio.projectCount > 0,
      },
    ],
    nextPhase: "young_adult",
    isFinal: false,
  },

  young_adult: {
    phase: "young_adult",
    label: "Young Adult",
    ageHint: "18–22",
    goalHeader: "Build portfolio and internship readiness",
    purpose: "Map target roles to skills, fill portfolio gaps, and reach application readiness.",
    accent: "luminous",
    density: "vibrant",
    focusWidgets: [
      { id: "target-role", label: "Target role metrics", hint: "Where you're aiming" },
      { id: "skill-mapping", label: "Skill mapping", hint: "Have vs. need" },
      { id: "portfolio-score", label: "Portfolio completeness", hint: "Internship-ready %" },
    ],
    milestones: [
      {
        id: "ya-portfolio",
        label: "Complete a role-specific portfolio",
        description: "Headline, summary, and at least a few skills plus one project.",
        derive: (d) =>
          d.portfolio.headline.trim().length > 0 &&
          d.portfolio.skills.length >= 3 &&
          (d.portfolio.projectCount > 0 || d.projects.length > 0),
      },
      {
        id: "ya-readiness",
        label: "Reach application readiness",
        description: "A clear target role and a portfolio with real depth.",
        derive: (d) => d.targetRoles.length > 0 && d.portfolio.skills.length >= 5,
      },
    ],
    nextPhase: "early_career",
    isFinal: false,
  },

  early_career: {
    phase: "early_career",
    label: "Early Career",
    ageHint: "23–34",
    goalHeader: "Land the right job and grow market value",
    purpose: "Run your job search like a pipeline and track your readiness toward the next role.",
    accent: "clover",
    density: "vibrant",
    focusWidgets: [
      { id: "pipeline", label: "Job pipeline (Kanban)", hint: "Applied → Offer" },
      { id: "applications", label: "Active applications", hint: "What's in flight" },
      { id: "market-value", label: "Market value tracking", hint: "Salary & demand" },
    ],
    milestones: [
      {
        id: "ec-stable",
        label: "Secure stable, relevant experience",
        description: "Log at least one role/experience in your portfolio.",
        derive: (d) => d.portfolio.experienceCount > 0,
      },
      {
        id: "ec-next",
        label: "Hit your next-role readiness indicator",
        description: "A strong, broad skill set mapped to a clear target role.",
        derive: (d) => d.portfolio.skills.length >= 8 && d.targetRoles.length > 0,
      },
    ],
    nextPhase: "mid_career",
    isFinal: false,
  },

  mid_career: {
    phase: "mid_career",
    label: "Mid-Career",
    ageHint: "35–44",
    goalHeader: "Prevent stagnation and plan your next move",
    purpose: "Watch for skill decay, deepen a specialization, and weigh leadership branches.",
    accent: "luminous",
    density: "calm",
    focusWidgets: [
      { id: "risk-matrix", label: "Skill deprecation risk", hint: "What's at risk" },
      { id: "specialization", label: "Specialization tracking", hint: "Go deeper" },
      { id: "leadership", label: "Leadership branch options", hint: "IC vs. manager" },
    ],
    milestones: [
      {
        id: "mc-proof",
        label: "Document high-impact proof of work",
        description: "Add multiple projects, or an award/recognition.",
        derive: (d) => d.portfolio.projectCount >= 2 || d.portfolio.awardCount > 0,
      },
      {
        id: "mc-track",
        label: "Pick a specialized track",
        description: "Name a clear desired next move and target role.",
        derive: (d) => d.desiredNextMove.trim().length > 0 && d.targetRoles.length > 0,
      },
    ],
    nextPhase: "senior_career",
    isFinal: false,
  },

  senior_career: {
    phase: "senior_career",
    label: "Senior Career",
    ageHint: "45–54",
    goalHeader: "Move into leadership, advisory, and mentorship",
    purpose: "Convert experience into influence — advisory seats, mentorship, and exec readiness.",
    accent: "clover",
    density: "calm",
    focusWidgets: [
      { id: "leadership-metrics", label: "Leadership metrics", hint: "Scope of impact" },
      { id: "advisory", label: "Advisory board tracking", hint: "External seats" },
      { id: "mentorship", label: "Mentorship hub", hint: "Grow the next cohort" },
    ],
    milestones: [
      {
        id: "sc-influence",
        label: "Demonstrate strategic influence",
        description: "Multiple senior experiences and high-impact proof.",
        derive: (d) => d.portfolio.experienceCount >= 2 && d.portfolio.projectCount >= 1,
      },
      {
        id: "sc-exec-ready",
        label: "Pass executive readiness verification",
        description: "Verified by a mentor or advisor (manual until backend support).",
        // No backend signal yet — manual check.
      },
    ],
    nextPhase: "executive",
    isFinal: false,
  },

  executive: {
    phase: "executive",
    label: "Executive & Beyond",
    ageHint: "55+",
    goalHeader: "Convert experience into legacy and influence",
    purpose: "Board roles, consulting, and master mentorship — your experience becomes a shortcut for others.",
    accent: "luminous",
    density: "calm",
    focusWidgets: [
      { id: "board-seats", label: "Board seats", hint: "Governance roles" },
      { id: "consulting", label: "Consulting pipeline", hint: "Advisory engagements" },
      { id: "master-mentorship", label: "Master mentorship", hint: "Scale your wisdom" },
      { id: "legacy", label: "Legacy metrics", hint: "Lasting impact" },
    ],
    milestones: [
      {
        id: "ex-final",
        label: "Operating in the final phase",
        description: "You've reached the terminal phase — focus shifts to legacy and influence.",
        derive: () => true,
      },
      {
        id: "ex-branch",
        label: "Choose a branch: consulting or gradual wind-down",
        description: "Decide how you want to channel your experience next (manual).",
        // No backend signal yet — manual check.
      },
    ],
    nextPhase: null,
    isFinal: true,
  },
};

/** Returns the config for a normalized phase. */
export function getPhaseConfig(phase: CareerPhase): PhaseDashboardConfig {
  return PHASE_CONFIG[phase];
}

/** Returns the config for the phase that follows `phase`, if any. */
export function getNextPhaseConfig(
  phase: CareerPhase,
): PhaseDashboardConfig | null {
  const next = PHASE_CONFIG[phase].nextPhase;
  return next ? PHASE_CONFIG[next] : null;
}
