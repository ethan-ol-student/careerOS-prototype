/**
 * Career OS seed — populates the marketplace `Candidate` table from
 * the existing in-app mock pool in `src/lib/candidates/data.ts`.
 *
 * Idempotent: re-running this script just upserts. No real user
 * records are created here — real candidate/employer accounts are
 * created through first-party sign-up (`POST /api/auth/signup`), which
 * hashes the password and provisions the matching profile rows.
 */

import { PrismaClient } from "@prisma/client";
import { MOCK_CANDIDATES } from "../src/lib/candidates/data";
import { MID_CAREER_DEMO } from "../src/lib/judge/midCareerDemo";
import { readCsv } from "./csv";
import { hashPassword } from "../src/lib/auth/password";
import {
  JUDGE_ACCOUNT,
  JUDGE_DEMO_CANDIDATES,
  JUDGE_DEMO_CHAPTERS,
  JUDGE_DEMO_MARKETPLACE_SOURCE,
  JUDGE_DEMO_PORTFOLIO,
  JUDGE_EMPLOYER_GOAL,
  JUDGE_EMPLOYER_MESSAGES,
} from "../src/lib/judge/demoData";

const prisma = new PrismaClient();

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  // SEED_DEMO guard — the demo catalog (candidates, companies, jobs, salary)
  // is labelled `isDemo` and only seeded when enabled. Default ON; set
  // SEED_DEMO=false (e.g. in production) to skip it. `/api/dev/reset` scope
  // "demo" removes exactly these rows.
  const demo = process.env.SEED_DEMO !== "false";

  if (demo) {
    console.log(`Seeding ${MOCK_CANDIDATES.length} marketplace candidates…`);
    for (const c of MOCK_CANDIDATES) {
      const fields = {
        name: c.name,
        careerDirection: c.careerDirection,
        targetRole: c.targetRole,
        industry: c.industry,
        category: c.category,
        matchScore: c.matchScore,
        readinessScore: c.readinessScore,
        growthSignal: c.growthSignal,
        topSkills: c.topSkills,
        portfolioProjects: c.portfolioProjects,
        whyRecommended: c.whyRecommended,
        location: c.location,
        availability: c.availability,
        headline: c.headline,
        stage: c.stage,
        // Seed rows are demo data. Real candidates are projected separately
        // with source="real"/isDemo=false (lib/candidates/projection.ts).
        source: "seed",
        isDemo: true,
      };
      await prisma.candidate.upsert({
        where: { id: c.id },
        create: { id: c.id, visible: true, ...fields },
        update: fields,
      });
    }
    await seedDemoCatalog();
  } else {
    console.log("SEED_DEMO=false → skipping demo catalog.");
  }

  console.log(`Seeding judge evaluation account "${JUDGE_ACCOUNT.username}"...`);
  await seedJudgeAccount();

  console.log(`Seeding mid-career demo account "${MID_CAREER_DEMO.username}"...`);
  await seedMidCareerDemo();

  console.log("Seed complete.");
}

// Mid-career demo account (35+, rich history) so the "Career Health"
// dashboard renders fully populated. isJudgeAccount=true so the flag-gated
// demo-login can sign it in. Idempotent: account upserts; history rows are
// replaced.
async function seedMidCareerDemo() {
  const d = MID_CAREER_DEMO;
  const passwordHash = await hashPassword(d.password);

  const user = await prisma.user.upsert({
    where: { username: d.username },
    create: {
      email: d.email,
      username: d.username,
      passwordHash,
      name: d.name,
      role: "CANDIDATE",
      isJudgeAccount: true,
      candidateProfile: {
        create: { name: d.name, field: d.profile.field, targetJob: d.profile.targetJob },
      },
      candidatesAI: { create: {} },
      employerProfile: {
        create: { organizationName: d.organizationName, hasCompletedOnboarding: true },
      },
      employersAI: { create: {} },
    },
    update: { email: d.email, passwordHash, name: d.name, isJudgeAccount: true },
    include: { candidateProfile: { select: { id: true } } },
  });

  let profileId = user.candidateProfile?.id;
  if (!profileId) {
    const p = await prisma.candidateProfile.create({
      data: { userId: user.id, name: d.name },
      select: { id: true },
    });
    profileId = p.id;
  }

  await prisma.candidateProfile.update({
    where: { id: profileId },
    data: {
      name: d.name,
      field: d.profile.field,
      targetJob: d.profile.targetJob,
      headline: d.profile.headline,
      summary: d.profile.summary,
      bio: d.profile.bio,
      skills: d.profile.skills,
      discoverable: false,
      totalAdditions: d.profile.skills.length + d.projects.length + d.experiences.length,
      lastUpdated: new Date(),
    },
  });

  await prisma.candidatesAI.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...d.ai },
    update: d.ai,
  });

  await prisma.midCareerProfile.upsert({
    where: { candidateProfileId: profileId },
    create: { candidateProfileId: profileId, ...d.midCareer },
    update: d.midCareer,
  });

  // Replace history rows so re-seeding stays idempotent (no duplicates).
  await prisma.project.deleteMany({ where: { profileId } });
  await prisma.experience.deleteMany({ where: { profileId } });
  await prisma.chapterEvent.deleteMany({ where: { profileId } });
  await prisma.project.createMany({ data: d.projects.map((p) => ({ ...p, profileId })) });
  await prisma.experience.createMany({ data: d.experiences.map((e) => ({ ...e, profileId })) });
  for (const c of d.chapters) {
    await prisma.chapterEvent.create({
      data: { profileId, name: c.name, priority: c.priority, date: c.date, time: c.time, subtasks: c.subtasks },
    });
  }
}

