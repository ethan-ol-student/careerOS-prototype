/**
 * Candidate Signal — the connection layer.
 *
 * Turns the five isolated candidate modules (Skill Radar, Living Portfolio,
 * Working Style Quiz, Jobs, Life Chapter Designer) into ONE normalized object
 * every cross-feature intelligence engine reads. Pure + deterministic: the
 * server loader (`signal.loader.ts`) maps Prisma rows into `CandidateSignalInput`,
 * and `buildCandidateSignal` does the normalization here so it stays unit-checkable.
 *
 * The key derived quantity is per-skill EVIDENCE: how often a skill actually
 * shows up in the candidate's portfolio text (experiences, projects, problems
 * solved). Comparing that evidence to the Skill Radar's self-rating is what
 * powers "undervalued strengths" and the tri-layer radar — self-perception vs
 * proof, which no single module can see on its own.
 */
import { normalizeSkill } from "@/lib/jobs/data";
import { extractSkillsFromText } from "@/lib/skills/taxonomy";
import type { CareerPhase } from "@/lib/dashboard/types";

export type TrustTier = 1 | 2 | 3;

export interface SkillSignal {
  /** Canonical (lower-case) key for matching. */
  canonical: string;
  /** Human display name (the candidate's own wording when claimed). */
  display: string;
  /** Skill Radar self-rating 1–5, or null when the skill isn't claimed. */
  selfLevel: number | null;
  /** Trust tier 1–3, or null when not claimed. */
  tier: TrustTier | null;
  /** Times the skill appears in portfolio evidence text. */
  evidenceCount: number;
}

/** One Timeline Journal entry, normalized for the narrative engine. */
export interface JournalSignal {
  date: string;
  title: string;
  reflection: string;
  /** "" | energized | steady | drained | proud | uncertain */
  mood: string;
  skillsTouched: string[];
  pivot: boolean;
}

export interface CandidateSignal {
  skills: SkillSignal[];
  /** Concatenated portfolio prose the evidence counts were mined from. */
  portfolioText: string;
  /** Timeline Journal entries — the narrativeThemeEngine's source. */
  journal: JournalSignal[];
  archetype: string | null;
  archetypeScores: Record<string, number>;
  /** Distinct `Job.field` values from applied jobs (proxy for interest). */
  savedJobFields: string[];
  /** Skills the candidate said they want to grow (CandidatesAI). */
  growthIntent: string[];
  field: string;
  targetRole: string;
  phase: CareerPhase | null;
}

/** Plain data the server loader fills — no Prisma types, so the builder is pure. */
export interface CandidateSignalInput {
  claims: { name: string; level: number; tier: number }[];
  experiences: { role?: string | null; company?: string | null; detail?: string | null }[];
  projects: { title?: string | null; description?: string | null }[];
  problemsSolved: string[];
  journal: JournalSignal[];
  headline: string;
  summary: string;
  archetype: string | null;
  archetypeScores: Record<string, number>;
  savedJobFields: string[];
  growthIntent: string[];
  field: string;
  targetRole: string;
  phase: CareerPhase | null;
}

function asTier(t: number): TrustTier | null {
  return t === 1 || t === 2 || t === 3 ? t : null;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Word-boundary, case-insensitive occurrence count. A trailing-boundary
 * lookahead (not a consuming group) so adjacent mentions both count.
 */
export function countOccurrences(text: string, term: string): number {
  const t = term.trim();
  if (!t) return 0;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRe(t.toLowerCase())}(?=$|[^a-z0-9])`, "g");
  const hay = text.toLowerCase();
  let n = 0;
  while (re.exec(hay) !== null) n++;
  return n;
}

/**
 * Merge the five modules into one normalized signal. Skills come from the
 * union of (a) Skill Radar claims and (b) taxonomy skills detected in the
 * portfolio text — so a skill proven in projects but never added to the radar
 * still surfaces (evidence with a null self-rating).
 */
export function buildCandidateSignal(input: CandidateSignalInput): CandidateSignal {
  const portfolioText = [
    input.headline,
    input.summary,
    ...input.experiences.map((e) =>
      [e.role, e.company, e.detail].filter(Boolean).join(" "),
    ),
    ...input.projects.map((p) => [p.title, p.description].filter(Boolean).join(" ")),
    ...input.problemsSolved,
  ]
    .filter(Boolean)
    .join("  ")
    .trim();

  const byCanonical = new Map<string, SkillSignal>();

  // 1) Skill Radar claims — the self-rating layer.
  for (const c of input.claims) {
    const canonical = normalizeSkill(c.name);
    if (!canonical) continue;
    byCanonical.set(canonical, {
      canonical,
      display: c.name.trim() || canonical,
      selfLevel: Math.min(5, Math.max(1, Math.round(c.level))),
      tier: asTier(c.tier),
      evidenceCount: 0,
    });
  }

  // 2) Taxonomy skills proven in portfolio text but not (yet) on the radar.
  for (const skill of extractSkillsFromText(portfolioText)) {
    const canonical = normalizeSkill(skill);
    if (byCanonical.has(canonical)) continue;
    byCanonical.set(canonical, {
      canonical,
      display: skill,
      selfLevel: null,
      tier: null,
      evidenceCount: 0,
    });
  }

  // 3) Evidence count for every skill (claimed or detected).
  for (const s of byCanonical.values()) {
    s.evidenceCount = countOccurrences(portfolioText, s.display);
  }

  const skills = [...byCanonical.values()].sort(
    (a, b) => b.evidenceCount - a.evidenceCount || a.canonical.localeCompare(b.canonical),
  );

  return {
    skills,
    portfolioText,
    journal: input.journal,
    archetype: input.archetype,
    archetypeScores: input.archetypeScores,
    savedJobFields: [...new Set(input.savedJobFields.filter(Boolean))],
    growthIntent: input.growthIntent,
    field: input.field,
    targetRole: input.targetRole,
    phase: input.phase,
  };
}
