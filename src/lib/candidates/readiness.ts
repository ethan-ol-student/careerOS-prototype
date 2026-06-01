/**
 * Transparent, explainable readiness rubric.
 *
 * Principle #3 ("speak human language back to humans — no black-box
 * scores, no false precision") requires that every 0–100 signal we
 * show can be broken down into the factors that produced it. This is
 * the single source of truth for that computation: it runs on the
 * PUBLIC marketplace `Candidate` shape so the exact same breakdown is
 * available server-side (when projecting a real candidate) and
 * client-side (when explaining a score in the UI).
 *
 * It is deliberately simple arithmetic over visible profile signals —
 * NOT an opaque model. When a richer model lands, replace the body but
 * keep returning `{ score, factors }` so callers don't change.
 */

export interface ReadinessFactor {
  /** Short human label, e.g. "Portfolio evidence". */
  label: string;
  /** Points earned for this factor. */
  earned: number;
  /** Maximum points this factor can contribute. */
  max: number;
  /** One-line, human explanation of why this many points were earned. */
  detail: string;
}

export interface ReadinessBreakdown {
  /** 0–100, the sum of every factor's earned points (clamped). */
  score: number;
  factors: ReadinessFactor[];
}

/** Minimal public shape the rubric reads — matches `Candidate`. */
export interface ReadinessInput {
  headline?: string;
  careerDirection?: string;
  topSkills?: string[];
  portfolioProjects?: string[];
  growthSignal?: string;
  availability?: string;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * Compute readiness from visible profile signals, returning both the
 * score and the factor-by-factor breakdown that produced it.
 */
export function explainReadiness(input: ReadinessInput): ReadinessBreakdown {
  const skills = input.topSkills?.length ?? 0;
  const projects = input.portfolioProjects?.length ?? 0;
  const hasBasics =
    !!input.headline?.trim() && !!input.careerDirection?.trim();
  const signal = (input.growthSignal ?? "").toLowerCase();
  const avail = (input.availability ?? "").toLowerCase();

  // 1) Profile basics — has a headline and a stated direction (15).
  const basics = hasBasics ? 15 : 0;

  // 2) Skills depth — 6 pts per tracked skill, capped at 30 (5 skills).
  const skillPts = Math.min(30, skills * 6);

  // 3) Portfolio evidence — 15 pts per project, capped at 30 (2 projects).
  const portfolioPts = Math.min(30, projects * 15);

  // 4) Growth trend — derived from the momentum signal (15).
  const growthPts =
    signal === "accelerating" || signal === "compounding"
      ? 15
      : signal === "steady"
        ? 10
        : signal === "emerging"
          ? 5
          : 0;

  // 5) Availability — how reachable they are right now (10).
  const availPts =
    avail.includes("actively") || avail.includes("open to opportunities")
      ? 10
      : avail.includes("intern") || avail.includes("open to")
        ? 8
        : avail.includes("future") || avail.includes("graduat")
          ? 5
          : 0;

  const factors: ReadinessFactor[] = [
    {
      label: "Profile basics",
      earned: basics,
      max: 15,
      detail: hasBasics
        ? "Has a headline and a stated career direction."
        : "Add a headline and career direction to earn this.",
    },
    {
      label: "Skills depth",
      earned: skillPts,
      max: 30,
      detail: `${skills} tracked skill${skills === 1 ? "" : "s"} (6 pts each, capped at 30).`,
    },
    {
      label: "Portfolio evidence",
      earned: portfolioPts,
      max: 30,
      detail: `${projects} portfolio project${projects === 1 ? "" : "s"} (15 pts each, capped at 30).`,
    },
    {
      label: "Growth trend",
      earned: growthPts,
      max: 15,
      detail: input.growthSignal
        ? `Momentum signal is "${input.growthSignal}".`
        : "No growth signal yet.",
    },
    {
      label: "Availability",
      earned: availPts,
      max: 10,
      detail: input.availability
        ? `Availability: ${input.availability}.`
        : "Set your availability to earn this.",
    },
  ];

  const score = clamp(
    factors.reduce((sum, f) => sum + f.earned, 0),
  );
  return { score, factors };
}

/** Convenience: just the number (used where a breakdown isn't needed). */
export function readinessScore(input: ReadinessInput): number {
  return explainReadiness(input).score;
}
