/**
 * Fair Pay engine (mid-career) — compares the candidate's PRIVATE salary
 * against a curated, cited SalaryBenchmark row and returns an explainable
 * ScoreResult + band. Salary input is optional; without it the result is an
 * honest "unknown", never a guess.
 *
 * ponytail: banded percentile compare over curated demo data. Swap the
 * benchmark source for live market data later; keep the shape.
 */
import { lower, type ScoreResult } from "./scoringConfig";

export interface BenchmarkRow {
  role: string;
  industry: string;
  companySize: string;
  location: string;
  currency: string;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  sourceUrl: string | null;
  isDemo: boolean;
}

export type FairPayBand =
  | "unknown"
  | "below-p25"
  | "p25-p50"
  | "p50-p75"
  | "p75-p90"
  | "above-p90";

export interface FairPayResult extends ScoreResult {
  band: FairPayBand;
  benchmark: BenchmarkRow | null;
}

const tokens = (s: string) =>
  lower(s).split(/[^a-z0-9]+/).filter((t) => t.length > 1);

/**
 * Pick the most relevant benchmark for a target role + location preference.
 * Deterministic: most shared role tokens, then location tokens, then highest
 * p50, then role name. Returns null when nothing shares a role token.
 */
export function pickBenchmark(
  targetRole: string,
  locationPreference: string,
  benchmarks: BenchmarkRow[],
): BenchmarkRow | null {
  const roleT = new Set(tokens(targetRole));
  const locT = new Set(tokens(locationPreference));
  const scored = benchmarks
    .map((b) => ({
      b,
      role: tokens(b.role).filter((t) => roleT.has(t)).length,
      loc: tokens(b.location).filter((t) => locT.has(t)).length,
    }))
    .filter((x) => x.role > 0)
    .sort(
      (a, z) =>
        z.role - a.role ||
        z.loc - a.loc ||
        z.b.p50 - a.b.p50 ||
        a.b.role.localeCompare(z.b.role),
    );
  return scored[0]?.b ?? null;
}

// ── Life Impact (Fair Pay & Life Impact Calculator) ─────────────

/** Non-salary considerations mapped from MidCareerProfile.lifeFactors. */
const LIFE_FACTOR_NOTES: Record<string, string> = {
  "remote-only": "Remote-only: a move must preserve location flexibility — treat on-site offers as a real pay cut.",
  caregiver: "Caregiver responsibilities: stability and flexible hours are worth real money — weight them alongside salary.",
  "relocation-limited": "Relocation-limited: your market is your region + remote roles; benchmark locations elsewhere overstate your options.",
  "travel-heavy-ok": "Open to travel: unlocks roles that pay a premium for it.",
  "stability-first": "Stability-first: favour established employers over volatile upside.",
};

export interface LifeImpactResult extends ScoreResult {
  fairPay: FairPayResult;
  /** Salary delta to the market median, in % (null when unknown). */
  takeHomeDeltaPct: number | null;
  /** Non-salary considerations derived from life factors. */
  lifeNotes: string[];
  verdict: "smart" | "balanced" | "risky" | "unknown";
}

/**
 * Fair Pay & Life Impact: is a MOVE smart or risky — salary fairness plus
 * the non-salary factors (flexibility, stability, family, travel) that a
 * raw number ignores. Deterministic; salary optional and private.
 */
