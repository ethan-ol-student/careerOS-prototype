import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ApplicationsService } from "@/lib/services/applications.service";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/me/applications — the caller's applications with their full
 * event timeline, newest first. Expire-on-read runs here, so stale
 * applications flip to "expired" the moment the tracker is opened.
 */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const rows = await prisma.application.findMany({
      where: { candidateProfileId: profile.id },
      include: {
        job: { include: { company: { select: { name: true } } } },
        events: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const applications = await Promise.all(
      rows.map(async (app) => {
        const fresh = await ApplicationsService.expireOnRead(app);
        const status = "status" in fresh ? fresh.status : app.status;
        return {
          id: app.id,
          status,
          createdAt: app.createdAt,
          expiresAt: app.expiresAt,
          job: {
            id: app.job.id,
            title: app.job.title,
            company: app.job.company.name,
            location: app.job.location,
          },
          events: app.events.map((e) => ({
            id: e.id,
            type: e.type,
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            createdAt: e.createdAt,
          })),
          // Auto "No response yet": only the submitted event exists.
          noResponseYet: status === "submitted" && app.events.length <= 1,
        };
      }),
    );

    return ok({ applications });
  } catch (err) {
    return failFromUnknown(err);
  }
}
