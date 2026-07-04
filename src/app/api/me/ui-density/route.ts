import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** GET /api/me/ui-density — the caller's saved override ("" = phase default). */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    return ok({ uiDensity: profile.uiDensity });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const Schema = z.object({ uiDensity: z.enum(["", "calm", "vibrant"]) });

/** PATCH /api/me/ui-density — set/clear the adaptive-UI override. */
export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        'uiDensity must be "", "calm", or "vibrant".',
      );
    }
    const updated = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { uiDensity: parsed.data.uiDensity },
    });
    return ok({ uiDensity: updated.uiDensity });
  } catch (err) {
    return failFromUnknown(err);
  }
}