// Demo job catalogue + salary benchmarks, from curated CSV (prisma/data/*).
// Idempotent: companies upsert on name, jobs on id, benchmarks on the
// (role, industry, companySize, location) natural key.
async function seedDemoCatalog() {
  const companies = readCsv("companies.csv");
  console.log(`Seeding ${companies.length} demo companies…`);
  for (const c of companies) {
    await prisma.company.upsert({
      where: { name: c.name },
      create: { name: c.name, sourceUrl: c.sourceUrl || null, isDemo: true },
      update: { sourceUrl: c.sourceUrl || null, isDemo: true },
    });
  }

  const jobs = readCsv("jobs.csv");
  console.log(`Seeding ${jobs.length} demo jobs…`);
  for (const j of jobs) {
    const company = await prisma.company.upsert({
      where: { name: j.company },
      create: { name: j.company, isDemo: true },
      update: {},
    });
    const fields = {
      title: j.title,
      location: j.location,
      duration: j.duration,
      field: j.field,
      requiredSkills: j.requiredSkills.split(";").map((s) => s.trim()).filter(Boolean),
      baseMatch: Number(j.baseMatch),
      sourceUrl: j.sourceUrl || null,
      companyId: company.id,
      isDemo: true,
      source: "seed",
    };
    await prisma.job.upsert({
      where: { id: j.id },
      create: { id: j.id, ...fields },
      update: fields,
    });
  }

  const benchmarks = readCsv("salary_benchmarks.csv");
  console.log(`Seeding ${benchmarks.length} salary benchmarks…`);
  for (const b of benchmarks) {
    const key = {
      role: b.role,
      industry: b.industry,
      companySize: b.companySize,
      location: b.location,
    };
    const fields = {
      currency: b.currency,
      p25: Number(b.p25),
      p50: Number(b.p50),
      p75: Number(b.p75),
      p90: Number(b.p90),
      sourceUrl: b.sourceUrl || null,
      isDemo: true,
    };
    await prisma.salaryBenchmark.upsert({
      where: { role_industry_companySize_location: key },
      create: { ...key, ...fields },
      update: fields,
    });
  }
}

