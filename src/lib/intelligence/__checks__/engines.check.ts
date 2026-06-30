/**
 * Intelligence engine checks — pure, deterministic, no DB. Runs in CI via
 * `npm run check:intelligence`. Asserts every engine returns a valid shared
 * ScoreResult (score 0–100 + non-empty reasons[]) and that the mid-career
 * engines produce Career Health + transferable-skill + skill-bridge outputs
 * for the demo profile.
 */
import assert from "node:assert/strict";
import { MID_CAREER_DEMO } from "@/lib/judge/midCareerDemo";
import { MOCK_CANDIDATES } from "@/lib/candidates/data";
import type { TargetJob } from "@/lib/jobs/data";
import type { ScoreResult } from "../scoringConfig";
import { scoreCareer } from "../careerScoreEngine";
import { scoreCandidateMatch } from "../candidateMatchEngine";
import { scoreCareerHealth } from "../careerHealthEngine";
import { scoreTransferableSkills } from "../transferableSkillEngine";
import { scoreSkillBridge } from "../skillBridgeEngine";

function assertScoreResult(name: string, r: ScoreResult) {
  assert.ok(Number.isInteger(r.score), `${name}: score must be an integer`);
  assert.ok(r.score >= 0 && r.score <= 100, `${name}: score in 0–100`);
  assert.ok(r.reasons.length > 0, `${name}: reasons[] must be non-empty`);
}

function main() {
  const ai = MID_CAREER_DEMO.ai;

  // 1) Career readiness (wraps the readiness rubric)
  const c0 = MOCK_CANDIDATES[0];
  const career = scoreCareer({
    headline: c0.headline,
    careerDirection: c0.careerDirection,
    topSkills: c0.topSkills,
    portfolioProjects: c0.portfolioProjects,
    growthSignal: c0.growthSignal,
    availability: c0.availability,
  });
  assertScoreResult("careerScore", career);

  // 2) Candidate match (wraps explainMatch)
  const match = scoreCandidateMatch(c0, {
    targetRoles: [c0.targetRole],
    requiredSkills: c0.topSkills.slice(0, 2),
    industries: [c0.industry],
    candidateGreenFlags: ["portfolio", "learning"],
  });
  assertScoreResult("candidateMatch", match);

  // 3) Career Health — mid-career demo profile
  const health = scoreCareerHealth({
    currentSkills: ai.currentSkills,
    skillsToImprove: ai.skillsToImprove,
    targetRoles: ai.targetRoles,
    desiredNextMove: ai.desiredNextMove,
  });
  assertScoreResult("careerHealth", health);
  assert.equal(health.maintained.length, 3, "3 maintained skills for the demo");
  assert.equal(health.atRisk.length, 5, "5 at-risk skills for the demo");
  assert.ok(health.decayRisk > 0 && health.decayRisk < 100, "decayRisk in (0,100)");
  assert.equal(health.factors?.length, 3, "3 factors");

  // 4) Transferable skills — demo skills vs a target skill set
  const transfer = scoreTransferableSkills({
    currentSkills: ai.currentSkills,
    targetSkills: ["Kubernetes", "System Design", "Rust", "Go"],
    targetLabel: "Principal Engineer",
  });
  assertScoreResult("transferableSkills", transfer);
  assert.ok(transfer.transferable.length > 0, "some skills transfer");
  assert.equal(transfer.coveredTargets.length, 3, "covers 3/4 targets");
  assert.equal(transfer.score, 75, "75% coverage");

  // 5) Skill bridge — partial coverage of a target job
  const job: TargetJob = {
    id: "demo-principal",
    title: "Principal Engineer",
    company: "Northwind Pay",
    location: "Remote",
    duration: "Full-time",
    field: "Technology and software",
    requiredSkills: ["kubernetes", "system design", "rust", "leadership coaching"],
    baseMatch: 80,
  };
  const bridge = scoreSkillBridge(job, ai.currentSkills);
  assertScoreResult("skillBridge", bridge);
  assert.equal(bridge.score, 50, "2/4 met → 50");
  assert.deepEqual(bridge.missing.sort(), ["leadership coaching", "rust"], "exact bridge gap");
  assert.equal(bridge.complete, false);

  // 6) Determinism — identical inputs → identical outputs
  assert.deepEqual(
    scoreCareerHealth({
      currentSkills: ai.currentSkills,
      skillsToImprove: ai.skillsToImprove,
      targetRoles: ai.targetRoles,
      desiredNextMove: ai.desiredNextMove,
    }),
    health,
    "careerHealth is deterministic",
  );

  console.log("OK — intelligence engine checks passed (5 engines, deterministic).");
}

main();
