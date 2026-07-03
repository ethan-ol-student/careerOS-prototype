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

export const JobsService = {
  async list(): Promise<TargetJob[]> {
    try {
      const rows = await prisma.job.findMany({
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
