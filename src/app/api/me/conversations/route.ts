import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/api/currentUser";
import { mirrorIdForUser } from "@/lib/candidates/projection";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/me/conversations — the signed-in candidate's chat threads
 * with employers.
 *
 * This is the candidate half of the messaging bridge: employer chats
 * are stored against the candidate's marketplace mirror row
 * (`Candidate.id = real-<userId>`), so we resolve them by that id and
 * surface the employer's organization name. Independent of the
 * notification system, mirroring the employer-side `/api/employer/messages`.
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (user.role !== "CANDIDATE") {
      return failFromCode("forbidden", "Only candidates have a candidate inbox.", 403);
    }

    const mirrorId = mirrorIdForUser(user.id);
    const conversations = await prisma.chatConversation.findMany({
      where: { candidateId: mirrorId },
      orderBy: { updatedAt: "desc" },
      include: {
        employer: { select: { organizationName: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const data = conversations.map((c) => {
      const last = c.messages[0];
      return {
        conversationId: c.id,
        employerName: c.employer?.organizationName?.trim() || "An employer",
        lastMessage: last?.body ?? null,
        lastSender: last?.sender ?? null,
        lastMessageAt: (last?.createdAt ?? c.updatedAt).getTime(),
      };
    });

    return ok({ conversations: data });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return failFromCode("unauthenticated", err.message, 401);
    }
    return failFromUnknown(err);
  }
}
