import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const OnboardingPatchSchema = z
  .object({
    companyType: z.string().max(40).optional(),
    industries: z.array(z.string().max(60)).max(20).optional(),
    teamFocus: z.array(z.string().max(80)).max(20).optional(),

    hiringReasons: z.array(z.string().max(80)).max(10).optional(),
    hiringTimeline: z.string().max(40).optional(),

    targetRoles: z.array(z.string().max(80)).max(20).optional(),
    futureRoleDirections: z.array(z.string().max(80)).max(20).optional(),

    candidateGreenFlags: z.array(z.string().max(80)).max(20).optional(),
    requiredSkills: z.array(z.string().max(60)).max(40).optional(),
    trainableSkills: z.array(z.string().max(60)).max(40).optional(),

    strongFitTypes: z.array(z.string().max(80)).max(20).optional(),
    workArrangement: z.string().max(20).optional(),
    hiringLocation: z.string().max(120).optional(),

    hiringIntentSummary: z.string().max(400).optional(),
    futurePathSummary: z.string().max(400).optional(),
    bestCandidateTypeSummary: z.string().max(400).optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .strict();

async function getOrCreateRow(userId: string) {
  return prisma.employersAI.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

/** GET /api/employer/onboarding-data — current employer's onboarding answers. */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (user.role !== "EMPLOYER") {
      return failFromCode(
        "forbidden",
        "Only employers have onboarding answers.",
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

/** PATCH /api/employer/onboarding-data — save partial onboarding answers. */
export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (user.role !== "EMPLOYER") {
      return failFromCode(
        "forbidden",
        "Only employers can submit onboarding answers.",
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

    // If the client is marking onboarding complete, ALSO flip the
    // `EmployerProfile.hasCompletedOnboarding` flag so the existing
    // EmployerAppShell guard (which reads from `/api/auth/me`) lets
    // them through. This is what fixes the redirect loop.
    const willCompleteOnboarding = parsed.data.onboardingCompleted === true;

    const [updated] = await prisma.$transaction([
      prisma.employersAI.update({
        where: { userId: user.id },
        data: parsed.data,
      }),
      ...(willCompleteOnboarding
        ? [
            prisma.employerProfile.upsert({
              where: { userId: user.id },
              create: { userId: user.id, hasCompletedOnboarding: true },
              update: { hasCompletedOnboarding: true },
            }),
          ]
        : []),
    ]);

    return ok(updated);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return failFromCode("unauthenticated", err.message, 401);
    }
    return failFromUnknown(err);
  }
}
