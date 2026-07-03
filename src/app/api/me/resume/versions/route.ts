import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { getResumeData } from "@/lib/resume/data";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** GET /api/me/resume/versions — the caller's saved resume snapshots. */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const versions = await prisma.resumeVersion.findMany({
      where: { candidateProfileId: profile.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, createdAt: true },
    });
    return ok({ versions });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const Schema = z.object({ label: z.string().trim().min(1).max(80) });

/**
 * POST /api/me/resume/versions — snapshot the CURRENT live resume data
 * under a label. Old versions stay reproducible after the profile changes.
 */
export async function POST(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "label is required (max 80 chars).");
    }
    const data = await getResumeData();
    const version = await prisma.resumeVersion.create({
      data: {
        candidateProfileId: profile.id,
        label: parsed.data.label,
        summary: data.summary,
        data: JSON.parse(JSON.stringify(data)),
      },
      select: { id: true, label: true, createdAt: true },
    });
    return ok(version);
  } catch (err) {
    return failFromUnknown(err);
  }
}
