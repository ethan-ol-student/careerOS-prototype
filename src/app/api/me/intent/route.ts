import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { syncMarketplaceMirror } from "@/lib/candidates/projection";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const IntentPatchSchema = z
  .object({
    stage: z.string().max(120).optional(),
    goals: z.array(z.string().max(120)).max(20).optional(),
    name: z.string().max(120).optional(),
    field: z.string().max(120).optional(),
    targetJob: z.string().max(120).optional(),
  })
  .strict();

/** PATCH /api/me/intent — partial intent updates. */
export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const parsed = IntentPatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid intent payload.",
      );
    }
    const profile = await getCurrentCandidateProfile();
    const updated = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: parsed.data,
    });
    await syncMarketplaceMirror(profile.userId);
    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
