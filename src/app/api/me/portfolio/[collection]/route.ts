import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { syncMarketplaceMirror } from "@/lib/candidates/projection";
import { addTier1Claims } from "@/lib/skills/claims";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * POST /api/me/portfolio/[collection]
 *
 * Creates one nested portfolio item (project / certificate / award /
 * experience) for the signed-in candidate. Scoped to the session
 * user's profile — a client can never write to another user's
 * portfolio.
 */

const COLLECTIONS = ["projects", "certificates", "awards", "experiences"] as const;
type Collection = (typeof COLLECTIONS)[number];
function isCollection(value: string): value is Collection {
  return (COLLECTIONS as readonly string[]).includes(value);
}

const ProjectSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(600).default(""),
  link: z.string().max(300).optional(),
});
const CertificateSchema = z.object({
  title: z.string().min(1).max(120),
  issuer: z.string().max(120).default(""),
  year: z.string().max(12).default(""),
});
const AwardSchema = z.object({
  title: z.string().min(1).max(120),
  year: z.string().max(12).default(""),
  description: z.string().max(600).optional(),
});
const ExperienceSchema = z.object({
  role: z.string().min(1).max(120), // the problem/project title when kind="project"
  company: z.string().max(120).default(""),
  period: z.string().max(60).default(""),
  detail: z.string().max(600).optional(),
  // Structured merge (Experience = experience ∪ projects ∪ problems solved)
  kind: z.enum(["role", "project"]).default("role"),
  contribution: z.enum(["", "lead", "assistant", "participant"]).default(""),
  approach: z.string().max(600).default(""),
  impact: z.string().max(600).default(""),
  skillsUsed: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  link: z.string().max(300).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ collection: string }> },
) {
  try {
    const { collection } = await params;
    if (!isCollection(collection)) {
      return failFromCode("not_found", "Unknown portfolio collection.", 404);
    }
    const profile = await getCurrentCandidateProfile();
    const json = await request.json().catch(() => null);

    let created: unknown;
    if (collection === "projects") {
      const p = ProjectSchema.safeParse(json);
      if (!p.success) {
        return failFromCode("validation", p.error.issues[0]?.message ?? "Invalid project.");
      }
      created = await prisma.project.create({
        data: { ...p.data, profileId: profile.id },
      });
    } else if (collection === "certificates") {
      const p = CertificateSchema.safeParse(json);
      if (!p.success) {
        return failFromCode("validation", p.error.issues[0]?.message ?? "Invalid certificate.");
      }
      created = await prisma.certificate.create({
        data: { ...p.data, profileId: profile.id },
      });
    } else if (collection === "awards") {
      const p = AwardSchema.safeParse(json);
      if (!p.success) {
        return failFromCode("validation", p.error.issues[0]?.message ?? "Invalid award.");
      }
      created = await prisma.award.create({
        data: { ...p.data, profileId: profile.id },
      });
    } else {
      const p = ExperienceSchema.safeParse(json);
      if (!p.success) {
        return failFromCode("validation", p.error.issues[0]?.message ?? "Invalid experience.");
      }
      created = await prisma.experience.create({
        data: { ...p.data, profileId: profile.id },
      });
      // "Skills strengthened or learned" auto-land on the Skill Radar as
      // tier-1 claims (never downgrades an existing validated claim).
      if (p.data.skillsUsed.length) {
        await addTier1Claims(profile.id, p.data.skillsUsed);
      }
    }

    // Touch the parent profile so "last updated" reflects the change.
    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: { totalAdditions: { increment: 1 }, lastUpdated: new Date() },
    });
    await syncMarketplaceMirror(profile.userId);

    return ok(created);
  } catch (err) {
    return failFromUnknown(err);
  }
}
