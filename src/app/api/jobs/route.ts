import { prisma } from "@/lib/prisma";
import {
  getCallerSkills,
  toTargetJob,
  JobsService,
} from "@/lib/services/jobs.service";
import { scoreSkillBridge } from "@/lib/intelligence/skillBridgeEngine";
import { toMarketField } from "@/lib/market/fieldMap";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/jobs?q=&field=&location= — job catalogue with per-caller match.
 *
 * Match badge: skill-bridge coverage for a signed-in candidate with skills;
 * otherwise the curated baseMatch. Explainable — reasons ride along.
 * ponytail: no pagination at 20 rows; add take/skip + cursor when the
 * catalogue grows past ~200 (field/companyId indexes already exist).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const field = url.searchParams.get("field")?.trim() ?? "";
    const location = url.searchParams.get("location")?.trim() ?? "";

    await JobsService.expireStale();
    const [rows, skills] = await Promise.all([
      prisma.job.findMany({
        where: {
          status: "active", // expired/fulfilled posts leave the public feed
          ...(field ? { field } : {}),
          ...(location
            ? { location: { contains: location, mode: "insensitive" } }
            : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { company: { name: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include: { company: true },
        orderBy: { baseMatch: "desc" },
      }),
      getCallerSkills(),
    ]);

    const jobs = rows.map((row) => {
      const t = toTargetJob(row);
      const personalized = skills && skills.length > 0;
      const bridge = personalized ? scoreSkillBridge(t, skills) : null;
      return {
        ...t,
        isDemo: row.isDemo,
        sourceUrl: row.sourceUrl,
        companyId: row.companyId,
        companySize: row.company.size,
        companyType: row.company.type,
        match: bridge ? bridge.score : row.baseMatch,
        matchReasons: bridge
          ? bridge.reasons
          : ["Curated baseline match — sign in and add skills for a personal score."],
        personalized: !!bridge,
      };
    });

    // Personalized scores re-rank the list.
    jobs.sort((a, b) => b.match - a.match);

    const fields = [...new Set(rows.map((r) => r.field))].sort();

    // Real posting volume for the selected field (the "is it hot" count) —
    // only when a field is chosen; nullable end-to-end (ingest may be empty).
    const demand = field
      ? await prisma.marketFieldDemand
          .findUnique({
            where: { field: toMarketField(field) },
            select: { field: true, postingCount: true },
          })
          .catch(() => null)
      : null;

    return ok({ jobs, fields, demand });
  } catch (err) {
    return failFromUnknown(err);
  }
}
