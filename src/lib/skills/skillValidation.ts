/**
 * Skill validation — the anti-gaming core. Two deterministic checks stand
 * between a claim and a higher trust tier:
 *
 *   assessEvidence   — is this evidence plausible enough to earn tier 2?
 *   assessEndorsement — is this endorsement rich enough to earn tier 3?
 *
 * Both are DETERMINISTIC keyword/shape heuristics (same input → same output,
 * CI-checkable), never random. They never hard-block: a rejection always
 * returns notes so the user can strengthen and retry. The tier is only ever
 * granted server-side (see /api/me/skills) when status is accepted/active —
 * rejected input simply isn't persisted, so `deriveTier` stays honest with
 * no extra columns.
 *
 * ponytail: this is the mock the real product replaces with an LLM call —
 * `assessEvidence(skillName, claimedLevel, content)` is already the exact
 * shape that boundary wants. Swap the body, keep the signature. The endorser
 * credibility knob is a neutral default until a social graph exists to feed
 * it real prior-endorsement / diversity counts.
 */

const LINK_RE = /(https?:\/\/|www\.|github\.com|linkedin\.com|\b\w+\.(com|org|io|dev|net)\b)/i;
const ACTION_RE =
  /\b(built|led|shipped|launched|designed|repaired|welded|managed|taught|trained|wrote|created|delivered|increased|reduced|fixed|developed|operated|installed|maintained|sold|negotiated|presented|coached|mentored|organi[sz]ed|analy[sz]ed|implemented|deployed|handled|served|cooked)\b/i;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export interface EvidenceAssessment {
  /** 0–1 plausibility. */
  confidenceScore: number;
  notes: string;
  status: "accepted" | "rejected";
}

/**
 * Score evidence on length, a verifiable artifact link, concrete specifics
 * (numbers/dates), action verbs, and whether it actually mentions the skill.
 * Trivially short "evidence" is floored so it can never reach tier 2.
 */
export function assessEvidence(
  skillName: string,
  _claimedLevel: number,
  content: string,
): EvidenceAssessment {
  const text = content.trim();
  const w = wordCount(text);

  let score = 0;
  score += Math.min(0.4, w / 40); // depth: ~40 words → full length credit
  if (LINK_RE.test(text)) score += 0.25; // a verifiable artifact
  if (/\d/.test(text)) score += 0.15; // numbers/dates = concreteness
  if (ACTION_RE.test(text)) score += 0.2; // did-a-thing signal
  if (skillName.trim() && text.toLowerCase().includes(skillName.trim().toLowerCase().split(/\s+/)[0]))
    score += 0.1; // on-topic

  // Anti-gaming floor: one-liners can't buy their way to evidence-backed.
  if (w < 6) score = Math.min(score, 0.35);
  score = clamp01(score);

  if (score < 0.4) {
    return {
      confidenceScore: round2(score),
      status: "rejected",
      notes:
        "That's too thin to verify. Say what you did, when, and add a link or a measurable result — then try again.",
    };
  }
  return {
    confidenceScore: round2(score),
    status: "accepted",
    notes:
      score > 0.7
        ? "Strong evidence — specific and verifiable. Marked evidence-backed."
        : "Accepted as evidence-backed. Add a link or concrete numbers to make it even stronger.",
  };
}

export interface EndorsementAssessment {
  qualityScore: number;
  /** active → grants tier 3; flagged/rejected → tier unchanged. */
  status: "active" | "flagged" | "rejected";
  notes: string;
}

export interface EndorserSignals {
  /** 0–1 overall endorser trust; neutral 0.6 until a social graph feeds it. */
  credibility?: number;
  /** Distinct other people who've endorsed this user — diversity beats rings. */
  distinctEndorsers?: number;
}

/**
 * Score an endorsement on the depth/specificity of the context description
 * (how/when they saw the skill), tilted by endorser credibility and endorser
 * diversity. Context-free endorsements are floored below the tier-3 line —
 * "they're great" earns nothing.
 */
export function assessEndorsement(
  context: string,
  _observedLevel: number,
  signals: EndorserSignals = {},
): EndorsementAssessment {
  const { credibility = 0.6, distinctEndorsers = 0 } = signals;
  const ctx = context.trim();
  const w = wordCount(ctx);

  let score = 0;
  score += Math.min(0.5, w / 30); // context depth: ~30 words → full credit
  if (/\d/.test(ctx)) score += 0.1; // concrete detail
  if (ACTION_RE.test(ctx)) score += 0.15; // observed a real action
  score += (credibility - 0.5) * 0.4; // ±0.2 around a neutral endorser
  score += Math.min(0.15, distinctEndorsers * 0.05); // diverse endorsers

  // Anti-gaming floor: thin context can't reach tier 3, whoever "signed" it.
  if (w < 8) score = Math.min(score, 0.5);
  score = clamp01(score);

  if (score > 0.6) {
    return {
      qualityScore: round2(score),
      status: "active",
      notes: "Endorsement verified — this skill is now endorsed.",
    };
  }
  if (score >= 0.4) {
    return {
      qualityScore: round2(score),
      status: "flagged",
      notes:
        "Almost — add a sentence on how and when they saw you use this skill to make the endorsement count.",
    };
  }
  return {
    qualityScore: round2(score),
    status: "rejected",
    notes:
      "An endorsement needs real context: who they are and a specific time they saw this skill in action.",
  };
}
