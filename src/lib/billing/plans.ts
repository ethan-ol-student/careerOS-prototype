/**
 * Plan tiers (Feature 15 — freemium). TS source of truth for the
 * `Subscription.plan` String field, per the enum-as-String convention.
 *
 * One paid tier gates exactly three features (the mid-career monetization
 * surfaces); everything else — including the Career Health Score — stays
 * free, per the over-gating backup. Pure config: safe to import from
 * client components (the pricing page reads it directly).
 */

export const PLANS = ["free", "pro"] as const;
export type Plan = (typeof PLANS)[number];

export interface PlanInfo {
  id: Plan;
  name: string;
  priceLabel: string;
  tagline: string;
  features: string[];
}

export const PLAN_INFO: Record<Plan, PlanInfo> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    tagline: "The full career operating system.",
    features: [
      "Career Health Score + every dashboard module",
      "Jobs, easy apply & application tracker",
      "Company responsiveness leaderboard",
      "Living Portfolio, working-style profile & check-ins",
      "Next Move Navigator & Transferable Skill Map",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "$9/mo",
    tagline: "Turn insight into a concrete plan.",
    features: [
      "Everything in Free",
      "Career Report — polished PDF resume export",
      "Full Fair Pay & Salary Benchmark report",
      "Complete Skill Bridge plan (your exact missing skills)",
    ],
  },
};

/** The three Pro-gated features, named for gate checks + UI copy. */
export const PRO_FEATURES = {
  careerReport: "Career Report (PDF export)",
  fairPayReport: "Fair Pay & Salary Benchmark report",
  skillBridgePlan: "Skill Bridge plan",
} as const;
