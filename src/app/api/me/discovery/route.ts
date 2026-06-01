import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { syncMarketplaceMirror } from "@/lib/candidates/projection";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * Candidate-controlled marketplace discovery.
 *
 * GET  → current opt-in state.
 * PATCH {discoverable} → flip the flag and (re)project the candidate
 *        into / out of the marketplace catalog. This is the honest
 *        "be findable at the right moment" control from principle #4 —
 *        the candidate, not the system, decides when they're visible.
 */

export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    return ok({ discoverable: profile.discoverable });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const PatchSchema = z.object({ discoverable: z.boolean() }).strict();

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const json = await request.json().catch(() => null);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "Expected { discoverable: boolean }.");
    }
    const updated = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { discoverable: parsed.data.discoverable },
    });
    // Project into / hide from the marketplace to match the new state.
    await syncMarketplaceMirror(updated.userId);
    return ok({ discoverable: updated.discoverable });
  } catch (err) {
    return failFromUnknown(err);
  }
}
