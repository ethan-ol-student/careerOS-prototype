/**
 * Skill validation + market-value checks — pure, deterministic, no DB. Runs
 * in CI via `npm run check:skills`. The anti-gaming invariants as asserts:
 * thin evidence/endorsements can't buy a higher tier, and volume of
 * self-claims can't out-value real validation.
 */
import assert from "node:assert/strict";
import { assessEvidence, assessEndorsement } from "../skillValidation";
import { marketValue } from "@/lib/intelligence/skillTruthEngine";
import type { SkillClaimInput } from "@/lib/intelligence/skillTruthEngine";

function main() {
  // ── Evidence: too thin is rejected, specific+verifiable is accepted ──
  const thin = assessEvidence("Welding", 4, "i can weld");
  assert.equal(thin.status, "rejected", "one-liner evidence rejected");
  assert.ok(thin.confidenceScore < 0.4, "rejected score below 0.4");

  const strong = assessEvidence(
    "Welding",
    4,
    "In 2023 I welded the structural frame for a 12m pedestrian bridge, MIG and TIG, passing inspection first time. Certificate: https://example.com/cert.",
  );
  assert.equal(strong.status, "accepted", "detailed + linked evidence accepted");
  assert.ok(strong.confidenceScore > 0.7, "strong evidence scores high");

  // Determinism — same input, same score.
  assert.deepEqual(assessEvidence("Welding", 4, "i can weld"), thin, "evidence deterministic");

  // ── Endorsement: context-free can't reach tier 3, rich context can ──
  const empty = assessEndorsement("", 4);
  assert.equal(empty.status, "rejected", "no context → rejected");

  const vague = assessEndorsement("great worker", 4);
  assert.notEqual(vague.status, "active", "vague context can't earn tier 3");

  const rich = assessEndorsement(
    "I managed her for 2 years at the clinic; she led triage during the 2022 surge and trained 4 new nurses on the protocol.",
    4,
  );
  assert.equal(rich.status, "active", "specific first-hand context earns tier 3");
  assert.ok(rich.qualityScore > 0.6, "rich endorsement above threshold");

  // ── Market value: validation beats volume ──
  assert.equal(marketValue([]).label, "Getting started", "no skills → getting started");

  const selfClaimed: SkillClaimInput[] = Array.from({ length: 6 }, (_, i) => ({
    name: `skill${i}`,
    level: 5,
    tier: 1,
  }));
  const endorsed: SkillClaimInput[] = selfClaimed.map((c) => ({ ...c, tier: 3 }));
  assert.ok(
    marketValue(endorsed).score > marketValue(selfClaimed).score,
    "6 endorsed skills out-value 6 identical self-claims",
  );
  assert.deepEqual(marketValue(selfClaimed), marketValue(selfClaimed), "market value deterministic");

  console.log("OK — skill validation + market value checks passed.");
}

main();
