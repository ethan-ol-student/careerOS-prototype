import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { checkIn } from "@/lib/services/gamification.service";
import { normalizeCareerPhase } from "@/lib/dashboard/phaseConfig";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * POST /api/me/checkin — the one deliberate gamified action. Grants XP at
 * most once per period; the period is age-tuned (daily for younger
 * phases, monthly Career Check-Up for mid-career+).
 */
export async function POST() {
  try {
    const profile = await getCurrentCandidateProfile();
    const ai = await prisma.candidatesAI.findUnique({
      where: { userId: profile.userId },
      select: { careerStage: true },
    });
    // Un-onboarded users default to the daily (younger) cadence.
    const phase = normalizeCareerPhase(ai?.careerStage ?? "") ?? "young_adult";
    return ok(await checkIn(profile.id, phase));
  } catch (err) {
    return failFromUnknown(err);
  }
}
