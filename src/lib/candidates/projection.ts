/**
 * Marketplace mirror projection (SERVER-ONLY).
 *
 * This is the connective tissue that fixes the root architectural gap:
 * real candidate users (`User` + `CandidateProfile` + `CandidatesAI`)
 * were previously invisible to employers, who only ever saw the static
 * `Candidate` catalog. `syncMarketplaceMirror` projects a real candidate
 * into that same `Candidate` table (id `real-<userId>`, `source="real"`,
 * `userId` link) so EVERY existing employer flow — marketplace listing,
 * save, invite, chat — works on real people with zero changes, and the
 * `userId` link lets the candidate inbox resolve employer conversations.
 *
 * Discovery is candidate-controlled: the row's `visible` flag mirrors
 * `CandidateProfile.discoverable`. Turning discovery off hides the row
 * but preserves any saves/invites/conversations tied to it.
 *
 * Never throws to the caller — a projection failure must not break the
 * user's primary profile write.
 */

import { prisma } from "@/lib/prisma";
import { readinessScore } from "./readiness";
import type { CandidateCategory, GrowthSignal, Availability } from "./types";

export function mirrorIdForUser(userId: string): string {
  return `real-${userId}`;
}

const CATEGORY_KEYWORDS: Record<CandidateCategory, string[]> = {
  Technology: ["tech", "software", "engineer", "developer", "it", "saas"],
  Design: ["design", "ux", "ui", "product design", "graphic"],
  Marketing: ["marketing", "growth", "seo", "content", "brand"],
  Engineering: ["mechanical", "electrical", "civil", "hardware", "manufactur"],
  Business: ["business", "sales", "operations manager", "consult", "finance", "management"],
  Data: ["data", "analyst", "analytics", "machine learning", "ml", "ai"],
  Creative: ["creative", "writer", "video", "media", "art"],
  Operations: ["operations", "logistics", "supply", "coordinator", "admin"],
};

function inferCategory(...hints: string[]): CandidateCategory {
  const hay = hints.join(" ").toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [
    CandidateCategory,
    string[],
  ][]) {
    if (words.some((w) => hay.includes(w))) return cat;
  }
  return "Technology";
}

function inferAvailability(raw: string | null | undefined): Availability {
  const a = (raw ?? "").toLowerCase();
  if (a.includes("actively")) return "Actively looking";
  if (a.includes("intern")) return "Open to internships";
  if (a.includes("graduat") || a.includes("future")) return "Future-ready (graduating soon)";
  if (a.includes("not")) return "Not actively looking";
  return "Open to opportunities";
}

function inferStage(careerStage: string): string {
  switch (careerStage) {
    case "student":
      return "Student";
    case "young-adult":
      return "Fresh grad";
    case "early-career":
      return "Junior";
    case "mid-career":
      return "Mid-level";
    case "senior-career":
      return "Senior";
    case "executive":
      return "Executive";
    default:
      return "Open";
  }
}

function inferGrowthSignal(opts: {
  projectCount: number;
  experienceCount: number;
  skillsToImprove: number;
  weeklyLearningTime: string | null | undefined;
}): GrowthSignal {
  const learning = (opts.weeklyLearningTime ?? "").toLowerCase();
  const learningHeavy = learning.includes("10+") || learning.includes("5–10") || learning.includes("5-10");
  if (opts.projectCount >= 2 && opts.experienceCount >= 1) return "Compounding";
  if (learningHeavy && opts.skillsToImprove > 0) return "Accelerating";
  if (opts.projectCount === 0 && opts.experienceCount === 0) return "Emerging";
  return "Steady";
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

/**
 * Re-project (or hide) a candidate's marketplace mirror to reflect
 * their current profile + discovery preference. Idempotent and safe to
 * call after any candidate profile/onboarding/portfolio write.
 */
export async function syncMarketplaceMirror(userId: string): Promise<void> {
  try {
    const [profile, ai] = await Promise.all([
      prisma.candidateProfile.findUnique({
        where: { userId },
        include: { projects: true, experiences: true },
      }),
      prisma.candidatesAI.findUnique({ where: { userId } }),
    ]);

    // No candidate profile → nothing to project.
    if (!profile) return;

    const id = mirrorIdForUser(userId);
    const discoverable = profile.discoverable;

    // If the candidate hasn't opted in, ensure any existing mirror is
    // hidden (but preserved) and stop. Don't create a hidden row.
    if (!discoverable) {
      const existing = await prisma.candidate.findUnique({ where: { id } });
      if (existing && existing.visible) {
        await prisma.candidate.update({
          where: { id },
          data: { visible: false },
        });
      }
      return;
    }

    const topSkills = dedupe([
      ...(profile.skills ?? []),
      ...((ai?.currentSkills as string[] | undefined) ?? []),
    ]).slice(0, 8);

    const portfolioProjects = dedupe([
      ...profile.projects.map((p) => p.title),
      ...((ai?.projects as string[] | undefined) ?? []),
    ]).slice(0, 6);

    const targetRole =
      profile.targetJob?.trim() ||
      ai?.targetRoles?.[0] ||
      "Open to roles";

    const industry =
      ai?.interestedIndustries?.[0] ||
      profile.field?.trim() ||
      "General";

    const careerDirection =
      ai?.desiredNextMove?.trim() ||
      profile.headline?.trim() ||
      `${targetRole}${industry !== "General" ? ` in ${industry}` : ""}`;

    const headline =
      profile.headline?.trim() ||
      profile.summary?.trim().slice(0, 120) ||
      careerDirection;

    const availability = inferAvailability(ai?.availability);
    const growthSignal = inferGrowthSignal({
      projectCount: profile.projects.length,
      experienceCount: profile.experiences.length,
      skillsToImprove: ((ai?.skillsToImprove as string[] | undefined) ?? []).length,
      weeklyLearningTime: ai?.weeklyLearningTime,
    });
    const category = inferCategory(targetRole, industry, careerDirection, profile.field ?? "");

    const readiness = readinessScore({
      headline,
      careerDirection,
      topSkills,
      portfolioProjects,
      growthSignal,
      availability,
    });

    const firstName = (profile.name || "This candidate").split(" ")[0];
    const whyRecommended =
      `${firstName} has ${portfolioProjects.length} portfolio project${portfolioProjects.length === 1 ? "" : "s"} and ` +
      `${topSkills.length} tracked skill${topSkills.length === 1 ? "" : "s"}` +
      (ai?.desiredNextMove?.trim()
        ? `, and is aiming to ${ai.desiredNextMove.trim().replace(/\.$/, "")}.`
        : ".") +
      " Signals are self-reported from their Living Portfolio.";

    const data = {
      name: profile.name?.trim() || "Career OS candidate",
      careerDirection,
      targetRole,
      industry,
      category,
      matchScore: readiness, // baseline; employer-relative match is computed live
      readinessScore: readiness,
      growthSignal,
      topSkills,
      portfolioProjects,
      whyRecommended,
      location: ai?.locationPreference?.trim() || "Not specified",
      availability,
      headline,
      stage: inferStage(ai?.careerStage ?? ""),
      source: "real",
      visible: true,
      userId,
    };

    await prisma.candidate.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  } catch (err) {
    // Never let a projection failure break the candidate's own write.
    console.error("[projection] syncMarketplaceMirror failed", err);
  }
}
