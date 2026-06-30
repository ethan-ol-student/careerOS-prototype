/**
 * Runnable check for ApplicationsService. Integration-level (hits the DB),
 * self-cleaning. Run: `npx tsx src/lib/services/applications.service.check.ts`
 *
 * Asserts the acceptance: apply() creates an Application + a "submitted"
 * event; re-apply is a friendly conflict; expire-on-read flips stale rows;
 * responseScore is a pure status map.
 */
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { ConflictError } from "@/lib/api/errors";
import { ApplicationsService, responseScore } from "./applications.service";

async function main() {
  const jobId = "robotics-engineer"; // seeded
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  assert(job, "seeded job missing — run `npm run db:seed` first");

  // Throwaway candidate (cascade-deleted at the end).
  const user = await prisma.user.create({
    data: {
      email: `check-${Date.now()}@example.test`,
      role: "CANDIDATE",
      candidateProfile: { create: {} },
    },
    include: { candidateProfile: true },
  });
  const profileId = user.candidateProfile!.id;

  try {
    // apply → Application + submitted event
    const app = await ApplicationsService.apply(profileId, jobId);
    assert.equal(app.status, "submitted");
    assert.equal(app.events.length, 1);
    assert.equal(app.events[0].type, "submitted");
    assert.equal(app.events[0].toStatus, "submitted");

    // re-apply → friendly conflict (unique-constraint backup)
    await assert.rejects(
      () => ApplicationsService.apply(profileId, jobId),
      (e: unknown) => e instanceof ConflictError,
    );

    // expire-on-read → backdate the deadline, then read flips to expired + event
    await prisma.application.update({
      where: { id: app.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const fresh = await prisma.application.findUniqueOrThrow({ where: { id: app.id } });
    const expired = await ApplicationsService.expireOnRead(fresh);
    assert.equal(expired.status, "expired");
    const events = await prisma.applicationEvent.findMany({ where: { applicationId: app.id } });
    assert(events.some((e) => e.type === "expired"), "expired event not logged");

    // responseScore — pure status map
    assert.equal(responseScore("offer"), 100);
    assert.equal(responseScore("submitted"), 10);
    assert.equal(responseScore("expired"), 0);

    console.log("OK — all ApplicationsService checks passed");
  } finally {
    await prisma.user.delete({ where: { id: user.id } }); // cascades app + events
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("CHECK FAILED:", err);
  process.exit(1);
});
