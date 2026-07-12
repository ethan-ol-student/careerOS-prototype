import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * Timeline Journal — the narrative source for narrativeThemeEngine and the
 * Life Chapter Designer's journal sub-page. All routes are scoped to the
 * session candidate; PATCH/DELETE filter by profileId so a foreign id simply
 * matches nothing (never touches another user's entries).
 */

// Legal moods — TS is the source of truth (String column, no PG enum).
const MOODS = ["", "energized", "steady", "drained", "proud", "uncertain"] as const;

const EntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD."),
  title: z.string().trim().min(1, "A title is required.").max(120),
  reflection: z.string().max(2000).optional().default(""),
  mood: z.enum(MOODS).optional().default(""),
  skillsTouched: z.array(z.string().trim().min(1).max(40)).max(12).optional().default([]),
  pivot: z.boolean().optional().default(false),
});

/** GET /api/me/journal — the caller's entries, newest first. */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const entries = await prisma.timelineJournalEntry.findMany({
      where: { profileId: profile.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return ok({ entries });
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** POST /api/me/journal — create an entry. */
export async function POST(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const parsed = EntrySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return failFromCode("validation", parsed.error.issues[0]?.message ?? "Invalid entry.");
    }
    const entry = await prisma.timelineJournalEntry.create({
      data: { profileId: profile.id, ...parsed.data },
    });
    return ok({ entry });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const PatchSchema = EntrySchema.partial().extend({ id: z.string().min(1) });

/** PATCH /api/me/journal — update one of the caller's entries (id in body). */
export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return failFromCode("validation", parsed.error.issues[0]?.message ?? "Invalid entry.");
    }
    const { id, ...data } = parsed.data;
    const res = await prisma.timelineJournalEntry.updateMany({
      where: { id, profileId: profile.id },
      data,
    });
    if (res.count === 0) return failFromCode("not_found", "Entry not found.", 404);
    return ok({ id });
  } catch (err) {
    return failFromUnknown(err);
  }
}

/** DELETE /api/me/journal — delete one of the caller's entries (id in body). */
export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return failFromCode("validation", "An entry id is required.");
    const res = await prisma.timelineJournalEntry.deleteMany({
      where: { id, profileId: profile.id },
    });
    if (res.count === 0) return failFromCode("not_found", "Entry not found.", 404);
    return ok({ id });
  } catch (err) {
    return failFromUnknown(err);
  }
}
