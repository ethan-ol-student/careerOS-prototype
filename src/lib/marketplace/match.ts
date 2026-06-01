/**
 * Transparent employer→candidate match explanation.
 *
 * Principle #3 ("explain why a recommendation makes sense and where the
 * uncertainty sits — no black-box scores") and #4 ("connect both sides
 * honestly… the right person for the right reason") require that a match
 * isn't a bare number. This module is the single source of truth for
 * BOTH the numeric score and the human-readable reasons + an explicit
 * uncertainty note. The marketplace card, detail modal, and the
 * employer personalization summary all consume it, so ranking and
 * explanation can never drift apart.
 *
 * Pure function, no AI, no hidden weights — the weights are listed in
 * the reasons themselves. Swap the body for a real ranker later while
 * keeping the `MatchExplanation` shape.
 */

import type { Candidate } from "@/lib/candidates/types";

export interface EmployerMatchPrefs {
  targetRoles: string[];
  requiredSkills: string[];
  industries: string[];
  candidateGreenFlags: string[];
}

export interface MatchExplanation {
  /** 0–100 weighted score. */
  score: number;
  /** Human reasons, strongest first — each names the weight it carries. */
  reasons: string[];
  /** Honest statement of what the score does NOT yet know. */
  uncertainty: string;
}

const lower = (s: string) => s.toLowerCase();

/**
 * Score buckets (each names its own weight so nothing is hidden):
 *   Target-role alignment ...... 35
 *   Required-skill overlap ..... 30 (proportional)
 *   Industry / category match .. 15
 *   Green-flag heuristics ...... 10
 *   Baseline marketplace score . 10
 */
export function explainMatch(
  c: Candidate,
  prefs: EmployerMatchPrefs,
): MatchExplanation {
  const targetRoles = prefs.targetRoles.map(lower);
  const requiredSkills = prefs.requiredSkills.map(lower);
  const industries = prefs.industries.map(lower);
  const greenFlags = prefs.candidateGreenFlags.map(lower);

  let score = 0;
  const reasons: string[] = [];

  // Target role (35)
  const roleHit = targetRoles.find((r) =>
    [c.targetRole, c.careerDirection].some((f) => lower(f).includes(r)),
  );
  if (roleHit) {
    score += 35;
    reasons.push(`Targets "${c.targetRole}" — matches your role focus (+35).`);
  }

  // Required skills (30, proportional)
  if (requiredSkills.length > 0) {
    const candidateSkills = c.topSkills.map(lower);
    const overlap = requiredSkills.filter((s) => candidateSkills.includes(s));
    if (overlap.length > 0) {
      const pts = Math.min(30, (overlap.length / requiredSkills.length) * 30);
      score += pts;
      reasons.push(
        `Covers ${overlap.length}/${requiredSkills.length} required skills (+${Math.round(pts)}).`,
      );
    }
  }

  // Industry / category (15)
  if (industries.length > 0) {
    if (
      industries.includes(lower(c.industry)) ||
      industries.includes(lower(c.category))
    ) {
      score += 15;
      reasons.push(`Industry "${c.industry}" matches your focus (+15).`);
    }
  }

  // Green flags (10)
  if (greenFlags.some((g) => g.includes("portfolio"))) {
    const pts = Math.min(5, c.portfolioProjects.length * 2);
    if (pts > 0) {
      score += pts;
      reasons.push(
        `${c.portfolioProjects.length} portfolio project${c.portfolioProjects.length === 1 ? "" : "s"} — you value portfolios (+${pts}).`,
      );
    }
  }
  if (greenFlags.some((g) => g.includes("learning"))) {
    if (c.growthSignal === "Accelerating" || c.growthSignal === "Compounding") {
      score += 5;
      reasons.push(`"${c.growthSignal}" growth — you value learning momentum (+5).`);
    }
  }

  // Baseline (10)
  const baseline = Math.round((c.matchScore / 100) * 10);
  score += baseline;
  if (baseline > 0) {
    reasons.push(`Baseline profile strength (+${baseline}).`);
  }

  if (reasons.length === 0) {
    reasons.push("No strong signals against your current preferences yet.");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    uncertainty:
      "Based on self-reported skills and profile signals — not yet verified by assessments or references.",
  };
}

/** Convenience for callers that only need the number (e.g. sorting). */
export function matchScore(c: Candidate, prefs: EmployerMatchPrefs): number {
  return explainMatch(c, prefs).score;
}