async function seedJudgeAccount() {
  const passwordHash = await hashPassword(JUDGE_ACCOUNT.password);

  let user = await prisma.user.findUnique({
    where: { username: JUDGE_ACCOUNT.username },
    include: {
      candidateProfile: { select: { id: true } },
      employerProfile: { select: { id: true } },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: JUDGE_ACCOUNT.email,
        username: JUDGE_ACCOUNT.username,
        passwordHash,
        name: JUDGE_ACCOUNT.name,
        role: "CANDIDATE",
        isJudgeAccount: true,
        candidateProfile: {
          create: {
            name: JUDGE_DEMO_PORTFOLIO.name,
            field: JUDGE_DEMO_PORTFOLIO.field,
            targetJob: JUDGE_DEMO_PORTFOLIO.targetJob,
          },
        },
        candidatesAI: { create: {} },
        employerProfile: {
          create: {
            organizationName: JUDGE_ACCOUNT.organizationName,
            hasCompletedOnboarding: true,
          },
        },
        employersAI: { create: {} },
      },
      include: {
        candidateProfile: { select: { id: true } },
        employerProfile: { select: { id: true } },
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: JUDGE_ACCOUNT.email,
        username: JUDGE_ACCOUNT.username,
        passwordHash,
        name: JUDGE_ACCOUNT.name,
        role: "CANDIDATE",
        isJudgeAccount: true,
      },
      include: {
        candidateProfile: { select: { id: true } },
        employerProfile: { select: { id: true } },
      },
    });
  }

  let candidateProfile = user.candidateProfile;
  if (!candidateProfile) {
    candidateProfile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        name: JUDGE_DEMO_PORTFOLIO.name,
        field: JUDGE_DEMO_PORTFOLIO.field,
        targetJob: JUDGE_DEMO_PORTFOLIO.targetJob,
      },
      select: { id: true },
    });
  }

  let employerProfile = user.employerProfile;
  if (!employerProfile) {
    employerProfile = await prisma.employerProfile.create({
      data: {
        userId: user.id,
        organizationName: JUDGE_ACCOUNT.organizationName,
        hasCompletedOnboarding: true,
      },
      select: { id: true },
    });
  }

  await prisma.candidateProfile.update({
    where: { id: candidateProfile.id },
    data: {
      name: JUDGE_DEMO_PORTFOLIO.name,
      field: JUDGE_DEMO_PORTFOLIO.field,
      targetJob: JUDGE_DEMO_PORTFOLIO.targetJob,
      headline: JUDGE_DEMO_PORTFOLIO.headline,
      summary: JUDGE_DEMO_PORTFOLIO.summary,
      bio: JUDGE_DEMO_PORTFOLIO.bio,
      skills: JUDGE_DEMO_PORTFOLIO.skills,
      discoverable: false,
      totalAdditions:
        JUDGE_DEMO_PORTFOLIO.skills.length +
        JUDGE_DEMO_PORTFOLIO.projects.length +
        JUDGE_DEMO_PORTFOLIO.experiences.length +
        JUDGE_DEMO_PORTFOLIO.certificates.length +
        JUDGE_DEMO_PORTFOLIO.awards.length,
      lastUpdated: new Date(),
    },
  });

  await prisma.candidatesAI.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      careerStage: "young-adult",
      careerStageMeaning:
        "Judge demo account showing phase-based career guidance.",
      targetRoles: JUDGE_EMPLOYER_GOAL.targetRoles,
      interestedIndustries: ["Technology", "Design", "Education"],
      opportunityTypes: ["Full-time", "Internship"],
      locationPreference: "Singapore or remote",
      availability: "Actively looking",
      currentSkills: JUDGE_DEMO_PORTFOLIO.skills,
      skillLevels: {
        React: "expert",
        TypeScript: "intermediate",
        "Product Thinking": "intermediate",
      },
      projects: JUDGE_DEMO_PORTFOLIO.projects.map((project) => project.title),
      skillsToImprove: ["Backend fundamentals", "Analytics storytelling"],
      weeklyLearningTime: "5-8 hours",
      desiredNextMove:
        "Earn a product engineering role where portfolio evidence matters.",
      longTermGoal:
        "Grow into a product-minded technical lead who mentors early talent.",
      timeline: "3-6 months",
      careerConfidence: "high",
      mainBlocker: "Needs a sharper signal for employers scanning quickly.",
      applicationsSent: "5-10",
      interviewExperience: "Some interviews",
      rejectionsOrChallenges: "Needs clearer proof packaging",
      resumeConfidence: "medium",
      portfolioConfidence: "high",
      interviewConfidence: "medium",
      dashboardPersonalizationSummary:
        "Judge demo: Young Adult aiming for Product Engineer with strong evidence signals.",
      onboardingCompleted: true,
    },
    update: {
      careerStage: "young-adult",
      careerStageMeaning:
        "Judge demo account showing phase-based career guidance.",
      targetRoles: JUDGE_EMPLOYER_GOAL.targetRoles,
      interestedIndustries: ["Technology", "Design", "Education"],
      opportunityTypes: ["Full-time", "Internship"],
      locationPreference: "Singapore or remote",
      availability: "Actively looking",
      currentSkills: JUDGE_DEMO_PORTFOLIO.skills,
      skillLevels: {
        React: "expert",
        TypeScript: "intermediate",
        "Product Thinking": "intermediate",
      },
      projects: JUDGE_DEMO_PORTFOLIO.projects.map((project) => project.title),
      skillsToImprove: ["Backend fundamentals", "Analytics storytelling"],
      weeklyLearningTime: "5-8 hours",
      desiredNextMove:
        "Earn a product engineering role where portfolio evidence matters.",
      longTermGoal:
        "Grow into a product-minded technical lead who mentors early talent.",
      timeline: "3-6 months",
      careerConfidence: "high",
      mainBlocker: "Needs a sharper signal for employers scanning quickly.",
      applicationsSent: "5-10",
      interviewExperience: "Some interviews",
      rejectionsOrChallenges: "Needs clearer proof packaging",
      resumeConfidence: "medium",
      portfolioConfidence: "high",
      interviewConfidence: "medium",
      dashboardPersonalizationSummary:
        "Judge demo: Young Adult aiming for Product Engineer with strong evidence signals.",
      onboardingCompleted: true,
    },
  });

  await prisma.employerProfile.update({
    where: { id: employerProfile.id },
    data: {
      organizationName: JUDGE_ACCOUNT.organizationName,
      talentType: "junior-professionals",
      role: "Product Engineer",
      priorities: [
        "portfolio-strength",
        "learning-momentum",
        "technical-skills",
      ],
      locationPreference: "Singapore or remote",
      hasCompletedOnboarding: true,
    },
  });

  await prisma.employersAI.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyType: "Startup",
      industries: ["Technology", "Education"],
      teamFocus: ["Engineering", "Product"],
      hiringReasons: ["Build product velocity", "Develop early talent"],
      hiringTimeline: "0-3 months",
      targetRoles: JUDGE_EMPLOYER_GOAL.targetRoles,
      futureRoleDirections: ["Product engineering lead"],
      candidateGreenFlags: JUDGE_EMPLOYER_GOAL.priorities,
      requiredSkills: JUDGE_EMPLOYER_GOAL.preferredSkills,
      trainableSkills: ["Backend fundamentals", "Analytics storytelling"],
      strongFitTypes: ["Portfolio builders", "Fast learners"],
      workArrangement: "Hybrid",
      hiringLocation: "Singapore",
      hiringIntentSummary: JUDGE_EMPLOYER_GOAL.hiringGoal,
      futurePathSummary:
        "The employer wants candidates with evidence of trajectory and product judgment.",
      bestCandidateTypeSummary:
        "Best fit: builders with strong portfolios, learning momentum, and communication.",
      onboardingCompleted: true,
    },
    update: {
      companyType: "Startup",
      industries: ["Technology", "Education"],
      teamFocus: ["Engineering", "Product"],
      hiringReasons: ["Build product velocity", "Develop early talent"],
      hiringTimeline: "0-3 months",
      targetRoles: JUDGE_EMPLOYER_GOAL.targetRoles,
      futureRoleDirections: ["Product engineering lead"],
      candidateGreenFlags: JUDGE_EMPLOYER_GOAL.priorities,
      requiredSkills: JUDGE_EMPLOYER_GOAL.preferredSkills,
      trainableSkills: ["Backend fundamentals", "Analytics storytelling"],
      strongFitTypes: ["Portfolio builders", "Fast learners"],
      workArrangement: "Hybrid",
      hiringLocation: "Singapore",
      hiringIntentSummary: JUDGE_EMPLOYER_GOAL.hiringGoal,
      futurePathSummary:
        "The employer wants candidates with evidence of trajectory and product judgment.",
      bestCandidateTypeSummary:
        "Best fit: builders with strong portfolios, learning momentum, and communication.",
      onboardingCompleted: true,
    },
  });

  await resetJudgeCandidateRows(candidateProfile.id);
  await resetJudgeEmployerRows(employerProfile.id);
}

