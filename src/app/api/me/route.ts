import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/me — full candidate profile bundle (intent + portfolio
 * + chapters + notifications). Used by `IntentContext`,
 * `PortfolioContext`, `ChaptersContext`, and `NotificationsContext`
 * on first hydration.
 */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const [full, chapters, notifications] = await Promise.all([
      prisma.candidateProfile.findUnique({
        where: { id: profile.id },
        include: {
          certificates: true,
          awards: true,
          projects: true,
          experiences: true,
        },
      }),
      prisma.chapterEvent.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.candidateNotification.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!full) {
      // Shouldn't happen because currentUser auto-creates it.
      return ok({ profile: null, chapters: [], notifications: [] });
    }

    return ok({
      profile: full,
      chapters,
      notifications,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
