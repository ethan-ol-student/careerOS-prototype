/**
 * Job-Style Fit — how the candidate's working-style archetype lines up with the
 * typical role in their field (O*NET work styles, aggregated from real matched
 * postings). Pearson correlation across the 8 compass axes → do you emphasize
 * what the field emphasizes?
 *
 * HARD GUARDRAIL: this is CANDIDATE-FACING context only. The archetype is never
 * an employer match input or filter (see scoringConfig + the Bias Check note
 * below, and the guardrail assertion in __checks__/candidateSignal.check.ts).
 */
import {
  ARCHETYPE_WORKSTYLE,
  ARCHETYPES,
  COMPASS_STYLES,
  clampScore,
  type CompassStyle,
} from "./scoringConfig";
import type { ScoreResult } from "./scoringConfig";

export interface CompassAxis {
  style: CompassStyle;
  /** 0–100 — the archetype's lean on this style. */
  you: number;
  /** 0–100 — the field's typical role lean on this style. */
  role: number;
}

export interface JobStyleFit extends ScoreResult {
  archetype: string;
  archetypeName: string;
  field: string;
  fitPct: number;
  axes: CompassAxis[];
  biasNote: string;
}

const BIAS_NOTE =
  "Working-style fit is context for you only — it never affects your match score and employers never see it as a screen.";

/** Pearson correlation of two equal-length vectors, or 0 when undefined. */
function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - ma;
    const db = b[i] - mb;
    cov += da * db;
    va += da * da;
    vb += db * db;
  }
  if (va === 0 || vb === 0) return 0;
  return cov / Math.sqrt(va * vb);
}

export function scoreJobStyleFit(
  archetype: string,
  fieldStyles: Record<string, number>,
  field: string,
): JobStyleFit | null {
  const you = ARCHETYPE_WORKSTYLE[archetype];
  if (!you) return null;

  const axes: CompassAxis[] = COMPASS_STYLES.map((style) => ({
    style,
    you: you[style],
    role: clampScore(fieldStyles[style] ?? 0),
  }));

  const r = pearson(
    axes.map((a) => a.you),
    axes.map((a) => a.role),
  );
  const fitPct = clampScore(((r + 1) / 2) * 100);

  const archetypeName = ARCHETYPES[archetype]?.name ?? archetype;
  // Strongest shared emphasis (both high) and biggest divergence, for copy.
  const shared = [...axes].sort((x, y) => y.you + y.role - (x.you + x.role))[0];
  const diverge = [...axes].sort(
    (x, y) => Math.abs(y.you - y.role) - Math.abs(x.you - x.role),
  )[0];

  const band =
    fitPct >= 70 ? "a strong match" : fitPct >= 50 ? "a fair match" : "a stretch";
  const reasons = [
    `As ${archetypeName}, your working style is ${band} for the typical role in ${field || "your field"} (${fitPct}%).`,
    `Shared strength: ${shared.style}.`,
    diverge.you > diverge.role
      ? `You lean harder on ${diverge.style} than these roles typically ask.`
      : `These roles lean on ${diverge.style} more than your style does.`,
  ];

  return {
    score: fitPct,
    reasons,
    uncertainty:
      "Role styles are aggregated from O*NET work styles for occupations matched to real postings — a field-level signal, not a specific employer.",
    archetype,
    archetypeName,
    field,
    fitPct,
    axes,
    biasNote: BIAS_NOTE,
  };
}
