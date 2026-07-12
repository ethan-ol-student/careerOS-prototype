/**
 * Undervalued Strengths — the first cross-feature insight.
 *
 * Compares the Skill Radar (self-perception) against the Living Portfolio
 * (evidence): a skill the candidate can PROVE across multiple portfolio items
 * but rates low — or never added to their radar at all — is a strength they're
 * hiding from employers (and themselves). Pure + deterministic; needs no
 * external data, so it ships in slice 1.
 *
 * "Evidence beats self-rating" is the same trust principle as the flagship
 * Skills Truth engine, applied across modules instead of within one.
 */
import { clampScore, type ScoreResult } from "./scoringConfig";
import type { CandidateSignal, SkillSignal, TrustTier } from "./candidateSignal";

/** Min portfolio mentions before we call a skill "proven". */
const EVIDENCE_THRESHOLD = 2;
/** At/below this self-rating (out of 5) counts as under-rated. */
const LOW_SELF_RATING = 2;

export interface UndervaluedStrength {
  skill: string;
  canonical: string;
  evidenceCount: number;
  selfLevel: number | null;
  tier: TrustTier | null;
  /** Why this surfaced — human copy for the card. */
  reason: string;
}

export interface UndervaluedResult extends ScoreResult {
  strengths: UndervaluedStrength[];
  /** ONE concrete action, or null when nothing is undervalued. */
  nextStep: string | null;
}

function isUndervalued(s: SkillSignal): boolean {
  if (s.evidenceCount < EVIDENCE_THRESHOLD) return false;
  return s.selfLevel === null || s.selfLevel <= LOW_SELF_RATING;
}

function reasonFor(s: SkillSignal): string {
  const items = `${s.evidenceCount} portfolio ${s.evidenceCount === 1 ? "item" : "items"}`;
  if (s.selfLevel === null) {
    return `${items} show ${s.display}, but it isn't on your Skill Radar yet.`;
  }
  return `You rate ${s.display} ${s.selfLevel}/5, but ${items} show it in action — likely undervalued.`;
}

export function scoreUndervaluedStrengths(signal: CandidateSignal): UndervaluedResult {
  const strengths: UndervaluedStrength[] = signal.skills
    .filter(isUndervalued)
    .sort(
      (a, b) =>
        b.evidenceCount - a.evidenceCount ||
        (a.selfLevel ?? 0) - (b.selfLevel ?? 0) ||
        a.canonical.localeCompare(b.canonical),
    )
    .map((s) => ({
      skill: s.display,
      canonical: s.canonical,
      evidenceCount: s.evidenceCount,
      selfLevel: s.selfLevel,
      tier: s.tier,
      reason: reasonFor(s),
    }));

  // Score = how much hidden, proven strength we found (0–100). Capped so a
  // handful of undervalued skills reads as a strong signal.
  const score = clampScore(Math.min(100, strengths.length * 25));

  const top = strengths[0];
  const nextStep = !top
    ? null
    : top.selfLevel === null
      ? `Add "${top.skill}" to your Skill Radar with evidence — ${top.evidenceCount} portfolio items already prove it.`
      : `Raise "${top.skill}" on your Skill Radar and attach one of the ${top.evidenceCount} portfolio items as evidence.`;

  const reasons = strengths.length
    ? [
        `${strengths.length} proven ${strengths.length === 1 ? "strength is" : "strengths are"} under-rated on your Skill Radar.`,
        ...strengths.slice(0, 3).map((s) => s.reason),
      ]
    : ["Your self-ratings line up with your portfolio evidence — nicely calibrated."];

  return {
    score,
    reasons,
    uncertainty:
      "Evidence is counted from your own portfolio text, not independently verified.",
    strengths,
    nextStep,
  };
}
