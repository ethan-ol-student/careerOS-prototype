/**
 * Skill-bridge engine (mid-career) — consolidates `jobReadiness` into the
 * shared ScoreResult: which required skills are met for a target job, and the
 * exact "bridge" (missing skills) to close.
 *
 * ponytail: exact-name match via the existing jobReadiness rubric. Add fuzzy
 * matching / suggested learning resources later; keep the ScoreResult shape.
 */
import { jobReadiness, type TargetJob } from "@/lib/jobs/data";
import {
  STANDARD_UNCERTAINTY,
  clampScore,
  type ScoreFactor,
  type ScoreResult,
} from "./scoringConfig";

export interface SkillBridge extends ScoreResult {
  matched: string[];
  missing: string[];
  complete: boolean;
}

export function scoreSkillBridge(
  job: TargetJob,
  userSkills: string[],
): SkillBridge {
  const { matched, missing, pct, complete } = jobReadiness(job, userSkills);
  const required = job.requiredSkills.length;

  const factors: ScoreFactor[] = [
    {
      label: "Skill coverage",
      points: clampScore(pct),
      max: 100,
      detail: `${matched.length}/${required} required skills met for ${job.title}.`,
    },
  ];

  const reasons = [
    `${matched.length}/${required} required skills met for ${job.title} at ${job.company}.`,
    missing.length
      ? `Bridge to close: ${missing.join(", ")}.`
      : "All required skills met — no bridge needed.",
  ];

  return {
    score: clampScore(pct),
    reasons,
    factors,
    uncertainty: STANDARD_UNCERTAINTY,
    matched,
    missing,
    complete,
  };
}
