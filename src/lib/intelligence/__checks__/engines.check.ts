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
import { pickBenchmark, scoreFairPay, scoreLifeImpact, type BenchmarkRow } from "../fairPayEngine";
import { analyzeCareerStory } from "../careerStoryEngine";
import { scoreQuiz, QUIZ_QUESTIONS } from "../personalityEngine";
import { ARCHETYPES } from "../scoringConfig";
import { candidateInsight } from "../employerCandidateInsightEngine";
import { simulateNextMoves } from "../nextMoveSimulator";

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

  // 6) Fair Pay — banded percentile compare, optional salary honored
  const benchmarks: BenchmarkRow[] = [
    {
      role: "Machine Learning Engineer", industry: "Technology",
      companySize: "enterprise", location: "Remote-US", currency: "USD",
      p25: 160000, p50: 200000, p75: 245000, p90: 300000,
      sourceUrl: null, isDemo: true,
    },
    {
      role: "Product Manager", industry: "Technology",
      companySize: "midsize", location: "Remote-US", currency: "USD",
      p25: 130000, p50: 160000, p75: 195000, p90: 235000,
      sourceUrl: null, isDemo: true,
    },
  ];
  const picked = pickBenchmark("Principal Engineer", "Remote (US)", benchmarks);
  assert.equal(picked?.role, "Machine Learning Engineer", "role-token match wins");
  const fair = scoreFairPay(185000, picked);
  assertScoreResult("fairPay", fair);
  assert.equal(fair.band, "p25-p50", "185k lands between p25 and p50");
  const noSalary = scoreFairPay(null, picked);
  assert.equal(noSalary.band, "unknown", "no salary → honest unknown, never a guess");

  // 7) Career story — pattern detection + hidden strengths for the demo
  const story = analyzeCareerStory({
    experiences: MID_CAREER_DEMO.experiences,
    careerPattern: "",
    problemsSolved: MID_CAREER_DEMO.midCareer.problemsSolved,
  });
  assertScoreResult("careerStory", story);
  assert.equal(story.pattern, "specialist", "3 engineer roles → specialist");
  assert.ok(story.hiddenStrengths.length >= 3, "problems solved surface as strengths");

  // 8) Personality quiz — deterministic archetype, all-builder answers win
  const builderAnswers = Object.fromEntries(QUIZ_QUESTIONS.map((q) => [q.id, "a"]));
  const quiz = scoreQuiz(builderAnswers);
  assert.equal(quiz.archetype, "builder", "all-'a' answers → builder");
  assert.ok(ARCHETYPES[quiz.archetype], "archetype id resolves to a definition");
  assert.deepEqual(scoreQuiz(builderAnswers), quiz, "quiz scoring is deterministic");
  assert.ok(
    quiz.reasons.some((r) => r.includes("never changes match scores")),
    "descriptive-only guardrail copy present",
  );

  // 9) Employer insight — signal map + confidence + interview kit
  const insight = candidateInsight(c0);
  assertScoreResult("candidateInsight", insight);
  assert.ok(insight.strengths.length > 0, "strengths found");
  assert.ok(insight.interviewKit.length >= 2, "interview kit generated");

  // 10) Next Move Simulator — 3 explainable pathways for the demo user
  const moves = simulateNextMoves({
    currentSkills: ai.currentSkills,
    desiredNextMove: ai.desiredNextMove,
    topJobs: [
      { id: "j1", title: "Platform Engineer", company: "Atlassian", score: 50, missing: ["kubernetes", "ci cd"] },
      { id: "j2", title: "Backend Engineer", company: "Stripe", score: 50, missing: ["api design", "databases"] },
    ],
    salary: MID_CAREER_DEMO.midCareer.salaryPrivate,
    benchmark: benchmarks[0],
  });
  assert.equal(moves.length, 3, "exactly 3 pathways");
  assert.deepEqual(moves.map((m) => m.flavor), ["safe", "growth", "bold"], "safe/growth/bold");
  for (const m of moves) {
    assertScoreResult(`pathway:${m.id}`, m);
    assert.ok(m.timeMonths > 0 && ["low", "medium", "high"].includes(m.difficulty));
  }

  // 11) Life impact — verdict + take-home delta + life factors honored
  const impact = scoreLifeImpact(150000, benchmarks[0], ["remote-only", "caregiver"]);
  assertScoreResult("lifeImpact", impact);
  assert.equal(impact.verdict, "balanced", "underpaid but constrained → balanced");
  assert.ok(impact.takeHomeDeltaPct !== null && impact.takeHomeDeltaPct > 0, "positive delta to median");
  assert.equal(impact.lifeNotes.length, 2, "both life factors surfaced");
  assert.equal(
    scoreLifeImpact(150000, benchmarks[0], []).verdict,
    "smart",
    "underpaid + unconstrained → smart",
  );
  assert.equal(scoreLifeImpact(null, benchmarks[0], []).verdict, "unknown", "no salary → honest unknown");

  // 12) Determinism — identical inputs → identical outputs
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

  console.log("OK — intelligence engine checks passed (11 engines, deterministic).");
}

main();
