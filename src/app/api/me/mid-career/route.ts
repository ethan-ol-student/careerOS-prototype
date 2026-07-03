import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { toTargetJob } from "@/lib/services/jobs.service";
import { scoreSkillBridge } from "@/lib/intelligence/skillBridgeEngine";
import { pickBenchmark, type BenchmarkRow } from "@/lib/intelligence/fairPayEngine";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/me/mid-career — everything the Career Health dashboard home
 * needs in ONE fetch: the MidCareerProfile, the experience timeline (Story
 * Map), the best salary benchmark (Fair Pay), and the caller's top job
 * bridges (Best Next Move / Top-3 Skill Gaps / Transferable Map).
 * All engine math is deterministic; the salary itself never leaves this
 * candidate-scoped endpoint.
 */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const [midCareer, experiences, ai, benchmarks, jobRows] = await Promise.all([
      prisma.midCareerProfile.findUnique({
        where: { candidateProfileId: profile.id },
      }),
      prisma.experience.findMany({
        where: { profileId: profile.id },
        orderBy: { id: "asc" },
      }),
      prisma.candidatesAI.findUnique({ where: { userId: profile.userId } }),
      prisma.salaryBenchmark.findMany(),
      prisma.job.findMany({ include: { company: true } }),
    ]);

    const skills = [
      ...new Set([...profile.skills, ...(ai?.currentSkills ?? [])]),
    ];

    const targetRole = ai?.targetRoles[0] ?? profile.targetJob ?? "";
    const benchmark = targetRole
      ? pickBenchmark(
          targetRole,
          ai?.locationPreference ?? "",
          benchmarks as BenchmarkRow[],
        )
      : null;

    const topJobs = jobRows
      .map((row) => {
        const t = toTargetJob(row);
        const bridge = scoreSkillBridge(t, skills);
        return {
          id: t.id,
          title: t.title,
          company: t.company,
          requiredSkills: t.requiredSkills,
          score: bridge.score,
          matched: bridge.matched,
          missing: bridge.missing,
          reasons: bridge.reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return ok({
      midCareer,
      experiences: experiences.map((e) => ({
        role: e.role,
        company: e.company,
        period: e.period,
        detail: e.detail,
      })),
      benchmark,
      topJobs,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const PatchSchema = z
  .object({
    problemsSolved: z.array(z.string().max(240)).max(20).optional(),
    careerPattern: z.string().max(40).optional(),
    salaryPrivate: z.number().int().min(0).nullable().optional(),
    salaryCurrency: z.string().max(8).optional(),
    lifeFactors: z.array(z.string().max(60)).max(12).optional(),
  })
  .strict();

/** PATCH /api/me/mid-career — upsert the caller's mid-career profile. */
export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const json = await request.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid mid-career payload.",
      );
    }
    const updated = await prisma.midCareerProfile.upsert({
      where: { candidateProfileId: profile.id },
      create: { candidateProfileId: profile.id, ...parsed.data },
      update: parsed.data,
    });
    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
