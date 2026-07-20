import type { CompanyMetrics } from "@/lib/services/companies.service";

/**
 * Presentation-layer enrichment for the employer browse cards. The DB has
 * no partner tier / rating / followers fields yet, so — exactly like the
 * `demoScore` fallback in companies.service — we DERIVE these signals
 * deterministically from the real metrics (responseScore, jobCount) + a
 * stable name hash. Same value every reload; the card still carries the
 * "Demo data" badge so nothing reads as a real, verified claim.
 *
 * Swap these for real Company columns when the schema grows them — the
 * card only consumes `CompanyPresentation`, so nothing else changes.
 */

export type PartnerTier = "Platinum" | "Gold" | "Silver" | "Bronze";

export interface CompanyPresentation {
  tier: PartnerTier;
  /** Gold/Platinum get the premium banner strip. */
  premium: boolean;
  rating: number; // 3.6–4.9
  followers: string; // "15k"
  partnerYears: number; // 3–14
  repliesDays: number; // 1 | 2 | 3 | 5
  fastResponder: boolean;
  graduatesChoice: boolean;
  hiringAtScale: boolean;
  whatsSpecial: string[]; // ≤ 2
}

const SPECIAL_POOL = [
  "Award-winning culture",
  "Fast-track promotions",
  "Remote-friendly",
  "Strong mentorship",
  "Learning budget",
  "Global mobility",
  "Diverse teams",
  "Flexible hours",
];

const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

export function tierOf(score: number): PartnerTier {
  return score >= 85 ? "Platinum" : score >= 75 ? "Gold" : score >= 63 ? "Silver" : "Bronze";
}

export function presentCompany(c: CompanyMetrics): CompanyPresentation {
  const h = hash(c.name);
  const score = c.responseScore;
  const tier = tierOf(score);
  const special = SPECIAL_POOL[h % SPECIAL_POOL.length];
  const special2 = SPECIAL_POOL[(h + 3) % SPECIAL_POOL.length];
  return {
    tier,
    premium: tier === "Gold" || tier === "Platinum",
    rating: Math.round((3.6 + (score / 100) * 1.3) * 10) / 10,
    followers: `${2 + (h % 30)}k`,
    partnerYears: 3 + (h % 12),
    repliesDays: score >= 85 ? 1 : score >= 72 ? 2 : score >= 60 ? 3 : 5,
    fastResponder: score >= 78,
    graduatesChoice: h % 2 === 0,
    hiringAtScale: c.jobCount >= 15,
    whatsSpecial: special === special2 ? [special] : [special, special2],
  };
}
