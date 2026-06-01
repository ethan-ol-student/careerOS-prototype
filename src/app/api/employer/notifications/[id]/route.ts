import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** DELETE /api/employer/notifications/[id] — dismiss one. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const profile = await getCurrentEmployerProfile();
    const result = await prisma.employerNotification.deleteMany({
      where: { id, employerId: profile.id },
    });
    if (result.count === 0) {
      return failFromCode("not_found", "Notification not found.", 404);
    }
    return ok({ id });
  } catch (err) {
    return failFromUnknown(err);
  }
}
