import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { syncMarketplaceMirror } from "@/lib/candidates/projection";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/**
 * DELETE /api/me/portfolio/[collection]/[id]
 *
 * Removes one nested portfolio item. Deletes are scoped by `profileId`
 * (ownership) so a candidate can only delete their own items — an id
 * belonging to another user matches nothing and deletes nothing.
 */

const COLLECTIONS = ["projects", "certificates", "awards", "experiences"] as const;
type Collection = (typeof COLLECTIONS)[number];
function isCollection(value: string): value is Collection {
  return (COLLECTIONS as readonly string[]).includes(value);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ collection: string; id: string }> },
) {
  try {
    const { collection, id } = await params;
    if (!isCollection(collection)) {
      return failFromCode("not_found", "Unknown portfolio collection.", 404);
    }
    const profile = await getCurrentCandidateProfile();
    const where = { id, profileId: profile.id };

    let count = 0;
    if (collection === "projects") {
      ({ count } = await prisma.project.deleteMany({ where }));
    } else if (collection === "certificates") {
      ({ count } = await prisma.certificate.deleteMany({ where }));
    } else if (collection === "awards") {
      ({ count } = await prisma.award.deleteMany({ where }));
    } else {
      ({ count } = await prisma.experience.deleteMany({ where }));
    }

    if (count > 0) {
      await prisma.candidateProfile.update({
        where: { id: profile.id },
        data: { lastUpdated: new Date() },
      });
      await syncMarketplaceMirror(profile.userId);
    }

    return ok({ deleted: count > 0 });
  } catch (err) {
    return failFromUnknown(err);
  }
}
