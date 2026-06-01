import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const NotificationCreateSchema = z.object({
  kind: z.enum(["invite-accepted", "invite-pending", "system"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  candidateId: z.string().max(80).optional(),
});

/** GET /api/employer/notifications — list, newest first. */
export async function GET() {
  try {
    const profile = await getCurrentEmployerProfile();
    const notifications = await prisma.employerNotification.findMany({
      where: { employerId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    return ok(notifications);
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** POST /api/employer/notifications — create one. */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = NotificationCreateSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid notification payload.",
      );
    }
    const profile = await getCurrentEmployerProfile();
    const created = await prisma.employerNotification.create({
      data: {
        employerId: profile.id,
        kind: parsed.data.kind,
        title: parsed.data.title,
        body: parsed.data.body,
        candidateId: parsed.data.candidateId,
      },
    });
    return ok(created);
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** PATCH /api/employer/notifications — bulk mark-all-read / clear-all. */
export async function PATCH(request: Request) {
  try {
    const json = (await request.json().catch(() => ({}))) as {
      action?: "markAllRead" | "clearAll";
    };
    const profile = await getCurrentEmployerProfile();

    if (json.action === "clearAll") {
      await prisma.employerNotification.deleteMany({
        where: { employerId: profile.id },
      });
      return ok({ cleared: true });
    }

    await prisma.employerNotification.updateMany({
      where: { employerId: profile.id, read: false },
      data: { read: true },
    });
    return ok({ markedRead: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
