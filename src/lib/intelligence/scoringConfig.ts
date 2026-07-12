/**
 * Intelligence engine core — shared, explainable score shape.
 *
 * Every engine returns the SAME `ScoreResult` so the UI's "Why this
 * recommendation?" panel has one contract to render. Scores are pure,
 * deterministic arithmetic over visible signals — no hidden weights, no AI.
 * The weights live here (named buckets), and each engine's reasons name the
 * points they carry. Swap an engine body for a real model later while
 * keeping this shape.
 */

export interface ScoreFactor {
  /** Short bucket name, e.g. "Required-skill overlap". */
  label: string;
  /** Points this factor contributed (0 = no signal). */
  points: number;
  /** Cap for this factor, when bounded. */
  max?: number;
  /** One-line human explanation of why these points were earned. */
  detail: string;
}

export interface ScoreResult {
  /** 0–100, integer, clamped. */
  score: number;
  /** Human lines, strongest first — the "Why". Always non-empty. */
  reasons: string[];
  /** Optional structured breakdown (engines that have one expose it). */
  factors?: ScoreFactor[];
  /** Honest statement of what the score does NOT yet know. */
  uncertainty?: string;
}

export const STANDARD_UNCERTAINTY =
  "Based on self-reported profile signals — not verified by assessments or references.";

/** Central weights. Each engine names its buckets so nothing is hidden. */
export const WEIGHTS = {
  match: { targetRole: 35, requiredSkills: 30, industry: 15, greenFlags: 10, baseline: 10 },
  career: { basics: 15, skills: 30, portfolio: 30, growth: 15, availability: 10 },
  careerHealth: { maintenance: 60, specialization: 25, direction: 15 },
} as const;

// ── Working-style archetypes (Feature 2) ────────────────────────
// Descriptive context ONLY. Archetypes never enter a match score and are
// never a filter — the employer-facing copy carries a Bias Check note.
// Mid-career framing: working-style/strength context, not a "fun quiz".

export interface Archetype {
  id: string;
  name: string;
  tagline: string;
  /** Candidate-facing description (strength framing). */
  description: string;
  /** How this shows up at work — bullets for the profile/tooltip. */
  strengths: string[];
  /** Employer-facing interpretation (context, not a screen). */
  interpretation: string;
}

export const ARCHETYPES: Record<string, Archetype> = {
  builder: {
    id: "builder",
    name: "The Builder",
    tagline: "Makes ideas real",
    description:
      "You do your best work shipping tangible things — you'd rather build a working version than debate a perfect plan.",
    strengths: ["Bias to action", "Prototype-first problem solving", "Strong follow-through"],
    interpretation:
      "Thrives on concrete deliverables and ownership; give them something real to ship early.",
  },
  strategist: {
    id: "strategist",
    name: "The Strategist",
    tagline: "Sees the system",
    description:
      "You zoom out before zooming in — patterns, trade-offs, and second-order effects are where you add the most value.",
    strengths: ["Systems thinking", "Prioritisation under constraints", "Long-horizon planning"],
    interpretation:
      "Strongest when scope is ambiguous; give them the problem, not the task list.",
  },
  connector: {
    id: "connector",
    name: "The Connector",
    tagline: "Multiplies through people",
    description:
      "You create momentum by aligning people — translating between groups and unblocking collaboration is your lever.",
    strengths: ["Stakeholder alignment", "Communication across functions", "Mentoring energy"],
    interpretation:
      "Impact compounds in cross-functional roles; pair with deep specialists.",
  },
  explorer: {
    id: "explorer",
    name: "The Explorer",
    tagline: "Finds the new edge",
    description:
      "You're energised by unmapped territory — new tools, domains, and approaches others haven't tried yet.",
    strengths: ["Fast learning curves", "Comfort with uncertainty", "Cross-domain range"],
    interpretation:
      "Best where the answer isn't known yet; avoid boxing into rigid, repetitive scope.",
  },
};

// ── Archetype ↔ O*NET work-style crosswalk (Job-Style Compass) ──────
// The 8 compass axes (a legible subset of O*NET's 21 work styles) and how
// strongly each working-style archetype leans on each. CANDIDATE-FACING
// context only — never an employer match input or filter (Bias Check).

export const COMPASS_STYLES = [
  "Achievement Orientation",
  "Innovation",
  "Intellectual Curiosity",
  "Adaptability",
  "Cooperation",
  "Leadership Orientation",
  "Attention to Detail",
  "Initiative",
] as const;

export type CompassStyle = (typeof COMPASS_STYLES)[number];

export const ARCHETYPE_WORKSTYLE: Record<string, Record<CompassStyle, number>> = {
  builder: {
    "Achievement Orientation": 90,
    Innovation: 55,
    "Intellectual Curiosity": 45,
    Adaptability: 45,
    Cooperation: 40,
    "Leadership Orientation": 40,
    "Attention to Detail": 85,
    Initiative: 80,
  },
  strategist: {
    "Achievement Orientation": 60,
    Innovation: 80,
    "Intellectual Curiosity": 90,
    Adaptability: 45,
    Cooperation: 40,
    "Leadership Orientation": 60,
    "Attention to Detail": 65,
    Initiative: 55,
  },
  connector: {
    "Achievement Orientation": 45,
    Innovation: 45,
    "Intellectual Curiosity": 45,
    Adaptability: 60,
    Cooperation: 90,
    "Leadership Orientation": 85,
    "Attention to Detail": 40,
    Initiative: 60,
  },
  explorer: {
    "Achievement Orientation": 50,
    Innovation: 85,
    "Intellectual Curiosity": 85,
    Adaptability: 90,
    Cooperation: 45,
    "Leadership Orientation": 45,
    "Attention to Detail": 35,
    Initiative: 75,
  },
};

export function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export const lower = (s: string) => s.trim().toLowerCase();

/** Loose token overlap — two skill labels share a meaningful word. */
export function tokensOverlap(a: string, b: string): boolean {
  if (a === b) return true;
  const at = new Set(a.split(/\s+/).filter((t) => t.length > 2));
  return b.split(/\s+/).some((t) => t.length > 2 && at.has(t));
}

/**
 * Build a ScoreResult from factors: score = Σ points (clamped), reasons are
 * the details of contributing factors, strongest first.
 */
export function fromFactors(
  factors: ScoreFactor[],
  uncertainty: string = STANDARD_UNCERTAINTY,
): ScoreResult {
  const score = clampScore(factors.reduce((s, f) => s + f.points, 0));
  const reasons = factors
    .filter((f) => f.points !== 0)
    .sort((a, b) => b.points - a.points)
    .map((f) => f.detail);
  return {
    score,
    reasons: reasons.length ? reasons : ["No strong signals yet."],
    factors,
    uncertainty,
  };
}
