import { prisma } from "@/lib/prisma";

/**
 * Shared skill-claim persistence (server-only).
 *
 * `CandidateProfile.skills` stays the mirror of claim names — claims are
 * the trust source, skills[] the compatibility view every engine reads.
 */

/** Mirror claim names into profile.skills (stable name order). */
export async function syncProfileSkills(profileId: string) {
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

/**
 * Upsert a batch of names as tier-1 (self-claimed) claims — the "skills
 * strengthened or learned" auto-add from portfolio experiences. Respects
 * the 100-claim ceiling by silently skipping past-cap names (the portfolio
 * write must never fail because the radar is full); existing claims are
 * left untouched (never downgrades a validated claim).
 */
export async function addTier1Claims(profileId: string, names: string[]) {
  const cleaned = [...new Set(names.map((n) => n.trim().slice(0, 40)).filter(Boolean))];
  if (!cleaned.length) return;
  const existing = await prisma.skillClaim.findMany({
    where: { profileId },
    select: { name: true },
  });
  const have = new Set(existing.map((c) => c.name.toLowerCase()));
  const fresh = cleaned.filter((n) => !have.has(n.toLowerCase()));
  const room = Math.max(0, 100 - existing.length);
  if (fresh.length) {
    await prisma.skillClaim.createMany({
      data: fresh.slice(0, room).map((name) => ({ profileId, name, level: 3 })),
      skipDuplicates: true,
    });
  }
  await syncProfileSkills(profileId);
}
