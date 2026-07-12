import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import { loadCandidateSignal } from "@/lib/candidates/signal.loader";
import { scoreUndervaluedStrengths } from "@/lib/intelligence/undervaluedStrengthEngine";
import { scoreSkillGap } from "@/lib/intelligence/skillGapEngine";
import { scoreJobStyleFit } from "@/lib/intelligence/jobStyleFitEngine";
import { analyzeNarrative } from "@/lib/intelligence/narrativeThemeEngine";
import { toMarketField } from "@/lib/market/fieldMap";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/me/intelligence — cross-feature career intelligence for the
 * signed-in candidate:
 *  - undervalued strengths (Skill Radar self-rating vs Living Portfolio evidence)
 *  - market gaps (candidate skills vs real ingested JobStreet demand)
 *  - market context (field posting volume + salary range)
 * Grows to carry the tri-layer radar + job-style compass in later slices.
 */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    const signal = await loadCandidateSignal(profile.userId);
    if (!signal) {
      return ok({
        summary: null,
        undervalued: null,
        marketGaps: null,
        marketContext: null,
        styleFit: null,
        narrative: null,
      });
    }

    const undervalued = scoreUndervaluedStrengths(signal);

    // Canonicalize the candidate's free-text field to the corpus vocabulary,
    // then scope demand to it — falling back to the global row set when their
    // field still has no ingested demand.
    const field = toMarketField(signal.field);
    const fieldRows = field
      ? await prisma.skillDemand.findMany({ where: { field } })
      : [];
    const demandRows = fieldRows.length
      ? fieldRows
      : await prisma.skillDemand.findMany({ where: { field: "" } });
    const marketGaps = demandRows.length
      ? scoreSkillGap(
          signal,
          demandRows.map((d) => ({
            skill: d.skill,
            demandScore: d.demandScore,
            postingCount: d.postingCount,
          })),
        )
      : null;

    const fieldDemand = field
      ? await prisma.marketFieldDemand.findUnique({ where: { field } })
      : null;
    const marketContext = fieldDemand
      ? {
          field: fieldDemand.field,
          postingCount: fieldDemand.postingCount,
          salaryMinYr: fieldDemand.salaryMinYr,
          salaryMaxYr: fieldDemand.salaryMaxYr,
          currency: fieldDemand.currency,
        }
      : null;

    // Job-style fit — candidate archetype vs the field's typical work styles.
    // Descriptive only; null when the quiz isn't taken or the field has no data.
    let styleFit = null;
    if (signal.archetype && field) {
      const fws = await prisma.fieldWorkStyle.findMany({ where: { field } });
      if (fws.length) {
        const map: Record<string, number> = {};
        for (const w of fws) map[w.elementName] = w.score;
        styleFit = scoreJobStyleFit(signal.archetype, map, field);
      }
    }

    // Narrative themes — reads the Timeline Journal against portfolio evidence.
    // Descriptive career insight; null when the journal is empty.
    const narrative =
      signal.journal.length > 0
        ? analyzeNarrative({
            journal: signal.journal,
            portfolioText: signal.portfolioText,
          })
        : null;

    const summary = {
      skillsTracked: signal.skills.filter((s) => s.selfLevel !== null).length,
      evidenceBacked: signal.skills.filter((s) => s.evidenceCount > 0).length,
      undervaluedCount: undervalued.strengths.length,
    };

    return ok({ summary, undervalued, marketGaps, marketContext, styleFit, narrative });
  } catch (err) {
    return failFromUnknown(err);
  }
}
