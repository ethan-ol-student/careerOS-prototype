/**
 * Candidate Signal + Undervalued Strengths — pure, deterministic, no DB.
 * Run: `npm run check:signal` (also in CI). Asserts the connection layer
 * merges self-rating with portfolio evidence and that the first cross-feature
 * insight fires only when evidence outruns self-perception.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildCandidateSignal,
  countOccurrences,
  type CandidateSignalInput,
} from "../candidateSignal";
import { scoreUndervaluedStrengths } from "../undervaluedStrengthEngine";
import { scoreSkillGap, type DemandRow } from "../skillGapEngine";
import { scoreJobStyleFit } from "../jobStyleFitEngine";
import { analyzeNarrative } from "../narrativeThemeEngine";

const BASE: CandidateSignalInput = {
  claims: [],
  experiences: [],
  projects: [],
  problemsSolved: [],
  journal: [],
  headline: "",
  summary: "",
  archetype: null,
  archetypeScores: {},
  savedJobFields: [],
  growthIntent: [],
  field: "",
  targetRole: "",
  phase: null,
};

function run() {
  // ── countOccurrences: word-boundary, counts adjacent mentions ──
  assert.equal(countOccurrences("Python and python, PYTHON", "python"), 3);
  assert.equal(countOccurrences("pythonic scripts", "python"), 0, "no substring matches");
  assert.equal(countOccurrences("", "python"), 0);

  // ── buildCandidateSignal: merges claims + portfolio evidence ──
  const input: CandidateSignalInput = {
    ...BASE,
    claims: [
      { name: "Python", level: 2, tier: 1 }, // rated low
      { name: "Leadership", level: 5, tier: 3 }, // rated high
    ],
    projects: [
      { title: "Data pipeline in Python", description: "Built a Python ETL job" },
      { title: "ML model", description: "Trained a model with Python and SQL" },
    ],
    experiences: [
      { role: "Analyst", company: "Acme", detail: "Owned SQL reporting and Python automation" },
    ],
  };
  const signal = buildCandidateSignal(input);

  const python = signal.skills.find((s) => s.canonical === "python");
  assert.ok(python, "python present");
  assert.equal(python!.selfLevel, 2, "self-rating preserved");
  assert.ok(python!.evidenceCount >= 3, "python evidence counted across portfolio");

  // SQL is proven in the portfolio but never claimed → evidence, null self-rating.
  const sql = signal.skills.find((s) => s.canonical === "sql");
  assert.ok(sql, "sql surfaced from evidence");
  assert.equal(sql!.selfLevel, null, "unclaimed skill has null self-rating");
  assert.ok(sql!.evidenceCount >= 2, "sql evidence counted");

  // ── undervalued strengths ──
  const uv = scoreUndervaluedStrengths(signal);
  assert.ok(uv.score >= 0 && uv.score <= 100, "score in range");
  assert.ok(uv.reasons.length > 0, "reasons non-empty");
  const flagged = new Set(uv.strengths.map((s) => s.canonical));
  assert.ok(flagged.has("python"), "low-rated but proven Python is undervalued");
  assert.ok(flagged.has("sql"), "unclaimed but proven SQL is undervalued");
  assert.ok(!flagged.has("leadership"), "high self-rating is NOT flagged");
  assert.ok(uv.nextStep && uv.nextStep.length > 0, "an action is offered");

  // ── calibrated candidate → nothing undervalued ──
  const calm = buildCandidateSignal({
    ...BASE,
    claims: [{ name: "Python", level: 5, tier: 3 }],
    projects: [{ title: "x", description: "Python Python" }],
  });
  const none = scoreUndervaluedStrengths(calm);
  assert.equal(none.strengths.length, 0, "well-calibrated skills aren't flagged");
  assert.equal(none.nextStep, null, "no action when nothing is undervalued");

  // ── market skill-gap: rank by demand × (1 − trust-weighted ownership) ──
  const gapSignal = buildCandidateSignal({
    ...BASE,
    field: "Technology and software",
    claims: [{ name: "Python", level: 5, tier: 3 }], // fully owned, high demand
  });
  const demand: DemandRow[] = [
    { skill: "python", demandScore: 90, postingCount: 400 }, // owned → excluded
    { skill: "sql", demandScore: 80, postingCount: 300 }, // missing, high demand
    { skill: "docker", demandScore: 40, postingCount: 100 }, // missing, lower demand
    { skill: "welding", demandScore: 5, postingCount: 10 }, // below threshold
  ];
  const gap = scoreSkillGap(gapSignal, demand);
  assert.ok(gap.score >= 0 && gap.score <= 100, "gap score in range");
  const gapSkills = gap.gaps.map((g) => g.skill);
  assert.ok(!gapSkills.includes("python"), "fully-owned skill is not a gap");
  assert.ok(!gapSkills.includes("welding"), "low-demand skill filtered out");
  assert.equal(gap.gaps[0]?.skill, "sql", "highest demand-weighted gap ranks first");
  assert.ok(gapSkills.indexOf("sql") < gapSkills.indexOf("docker"), "ranked by demand");
  assert.ok(gap.nextStep?.includes("sql"), "next step targets the top gap");

  // ── job-style fit: correlates archetype vs field work-styles ──
  // A field profile shaped like the Builder archetype should fit Builder well
  // and Connector poorly (opposite emphases).
  const builderish = {
    "Achievement Orientation": 95,
    Innovation: 50,
    "Intellectual Curiosity": 45,
    Adaptability: 45,
    Cooperation: 30,
    "Leadership Orientation": 30,
    "Attention to Detail": 90,
    Initiative: 85,
  };
  const fitBuilder = scoreJobStyleFit("builder", builderish, "Technology and software");
  const fitConnector = scoreJobStyleFit("connector", builderish, "Technology and software");
  assert.ok(fitBuilder && fitConnector, "fit computed for known archetypes");
  assert.equal(fitBuilder!.axes.length, 8, "compass has 8 axes");
  assert.ok(fitBuilder!.fitPct > fitConnector!.fitPct, "builder fits a builder-shaped field better than connector");
  assert.ok(fitBuilder!.biasNote.includes("never affects your match score"), "bias note present");
  assert.equal(scoreJobStyleFit("nonexistent", builderish, "x"), null, "unknown archetype → null");

  // ── narrative themes: recurring journal skills, energy, proof-gap ──
  const narrative = analyzeNarrative({
    journal: [
      { date: "2026-01-01", title: "Shipped the API", reflection: "", mood: "proud", skillsTouched: ["Python"], pivot: false },
      { date: "2026-02-01", title: "More API work", reflection: "", mood: "energized", skillsTouched: ["Python"], pivot: true },
      { date: "2026-03-01", title: "On-call again", reflection: "", mood: "drained", skillsTouched: ["Kubernetes"], pivot: false },
      { date: "2026-04-01", title: "On-call still", reflection: "", mood: "drained", skillsTouched: ["Kubernetes"], pivot: false },
    ],
    portfolioText: "Built a Python data pipeline", // Python proven; Kubernetes not
  });
  assert.ok(narrative.score > 0, "narrative scored");
  const pyTheme = narrative.themes.find((t) => /python/i.test(t.theme));
  const k8sTheme = narrative.themes.find((t) => /kubernetes/i.test(t.theme));
  assert.ok(pyTheme && k8sTheme, "both recurring themes surfaced");
  assert.equal(pyTheme!.energy, "energizing", "proud+energized theme reads energizing");
  assert.equal(k8sTheme!.energy, "draining", "repeatedly-drained theme reads draining");
  assert.equal(pyTheme!.inPortfolio, true, "python proven in portfolio");
  assert.equal(k8sTheme!.inPortfolio, false, "kubernetes has no portfolio proof");
  assert.equal(narrative.pivots, 1, "one turning point counted");
  assert.ok(
    narrative.tensions.some((t) => /kubernetes/i.test(t)),
    "a proof-gap/drain tension names the unproven, draining theme",
  );
  assert.ok(narrative.nextStep, "an action is offered");

  // one-off skills (count < 2) are not themes; empty journal → onboarding nudge
  const oneOff = analyzeNarrative({
    journal: [{ date: "2026-01-01", title: "Tried Rust once", reflection: "", mood: "steady", skillsTouched: ["Rust"], pivot: false }],
    portfolioText: "",
  });
  assert.equal(oneOff.themes.length, 0, "a single mention isn't a theme");
  const empty = analyzeNarrative({ journal: [], portfolioText: "" });
  assert.equal(empty.score, 0, "empty narrative scores 0");
  assert.ok(empty.nextStep, "empty state still offers a next step");

  // ── HARD GUARDRAIL: employer match engines must NOT read archetype/style ──
  for (const path of ["marketplace/match.ts", "intelligence/candidateMatchEngine.ts"]) {
    const src = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
    assert.ok(
      !/archetype|jobStyleFit|ARCHETYPE_WORKSTYLE|personality/i.test(src),
      `${path} must not reference archetype/personality/style (bias guardrail)`,
    );
  }

  console.log("check:signal — signal + undervalued + skill-gap + style-fit + narrative + guardrail OK");
}

try {
  run();
} catch (err) {
  console.error("check:signal FAILED");
  console.error(err);
  process.exit(1);
}
