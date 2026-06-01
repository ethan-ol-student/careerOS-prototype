import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const SubtaskSchema = z.object({
  id: z.string().max(40),
  label: z.string().max(120),
  done: z.boolean().optional(),
});

const ChapterCreateSchema = z.object({
  name: z.string().min(1).max(80),
  priority: z.enum(["high", "medium", "low"]),
  date: z.string().min(1).max(32),
  time: z.string().max(32),
  subtasks: z.array(SubtaskSchema).max(20),
});

/** GET /api/me/chapters — list. */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const chapters = await prisma.chapterEvent.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "asc" },
    });
    return ok(chapters);
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** POST /api/me/chapters — create a new event. */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ChapterCreateSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid chapter payload.",
      );
    }
    const profile = await getCurrentCandidateProfile();
    const created = await prisma.chapterEvent.create({
      data: {
        profileId: profile.id,
        name: parsed.data.name.trim(),
        priority: parsed.data.priority,
        date: parsed.data.date,
        time: parsed.data.time,
        subtasks: parsed.data.subtasks,
      },
    });
    return ok(created);
  } catch (err) {
    return failFromUnknown(err);
  }
}
