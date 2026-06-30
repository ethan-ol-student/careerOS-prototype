import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { devModeGuard, loadTestContext } from "@/lib/dev/testApi";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";

const Schema = z.object({ scope: z.enum(["candidate", "employer", "all", "demo"]) });

/**
 * POST /api/dev/reset — wipe test data. Dev only.
 * - "candidate"/"employer"/"all": the test account's own profile data.
 * - "demo": the seeded demo catalog — deletes ONLY `isDemo` rows, so real
 *   users/companies/jobs/benchmarks are never touched.
 */
export async function POST(request: Request) {
  const blocked = devModeGuard();
  if (blocked) return blocked;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return failFromCode("validation", "scope must be candidate, employer, all, or demo.");
    }
    const { scope } = parsed.data;

    if (scope === "demo") {
      // Order respects FKs: jobs (their applications cascade) before the
      // companies they belong to; salary + candidates are independent.
      const jobs = await prisma.job.deleteMany({ where: { isDemo: true } });
      const companies = await prisma.company.deleteMany({ where: { isDemo: true } });
      const salaryBenchmarks = await prisma.salaryBenchmark.deleteMany({ where: { isDemo: true } });
      const candidates = await prisma.candidate.deleteMany({ where: { isDemo: true } });
      return ok({
        message: "Reset demo catalog (isDemo rows only).",
        scope,
        deleted: {
          jobs: jobs.count,
          companies: companies.count,
          salaryBenchmarks: salaryBenchmarks.count,
          candidates: candidates.count,
        },
      });
    }

    const ctx = await loadTestContext();
    const profileId = ctx.candidateProfileId;
    const employerId = ctx.employerProfileId;
    const userId = ctx.user.id;

    if (scope === "candidate" || scope === "all") {
      await prisma.chapterEvent.deleteMany({ where: { profileId } });
      await prisma.candidateNotification.deleteMany({ where: { profileId } });
      await prisma.project.deleteMany({ where: { profileId } });
      await prisma.experience.deleteMany({ where: { profileId } });
      await prisma.certificate.deleteMany({ where: { profileId } });
      await prisma.award.deleteMany({ where: { profileId } });
      await prisma.candidateProfile.update({
        where: { id: profileId },
        data: {
          headline: "",
          summary: "",
          skills: [],
          bio: "",
          totalAdditions: 0,
          lastUpdated: null,
        },
      });
      // Reset advanced onboarding row to pristine (clears phase + flags).
      await prisma.candidatesAI.deleteMany({ where: { userId } });
      await prisma.candidatesAI.create({ data: { userId } });
    }

    if (scope === "employer" || scope === "all") {
      await prisma.employerSavedCandidate.deleteMany({ where: { employerId } });
      await prisma.employerInvitedCandidate.deleteMany({ where: { employerId } });
      await prisma.employerNotification.deleteMany({ where: { employerId } });
      // Conversations cascade-delete their messages.
      await prisma.chatConversation.deleteMany({ where: { employerId } });
      await prisma.employerProfile.update({
        where: { id: employerId },
        data: {
          hasCompletedOnboarding: false,
          talentType: "",
          role: "",
          priorities: [],
          locationPreference: null,
        },
      });
      await prisma.employersAI.deleteMany({ where: { userId } });
      await prisma.employersAI.create({ data: { userId } });
    }

    return ok({ message: `Reset ${scope} test data.`, scope });
  } catch (err) {
    return failFromUnknown(err);
  }
}
