import type { Company, Job } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth/session";
import { TARGET_JOBS, type TargetJob } from "@/lib/jobs/data";

/**
 * Jobs query service. DB-first, with the static `TARGET_JOBS` catalogue
 * as the defensive fallback: if the query throws (DB down/misconfigured)
 * or the table is empty (unseeded), callers still get the curated list.
 */
/** Map a DB Job row (+company) to the engine-facing TargetJob shape. */
export function toTargetJob(row: Job & { company: Company }): TargetJob {
  return {
    id: row.id,
    title: row.title,
    company: row.company.name,
    location: row.location,
    duration: row.duration,
    field: row.field,
    requiredSkills: row.requiredSkills,
    baseMatch: row.baseMatch,
  };
}

/**
 * Skills of the calling candidate (profile skills ∪ onboarding skills),
 * or null when the caller isn't a signed-in candidate. Never throws —
 * job pages stay browsable without a match score.
 */
export async function getCallerSkills(): Promise<string[] | null> {
  const session = await readSession();
  if (!session || session.role !== "candidate") return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      candidateProfile: { select: { skills: true } },
      candidatesAI: { select: { currentSkills: true } },
    },
  });
  if (!user?.candidateProfile) return null;
  const merged = new Set([
    ...user.candidateProfile.skills,
    ...(user.candidatesAI?.currentSkills ?? []),
  ]);
  return [...merged];
}

// ── Job post lifecycle (soft-delete by status, never hard-delete) ──
// TS is the source of truth for legal statuses.
export const JOB_STATUSES = ["active", "expired", "fulfilled"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

// ponytail: fixed 30-day posting window, mirroring applications.service.
export const JOB_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const JobsService = {
  /**
   * Expire-on-read sweep: flip stale active posts (past expiresAt) to
   * "expired" in one indexed updateMany. Catalogue rows have a null
   * expiresAt and are never touched. Called before any listing.
   */
  async expireStale() {
    await prisma.job.updateMany({
      where: { status: "active", expiresAt: { lt: new Date() } },
      data: { status: "expired" },
    });
  },

  /**
   * Fulfillment check — a job post auto-fulfills (hidden from the public
   * feed, kept in the employer's history) when BOTH hold:
   *   1. an application on it from this candidate reached "offer"
   *      (the accepted terminal status in this prototype), AND
   *   2. a chat message has been exchanged between this employer and the
   *      candidate's marketplace projection.
   * Chat isn't job-scoped here, so "message tied to the job" adapts to
   * "message between the two parties of the accepted application".
   * Called from both triggers: application-status PATCH and message POST.
   */
  async maybeFulfillJobs(employerProfileId: string, candidateProfileId: string) {
    const jobs = await prisma.job.findMany({
      where: {
        employerId: employerProfileId,
        status: "active",
        applications: { some: { candidateProfileId, status: "offer" } },
      },
      select: { id: true },
    });
    if (jobs.length === 0) return 0;

    const message = await prisma.chatMessage.findFirst({
      where: {
        conversation: {
          employerId: employerProfileId,
          candidate: { user: { candidateProfile: { id: candidateProfileId } } },
        },
      },
      select: { id: true },
    });
    if (!message) return 0;

    const res = await prisma.job.updateMany({
      where: { id: { in: jobs.map((j) => j.id) } },
      data: { status: "fulfilled" },
    });
    return res.count;
  },

  /** The employer's own posts (all statuses — their history), freshest first. */
  async listForEmployer(employerProfileId: string) {
    await this.expireStale();
    return prisma.job.findMany({
      where: { employerId: employerProfileId },
      include: {
        company: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async list(): Promise<TargetJob[]> {
    try {
      await this.expireStale();
      const rows = await prisma.job.findMany({
        where: { status: "active" }, // expired/fulfilled posts leave the public feed
        include: { company: true },
        orderBy: { baseMatch: "desc" },
      });
      // ponytail: TARGET_JOBS is the fallback array — canonical copy lives
      // in src/lib/jobs/data.ts; importing it avoids a stale duplicate.
      if (rows.length === 0) return TARGET_JOBS;
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        company: r.company.name,
        location: r.location,
        duration: r.duration,
        field: r.field,
        requiredSkills: r.requiredSkills,
        baseMatch: r.baseMatch,
      }));
    } catch {
      return TARGET_JOBS;
    }
  },
};
