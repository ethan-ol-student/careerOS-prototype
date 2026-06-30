/**
 * Candidate match engine — consolidates employer→candidate matching into the
 * shared ScoreResult. Wraps the existing `explainMatch` single-source-of-truth
 * (used by the marketplace card, detail modal, and employer summary) so the
 * intelligence layer and the marketplace can never disagree on a score.
 */
import { explainMatch, type EmployerMatchPrefs } from "@/lib/marketplace/match";
import type { Candidate } from "@/lib/candidates/types";
import type { ScoreResult } from "./scoringConfig";

export type { EmployerMatchPrefs };

export function scoreCandidateMatch(
  candidate: Candidate,
  prefs: EmployerMatchPrefs,
): ScoreResult {
  const { score, reasons, uncertainty } = explainMatch(candidate, prefs);
  return { score, reasons, uncertainty };
}
