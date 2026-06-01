import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** DELETE /api/me/notifications/[id] — dismiss a single notification. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const profile = await getCurrentCandidateProfile();
    const result = await prisma.candidateNotification.deleteMany({
      where: { id, profileId: profile.id },
    });
    if (result.count === 0) {
      return failFromCode("not_found", "Notification not found.", 404);
    }
    return ok({ id });
  } catch (err) {
    return failFromUnknown(err);
  }
}
