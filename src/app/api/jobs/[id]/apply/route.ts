import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ApplicationsService } from "@/lib/services/applications.service";
import { rateLimit, clientIp } from "@/lib/auth/rateLimit";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** POST /api/jobs/[id]/apply — current candidate applies to a job. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Throttle apply spam (the unique constraint blocks re-applies to the
    // same job, but not fan-out across many jobs).
    const rl = rateLimit(`apply:${clientIp(request)}`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return failFromCode(
        "rate_limited",
        "Too many applications too fast. Please slow down.",
        429,
      );
    }

    const { id: jobId } = await params;
    const profile = await getCurrentCandidateProfile();

    // Explicit 404 instead of a raw FK violation (cleaner than P2003 → 500).
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: { select: { name: true } } },
    });
    if (!job) return failFromCode("not_found", "Job not found.", 404);

    // ConflictError (already applied) is mapped to a friendly 409 by failFromUnknown.
    const application = await ApplicationsService.apply(profile.id, jobId);

    // Notify the hiring employer. Prefer the post's actual owner
    // (`Job.employerId`) — exact, no ambiguity. Only fall back to the
    // org-name bridge for ownerless catalogue jobs. Best-effort: a
    // notification failure must never fail an application that succeeded.
    try {
      const employerIds = job.employerId
        ? [job.employerId]
        : (
            await prisma.employerProfile.findMany({
              where: { organizationName: job.company.name },
              select: { id: true },
            })
          ).map((e) => e.id);
      if (employerIds.length > 0) {
        await prisma.employerNotification.createMany({
          data: employerIds.map((employerId) => ({
            employerId,
            kind: "system",
            title: "New applicant",
            body: `${profile.name || "A candidate"} applied to ${job.title}.`,
          })),
        });
      }
    } catch (notifyErr) {
      console.error("[apply] employer notification failed (non-fatal)", notifyErr);
    }

    return ok(application);
  } catch (err) {
    return failFromUnknown(err);
  }
}
