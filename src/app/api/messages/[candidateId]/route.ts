import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const SendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

/** GET /api/messages/[candidateId] — full conversation history. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    const { candidateId } = await params;
    const profile = await getCurrentEmployerProfile();

    const conversation = await prisma.chatConversation.findUnique({
      where: {
        employerId_candidateId: {
          employerId: profile.id,
          candidateId,
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return ok(conversation?.messages ?? []);
  } catch (err) {
    return failFromUnknown(err);
  }
}

/**
 * POST /api/messages/[candidateId] — append an employer message.
 *
 * Returns `{ message }`. No automatic reply at the API layer —
 * the demo-only typing block in `ChatInterface.tsx` still fakes
 * one for the prototype. Delete that block when real-time lands.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    const { candidateId } = await params;
    const json = await request.json();
    const parsed = SendMessageSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "Message body is required.");
    }

    const profile = await getCurrentEmployerProfile();

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      return failFromCode("not_found", "Candidate not found.", 404);
    }

    // Idempotent get-or-create. Using `findUnique` first + `create`
    // catch lets us tolerate concurrent requests racing to create the
    // same conversation (e.g. the chat page firing two POSTs back to
    // back). The `P2002` catch handles the rare case where two
    // parallel inserts both pass the existence check.
    let conversation = await prisma.chatConversation.findUnique({
      where: {
        employerId_candidateId: {
          employerId: profile.id,
          candidateId,
        },
      },
    });
    if (!conversation) {
      try {
        conversation = await prisma.chatConversation.create({
          data: { employerId: profile.id, candidateId },
        });
      } catch (err) {
        const code = (err as { code?: string } | null)?.code;
        if (code === "P2002") {
          // Another request just inserted it — re-fetch and continue.
          conversation = await prisma.chatConversation.findUnique({
            where: {
              employerId_candidateId: {
                employerId: profile.id,
                candidateId,
              },
            },
          });
        } else {
          throw err;
        }
      }
    }
    if (!conversation) {
      return failFromCode("server", "Could not open conversation.", 500);
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        sender: "employer",
        body: parsed.data.body,
      },
    });

    return ok({ message });
  } catch (err) {
    return failFromUnknown(err);
  }
}
