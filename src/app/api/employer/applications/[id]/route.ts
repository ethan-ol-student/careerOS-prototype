import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ApplicationsService } from "@/lib/services/applications.service";
import { JobsService } from "@/lib/services/jobs.service";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

// Employer-settable statuses (not "submitted"/"withdrawn"/"expired" —
// those belong to the candidate/system).
const Schema = z.object({
  status: z.enum(["reviewing", "interview", "offer", "rejected"]),
});

/**
 * PATCH /api/employer/applications/[id] — set an application's status.
 * Writes an ApplicationEvent (candidate timeline) and a candidate
 * notification, so a status change is visible on both sides.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const employer = await getCurrentEmployerProfile();
    const { id } = await params;

    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        "status must be reviewing, interview, offer, or rejected.",
      );
    }

    const updated = await ApplicationsService.transition(id, parsed.data.status);

    // Tell the candidate their application moved.
    const app = await prisma.application.findUnique({
      where: { id },
      include: { job: { select: { title: true, employerId: true } } },
    });
    if (app) {
      await prisma.candidateNotification.create({
        data: {
          profileId: app.candidateProfileId,
          kind: "system",
          severity: "important",
          title: "Application update",
          body: `Your application for ${app.job.title} is now "${parsed.data.status}".`,
        },
      });
      // Accepted ("offer") on an employer-posted job — fulfillment trigger 1.
      // (Trigger 2 is the message POST; the job fulfills once BOTH held.)
      if (parsed.data.status === "offer" && app.job.employerId === employer.id) {
        await JobsService.maybeFulfillJobs(employer.id, app.candidateProfileId);
      }
    }

    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
