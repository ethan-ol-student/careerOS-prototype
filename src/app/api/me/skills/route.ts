import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { NotFoundError } from "@/lib/api/errors";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";
import { assessEvidence, assessEndorsement } from "@/lib/skills/skillValidation";

/**
 * /api/me/skills — the caller's skill claims with 3-tier trust.
 *
 * Tier is DERIVED here, never accepted from the client:
 *   endorsedBy set → 3, else evidence set → 2, else 1.
 * A tier upgrade is EARNED: evidence must pass the AI plausibility check and
 * an endorsement must pass the quality check (`skillValidation.ts`) before it
 * persists — rejected input is dropped and fed back, so a stored evidence/
 * endorser always means it cleared the bar. No extra columns needed.
 *
 * `CandidateProfile.skills` (read by every existing engine/marketplace
 * surface) stays the mirror of claim names — claims are the trust source,
 * skills[] the compatibility view. GET self-heals: plain skills added
 * elsewhere (portfolio builder) become tier-1 claims.
 */

function deriveTier(evidence: string, endorsedBy: string): number {
  return endorsedBy.trim() ? 3 : evidence.trim() ? 2 : 1;
}

/** Mirror claim names into profile.skills (stable name order). */
async function syncProfileSkills(profileId: string) {
  const claims = await prisma.skillClaim.findMany({
    where: { profileId },
    orderBy: { name: "asc" },
  });
  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: { skills: claims.map((c) => c.name) },
  });
  return claims;
}

export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    // Self-heal: any profile.skills entry without a claim → tier-1 claim.
    const existing = await prisma.skillClaim.findMany({
      where: { profileId: profile.id },
      select: { name: true },
    });
    const have = new Set(existing.map((c) => c.name.toLowerCase()));
    const orphans = profile.skills.filter((s) => !have.has(s.toLowerCase()));
    if (orphans.length) {
      await prisma.skillClaim.createMany({
        data: orphans.map((name) => ({ profileId: profile.id, name })),
        skipDuplicates: true,
      });
    }
    const claims = await prisma.skillClaim.findMany({
      where: { profileId: profile.id },
      orderBy: { name: "asc" },
    });
    return ok({ claims });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const PostSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    level: z.number().int().min(1).max(5).default(3),
  })
  .strict();

export async function POST(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const parsed = PostSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return failFromCode("validation", "Invalid skill payload.");
    }
    const { name, level } = parsed.data;
    const claim = await prisma.skillClaim.upsert({
      where: { profileId_name: { profileId: profile.id, name } },
      create: { profileId: profile.id, name, level },
      update: { level },
    });
    await syncProfileSkills(profile.id);
    return ok({ claim });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const PatchSchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    level: z.number().int().min(1).max(5).optional(),
    evidence: z.string().trim().max(400).optional(),
    endorsedBy: z.string().trim().max(80).optional(),
    endorserNote: z.string().trim().max(160).optional(),
  })
  .strict();

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return failFromCode("validation", "Invalid skill payload.");
    }
    const { name, level, evidence, endorsedBy, endorserNote } = parsed.data;
    const current = await prisma.skillClaim.findUnique({
      where: { profileId_name: { profileId: profile.id, name } },
    });
    if (!current) throw new NotFoundError("Skill not found.");

    // Evidence gate (→ tier 2): must pass the plausibility check to persist.
    let nextEvidence = current.evidence;
    let evidenceAssessment = null;
    if (evidence !== undefined) {
      if (evidence.trim() === "") {
        nextEvidence = ""; // clearing → downgrade is always allowed
      } else {
        evidenceAssessment = assessEvidence(name, level ?? current.level, evidence);
        if (evidenceAssessment.status === "accepted") nextEvidence = evidence;
        // rejected → keep prior evidence, feedback returned below
      }
    }

    // Endorsement gate (→ tier 3): needs enough context to pass the quality check.
    let nextEndorsedBy = current.endorsedBy;
    let nextEndorserNote = endorserNote ?? current.endorserNote;
    let endorsementAssessment = null;
    if (endorsedBy !== undefined) {
      if (endorsedBy.trim() === "") {
        nextEndorsedBy = "";
        nextEndorserNote = "";
      } else {
        endorsementAssessment = assessEndorsement(
          (endorserNote ?? current.endorserNote).trim(),
          level ?? current.level,
        );
        if (endorsementAssessment.status === "active") nextEndorsedBy = endorsedBy;
        // flagged/rejected → no tier 3; note is still kept for a retry
      }
    }

    const claim = await prisma.skillClaim.update({
      where: { id: current.id },
      data: {
        ...(level !== undefined ? { level } : {}),
        evidence: nextEvidence,
        endorsedBy: nextEndorsedBy,
        endorserNote: nextEndorserNote,
        tier: deriveTier(nextEvidence, nextEndorsedBy),
      },
    });
    return ok({ claim, evidenceAssessment, endorsementAssessment });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const DeleteSchema = z.object({ name: z.string().trim().min(1).max(40) }).strict();

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const parsed = DeleteSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return failFromCode("validation", "Invalid skill payload.");
    }
    await prisma.skillClaim.deleteMany({
      where: { profileId: profile.id, name: parsed.data.name },
    });
    await syncProfileSkills(profile.id);
    return ok({ deleted: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
