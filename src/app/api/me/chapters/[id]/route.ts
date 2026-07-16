import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const SubtaskSchema = z.object({
  id: z.string().max(40),
  label: z.string().max(120),
  done: z.boolean().optional(),
});

const ChapterPatchSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    date: z.string().max(32).optional(),
    time: z.string().max(32).optional(),
    subtasks: z.array(SubtaskSchema).max(20).optional(),
    meaningful: z.boolean().nullable().optional(),
  })
  .strict();

/** PATCH /api/me/chapters/[id] — update a chapter (e.g. toggle a
 *  subtask done). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const json = await request.json();
    const parsed = ChapterPatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid chapter patch.",
      );
    }
    const profile = await getCurrentCandidateProfile();
    const existing = await prisma.chapterEvent.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!existing) {
      return failFromCode("not_found", "Chapter not found.", 404);
    }
    const updated = await prisma.chapterEvent.update({
      where: { id },
      data: parsed.data,
    });
    return ok(updated);
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** DELETE /api/me/chapters/[id] — remove a chapter. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const profile = await getCurrentCandidateProfile();
    const result = await prisma.chapterEvent.deleteMany({
      where: { id, profileId: profile.id },
    });
    if (result.count === 0) {
      return failFromCode("not_found", "Chapter not found.", 404);
    }
    return ok({ id });
  } catch (err) {
    return failFromUnknown(err);
  }
}
