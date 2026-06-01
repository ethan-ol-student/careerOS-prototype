import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const MarkInvitedSchema = z.object({
  candidateId: z.string().min(1).max(80),
});

/** GET /api/employer/invited — list candidate IDs already invited. */
export async function GET() {
  try {
    const profile = await getCurrentEmployerProfile();
    const rows = await prisma.employerInvitedCandidate.findMany({
      where: { employerId: profile.id },
      orderBy: { invitedAt: "desc" },
      select: { candidateId: true },
    });
    return ok(rows.map((r) => r.candidateId));
  } catch (err) {
    return failFromUnknown(err);
  }
}

/**
 * POST /api/employer/invited — idempotent "mark invited". The full
 * email-style invite payload goes through POST /api/invites; this
 * route is a quick "have I already invited X" tracker.
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = MarkInvitedSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "candidateId is required.");
    }
    const profile = await getCurrentEmployerProfile();
    const { candidateId } = parsed.data;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return failFromCode("not_found", "Candidate not found.", 404);
    }

    await prisma.employerInvitedCandidate.upsert({
      where: {
        employerId_candidateId: {
          employerId: profile.id,
          candidateId,
        },
      },
      create: { employerId: profile.id, candidateId },
      update: {},
    });
    return ok({ candidateId, invited: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