async function resetJudgeCandidateRows(profileId: string) {
  await Promise.all([
    prisma.project.deleteMany({ where: { profileId } }),
    prisma.experience.deleteMany({ where: { profileId } }),
    prisma.certificate.deleteMany({ where: { profileId } }),
    prisma.award.deleteMany({ where: { profileId } }),
    prisma.chapterEvent.deleteMany({ where: { profileId } }),
    prisma.candidateNotification.deleteMany({ where: { profileId } }),
  ]);

  await prisma.project.createMany({
    data: JUDGE_DEMO_PORTFOLIO.projects.map((project) => ({
      profileId,
      title: project.title,
      description: project.description,
      link: project.link,
    })),
  });
  await prisma.experience.createMany({
    data: JUDGE_DEMO_PORTFOLIO.experiences.map((experience) => ({
      profileId,
      ...experience,
    })),
  });
  await prisma.certificate.createMany({
    data: JUDGE_DEMO_PORTFOLIO.certificates.map((certificate) => ({
      profileId,
      ...certificate,
    })),
  });
  await prisma.award.createMany({
    data: JUDGE_DEMO_PORTFOLIO.awards.map((award) => ({
      profileId,
      ...award,
    })),
  });
  await prisma.chapterEvent.createMany({
    data: JUDGE_DEMO_CHAPTERS.map((chapter) => ({
      profileId,
      name: chapter.name,
      priority: chapter.priority,
      date: daysFromNow(chapter.dateOffset),
      time: chapter.time,
      subtasks: chapter.subtasks,
    })),
  });
  await prisma.candidateNotification.createMany({
    data: [
      {
        profileId,
        kind: "system",
        severity: "info",
        title: "Judge demo mode",
        body: "This notification belongs to the isolated judge account.",
        read: false,
      },
      {
        profileId,
        kind: "job-match",
        severity: "important",
        title: "Employer match ready",
        body: "Northstar Labs is a strong match for this demo candidate.",
        actionLabel: "View match",
        read: false,
      },
    ],
  });
}

