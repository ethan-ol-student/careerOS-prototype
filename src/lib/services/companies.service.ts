import { prisma } from "@/lib/prisma";
import { responseScore, type ApplicationStatus } from "./applications.service";

/**
 * Company responsiveness / candidate-friendliness metrics.
 *
 * Real metrics when applications exist: the average `responseScore` of every
 * application to the company's jobs, plus the share that got any response.
 * Companies with no applications yet fall back to a DETERMINISTIC demo score
 * derived from the name (stable across reloads) and are flagged
 * `demoMetrics: true` so the UI labels them "Demo data".
 */

export interface CompanyMetrics {
  id: string;
  name: string;
  size: string;
  type: string;
  location: string;
  sourceUrl: string | null;
  isDemo: boolean;
  jobCount: number;
  applicants: number;
  /** 0–100 candidate-friendliness / responsiveness. */
  responseScore: number;
  /** Share of applications with any employer response, or null if none yet. */
  respondedShare: number | null;
  /** True when responseScore is the seeded demo fallback, not real data. */
  demoMetrics: boolean;
}

// ponytail: stable hash → plausible 55–92 demo score; replaced by real
// application metrics as soon as a company has applicants.
function demoScore(name: string): number {
  const h = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  return 55 + (h % 38);
}

export async function listCompaniesWithMetrics(): Promise<CompanyMetrics[]> {
  const [companies, apps] = await Promise.all([
    prisma.company.findMany({ include: { jobs: { select: { id: true } } } }),
    prisma.application.findMany({ select: { jobId: true, status: true } }),
  ]);

  const appsByJob = new Map<string, ApplicationStatus[]>();
  for (const a of apps) {
    const list = appsByJob.get(a.jobId) ?? [];
    list.push(a.status as ApplicationStatus);
    appsByJob.set(a.jobId, list);
  }

  const rows = companies.map((c) => {
    const statuses = c.jobs.flatMap((j) => appsByJob.get(j.id) ?? []);
    const applicants = statuses.length;
    let score: number;
    let respondedShare: number | null = null;
    let demoMetrics = false;
    if (applicants > 0) {
      score = Math.round(
        statuses.reduce((s, st) => s + responseScore(st), 0) / applicants,
      );
      respondedShare =
        Math.round(
          (statuses.filter((st) => st !== "submitted").length / applicants) * 100,
        ) / 100;
    } else {
      score = demoScore(c.name);
      demoMetrics = true;
    }
    return {
      id: c.id,
      name: c.name,
      size: c.size,
      type: c.type,
      location: c.location,
      sourceUrl: c.sourceUrl,
      isDemo: c.isDemo,
      jobCount: c.jobs.length,
      applicants,
      responseScore: score,
      respondedShare,
      demoMetrics,
    };
  });

  // Leaderboard order: most responsive / candidate-friendly first.
  return rows.sort((a, b) => b.responseScore - a.responseScore || a.name.localeCompare(b.name));
}
