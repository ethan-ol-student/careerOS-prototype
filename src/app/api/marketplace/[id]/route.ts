import { prisma } from "@/lib/prisma";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** GET /api/marketplace/[id] — single catalog candidate. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) {
      return failFromCode("not_found", "Candidate not found.", 404);
    }
    // NOTE: direct-by-id lookups intentionally return the candidate even
    // when `visible` is false. Discovery-off removes a candidate from
    // NEW marketplace searches (the list endpoint filters `visible:true`),
    // but anyone with an existing relationship — an employer who already
    // saved/invited them, or someone with their shared profile link —
    // keeps access. This mirrors the common "unlisted profile" model.
    return ok(candidate);
  } catch (err) {
    return failFromUnknown(err);
  }
}
