import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromUnknown } from "@/lib/api/respond";

/** POST /api/employer/onboarding — mark onboarding as complete. */
export async function POST() {
  try {
    const profile = await getCurrentEmployerProfile();
    const updated = await prisma.employerProfile.update({
      where: { id: profile.id },
      data: { hasCompletedOnboarding: true },
    });
    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}
