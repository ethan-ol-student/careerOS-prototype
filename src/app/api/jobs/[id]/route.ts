import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth/session";
import { getCallerSkills, toTargetJob } from "@/lib/services/jobs.service";
import { scoreSkillBridge } from "@/lib/intelligence/skillBridgeEngine";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/jobs/[id] — job detail + explainable match (skill bridge:
 * matched/missing skills + reasons) and whether the caller already applied.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const row = await prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });
    if (!row) return failFromCode("not_found", "Job not found.", 404);

    const t = toTargetJob(row);
    const skills = await getCallerSkills();
    const bridge =
      skills && skills.length > 0 ? scoreSkillBridge(t, skills) : null;

    // Has the caller already applied? (candidate-scoped, never client ids)
    let alreadyApplied = false;
    const session = await readSession();
    if (session?.role === "candidate") {
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (profile) {
        alreadyApplied = !!(await prisma.application.findUnique({
          where: {
            candidateProfileId_jobId: {
              candidateProfileId: profile.id,
              jobId: id,
            },
          },
        }));
      }
    }

    return ok({
      ...t,
      isDemo: row.isDemo,
      sourceUrl: row.sourceUrl,
      companyId: row.companyId,
      companySize: row.company.size,
      companyType: row.company.type,
      companyLocation: row.company.location,
      match: bridge ? bridge.score : row.baseMatch,
      matchReasons: bridge
        ? bridge.reasons
        : ["Curated baseline match — add skills to your profile for a personal score."],
      matched: bridge?.matched ?? [],
      missing: bridge?.missing ?? [],
      personalized: !!bridge,
      alreadyApplied,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
