/**
 * Job-post lifecycle check (self-cleaning, live DB):
 * post → apply → NOT fulfilled on offer alone → NOT fulfilled on message
 * alone → fulfilled when offer + message both hold → expiry sweep flips
 * stale posts → neither leaves in the public feed. Soft-delete only.
 *
 *   npm run check:job-lifecycle
 */
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { JobsService, JOB_TTL_MS } from "@/lib/services/jobs.service";
import { ApplicationsService } from "@/lib/services/applications.service";

const TAG = `jlc-${Date.now()}`;

async function main() {
  // ── Temp fixtures: one employer, one candidate (+ marketplace projection) ──
  const employerUser = await prisma.user.create({
    data: {
      email: `${TAG}-employer@check.local`,
      role: "EMPLOYER",
      employerProfile: { create: { organizationName: `${TAG} Co` } },
    },
    include: { employerProfile: true },
  });
  const employer = employerUser.employerProfile!;

  const candidateUser = await prisma.user.create({
    data: {
      email: `${TAG}-candidate@check.local`,
      role: "CANDIDATE",
      candidateProfile: { create: {} },
      marketplaceCandidate: {
        create: {
          id: `real-${TAG}`,
          name: "Check Candidate",
          careerDirection: "check",
          targetRole: "check",
          industry: "check",
          category: "Technology",
          matchScore: 50,
          readinessScore: 50,
          growthSignal: "Steady",
          topSkills: [],
          portfolioProjects: [],
          whyRecommended: "check",
          location: "check",
          availability: "Actively looking",
          headline: "check",
          stage: "check",
          source: "real",
        },
      },
    },
    include: { candidateProfile: true, marketplaceCandidate: true },
  });
  const profile = candidateUser.candidateProfile!;
  const projection = candidateUser.marketplaceCandidate!;

  const company = await prisma.company.create({
    data: { name: `${TAG} Co` },
  });

  try {
    // 1) Post a job (as POST /api/employer/jobs does)
    const job = await prisma.job.create({
      data: {
        title: "Check Engineer",
        location: "Remote",
        duration: "Full-time",
        field: "General",
        requiredSkills: ["python", "sql", "communication"],
        skillWeights: { python: 8, sql: 6, communication: 4 },
        baseMatch: 70,
        source: "real",
        companyId: company.id,
        employerId: employer.id,
        status: "active",
        expiresAt: new Date(Date.now() + JOB_TTL_MS),
      },
    });
    console.log("post ✓ employer job created (active, 30-day expiry)");

    // 2) Candidate applies
    const app = await ApplicationsService.apply(profile.id, job.id);
    assert.equal(app.status, "submitted");

    // 3) No fulfillment before BOTH conditions hold
    assert.equal(
      await JobsService.maybeFulfillJobs(employer.id, profile.id),
      0,
      "no offer, no message → not fulfilled",
    );

    await ApplicationsService.transition(app.id, "offer");
    assert.equal(
      await JobsService.maybeFulfillJobs(employer.id, profile.id),
      0,
      "offer but no message → not fulfilled",
    );
    console.log("guard ✓ offer alone does not fulfill");

    // 4) Message exchanged → both conditions hold → fulfilled
    await prisma.chatConversation.create({
      data: {
        employerId: employer.id,
        candidateId: projection.id,
        messages: { create: { sender: "employer", body: "Welcome aboard!" } },
      },
    });
    assert.equal(
      await JobsService.maybeFulfillJobs(employer.id, profile.id),
      1,
      "offer + message → fulfilled",
    );
    const fulfilled = await prisma.job.findUnique({ where: { id: job.id } });
    assert.equal(fulfilled?.status, "fulfilled", "status flipped, row kept");
    console.log("fulfill ✓ offer + message exchanged → status fulfilled (soft-delete)");

    // 5) Expiry sweep flips stale active posts
    const stale = await prisma.job.create({
      data: {
        title: "Stale Check Job",
        location: "Remote",
        duration: "Full-time",
        field: "General",
        requiredSkills: ["python", "sql", "communication"],
        baseMatch: 70,
        source: "real",
        companyId: company.id,
        employerId: employer.id,
        status: "active",
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await JobsService.expireStale();
    const expired = await prisma.job.findUnique({ where: { id: stale.id } });
    assert.equal(expired?.status, "expired", "past-deadline post expired");
    console.log("expire ✓ stale active post flipped to expired");

    // 6) Neither shows in the public candidate feed; history keeps both
    const feed = await JobsService.list();
    assert.ok(
      !feed.some((j) => j.id === job.id || j.id === stale.id),
      "fulfilled/expired posts left the public feed",
    );
    const history = await JobsService.listForEmployer(employer.id);
    assert.equal(history.length, 2, "employer history keeps both rows");
    console.log("feed ✓ hidden from candidates, kept in employer history");

    console.log("OK — job-post lifecycle verified (post→offer+message→fulfilled, expiry, soft-delete).");
  } finally {
    // Cascades: employer profile → jobs → applications; user → projection.
    await prisma.user.delete({ where: { id: employerUser.id } });
    await prisma.user.delete({ where: { id: candidateUser.id } });
    await prisma.company.delete({ where: { id: company.id } });
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
