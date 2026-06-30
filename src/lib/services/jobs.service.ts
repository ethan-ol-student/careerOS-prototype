import { prisma } from "@/lib/prisma";
import { TARGET_JOBS, type TargetJob } from "@/lib/jobs/data";

/**
 * Jobs query service. DB-first, with the static `TARGET_JOBS` catalogue
 * as the defensive fallback: if the query throws (DB down/misconfigured)
 * or the table is empty (unseeded), callers still get the curated list.
 */
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
