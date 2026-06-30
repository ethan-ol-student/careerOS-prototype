/**
 * Career readiness engine — consolidates the readiness rubric into the
 * shared ScoreResult. Wraps the proven `explainReadiness` core (still used
 * directly by the marketplace projection) so ranking + explanation can't drift.
 */
import { explainReadiness, type ReadinessInput } from "@/lib/candidates/readiness";
import {
  STANDARD_UNCERTAINTY,
  type ScoreFactor,
  type ScoreResult,
} from "./scoringConfig";

export type { ReadinessInput };

export function scoreCareer(input: ReadinessInput): ScoreResult {
  const { score, factors } = explainReadiness(input);
  const sf: ScoreFactor[] = factors.map((f) => ({
    label: f.label,
    points: f.earned,
    max: f.max,
    detail: f.detail,
  }));
  const reasons = sf
    .filter((f) => f.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((f) => `${f.label}: ${f.detail} (+${f.points})`);
  return {
    score,
    reasons: reasons.length
      ? reasons
      : ["Add profile details (skills, projects, direction) to build a readiness score."],
    factors: sf,
    uncertainty: STANDARD_UNCERTAINTY,
  };
}
