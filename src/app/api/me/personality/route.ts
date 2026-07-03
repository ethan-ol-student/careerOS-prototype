import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { syncMarketplaceMirror } from "@/lib/candidates/projection";
import { scoreQuiz, QUIZ_QUESTIONS } from "@/lib/intelligence/personalityEngine";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

/** GET /api/me/personality — the caller's working-style result (or null). */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const result = await prisma.personalityResult.findUnique({
      where: { candidateProfileId: profile.id },
    });
    return ok({ result });
  } catch (err) {
    return failFromUnknown(err);
  }
}

const Schema = z.object({
  answers: z.record(z.string(), z.string()),
});

/**
 * POST /api/me/personality — score the quiz DETERMINISTICALLY server-side
 * and persist the result. Also mirrors the archetype tag onto the
 * candidate's marketplace row (context only — never a filter).
 */
export async function POST(request: Request) {
  try {
    const profile = await getCurrentCandidateProfile();
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "answers must map question ids to option ids.");
    }
    const answered = QUIZ_QUESTIONS.filter((q) => parsed.data.answers[q.id]).length;
    if (answered < QUIZ_QUESTIONS.length) {
      return failFromCode(
        "validation",
        `Answer all ${QUIZ_QUESTIONS.length} questions (got ${answered}).`,
      );
    }

    const outcome = scoreQuiz(parsed.data.answers);
    const result = await prisma.personalityResult.upsert({
      where: { candidateProfileId: profile.id },
      create: {
        candidateProfileId: profile.id,
        archetype: outcome.archetype,
        scores: outcome.totals,
        answers: parsed.data.answers,
      },
      update: {
        archetype: outcome.archetype,
        scores: outcome.totals,
        answers: parsed.data.answers,
      },
    });
    // Refresh the marketplace mirror so the employer-side tag stays in sync.
    await syncMarketplaceMirror(profile.userId);
    return ok({ result, outcome });
  } catch (err) {
    return failFromUnknown(err);
  }
}
