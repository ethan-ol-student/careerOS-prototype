/**
 * Transferable-skill engine (mid-career) — given current skills and the
 * skills a target role needs, identifies which existing skills carry over and
 * how much of the target they cover.
 *
 * ponytail: token-overlap heuristic. Swap for an embedding/ontology similarity
 * later; keep the ScoreResult shape.
 */
import {
  STANDARD_UNCERTAINTY,
  clampScore,
  lower,
  tokensOverlap,
  type ScoreFactor,
  type ScoreResult,
} from "./scoringConfig";

export interface TransferInput {
  currentSkills: string[];
  /** Skills the target role/industry needs. */
  targetSkills: string[];
  targetLabel?: string;
}

export interface TransferResult extends ScoreResult {
  transferable: string[];
  coveredTargets: string[];
}

export function scoreTransferableSkills(input: TransferInput): TransferResult {
  const target = input.targetSkills.map(lower);
  const cur = input.currentSkills.map(lower);

  const transferable = input.currentSkills.filter((s) =>
    target.some((t) => tokensOverlap(lower(s), t)),
  );
  const coveredTargets = input.targetSkills.filter((t) =>
    cur.some((s) => tokensOverlap(s, lower(t))),
  );
  const coverage = input.targetSkills.length
    ? coveredTargets.length / input.targetSkills.length
    : 0;

  const label = input.targetLabel ?? "the target role";
  const factors: ScoreFactor[] = [
    {
      label: "Transferable coverage",
      points: clampScore(coverage * 100),
      max: 100,
      detail: `${coveredTargets.length}/${input.targetSkills.length} of ${label}'s needs are covered by skills you already have.`,
    },
  ];

  const reasons = [
    transferable.length
      ? `${transferable.length} skill${transferable.length === 1 ? "" : "s"} transfer to ${label}: ${transferable.join(", ")}.`
      : `No directly transferable skills detected for ${label} yet.`,
    `Covers ${coveredTargets.length} of ${input.targetSkills.length} target requirements.`,
  ];

  return {
    score: factors[0].points,
    reasons,
    factors,
    uncertainty: STANDARD_UNCERTAINTY,
    transferable,
    coveredTargets,
  };
}
