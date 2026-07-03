/**
 * Next Move Simulator (mid-career) — three explainable pathways:
 * Stay & grow · Move company · Change role/industry. Each is scored
 * deterministically from the same inputs the Career Health home already
 * fetches (skills, best-job bridges, salary benchmark).
 *
 * ponytail: static-but-scored pathway model per the backup — difficulty,
 * salary impact, gap, and time come from simple named formulas, not a
 * projection model. The "what-if 2 years" simulation is deferred.
 */
import { clampScore, type ScoreResult } from "./scoringConfig";
import type { BenchmarkRow } from "./fairPayEngine";

export interface PathwayJob {
  id: string;
  title: string;
  company: string;
  score: number; // skill-bridge coverage 0–100
  missing: string[];
}

export interface NextMoveInput {
  currentSkills: string[];
  desiredNextMove: string;
  /** Best-matching jobs (bridge-scored), strongest first. */
  topJobs: PathwayJob[];
  /** Private salary + matched benchmark; both optional. */
  salary: number | null;
  benchmark: BenchmarkRow | null;
}

export interface Pathway extends ScoreResult {
  id: "stay" | "move-company" | "change-role";
  label: string;
  flavor: "safe" | "growth" | "bold";
  difficulty: "low" | "medium" | "high";
  /** Rough salary movement vs today, in % (null = unknown). */
  salaryImpactPct: number | null;
  skillGap: string[];
  timeMonths: number;
  /** score = confidence this pathway works out, 0–100. */
}

const pct = (from: number, to: number) => Math.round(((to - from) / from) * 100);

export function simulateNextMoves(input: NextMoveInput): Pathway[] {
  const { salary, benchmark } = input;
  const best = input.topJobs[0] ?? null;
  const second = input.topJobs[1] ?? null;

  // ── 1) Stay & grow (safe): deepen the current track ──
  const stay: Pathway = {
    id: "stay",
    label: "Stay & grow",
    flavor: "safe",
    difficulty: "low",
    // Typical internal progression ≈ toward the benchmark median/p75.
    salaryImpactPct:
      salary && benchmark
        ? Math.max(3, Math.min(15, pct(salary, Math.max(salary * 1.05, benchmark.p50))))
        : null,
    skillGap: best ? best.missing.slice(0, 2) : [],
    timeMonths: 9,
    score: clampScore(70 + (best ? Math.round(best.score / 10) : 0)),
    reasons: [
      "Lowest risk: your track record and relationships compound where you are.",
      best
        ? `Deepening toward "${best.title}"-level scope needs ${best.missing.length || "no"} new skill${best.missing.length === 1 ? "" : "s"}.`
        : "Progression uses the skills you already maintain.",
      "Trade-off: slowest salary and scope change of the three.",
    ],
    uncertainty: "Assumes your current employer has headroom for growth.",
  };

  // ── 2) Move company, same role (growth): market repricing ──
  const moveImpact =
    salary && benchmark ? pct(salary, benchmark.p75) : null;
  const move: Pathway = {
    id: "move-company",
    label: "Move company",
    flavor: "growth",
    difficulty: "medium",
    salaryImpactPct: moveImpact,
    skillGap: best ? best.missing.slice(0, 3) : [],
    timeMonths: 4,
    score: clampScore(55 + (best ? Math.round(best.score / 5) : 0)),
    reasons: [
      moveImpact !== null
        ? `Market re-pricing: moving at your level typically lands near the 75th percentile (${moveImpact >= 0 ? "+" : ""}${moveImpact}% vs today).`
        : "Moving companies re-prices you at market rate (add your salary for the exact delta).",
      best
        ? `You already cover ${best.score}% of "${best.title}" at ${best.company}.`
        : "Your maintained skills transfer as-is.",
      "Trade-off: rebuilt trust and relationships from zero.",
    ],
    uncertainty: "Benchmark is a curated demo range, not a live offer.",
  };

  // ── 3) Change role/industry (bold): the transferable-skill door ──
  const target = second ?? best;
  const change: Pathway = {
    id: "change-role",
    label: "Change role / industry",
    flavor: "bold",
    difficulty: "high",
    salaryImpactPct: salary && benchmark ? pct(salary, benchmark.p50) : null,
    skillGap: target ? target.missing.slice(0, 3) : [],
    timeMonths: 12,
    score: clampScore(target ? 30 + Math.round(target.score / 2.5) : 35),
    reasons: [
      input.desiredNextMove
        ? `Aims directly at your stated move: "${input.desiredNextMove}"`
        : "Opens the widest option space of the three.",
      target
        ? `Transferable skills already cover ${target.score}% of "${target.title}" — the bridge is ${target.missing.slice(0, 3).join(", ") || "small"}.`
        : "Requires mapping your transferable skills to the new domain first.",
      "Trade-off: short-term salary usually resets toward the median while you re-prove seniority.",
    ],
    uncertainty:
      "Highest variance pathway — treat the confidence score as a floor, not a forecast.",
  };

  return [stay, move, change];
}
