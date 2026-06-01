import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/employer/messages — the signed-in employer's conversation
 * list (independent of notifications). Returns one row per
 * `ChatConversation` with the joined candidate and a preview of the
 * latest message, newest conversation first.
 *
 * This is the data source for the dedicated `/employers/messages`
 * page, so chat history is never coupled to notification read-state.
 */
export async function GET() {
  try {
    const profile = await getCurrentEmployerProfile();

    const conversations = await prisma.chatConversation.findMany({
      where: { employerId: profile.id },
      orderBy: { updatedAt: "desc" },
      include: {
        candidate: {
          select: { id: true, name: true, headline: true, targetRole: true },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const data = conversations.map((c) => {
      const last = c.messages[0];
      return {
        conversationId: c.id,
        candidateId: c.candidateId,
        candidateName: c.candidate?.name ?? "Candidate",
        candidateRole: c.candidate?.targetRole ?? "",
        candidateHeadline: c.candidate?.headline ?? "",
        lastMessage: last?.body ?? null,
        lastSender: last?.sender ?? null,
        lastMessageAt: (last?.createdAt ?? c.updatedAt).getTime(),
      };
    });

    return ok({ conversations: data });
  } catch (err) {
    return failFromUnknown(err);
  }
}
