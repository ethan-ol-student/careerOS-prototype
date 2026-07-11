import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * Timeline / Living Portfolio display metadata (Phase 2).
 *
 * The timeline ENTRIES derive client-side from data that already exists
 * (experiences, certificates, projects, skill claims) — this endpoint only
 * stores the customisable heading prefix and the per-entry flags, keyed by
 * the source row (`exp:<id>`, `cert:<id>`, `proj:<id>`, `skill:<id>`):
 * `{ major?: boolean, ai?: boolean, evidence?: string }`. Entry evidence
 * is the timeline's own reference (URL or note) — skill-claim evidence
 * stays the tier-2 trust source in /api/me/skills.
 */

type EntryMeta = { major?: boolean; ai?: boolean; evidence?: string };

const PatchSchema = z
  .object({
    prefix: z.string().trim().min(1).max(40).optional(),
    entry: z
      .object({
        key: z.string().regex(/^(exp|cert|proj|skill):[\w-]+$/),
        major: z.boolean().optional(),
        ai: z.boolean().optional(),
        evidence: z.string().trim().max(500).optional(),
      })
      .optional(),
  })
  .strict();

export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    return ok({
      prefix: profile.timelinePrefix,
      meta: (profile.timelineMeta ?? {}) as Record<string, EntryMeta>,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const json = await request.json().catch(() => null);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid timeline update.",
      );
    }
    const { prefix, entry } = parsed.data;

    let meta = (profile.timelineMeta ?? {}) as Record<string, EntryMeta>;
    if (entry) {
      const merged: EntryMeta = { ...meta[entry.key] };
      if (entry.major !== undefined) merged.major = entry.major;
      if (entry.ai !== undefined) merged.ai = entry.ai;
      if (entry.evidence !== undefined) merged.evidence = entry.evidence;
      // Drop empty records so the JSON never accumulates dead keys.
      if (!merged.major && !merged.ai && !merged.evidence?.trim()) {
        delete meta[entry.key];
        meta = { ...meta };
      } else {
        meta = { ...meta, [entry.key]: merged };
      }
    }

    const updated = await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        ...(prefix !== undefined ? { timelinePrefix: prefix } : {}),
        timelineMeta: meta,
      },
      select: { timelinePrefix: true, timelineMeta: true },
    });

    return ok({
      prefix: updated.timelinePrefix,
      meta: (updated.timelineMeta ?? {}) as Record<string, EntryMeta>,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}
