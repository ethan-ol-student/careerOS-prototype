import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser, UnauthorizedError } from "@/lib/api/currentUser";
import { mirrorIdForUser } from "@/lib/candidates/projection";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * Candidate-side thread access. Both handlers verify the conversation
 * belongs to the signed-in candidate's marketplace mirror
 * (`candidateId === real-<userId>`) before returning or appending —
 * a candidate can only ever read/reply to their OWN threads.
 */

async function ownedConversation(userId: string, conversationId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) return null;
  if (conversation.candidateId !== mirrorIdForUser(userId)) return null;
  return conversation;
}

/** GET /api/me/conversations/[id] — full message history for a thread. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (user.role !== "CANDIDATE") {
      return failFromCode("forbidden", "Only candidates can read this thread.", 403);
    }
    const conversation = await ownedConversation(user.id, id);
    if (!conversation) {
      return failFromCode("not_found", "Conversation not found.", 404);
    }
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    });
    return ok(messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      body: m.body,
      createdAt: m.createdAt.getTime(),
    })));
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return failFromCode("unauthenticated", err.message, 401);
    }
    return failFromUnknown(err);
  }
}

const PostSchema = z.object({ body: z.string().min(1).max(4000) });

/** POST /api/me/conversations/[id] — candidate replies to an employer. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (user.role !== "CANDIDATE") {
      return failFromCode("forbidden", "Only candidates can reply here.", 403);
    }
    const json = await request.json();
    const parsed = PostSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "Message body is required.");
    }
    const conversation = await ownedConversation(user.id, id);
    if (!conversation) {
      return failFromCode("not_found", "Conversation not found.", 404);
    }
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "candidate",
        body: parsed.data.body,
      },
    });
    // Bump the conversation so it sorts to the top on both sides.
    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return ok({
      message: {
        id: message.id,
        sender: message.sender,
        body: message.body,
        createdAt: message.createdAt.getTime(),
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return failFromCode("unauthenticated", err.message, 401);
    }
    return failFromUnknown(err);
  }
}
