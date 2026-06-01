import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const NotificationCreateSchema = z.object({
  kind: z.enum(["skill", "system", "job-match"]),
  severity: z.enum(["info", "important"]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  actionLabel: z.string().max(40).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

/** GET /api/me/notifications — list, newest first. */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const notifications = await prisma.candidateNotification.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    return ok(notifications);
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** POST /api/me/notifications — create one (skill added, job match). */
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
    const profile = await getCurrentCandidateProfile();
    const created = await prisma.candidateNotification.create({
      data: {
        profileId: profile.id,
        kind: parsed.data.kind,
        severity: parsed.data.severity,
        title: parsed.data.title,
        body: parsed.data.body,
        actionLabel: parsed.data.actionLabel,
        payload: parsed.data.payload as object | undefined,
      },
    });
    return ok(created);
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** PATCH /api/me/notifications — bulk action (mark all read / clear). */
export async function PATCH(request: Request) {
  try {
    const json = (await request.json().catch(() => ({}))) as {
      action?: "markAllRead" | "clearAll";
    };
    const profile = await getCurrentCandidateProfile();

    if (json.action === "clearAll") {
      await prisma.candidateNotification.deleteMany({
        where: { profileId: profile.id },
      });
      return ok({ cleared: true });
    }

    // Default: mark-all-read.
    await prisma.candidateNotification.updateMany({
      where: { profileId: profile.id, read: false },
      data: { read: true },
    });
    return ok({ markedRead: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
