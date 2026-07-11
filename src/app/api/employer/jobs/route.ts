import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentEmployerProfile } from "@/lib/api/currentUser";
import { ok, failFromCode, failFromUnknown } from "@/lib/api/respond";
import { JobsService, JOB_TTL_MS } from "@/lib/services/jobs.service";
import { normalizeSkill } from "@/lib/jobs/data";

/**
 * Employer job posting.
 *
 * POST — create a job post (Quick Post modal AND the full Post Job page
 * share this endpoint; the full form just sends the optional fields).
 * The post lands in the public candidate feed (`/api/jobs`) immediately:
 * `requiredSkills` (the skill-matrix vertex names) keeps every existing
 * match engine working; the 1–10 vertex weights ride along in
 * `skillWeights`. Expires after 30 days; soft-delete only (status flips).
 *
 * GET — the caller's own posts, all statuses (their history).
 */

const CreateJobSchema = z
  .object({
    title: z.string().trim().min(3).max(80),
    description: z.string().trim().min(10).max(4000),
    requirements: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
    // The adaptive skill matrix: 3–5 vertices, each valued 1–10.
    skills: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(40),
          weight: z.number().int().min(1).max(10),
        }),
      )
      .min(3)
      .max(5),
    location: z.string().trim().max(80).default("Remote"),
    field: z.string().trim().max(60).default("General"),
    duration: z.string().trim().max(40).default("Full-time"),
    // Advanced (full Post Job page only)
    budgetMin: z.number().int().min(0).max(100_000_000).optional(),
    budgetMax: z.number().int().min(0).max(100_000_000).optional(),
    startDate: z.iso.date().optional(),
    timelineWeeks: z.number().int().min(1).max(520).optional(),
    teamSize: z.number().int().min(1).max(10_000).optional(),
  })
  .refine(
    (v) =>
      v.budgetMin === undefined ||
      v.budgetMax === undefined ||
      v.budgetMin <= v.budgetMax,
    { message: "Budget minimum can't exceed the maximum." },
  );

export async function POST(request: Request) {
  try {
    const profile = await getCurrentEmployerProfile();
    const json = await request.json().catch(() => ({}));
    const parsed = CreateJobSchema.safeParse(json);
    if (!parsed.success) {
      return failFromCode(
        "validation",
        parsed.error.issues[0]?.message ?? "Invalid job post.",
      );
    }
    const data = parsed.data;

    // Skill names dedupe to the canonical form the match engines use.
    const seen = new Map<string, number>();
    for (const s of data.skills) {
      const name = normalizeSkill(s.name);
      if (!seen.has(name)) seen.set(name, s.weight);
    }
    if (seen.size < 3) {
      return failFromCode("validation", "At least 3 distinct skills required.");
    }

    // The employer's organization is the job's Company row (upsert by name).
    const companyName =
      profile.organizationName?.trim() || "Independent employer";
    const company = await prisma.company.upsert({
      where: { name: companyName },
      update: {},
      create: { name: companyName },
    });

    const job = await prisma.job.create({
      data: {
        title: data.title,
        location: data.location || "Remote",
        duration: data.duration || "Full-time",
        field: data.field || "General",
        requiredSkills: [...seen.keys()],
        skillWeights: Object.fromEntries(seen),
        baseMatch: 70, // neutral curated baseline; personal scores override
        source: "real",
        companyId: company.id,
        employerId: profile.id,
        status: "active",
        expiresAt: new Date(Date.now() + JOB_TTL_MS),
        description: data.description,
        requirements: data.requirements,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        timelineWeeks: data.timelineWeeks,
        teamSize: data.teamSize,
      },
      include: { company: { select: { name: true } } },
    });

    return ok(job);
  } catch (err) {
    return failFromUnknown(err);
  }
}

export async function GET() {
  try {
    const profile = await getCurrentEmployerProfile();
    const jobs = await JobsService.listForEmployer(profile.id);
    return ok({ jobs });
  } catch (err) {
    return failFromUnknown(err);
  }
}
