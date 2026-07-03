/**
 * Demo-safety snapshot (Week 3): pins the CANONICAL judge-facing numbers
 * for the mid-career demo account. Recomputes every engine from the live
 * seeded DB and compares against `demo-snapshot.json` — if seed data or
 * engine math drifts, this fails BEFORE a judge sees a weird number.
 *
 * Run (needs DB + seed):  npm run check:demo
 * Refresh after an intentional change:  npm run check:demo -- --update
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";
import { toTargetJob } from "@/lib/services/jobs.service";
import { scoreCareerHealth } from "../careerHealthEngine";
import { scoreSkillBridge } from "../skillBridgeEngine";
import { analyzeCareerStory } from "../careerStoryEngine";
import { pickBenchmark, scoreLifeImpact, type BenchmarkRow } from "../fairPayEngine";
import { simulateNextMoves } from "../nextMoveSimulator";
import { resumeCompleteness } from "@/lib/resume/completeness";
import { MID_CAREER_DEMO } from "@/lib/judge/midCareerDemo";

const FIXTURE = join(__dirname, "demo-snapshot.json");

async function computeCanonical() {
  const user = await prisma.user.findUnique({
    where: { username: MID_CAREER_DEMO.username },
    include: {
      candidateProfile: {
        include: {
          midCareer: true,
          personality: true,
          experiences: true,
          projects: true,
          certificates: true,
          awards: true,
        },
      },
      candidatesAI: true,
    },
  });
  assert(user?.candidateProfile && user.candidatesAI, "demo user must be seeded");
  const profile = user.candidateProfile;
  const ai = user.candidatesAI;
  const skills = [...new Set([...profile.skills, ...ai.currentSkills])];

  const jobs = await prisma.job.findMany({ include: { company: true } });
  const bridges = jobs
    .map((j) => ({ job: toTargetJob(j), bridge: scoreSkillBridge(toTargetJob(j), skills) }))
    .sort((a, b) => b.bridge.score - a.bridge.score || a.job.id.localeCompare(b.job.id));
  const topJobs = bridges.slice(0, 3).map(({ job, bridge }) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    requiredSkills: job.requiredSkills,
    score: bridge.score,
    matched: bridge.matched,
    missing: bridge.missing,
  }));

  const health = scoreCareerHealth({
    currentSkills: ai.currentSkills,
    skillsToImprove: ai.skillsToImprove,
    targetRoles: ai.targetRoles,
    desiredNextMove: ai.desiredNextMove,
  });

  const benchmarks = (await prisma.salaryBenchmark.findMany()) as BenchmarkRow[];
  const benchmark = pickBenchmark(
    ai.targetRoles[0] ?? "",
    ai.locationPreference ?? "",
    benchmarks,
  );
  const lifeImpact = scoreLifeImpact(
    profile.midCareer?.salaryPrivate ?? null,
    benchmark,
    profile.midCareer?.lifeFactors ?? [],
  );

  const story = analyzeCareerStory({
    experiences: profile.experiences.map((e) => ({
      role: e.role, company: e.company, period: e.period, detail: e.detail,
    })),
    careerPattern: profile.midCareer?.careerPattern ?? "",
    problemsSolved: profile.midCareer?.problemsSolved ?? [],
  });

  const moves = simulateNextMoves({
    currentSkills: ai.currentSkills,
    desiredNextMove: ai.desiredNextMove,
    topJobs: topJobs.map((t) => ({
      id: t.id, title: t.title, company: t.company, score: t.score, missing: t.missing,
    })),
    salary: profile.midCareer?.salaryPrivate ?? null,
    benchmark,
  });

  const completeness = resumeCompleteness({
    name: profile.name,
    email: user.email,
    headline: profile.headline,
    summary: profile.summary,
    field: profile.field,
    targetJob: profile.targetJob,
    skills: profile.skills,
    problemsSolved: profile.midCareer?.problemsSolved ?? [],
    careerPattern: profile.midCareer?.careerPattern ?? "",
    experiences: profile.experiences.map((e) => ({
      role: e.role, company: e.company, period: e.period, detail: e.detail,
    })),
    projects: profile.projects.map((p) => ({
      title: p.title, description: p.description, link: p.link,
    })),
    certificates: profile.certificates.map((c) => ({
      title: c.title, issuer: c.issuer, year: c.year,
    })),
    awards: profile.awards.map((a) => ({
      title: a.title, year: a.year, description: a.description,
    })),
  });

  // The canonical judge-facing numbers, in one comparable object.
  return {
    careerHealth: {
      score: health.score,
      maintained: health.maintained,
      atRisk: health.atRisk,
      decayRisk: health.decayRisk,
    },
    topJob: { id: topJobs[0].id, score: topJobs[0].score, missing: topJobs[0].missing },
    fairPay: {
      band: lifeImpact.fairPay.band,
      score: lifeImpact.fairPay.score,
      verdict: lifeImpact.verdict,
      takeHomeDeltaPct: lifeImpact.takeHomeDeltaPct,
      benchmarkRole: benchmark?.role ?? null,
      lifeNotes: lifeImpact.lifeNotes.length,
    },
    story: { pattern: story.pattern, score: story.score, hiddenStrengths: story.hiddenStrengths.length },
    nextMoves: moves.map((m) => ({
      id: m.id,
      flavor: m.flavor,
      confidence: m.score,
      difficulty: m.difficulty,
      salaryImpactPct: m.salaryImpactPct,
      timeMonths: m.timeMonths,
    })),
    archetype: profile.personality?.archetype ?? null,
    resumeCompletenessPct: completeness.pct,
  };
}

async function main() {
  const actual = await computeCanonical();

  if (process.argv.includes("--update")) {
    writeFileSync(FIXTURE, JSON.stringify(actual, null, 2) + "\n");
    console.log("Snapshot updated:", FIXTURE);
  } else {
    const expected = JSON.parse(readFileSync(FIXTURE, "utf8"));
    assert.deepEqual(actual, expected, "demo numbers drifted from the pinned snapshot");
    console.log("OK — demo snapshot stable. Judges see the pinned numbers:");
    console.log(
      `  career health ${actual.careerHealth.score} · fair pay ${actual.fairPay.band} (${actual.fairPay.verdict}) · ` +
        `moves ${actual.nextMoves.map((m) => m.confidence).join("/")} · story ${actual.story.pattern} · ` +
        `top job ${actual.topJob.id} (${actual.topJob.score})`,
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("DEMO SNAPSHOT CHECK FAILED:", e.message ?? e);
  process.exit(1);
});
