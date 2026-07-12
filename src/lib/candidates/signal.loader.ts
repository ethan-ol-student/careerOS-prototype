/**
 * Server loader for the Candidate Signal (see intelligence/candidateSignal.ts).
 *
 * One Prisma read that fans across the five candidate modules and maps the rows
 * into the pure `CandidateSignalInput`. Keeping the I/O here (and the
 * normalization in the pure builder) is what lets the intelligence engines stay
 * deterministic + unit-checkable. Server-only (imports prisma).
 */
import { prisma } from "@/lib/prisma";
import { normalizeCareerPhase } from "@/lib/dashboard/phaseConfig";
import {
  buildCandidateSignal,
  type CandidateSignal,
  type CandidateSignalInput,
} from "@/lib/intelligence/candidateSignal";

export async function loadCandidateSignalInput(
  userId: string,
): Promise<CandidateSignalInput | null> {
  const [profile, ai] = await Promise.all([
    prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        skillClaims: true,
        experiences: true,
        projects: true,
        midCareer: true,
        personality: true,
        applications: { include: { job: { select: { field: true } } } },
        journalEntries: { orderBy: { date: "asc" } },
      },
    }),
    prisma.candidatesAI.findUnique({ where: { userId } }),
  ]);
  if (!profile) return null;

  const scores =
    (profile.personality?.scores as Record<string, number> | null) ?? {};

  return {
    claims: profile.skillClaims.map((c) => ({
      name: c.name,
      level: c.level,
      tier: c.tier,
    })),
    experiences: profile.experiences.map((e) => ({
      role: e.role,
      company: e.company,
      detail: e.detail,
    })),
    projects: profile.projects.map((p) => ({
      title: p.title,
      description: p.description,
    })),
    problemsSolved: profile.midCareer?.problemsSolved ?? [],
    journal: profile.journalEntries.map((j) => ({
      date: j.date,
      title: j.title,
      reflection: j.reflection,
      mood: j.mood,
      skillsTouched: j.skillsTouched,
      pivot: j.pivot,
    })),
    headline: profile.headline,
    summary: profile.summary,
    archetype: profile.personality?.archetype ?? null,
    archetypeScores: scores,
    savedJobFields: profile.applications.map((a) => a.job.field),
    growthIntent: ai?.skillsToImprove ?? [],
    field: ai?.interestedIndustries?.[0]?.trim() || profile.field,
    targetRole:
      profile.targetJob?.trim() ||
      ai?.targetRoles?.[0] ||
      ai?.desiredNextMove ||
      "",
    phase: ai?.careerStage ? normalizeCareerPhase(ai.careerStage) : null,
  };
}

/** Convenience: load + build in one call. Returns null for a missing profile. */
export async function loadCandidateSignal(
  userId: string,
): Promise<CandidateSignal | null> {
  const input = await loadCandidateSignalInput(userId);
  return input ? buildCandidateSignal(input) : null;
}
