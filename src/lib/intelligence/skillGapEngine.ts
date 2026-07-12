/**
 * Market Skill-Gap — ranks the skills the market wants that the candidate
 * lacks or under-validates. Demand is real (ingested JobStreet volume, see
 * SkillDemand); ownership is trust-weighted (the same asymmetry as the Skills
 * Truth radar — a self-claim counts less than validated proof). Pure +
 * deterministic; the route supplies the demand rows for the candidate's field.
 */
import { clampScore, type ScoreResult } from "./scoringConfig";
import { TIER_WEIGHT } from "./skillTruthEngine";
import type { CandidateSignal, SkillSignal } from "./candidateSignal";

export interface DemandRow {
  skill: string; // app-canonical (lower-case)
  demandScore: number; // 0–100
  postingCount: number;
}

export interface MarketGap {
  skill: string;
  demandScore: number;
  /** 0–1 trust-weighted ownership of the skill. */
  ownedStrength: number;
  /** demandScore × (1 − ownedStrength). */
  gap: number;
  reason: string;
}

export interface SkillGapResult extends ScoreResult {
  gaps: MarketGap[];
  nextStep: string | null;
  field: string;
}

/** Trust-weighted ownership 0–1. Evidence-only (unclaimed) earns partial credit. */
function ownedStrength(s: SkillSignal | undefined): number {
  if (!s) return 0;
  if (s.selfLevel === null) return Math.min(0.6, s.evidenceCount * 0.2);
  const w = s.tier ? TIER_WEIGHT[s.tier] : 0.5;
  return Math.min(1, (s.selfLevel / 5) * w);
}

export function scoreSkillGap(
  signal: CandidateSignal,
  demand: DemandRow[],
): SkillGapResult {
  const byCanonical = new Map(signal.skills.map((s) => [s.canonical, s]));

  const gaps: MarketGap[] = demand
    .filter((d) => d.demandScore > 0)
    .map((d) => {
      const owned = ownedStrength(byCanonical.get(d.skill));
      return {
        skill: d.skill,
        demandScore: d.demandScore,
        ownedStrength: owned,
        gap: d.demandScore * (1 - owned),
        reason: "",
      };
    })
    .filter((g) => g.gap >= 10 && g.ownedStrength < 0.8)
    .sort((a, b) => b.gap - a.gap || a.skill.localeCompare(b.skill))
    .slice(0, 6)
    .map((g) => ({
      ...g,
      reason:
        g.ownedStrength === 0
          ? `In demand (${g.demandScore}/100) and not on your radar.`
          : `In demand (${g.demandScore}/100); your validated strength here is still light.`,
    }));

  const top = gaps[0];
  const score = clampScore(top ? Math.round(top.gap) : 0);
  const nextStep = !top
    ? null
    : top.ownedStrength === 0
      ? `Add "${top.skill}" — one of the most in-demand skills you're missing.`
      : `Validate "${top.skill}" with evidence — it's in demand and light on your radar.`;

  const reasons = gaps.length
    ? [
        `${gaps.length} in-demand skill${gaps.length === 1 ? "" : "s"} to close, ranked by real market demand${signal.field ? ` in ${signal.field}` : ""}.`,
        ...gaps.slice(0, 3).map((g) => `${g.skill} — demand ${g.demandScore}/100.`),
      ]
    : ["You already cover the most in-demand skills for your field — no major market gaps."];

  return {
    score,
    reasons,
    uncertainty:
      "Demand is derived from ingested JobStreet postings weighted by the curated job catalogue — not per-occupation skills yet.",
    gaps,
    nextStep,
    field: signal.field,
  };
}
