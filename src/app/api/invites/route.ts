import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { rateLimit, clientIp } from "@/lib/auth/rateLimit";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const SendInviteSchema = z.object({
  candidateId: z.string().min(1).max(80),
  subject: z.string().min(4).max(120),
  message: z.string().min(20).max(4000),
});

/**
 * POST /api/invites — employer sends an invite to a catalog candidate.
 *
 * Side effects (single Prisma transaction):
 *   1. Mark the candidate as invited (idempotent).
 *   2. Seed an "invite-pending" notification on the employer side so
 *      the bell shows immediate feedback.
 *   3. Ensure a chat conversation exists so the Messages tab works.
 *
 * Returns `{ inviteId, notification }` matching the API contract.
 */
export async function POST(request: Request) {
  try {
    // Throttle invite/message blasts from one origin.
    const rl = rateLimit(`invite:${clientIp(request)}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return failFromCode(
        "rate_limited",
        "Too many invites too fast. Please slow down.",
        429,
      );
    }

    const json = await request.json();
    const parsed = SendInviteSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid invite payload.",
      );
    }
    const { candidateId, subject, message } = parsed.data;
    const profile = await getCurrentEmployerProfile();

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, name: true, targetRole: true, userId: true },
    });
    if (!candidate) {
      return failFromCode("not_found", "Candidate not found.", 404);
    }

    const [, notification, conversation] = await prisma.$transaction([
      prisma.employerInvitedCandidate.upsert({
        where: {
          employerId_candidateId: {
            employerId: profile.id,
            candidateId,
          },
        },
        create: { employerId: profile.id, candidateId },
        update: {},
      }),
      prisma.employerNotification.create({
        data: {
          employerId: profile.id,
          kind: "invite-pending",
          title: `Invite sent to ${candidate.name}.`,
          body: `Subject: ${subject}`,
          candidateId,
        },
      }),
      prisma.chatConversation.upsert({
        where: {
          employerId_candidateId: {
            employerId: profile.id,
            candidateId,
          },
        },
        create: {
          employerId: profile.id,
          candidateId,
          messages: {
            create: [
              { sender: "employer", body: `${subject}\n\n${message}` },
            ],
          },
        },
        update: {
          messages: {
            create: [
              { sender: "employer", body: `${subject}\n\n${message}` },
            ],
          },
        },
      }),
    ]);

    // Cross-side bridge: if this is a REAL candidate (projected into the
    // marketplace), drop a persistent notification into THEIR inbox so
    // they're reached at the right moment — the honest both-sides
    // connection from principle #4. Seed/demo candidates have no user,
    // so this is skipped for them.
    if (candidate.userId) {
      const candidateProfile = await prisma.candidateProfile.findUnique({
        where: { userId: candidate.userId },
        select: { id: true },
      });
      if (candidateProfile) {
        const orgName = profile.organizationName?.trim() || "An employer";
        await prisma.candidateNotification.create({
          data: {
            profileId: candidateProfile.id,
            kind: "system",
            severity: "important",
            title: `${orgName} wants to connect`,
            body: `${subject} — open Messages to reply.`,
          },
        });
      }
    }

    return ok({
      inviteId: conversation.id,
      notification,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
