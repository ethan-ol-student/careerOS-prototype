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
