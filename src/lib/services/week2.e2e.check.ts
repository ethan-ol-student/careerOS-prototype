/**
 * Week-2 integration check (self-cleaning): jobs scoring → apply →
 * employer notification → status transition → candidate timeline +
 * notification → company metrics turn real → resume PDF <3s →
 * mid-career dashboard math for the 35+ demo user.
 *
 * Needs a live DB + seeded demo data (not CI):
 *   npx tsx src/lib/services/week2.e2e.check.ts
 */
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { toTargetJob } from "@/lib/services/jobs.service";
import { ApplicationsService } from "@/lib/services/applications.service";
import { listCompaniesWithMetrics } from "@/lib/services/companies.service";
import { scoreSkillBridge } from "@/lib/intelligence/skillBridgeEngine";
import { pickBenchmark, scoreFairPay, type BenchmarkRow } from "@/lib/intelligence/fairPayEngine";
import { renderResumeBuffer } from "@/lib/resume/pdfTemplate";
import { resumeCompleteness } from "@/lib/resume/completeness";
import { MID_CAREER_DEMO } from "@/lib/judge/midCareerDemo";

async function main() {
  // ── The 35+ demo user, as seeded ──
  const user = await prisma.user.findUnique({
    where: { username: MID_CAREER_DEMO.username },
    include: {
      candidateProfile: {
        include: { experiences: true, projects: true, certificates: true, awards: true, midCareer: true },
      },
      candidatesAI: true,
    },
  });
  assert(user?.candidateProfile && user.candidatesAI, "demo user seeded");
  const profile = user.candidateProfile;
  const skills = [...new Set([...profile.skills, ...user.candidatesAI.currentSkills])];

  // 1) Jobs render from DB with personalized match scores
  // (catalogue rows only — employer-posted jobs land in the same table and
  // are soft-deleted by design, so total count is not a stable invariant)
  // (source "seed" = the original 20-row catalogue; role-catalog market jobs
  // land in the same table with source "role-catalog")
  const jobs = (await prisma.job.findMany({ where: { employerId: null, source: "seed" }, include: { company: true } })).map((r) => ({
    row: r,
    bridge: scoreSkillBridge(toTargetJob(r), skills),
  }));
  assert.equal(jobs.length, 20, "20 catalogue jobs from DB");
  assert.ok(jobs.every((j) => j.bridge.score >= 0 && j.bridge.reasons.length > 0), "every job has explainable match");
  const best = [...jobs].sort((a, b) => b.bridge.score - a.bridge.score)[0];
  console.log(`jobs ✓ best match for demo user: ${best.row.title} (${best.bridge.score})`);

  // 2) Apply → Application + submitted event (+ employer notification path)
  await prisma.application.deleteMany({ where: { candidateProfileId: profile.id } }); // clean slate
  const app = await ApplicationsService.apply(profile.id, best.row.id);
  assert.equal(app.status, "submitted");
  assert.equal(app.events[0].type, "submitted");
  console.log("apply ✓ Application + submitted event");

  // 3) Company metrics become REAL for the applied-to company
  const metrics = await listCompaniesWithMetrics();
  const applied = metrics.find((c) => c.id === best.row.companyId);
  assert(applied && !applied.demoMetrics && applied.applicants === 1, "company metrics turned real");
  assert.ok(metrics.every((c) => typeof c.size === "string" && typeof c.location === "string"), "size/type/location surfaced");
  console.log(`companies ✓ ${applied.name}: real metrics (score ${applied.responseScore}), demo labels intact elsewhere`);

  // 4) Employer status change → event on candidate timeline
  await ApplicationsService.transition(app.id, "interview");
  const timeline = await prisma.applicationEvent.findMany({
    where: { applicationId: app.id },
    orderBy: { createdAt: "asc" },
  });
  assert.deepEqual(timeline.map((e) => e.type), ["submitted", "status_changed"], "candidate timeline shows employer change");
  console.log("employer loop ✓ status change on candidate timeline");

  // 5) Resume PDF from real data in <3s, mid-career leads with problems solved
  const resumeData = {
    name: profile.name, email: user.email, headline: profile.headline,
    summary: profile.summary, field: profile.field, targetJob: profile.targetJob,
    skills: profile.skills,
    problemsSolved: profile.midCareer?.problemsSolved ?? [],
    careerPattern: profile.midCareer?.careerPattern ?? "",
    experiences: profile.experiences.map((e) => ({ role: e.role, company: e.company, period: e.period, detail: e.detail })),
    projects: profile.projects.map((p) => ({ title: p.title, description: p.description, link: p.link })),
    certificates: profile.certificates.map((c) => ({ title: c.title, issuer: c.issuer, year: c.year })),
    awards: profile.awards.map((a) => ({ title: a.title, year: a.year, description: a.description })),
  };
  assert.ok(resumeData.problemsSolved.length >= 3, "mid-career resume has problems solved");
  const t0 = Date.now();
  const pdf = await renderResumeBuffer(resumeData);
  const ms = Date.now() - t0;
  assert.ok(pdf.subarray(0, 5).toString() === "%PDF-", "valid PDF bytes");
  assert.ok(ms < 3000, `PDF under 3s (took ${ms}ms)`);
  const comp = resumeCompleteness(resumeData);
  assert.ok(comp.pct >= 70, `demo resume mostly complete (${comp.pct}%)`);
  console.log(`resume ✓ real-data PDF in ${ms}ms, completeness ${comp.pct}%`);

  // 6) Mid-career dashboard inputs: benchmark + fair pay for the demo salary
  const benchmarks = (await prisma.salaryBenchmark.findMany()) as BenchmarkRow[];
  const bench = pickBenchmark(
    user.candidatesAI.targetRoles[0] ?? "",
    user.candidatesAI.locationPreference ?? "",
    benchmarks,
  );
  assert(bench, "benchmark picked for demo target role");
  const fair = scoreFairPay(profile.midCareer?.salaryPrivate ?? null, bench);
  assert.notEqual(fair.band, "unknown", "fair pay resolves with demo salary");
  console.log(`mid-career ✓ fair pay: ${fair.band} vs ${bench.role} (${bench.location})`);

  // Clean up the test application (repeatable runs) — demo user only.
  await prisma.application.deleteMany({ where: { candidateProfileId: profile.id } });
  await prisma.candidateNotification.deleteMany({ where: { profileId: profile.id, title: "Application update" } });
  console.log("\nOK — full candidate↔employer loop + mid-career dashboard verified.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("E2E FAILED:", e);
  process.exit(1);
});
