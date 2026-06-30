/**
 * Career Health engine (mid-career) — consolidates the skill-decay heuristic
 * the MidCareerDashboard computes inline into a reusable, explainable engine.
 *
 * ponytail: heuristic over self-reported skills (maintained = skills the user
 * is actively improving). Swap for a real recency/usage-decay model later;
 * keep the ScoreResult shape.
 */
import {
  WEIGHTS,
  clampScore,
  fromFactors,
  lower,
  type ScoreFactor,
  type ScoreResult,
} from "./scoringConfig";

export interface CareerHealthInput {
  currentSkills: string[];
  /** Overlap with currentSkills = actively maintained; the rest are at risk. */
  skillsToImprove: string[];
  targetRoles: string[];
  desiredNextMove: string;
}

export interface CareerHealth extends ScoreResult {
  maintained: string[];
  atRisk: string[];
  decayRisk: number; // 0–100, share of skills not actively maintained
}

export function scoreCareerHealth(input: CareerHealthInput): CareerHealth {
  const improving = new Set(input.skillsToImprove.map(lower));
  const maintained = input.currentSkills.filter((s) => improving.has(lower(s)));
  const atRisk = input.currentSkills.filter((s) => !improving.has(lower(s)));
  const total = input.currentSkills.length;
  const maintenanceRate = total ? maintained.length / total : 0;
  const decayRisk = total ? clampScore((atRisk.length / total) * 100) : 0;

  const w = WEIGHTS.careerHealth;
  const factors: ScoreFactor[] = [
    {
      label: "Skill maintenance",
      points: Math.round(maintenanceRate * w.maintenance),
      max: w.maintenance,
      detail: `${maintained.length}/${total || 0} skills actively maintained; ${atRisk.length} at risk of going stale.`,
    },
    {
      label: "Specialization",
      points: input.targetRoles.length ? w.specialization : 0,
      max: w.specialization,
      detail: input.targetRoles.length
        ? `Clear track: ${input.targetRoles.join(", ")}.`
        : "No target role set — pick a track to deepen specialization.",
    },
    {
      label: "Direction",
      points: input.desiredNextMove.trim() ? w.direction : 0,
      max: w.direction,
      detail: input.desiredNextMove.trim()
        ? "A specific next move is defined."
        : "Define a next move to set direction.",
    },
  ];

  return { ...fromFactors(factors), maintained, atRisk, decayRisk };
}
