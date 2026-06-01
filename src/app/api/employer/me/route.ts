import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/employer/me — full employer bundle: goal, onboarding
 * flag, saved candidate IDs, invited IDs, and notifications.
 * Used by `EmployerContext` and `SavedCandidatesContext` on hydrate.
 */
export async function GET() {
  try {
    const profile = await getCurrentEmployerProfile();

    const [saved, invited, notifications] = await Promise.all([
      prisma.employerSavedCandidate.findMany({
        where: { employerId: profile.id },
        orderBy: { savedAt: "desc" },
        select: { candidateId: true },
      }),
      prisma.employerInvitedCandidate.findMany({
        where: { employerId: profile.id },
        orderBy: { invitedAt: "desc" },
        select: { candidateId: true },
      }),
      prisma.employerNotification.findMany({
        where: { employerId: profile.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return ok({
      profile,
      savedIds: saved.map((s) => s.candidateId),
      invitedIds: invited.map((s) => s.candidateId),
      notifications,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
