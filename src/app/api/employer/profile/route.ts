import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * Employer profile fields that live on `EmployerProfile` itself
 * (distinct from the AI/onboarding answers in `EmployersAI`). Scoped
 * to the session employer.
 */

/** GET /api/employer/profile — organization-level profile fields. */
export async function GET() {
  try {
    const profile = await getCurrentEmployerProfile();
    return ok({
      organizationName: profile.organizationName ?? "",
      hasCompletedOnboarding: profile.hasCompletedOnboarding,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const PatchSchema = z
  .object({
    organizationName: z.string().max(120).optional(),
  })
  .strict();

/** PATCH /api/employer/profile — update organization-level fields. */
export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentEmployerProfile();
    const json = await request.json().catch(() => null);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid profile update.",
      );
    }
    const updated = await prisma.employerProfile.update({
      where: { id: profile.id },
      data: parsed.data,
    });
    return ok({ organizationName: updated.organizationName ?? "" });
  } catch (err) {
    return failFromUnknown(err);
  }
}
