import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const ToggleSchema = z.object({
  candidateId: z.string().min(1).max(80),
});

/** GET /api/employer/saved — list candidate IDs, newest first. */
export async function GET() {
  try {
    const profile = await getCurrentEmployerProfile();
    const rows = await prisma.employerSavedCandidate.findMany({
      where: { employerId: profile.id },
      orderBy: { savedAt: "desc" },
      select: { candidateId: true },
    });
    return ok(rows.map((r) => r.candidateId));
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** POST /api/employer/saved — toggle save state for one candidate. */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ToggleSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "candidateId is required.");
    }
    const profile = await getCurrentEmployerProfile();
    const { candidateId } = parsed.data;

    // Confirm the candidate exists so we don't insert a dangling FK.
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return failFromCode("not_found", "Candidate not found.", 404);
    }

    const existing = await prisma.employerSavedCandidate.findUnique({
      where: {
        employerId_candidateId: {
          employerId: profile.id,
          candidateId,
        },
      },
    });

    if (existing) {
      await prisma.employerSavedCandidate.delete({
        where: {
          employerId_candidateId: {
            employerId: profile.id,
            candidateId,
          },
        },
      });
      return ok({ candidateId, saved: false });
    } else {
      await prisma.employerSavedCandidate.create({
        data: { employerId: profile.id, candidateId },
      });
      return ok({ candidateId, saved: true });
    }
  } catch (err) {
    return failFromUnknown(err);
  }
}
