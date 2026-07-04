import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";
import {
  pickBenchmark,
  scoreLifeImpact,
  type BenchmarkRow,
} from "@/lib/intelligence/fairPayEngine";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/me/fair-pay — the Fair Pay & Life Impact readout: salary
 * fairness vs the best curated benchmark + non-salary life factors +
 * a smart/balanced/risky move verdict. Salary is optional and PRIVATE —
 * it never leaves this candidate-scoped endpoint.
 */
export async function GET() {
  try {
    const profile = await getCurrentCandidateProfile();
    // Pro gate (Fair Pay & Salary Benchmark report) — judges bypass.
    await requireEntitlement();
    const [midCareer, ai, benchmarks] = await Promise.all([
      prisma.midCareerProfile.findUnique({
        where: { candidateProfileId: profile.id },
      }),
      prisma.candidatesAI.findUnique({ where: { userId: profile.userId } }),
      prisma.salaryBenchmark.findMany(),
    ]);

    const targetRole = ai?.targetRoles[0] ?? profile.targetJob ?? "";
    const benchmark = targetRole
      ? pickBenchmark(targetRole, ai?.locationPreference ?? "", benchmarks as BenchmarkRow[])
      : null;

    const readout = scoreLifeImpact(
      midCareer?.salaryPrivate ?? null,
      benchmark,
      midCareer?.lifeFactors ?? [],
    );
    return ok({ readout, hasSalary: midCareer?.salaryPrivate != null });
  } catch (err) {
    return failFromUnknown(err);
  }
}
