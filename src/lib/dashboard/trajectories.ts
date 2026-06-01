/**
 * Career trajectory options per phase.
 *
 * Principle #1 ("see the landscape, not a single answer — surface the
 * realistic RANGE of trajectories and explain the trade-offs of each")
 * and #2 ("a career is a 40-year arc with phases, plateaus, pivots")
 * require that the dashboard show MULTIPLE realistic next moves with
 * honest trade-offs — not one linear "next phase" arrow.
 *
 * This is static, transparent guidance keyed by the normalized
 * `CareerPhase`. It is intentionally opinion-light and trade-off-heavy:
 * every option states what you gain AND what you give up, so the user
 * is choosing between landscapes, not chasing a single score.
 */

import type { CareerPhase } from "./types";

export interface TrajectoryOption {
  id: string;
  /** The move, phrased as a direction. */
  title: string;
  /** One-line description of the path. */
  summary: string;
  /** Rough time horizon for the move. */
  horizon: string;
  /** Honest trade-offs — what you gain vs. give up. */
  tradeoffs: string[];
}

const TRAJECTORIES: Record<CareerPhase, TrajectoryOption[]> = {
  student: [
    {
      id: "student-explore-broad",
      title: "Explore broadly before committing",
      summary: "Sample several fields through small projects and classes.",
      horizon: "Now – 2 years",
      tradeoffs: [
        "Gain: a wide map of what fits you and what doesn't.",
        "Give up: the head start that early specialization buys.",
      ],
    },
    {
      id: "student-go-deep",
      title: "Go deep on one craft early",
      summary: "Pick a direction now and build a focused proof of skill.",
      horizon: "Now – 3 years",
      tradeoffs: [
        "Gain: a standout portfolio and an early lead in one field.",
        "Give up: flexibility if your interests shift later.",
      ],
    },
  ],
  young_adult: [
    {
      id: "ya-internship-track",
      title: "Internship-to-offer track",
      summary: "Optimize for internships that convert to full-time roles.",
      horizon: "6 – 18 months",
      tradeoffs: [
        "Gain: real experience and a likely first job.",
        "Give up: time for open-ended exploration or side projects.",
      ],
    },
    {
      id: "ya-portfolio-builder",
      title: "Build a portfolio that speaks for you",
      summary: "Ship public projects so employers find you on evidence.",
      horizon: "6 – 24 months",
      tradeoffs: [
        "Gain: findability and proof that outlasts any single role.",
        "Give up: the steady structure of a formal program.",
      ],
    },
    {
      id: "ya-pivot-field",
      title: "Pivot toward an adjacent field",
      summary: "Redirect now while switching costs are still low.",
      horizon: "3 – 12 months",
      tradeoffs: [
        "Gain: alignment with what actually energizes you.",
        "Give up: some momentum you've already built.",
      ],
    },
  ],
  early_career: [
    {
      id: "ec-deepen-ic",
      title: "Deepen as a specialist (IC track)",
      summary: "Become the person who owns a hard problem end-to-end.",
      horizon: "1 – 3 years",
      tradeoffs: [
        "Gain: rare expertise and strong market value.",
        "Give up: breadth and early management exposure.",
      ],
    },
    {
      id: "ec-broaden-lead",
      title: "Broaden toward leadership",
      summary: "Take on coordination, mentoring, and cross-team scope.",
      horizon: "2 – 4 years",
      tradeoffs: [
        "Gain: influence and a path to management.",
        "Give up: hands-on depth in your core craft.",
      ],
    },
    {
      id: "ec-pivot-domain",
      title: "Pivot domain, keep the skill",
      summary: "Apply your existing skills in a new industry or product.",
      horizon: "6 – 18 months",
      tradeoffs: [
        "Gain: a fresh market and renewed motivation.",
        "Give up: domain credibility you'd rebuild elsewhere.",
      ],
    },
  ],
  mid_career: [
    {
      id: "mc-specialist-authority",
      title: "Become a recognized specialist",
      summary: "Convert deep experience into authority and advisory pull.",
      horizon: "2 – 5 years",
      tradeoffs: [
        "Gain: durable demand and premium positioning.",
        "Give up: the optionality of staying a generalist.",
      ],
    },
    {
      id: "mc-management",
      title: "Step into management",
      summary: "Lead people and own outcomes through a team.",
      horizon: "1 – 3 years",
      tradeoffs: [
        "Gain: larger scope and organizational impact.",
        "Give up: daily hands-on work; success is now indirect.",
      ],
    },
    {
      id: "mc-reinvent",
      title: "Reinvent before a plateau",
      summary: "Pre-empt skill decay by learning the next wave early.",
      horizon: "1 – 2 years",
      tradeoffs: [
        "Gain: relevance through the next decade.",
        "Give up: short-term comfort and earnings stability.",
      ],
    },
  ],
  senior_career: [
    {
      id: "sc-executive",
      title: "Move toward executive leadership",
      summary: "Own strategy and outcomes at the organization level.",
      horizon: "2 – 5 years",
      tradeoffs: [
        "Gain: maximum scope and influence.",
        "Give up: proximity to the craft and a calmer pace.",
      ],
    },
    {
      id: "sc-advisory",
      title: "Advisory & board roles",
      summary: "Convert experience into part-time, high-leverage seats.",
      horizon: "1 – 3 years",
      tradeoffs: [
        "Gain: flexibility and portfolio income.",
        "Give up: the steady authority of an operating role.",
      ],
    },
    {
      id: "sc-mentor",
      title: "Mentorship & multiplier roles",
      summary: "Scale your impact by growing the next cohort.",
      horizon: "Ongoing",
      tradeoffs: [
        "Gain: legacy and a widening network.",
        "Give up: the spotlight on your own output.",
      ],
    },
  ],
  executive: [
    {
      id: "ex-portfolio",
      title: "Portfolio of board & consulting work",
      summary: "Spread experience across several organizations.",
      horizon: "Ongoing",
      tradeoffs: [
        "Gain: variety, autonomy, and reach.",
        "Give up: deep ownership of any single outcome.",
      ],
    },
    {
      id: "ex-legacy",
      title: "Legacy & institution-building",
      summary: "Invest in people, standards, and things that outlast you.",
      horizon: "5+ years",
      tradeoffs: [
        "Gain: lasting impact beyond your tenure.",
        "Give up: near-term, individually-attributed wins.",
      ],
    },
    {
      id: "ex-winddown",
      title: "Gradual, intentional wind-down",
      summary: "Step back on your terms while staying selectively engaged.",
      horizon: "Flexible",
      tradeoffs: [
        "Gain: time and balance.",
        "Give up: the pace and pull of full-time leadership.",
      ],
    },
  ],
};

export function getTrajectories(phase: CareerPhase): TrajectoryOption[] {
  return TRAJECTORIES[phase] ?? [];
}
