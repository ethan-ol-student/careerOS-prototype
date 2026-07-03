import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ApplicationsService } from "@/lib/services/applications.service";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** POST /api/jobs/[id]/apply — current candidate applies to a job. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    // Notify the employer(s) whose org matches the job's company. Jobs have
    // no owner in the prototype schema, so org-name match is the honest
    // bridge; no match → no notification, never a wrong one.
    const employers = await prisma.employerProfile.findMany({
      where: { organizationName: job.company.name },
      select: { id: true },
    });
    if (employers.length > 0) {
      await prisma.employerNotification.createMany({
        data: employers.map((e) => ({
          employerId: e.id,
          kind: "system",
          title: "New applicant",
          body: `${profile.name || "A candidate"} applied to ${job.title}.`,
        })),
      });
    }

    return ok(application);
  } catch (err) {
    return failFromUnknown(err);
  }
}
