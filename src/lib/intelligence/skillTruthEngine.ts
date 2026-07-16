/**
 * Skills Truth engine (flagship) — trust-weighted skill strength vs a target
 * job. The anti-inflation core: a self-claimed "expert" (tier 1) counts HALF
 * of an endorsed one (tier 3), so a claimed skill and a proven skill look
 * different everywhere. Pure + deterministic; weights live here, not in UI.
 */
import { normalizeSkill, type TargetJob } from "@/lib/jobs/data";
import {
  clampScore,
  type ScoreFactor,
  type ScoreResult,
} from "./scoringConfig";

export type TrustTier = 1 | 2 | 3;

export interface SkillClaimInput {
  name: string;
  /** Claimed proficiency 1–5. */
  level: number;
  tier: TrustTier;
}

/** Trust multipliers — the asymmetry IS the product. */
export const TIER_WEIGHT: Record<TrustTier, number> = { 1: 0.5, 2: 0.8, 3: 1 };
export const TIER_LABEL: Record<TrustTier, string> = {
  1: "Self-claimed",
  2: "Evidence-backed",
  3: "Endorsed",
};

export interface RadarAxis {
  /** Canonical (lower-case) skill name — one radar spoke. */
  skill: string;
  /** 0–100 trust-weighted strength. */
  you: number;
  /** 0–100 the role asks for (always 100 for a required skill). */
  required: number;
  /** Trust tier behind `you`, or null when the skill isn't claimed. */
  tier: TrustTier | null;
}

export interface SkillTruth extends ScoreResult {
  axes: RadarAxis[];
  /** Weakest-first spokes below requirement, max 3. */
  gaps: string[];
  /** ONE concrete action — every journey ends in "do this next". */
  nextStep: string;
}

/** Trust-weighted strength of a single claim, 0–100. Exported so category
 *  radars can derive axes page-side without duplicating the tier math. */
export function claimStrength(c: SkillClaimInput): number {
  const level = Math.min(5, Math.max(1, Math.round(c.level)));
  return clampScore(Math.round((level / 5) * TIER_WEIGHT[c.tier] * 100));
}

export interface MarketValue {
  /** 0–100 tier-weighted signal across ALL claimed skills (job-agnostic). */
  score: number;
  /** Human band for the readout. */
  label: "Emerging" | "Solid" | "Strong" | "Elite" | "Getting started";
  reason: string;
}

/**
 * Market-value readout for the cockpit: tier- and level-weighted skill mass,
 * normalized so ~8 fully-validated expert skills reads as Elite. Because
 * tier-1 counts ×0.5, self-claiming a long list can't fake a high signal —
 * validation is the only lever that moves it. Same asymmetry as the radar.
 */
export function marketValue(claims: SkillClaimInput[]): MarketValue {
  if (!claims.length)
    return {
      score: 0,
      label: "Getting started",
      reason: "Add a few skills to see your market signal.",
    };
  const raw = claims.reduce(
    (s, c) => s + claimStrength(c) / 100, // reuse the radar's per-claim weight
    0,
  );
  const score = clampScore(Math.round((raw / 8) * 100));
  const label =
    score >= 75 ? "Elite" : score >= 50 ? "Strong" : score >= 25 ? "Solid" : "Emerging";
  const validated = claims.filter((c) => c.tier >= 2).length;
  return {
    score,
    label,
    reason: `${validated} of ${claims.length} skill${claims.length === 1 ? "" : "s"} evidence-backed or endorsed — trust-weighted, so validation (not volume) drives this.`,
  };
}

export function scoreSkillTruth(
  claims: SkillClaimInput[],
  job: TargetJob,
): SkillTruth {
  const byName = new Map(claims.map((c) => [normalizeSkill(c.name), c]));

  // ponytail: radar is a pentagon — 5 spokes. Role skills first; the
  // user's strongest other claims fill remaining spokes (required: 0,
  // display-only padding appended AFTER scoring, which stays role-only).
  const axes: RadarAxis[] = job.requiredSkills.slice(0, 5).map((skill) => {
    const c = byName.get(skill);
    return {
      skill,
      you: c ? claimStrength(c) : 0,
      required: 100,
      tier: c ? c.tier : null,
    };
  });

  const score = clampScore(
    Math.round(axes.reduce((s, a) => s + a.you, 0) / Math.max(1, axes.length)),
  );
  const gaps = [...axes]
    .sort((a, b) => a.you - b.you || a.skill.localeCompare(b.skill))
    .filter((a) => a.you < a.required)
    .slice(0, 3)
    .map((a) => a.skill);

  const claimed = axes.filter((a) => a.tier !== null);
  const selfOnly = claimed.filter((a) => a.tier === 1);
  const missing = axes.find((a) => a.tier === null);
  const weakest = [...claimed]
    .filter((a) => a.you < a.required)
    .sort((a, b) => a.you - b.you || a.skill.localeCompare(b.skill))[0];

  const nextStep = missing
    ? `Start "${missing.skill}" — ${job.title} requires it and it isn't on your profile yet.`
    : weakest
      ? weakest.tier === 1
        ? `Add evidence for "${weakest.skill}" — a self-claim counts at half the weight of a validated skill.`
        : `Get "${weakest.skill}" endorsed by someone who saw you use it — that lifts it to full weight.`
      : `You're fully validated for ${job.title} — apply now.`;

  const reasons = [
    `${claimed.length}/${axes.length} skills ${job.title} requires are on your profile; validated strength ${score}/100.`,
    gaps.length
      ? `Biggest gaps: ${gaps.join(", ")}.`
      : "No gaps — every required skill is claimed at full validated strength.",
  ];
  if (selfOnly.length) {
    reasons.push(
      `${selfOnly.length} of those are self-claimed only — evidence (×0.8) or an endorsement (×1.0) raises their weight from ×0.5.`,
    );
  }

  const factors: ScoreFactor[] = axes.map((a) => ({
    label: a.skill,
    points: a.you,
    max: a.required,
    detail: a.tier ? TIER_LABEL[a.tier] : "Not claimed",
  }));

  // Pentagon padding — extra claimed skills the role doesn't ask for.
  const padding: RadarAxis[] = [...byName]
    .filter(([name]) => !axes.some((a) => a.skill === name))
    .map(([name, c]) => ({
      skill: name,
      you: claimStrength(c),
      required: 0,
      tier: c.tier,
    }))
    .sort((a, b) => b.you - a.you || a.skill.localeCompare(b.skill))
    .slice(0, Math.max(0, 5 - axes.length));

  return {
    score,
    reasons,
    factors,
    uncertainty:
      "Tiers 2–3 rest on user-submitted evidence and named endorsers — not yet independently verified.",
    axes: [...axes, ...padding],
    gaps,
    nextStep,
  };
}
