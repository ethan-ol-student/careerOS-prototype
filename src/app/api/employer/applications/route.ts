import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/employer/applications — applicants grouped per job for the
 * employer review flow.
 *
 * ponytail: jobs have no owning employer in the prototype schema, so every
 * employer reviews the shared catalogue's applicants. Scope with a
 * `Job.employerId` when employers can post their own jobs.
 */
export async function GET() {
  try {
    await getCurrentEmployerProfile(); // 401/403 for non-employers

    const rows = await prisma.application.findMany({
      include: {
        job: { include: { company: { select: { name: true } } } },
        candidateProfile: {
          select: { name: true, headline: true, skills: true },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const applications = rows.map((a) => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      job: {
        id: a.job.id,
        title: a.job.title,
        company: a.job.company.name,
      },
      candidate: {
        name: a.candidateProfile.name || "Unnamed candidate",
        headline: a.candidateProfile.headline,
        skills: a.candidateProfile.skills.slice(0, 6),
      },
      // Employer-side nudge: still unanswered.
      needsResponse: a.status === "submitted",
      lastEventAt: a.events.at(-1)?.createdAt ?? a.createdAt,
    }));

    return ok({ applications });
  } catch (err) {
    return failFromUnknown(err);
  }
}