async function resetJudgeEmployerRows(employerId: string) {
  for (const candidate of JUDGE_DEMO_CANDIDATES) {
    await prisma.candidate.upsert({
      where: { id: candidate.id },
      create: {
        id: candidate.id,
        name: candidate.name,
        careerDirection: candidate.careerDirection,
        targetRole: candidate.targetRole,
        industry: candidate.industry,
        category: candidate.category,
        matchScore: candidate.matchScore,
        readinessScore: candidate.readinessScore,
        growthSignal: candidate.growthSignal,
        topSkills: candidate.topSkills,
        portfolioProjects: candidate.portfolioProjects,
        whyRecommended: candidate.whyRecommended,
        location: candidate.location,
        availability: candidate.availability,
        headline: candidate.headline,
        stage: candidate.stage,
        source: JUDGE_DEMO_MARKETPLACE_SOURCE,
        visible: false,
      },
      update: {
        name: candidate.name,
        careerDirection: candidate.careerDirection,
        targetRole: candidate.targetRole,
        industry: candidate.industry,
        category: candidate.category,
        matchScore: candidate.matchScore,
        readinessScore: candidate.readinessScore,
        growthSignal: candidate.growthSignal,
        topSkills: candidate.topSkills,
        portfolioProjects: candidate.portfolioProjects,
        whyRecommended: candidate.whyRecommended,
        location: candidate.location,
        availability: candidate.availability,
        headline: candidate.headline,
        stage: candidate.stage,
        source: JUDGE_DEMO_MARKETPLACE_SOURCE,
        visible: false,
      },
    });
  }

  await Promise.all([
    prisma.employerSavedCandidate.deleteMany({ where: { employerId } }),
    prisma.employerInvitedCandidate.deleteMany({ where: { employerId } }),
    prisma.employerNotification.deleteMany({ where: { employerId } }),
  ]);

  const primaryCandidate = JUDGE_DEMO_CANDIDATES[0];
  await prisma.employerSavedCandidate.create({
    data: { employerId, candidateId: primaryCandidate.id },
  });
  await prisma.employerInvitedCandidate.create({
    data: { employerId, candidateId: primaryCandidate.id },
  });
  await prisma.employerNotification.createMany({
    data: [
      {
        employerId,
        kind: "system",
        title: "Judge demo recommendations",
        body: "Candidate recommendations are seeded only for the judge account.",
        read: false,
      },
      {
        employerId,
        kind: "invite-pending",
        title: "Invite pending",
        body: `${primaryCandidate.name} has a demo invite in progress.`,
        candidateId: primaryCandidate.id,
        read: false,
      },
    ],
  });

  for (const thread of JUDGE_EMPLOYER_MESSAGES) {
    const candidate = JUDGE_DEMO_CANDIDATES.find(
      (item) => item.name === thread.candidateName,
    );
    if (!candidate) continue;
    const conversation = await prisma.chatConversation.upsert({
      where: {
        employerId_candidateId: {
          employerId,
          candidateId: candidate.id,
        },
      },
      create: { employerId, candidateId: candidate.id },
      update: {},
    });
    await prisma.chatMessage.deleteMany({
      where: { conversationId: conversation.id },
    });
    await prisma.chatMessage.createMany({
      data: thread.messages.map((message) => ({
        conversationId: conversation.id,
        sender: message.sender,
        body: message.body,
      })),
    });
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
