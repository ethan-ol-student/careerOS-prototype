import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/api/currentUser";
import { syncMarketplaceMirror } from "@/lib/candidates/projection";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const SkillLevelSchema = z.enum(["beginner", "intermediate", "expert"]);

const ConfidenceSchema = z.enum(["low", "medium", "high"]);

const OnboardingPatchSchema = z
  .object({
    careerStage: z.string().max(40).optional(),
    careerStageMeaning: z.string().max(400).optional(),

    targetRoles: z.array(z.string().max(80)).max(20).optional(),
    interestedIndustries: z.array(z.string().max(80)).max(20).optional(),
    opportunityTypes: z.array(z.string().max(80)).max(20).optional(),
    locationPreference: z.string().max(120).optional(),
    availability: z.string().max(80).optional(),

    currentSkills: z.array(z.string().max(60)).max(40).optional(),
    skillLevels: z.record(z.string(), SkillLevelSchema).optional(),
    projects: z.array(z.string().max(200)).max(20).optional(),
    skillsToImprove: z.array(z.string().max(60)).max(20).optional(),
    weeklyLearningTime: z.string().max(40).optional(),

    desiredNextMove: z.string().max(400).optional(),
    longTermGoal: z.string().max(400).optional(),
    timeline: z.string().max(40).optional(),
    careerConfidence: ConfidenceSchema.optional(),
    mainBlocker: z.string().max(400).optional(),

    applicationsSent: z.string().max(40).optional(),
    interviewExperience: z.string().max(400).optional(),
    rejectionsOrChallenges: z.string().max(400).optional(),
    resumeConfidence: ConfidenceSchema.optional(),
    portfolioConfidence: ConfidenceSchema.optional(),
    interviewConfidence: ConfidenceSchema.optional(),

    dashboardPersonalizationSummary: z.string().max(800).optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .strict();

async function getOrCreateRow(userId: string) {
  return prisma.candidatesAI.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

/** GET /api/me/onboarding — current candidate's onboarding answers. */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (user.role !== "CANDIDATE") {
      return failFromCode(
        "forbidden",
        "Only candidates have onboarding answers.",
        403,
      );
    }
    const row = await getOrCreateRow(user.id);
    return ok(row);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return failFromCode("unauthenticated", err.message, 401);
    }
    return failFromUnknown(err);
  }
}

/** PATCH /api/me/onboarding — save partial onboarding answers. */
export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (user.role !== "CANDIDATE") {
      return failFromCode(
        "forbidden",
        "Only candidates can submit onboarding answers.",
        403,
      );
    }
    const json = await request.json();
    const parsed = OnboardingPatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid onboarding payload.",
      );
    }
    await getOrCreateRow(user.id);
    const updated = await prisma.candidatesAI.update({
      where: { userId: user.id },
      data: parsed.data,
    });
    // Keep the marketplace mirror in sync with the latest answers
    // (no-op unless the candidate has opted into discovery).
    await syncMarketplaceMirror(user.id);
    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return failFromCode("unauthenticated", err.message, 401);
    }
    return failFromUnknown(err);
  }
}
