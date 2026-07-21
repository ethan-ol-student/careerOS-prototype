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

    // Onboarding v2 — preferences
    desiredLocations: z.array(z.string().max(120)).max(20).optional(),
    openToRelocate: z.boolean().optional(),
    workArrangement: z.array(z.enum(["remote", "hybrid", "onsite"])).optional(),
    topValues: z.array(z.string().max(60)).max(3).optional(),
    scheduleFlexibility: z.array(z.string().max(60)).max(10).optional(),
    travelWillingness: z.enum(["", "none", "occasional", "frequent"]).optional(),
    workEnvironment: z
      .enum(["", "structured", "fast_moving", "independent", "collaborative"])
      .optional(),
    maxCommuteMinutes: z.number().int().min(0).max(300).nullable().optional(),
    minSalaryAmount: z.number().int().min(0).nullable().optional(),
    minSalaryPeriod: z.enum(["", "hourly", "monthly", "yearly"]).optional(),
    links: z.array(z.string().max(300)).max(10).optional(),
    languages: z.array(z.string().max(60)).max(15).optional(),
    fieldOfStudy: z.string().max(120).optional(),
    expectedGraduation: z.string().max(40).optional(),

    // Onboarding v4 — phase-conditional preference answers (mid/senior/exec).
    // One JSON bag keyed by question id; values are free text, choice
    // arrays, or slider numbers. The onboarding page owns legal keys.
    phaseAnswers: z
      .record(
        z.string().max(40),
        z.union([
          z.string().max(600),
          z.array(z.string().max(160)).max(15),
          z.number().min(0).max(100),
        ]),
      )
      .optional(),

    // Onboarding v5 — role-catalog associations (senior/exec = current
    // role; standard tracks = desired roles). Titles mirror into
    // targetRoles for engine compatibility.
    currentRoleId: z.string().max(40).nullable().optional(),
    currentRoleTitle: z.string().max(120).optional(),
    desiredRoleIds: z.array(z.string().max(40)).max(20).optional(),

    // Onboarding v3 — focus + optional self-ID (PRIVATE, never projected)
    focus: z.enum(["", "improve", "discovering"]).optional(),
    familyStatus: z.string().max(40).optional(),
    gender: z.string().max(40).optional(),
    religion: z.array(z.string().max(40)).max(10).optional(),
    race: z.array(z.string().max(40)).max(10).optional(),
    age: z.number().int().min(0).max(120).nullable().optional(),

    // Onboarding v2/v3 — profile-bound fields (routed to CandidateProfile)
    fullName: z.string().max(120).optional(),
    nickname: z.string().max(60).optional(),
    currentTitle: z.string().max(120).optional(),
    phone: z.string().max(40).optional(),
    location: z.string().max(120).optional(),
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
    // Include the profile-bound fields so onboarding can prefill them.
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      select: { name: true, nickname: true, headline: true, phone: true, location: true },
    });
    return ok({
      ...row,
      fullName: profile?.name ?? user.name ?? "",
      nickname: profile?.nickname ?? "",
      currentTitle: profile?.headline ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      email: user.email,
    });
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
    // Profile-bound fields live on CandidateProfile, not CandidatesAI.
    const { fullName, nickname, currentTitle, phone, location, ...aiData } = parsed.data;
    const profilePatch = {
      ...(fullName !== undefined ? { name: fullName } : {}),
      ...(nickname !== undefined ? { nickname } : {}),
      ...(currentTitle !== undefined ? { headline: currentTitle } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(location !== undefined ? { location } : {}),
    };
    if (Object.keys(profilePatch).length > 0) {
      await prisma.candidateProfile.updateMany({
        where: { userId: user.id },
        data: profilePatch,
      });
    }
    const updated = await prisma.candidatesAI.update({
      where: { userId: user.id },
      data: aiData,
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
