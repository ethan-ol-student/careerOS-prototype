import { prisma } from "@/lib/prisma";
import { getCurrentCandidateProfile } from "@/lib/api/currentUser";

/**
 * Resume snapshot — the single data shape the PDF template, the resume
 * page, and ResumeVersion snapshots all share. Living-Portfolio angle:
 * `problemsSolved` (proof of capability) rides along with experiences so a
 * mid-career resume leads with achievements, not just titles.
 */
export interface ResumeData {
  name: string;
  email: string;
  headline: string;
  summary: string;
  field: string;
  targetJob: string;
  skills: string[];
  problemsSolved: string[];
  careerPattern: string;
  experiences: { role: string; company: string; period: string; detail: string | null }[];
  projects: { title: string; description: string; link: string | null }[];
  certificates: { title: string; issuer: string; year: string }[];
  awards: { title: string; year: string; description: string | null }[];
}

/** Gather the caller's live resume data (server-side, session-scoped). */
export async function getResumeData(): Promise<ResumeData> {
  const profile = await getCurrentCandidateProfile();
  const [user, experiences, projects, certificates, awards, midCareer] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: profile.userId },
        select: { email: true, name: true },
      }),
      prisma.experience.findMany({ where: { profileId: profile.id }, orderBy: { id: "asc" } }),
      prisma.project.findMany({ where: { profileId: profile.id }, orderBy: { id: "asc" } }),
      prisma.certificate.findMany({ where: { profileId: profile.id }, orderBy: { id: "asc" } }),
      prisma.award.findMany({ where: { profileId: profile.id }, orderBy: { id: "asc" } }),
      prisma.midCareerProfile.findUnique({ where: { candidateProfileId: profile.id } }),
    ]);

  return {
    name: profile.name || user?.name || "Career OS candidate",
    email: user?.email ?? "",
    headline: profile.headline,
    summary: profile.summary,
    field: profile.field,
    targetJob: profile.targetJob,
    skills: profile.skills,
    problemsSolved: midCareer?.problemsSolved ?? [],
    careerPattern: midCareer?.careerPattern ?? "",
    experiences: experiences.map((e) => ({
      role: e.role, company: e.company, period: e.period, detail: e.detail,
    })),
    projects: projects.map((p) => ({
      title: p.title, description: p.description, link: p.link,
    })),
    certificates: certificates.map((c) => ({
      title: c.title, issuer: c.issuer, year: c.year,
    })),
    awards: awards.map((a) => ({
      title: a.title, year: a.year, description: a.description,
    })),
  };
}
