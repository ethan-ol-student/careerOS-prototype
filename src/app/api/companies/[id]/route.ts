import { prisma } from "@/lib/prisma";
import { listCompaniesWithMetrics } from "@/lib/services/companies.service";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/companies/[id] — company detail: fit signals (size/type/location),
 * responsiveness metrics, and its open jobs.
 * ponytail: reuses the 20-row leaderboard computation instead of a second
 * metrics path; split when the catalogue outgrows one query.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [metrics, jobs] = await Promise.all([
      listCompaniesWithMetrics(),
      prisma.job.findMany({
        where: { companyId: id },
        orderBy: { baseMatch: "desc" },
        select: {
          id: true,
          title: true,
          location: true,
          duration: true,
          field: true,
          baseMatch: true,
          isDemo: true,
        },
      }),
    ]);
    const company = metrics.find((c) => c.id === id);
    if (!company) return failFromCode("not_found", "Company not found.", 404);
    return ok({ ...company, jobs });
  } catch (err) {
    return failFromUnknown(err);
  }
}
