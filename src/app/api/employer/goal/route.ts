import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const EmployerGoalPatchSchema = z
  .object({
    talentType: z.string().max(40).optional(),
    role: z.string().max(80).optional(),
    priorities: z.array(z.string().max(40)).max(10).optional(),
    locationPreference: z.string().max(80).optional(),
  })
  .strict();

/** PATCH /api/employer/goal — partial hiring-goal updates. */
export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const parsed = EmployerGoalPatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid goal payload.",
      );
    }
    const profile = await getCurrentEmployerProfile();
    const updated = await prisma.employerProfile.update({
      where: { id: profile.id },
      data: parsed.data,
    });
    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
