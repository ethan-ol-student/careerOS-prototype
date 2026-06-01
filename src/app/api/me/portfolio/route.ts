import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { syncMarketplaceMirror } from "@/lib/candidates/projection";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const PortfolioPatchSchema = z
  .object({
    headline: z.string().max(120).optional(),
    summary: z.string().max(600).optional(),
    bio: z.string().max(2000).optional(),
    skills: z.array(z.string().max(50)).max(50).optional(),
  })
  .strict();

/** PATCH /api/me/portfolio — partial portfolio updates (top-level
 *  scalar / array fields). Nested collections (certificates, awards,
 *  projects, experiences) get dedicated routes later in Phase 4. */
export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const parsed = PortfolioPatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid portfolio payload.",
      );
    }
    const profile = await getCurrentCandidateProfile();
    const updated = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        ...parsed.data,
        totalAdditions: { increment: 1 },
        lastUpdated: new Date(),
      },
    });
    await syncMarketplaceMirror(profile.userId);
    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