export function scoreLifeImpact(
  salary: number | null,
  benchmark: BenchmarkRow | null,
  lifeFactors: string[],
): LifeImpactResult {
  const fairPay = scoreFairPay(salary, benchmark);
  const lifeNotes = lifeFactors
    .map((f) => LIFE_FACTOR_NOTES[f])
    .filter((n): n is string => !!n);
  const constrained = lifeNotes.length > 0;

  if (fairPay.band === "unknown" || salary == null || !benchmark) {
    return {
      ...fairPay,
      fairPay,
      takeHomeDeltaPct: null,
      lifeNotes,
      verdict: "unknown",
      reasons: [
        fairPay.reasons[0],
        ...(lifeNotes.length ? [`${lifeNotes.length} life factor${lifeNotes.length === 1 ? "" : "s"} will shape any move — see below.`] : []),
      ],
    };
  }

  const deltaPct = Math.round(((benchmark.p50 - salary) / salary) * 100);
  // Verdict: underpaid + unconstrained → smart to move; well-paid → a move
  // risks a cut; constrained cases lean balanced (money isn't the whole story).
  let verdict: LifeImpactResult["verdict"];
  if (deltaPct >= 10) verdict = constrained ? "balanced" : "smart";
  else if (fairPay.band === "p75-p90" || fairPay.band === "above-p90") verdict = "risky";
  else verdict = "balanced";

  const fmtDelta = `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`;
  return {
    score: fairPay.score,
    fairPay,
    takeHomeDeltaPct: deltaPct,
    lifeNotes,
    verdict,
    reasons: [
      `Moving to the market median would change your pay by ~${fmtDelta} (${benchmark.currency} ${benchmark.p50.toLocaleString("en-US")} median).`,
      verdict === "smart"
        ? "Verdict: moving looks SMART — you're paid below market and no life factor blocks it."
        : verdict === "risky"
          ? "Verdict: moving is RISKY on pay alone — you're above market; a move should be about scope, not salary."
          : "Verdict: BALANCED — the money case is mixed, and your life factors matter as much as the number.",
      ...lifeNotes,
    ],
    uncertainty: fairPay.uncertainty,
  };
}

export function scoreFairPay(
  salary: number | null,
  benchmark: BenchmarkRow | null,
): FairPayResult {
  if (!benchmark) {
    return {
      score: 0,
      band: "unknown",
      benchmark: null,
      reasons: ["No salary benchmark matches your target role yet."],
      uncertainty: "Benchmarks are curated demo ranges, not live market data.",
    };
  }
  if (salary == null) {
    return {
      score: 0,
      band: "unknown",
      benchmark,
      reasons: [
        `Add your current salary (optional, private) to compare against the ${benchmark.role} range in ${benchmark.location}.`,
      ],
      uncertainty: "Your salary stays private — it is never shown to employers.",
    };
  }

  const { p25, p50, p75, p90, currency } = benchmark;
  const fmt = (n: number) => `${currency} ${n.toLocaleString("en-US")}`;
  let band: FairPayBand;
  let score: number;
  if (salary < p25) [band, score] = ["below-p25", 20];
  else if (salary < p50) [band, score] = ["p25-p50", 45];
  else if (salary < p75) [band, score] = ["p50-p75", 70];
  else if (salary < p90) [band, score] = ["p75-p90", 88];
  else [band, score] = ["above-p90", 97];

  const wording: Record<Exclude<FairPayBand, "unknown">, string> = {
    "below-p25": `is below the 25th percentile (${fmt(p25)}) — likely underpaid for this market.`,
    "p25-p50": `sits between the 25th (${fmt(p25)}) and median (${fmt(p50)}) — room to negotiate.`,
    "p50-p75": `sits between the median (${fmt(p50)}) and 75th percentile (${fmt(p75)}) — a fair market rate.`,
    "p75-p90": `sits between the 75th (${fmt(p75)}) and 90th percentile (${fmt(p90)}) — above market.`,
    "above-p90": `is above the 90th percentile (${fmt(p90)}) — top of this market band.`,
  };

  return {
    score,
    band,
    benchmark,
    reasons: [
      `Your salary ${wording[band]}`,
      `Benchmark: ${benchmark.role} · ${benchmark.companySize} · ${benchmark.location}${benchmark.isDemo ? " (demo data)" : ""}.`,
    ],
    uncertainty:
      "Curated, cited demo ranges — not live market data. Your salary stays private.",
  };
}
