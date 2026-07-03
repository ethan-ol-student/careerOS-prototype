import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { getState } from "@/lib/services/gamification.service";
import { normalizeCareerPhase } from "@/lib/dashboard/phaseConfig";
import { ok, failFromUnknown } from "@/lib/api/respond";

/** GET /api/me/gamification — XP total, streak, badges, cadence. */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const ai = await prisma.candidatesAI.findUnique({
      where: { userId: profile.userId },
      select: { careerStage: true },
    });
    // Un-onboarded users default to the daily (younger) cadence.
    const phase = normalizeCareerPhase(ai?.careerStage ?? "") ?? "young_adult";
    return ok(await getState(profile.id, phase));
  } catch (err) {
    return failFromUnknown(err);
  }
}
