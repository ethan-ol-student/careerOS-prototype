import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  devModeGuard,
  loadTestContext,
  setTestRoleAndSession,
  buildDevStatus,
} from "@/lib/dev/testApi";
import { PHASE_TO_DB_STAGE } from "@/lib/dev/testMode";
import {
  devCandidatesAIPresent,
  devCandidatesAIEmpty,
  devEmployersAIPresent,
  devEmployersAIEmpty,
} from "@/lib/dev/testDataSeed";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const Schema = z
  .object({
    role: z.enum(["candidate", "employer"]).optional(),
    candidateOnboardingCompleted: z.boolean().optional(),
    candidateAdvancedData: z.enum(["present", "missing"]).optional(),
    careerPhase: z
      .enum([
        "student",
        "young_adult",
        "early_career",
        "mid_career",
        "senior_career",
        "executive",
      ])
      .optional(),
    employerOnboardingCompleted: z.boolean().optional(),
    employerAIData: z.enum(["present", "missing"]).optional(),
  })
  .strict();

/**
 * POST /api/dev/state — update onboarding flags, phase, role, and
 * advanced-data presence for the test account. Dev only. Operates ONLY
 * on the test account (resolved server-side), never a real user.
 */
export async function POST(request: Request) {
  const blocked = devModeGuard();
  if (blocked) return blocked;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid state patch.",
      );
    }
    const patch = parsed.data;
    const ctx = await loadTestContext();

    if (patch.role) {
      await setTestRoleAndSession(patch.role);
    }
    if (patch.candidateOnboardingCompleted !== undefined) {
      await prisma.candidatesAI.update({
        where: { userId: ctx.user.id },
        data: { onboardingCompleted: patch.candidateOnboardingCompleted },
      });
    }
    if (patch.careerPhase) {
      await prisma.candidatesAI.update({
        where: { userId: ctx.user.id },
        data: { careerStage: PHASE_TO_DB_STAGE[patch.careerPhase] },
      });
    }
    if (patch.candidateAdvancedData === "present") {
      await prisma.candidatesAI.update({
        where: { userId: ctx.user.id },
        data: devCandidatesAIPresent(),
      });
    } else if (patch.candidateAdvancedData === "missing") {
      await prisma.candidatesAI.update({
        where: { userId: ctx.user.id },
        data: devCandidatesAIEmpty(),
      });
    }
    if (patch.employerOnboardingCompleted !== undefined) {
      await prisma.employerProfile.update({
        where: { id: ctx.employerProfileId },
        data: { hasCompletedOnboarding: patch.employerOnboardingCompleted },
      });
    }
    if (patch.employerAIData === "present") {
      await prisma.employersAI.update({
        where: { userId: ctx.user.id },
        data: { ...devEmployersAIPresent(), onboardingCompleted: true },
      });
    } else if (patch.employerAIData === "missing") {
      await prisma.employersAI.update({
        where: { userId: ctx.user.id },
        data: { ...devEmployersAIEmpty(), onboardingCompleted: false },
      });
    }

    return ok(await buildDevStatus());
  } catch (err) {
    return failFromUnknown(err);
  }
}
