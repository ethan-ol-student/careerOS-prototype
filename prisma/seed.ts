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
  console.log(`Seeding ${MOCK_CANDIDATES.length} marketplace candidates…`);

  for (const c of MOCK_CANDIDATES) {
    await prisma.candidate.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
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
        // Seed rows are demo data and always visible. Real candidates are
        // projected separately with source="real" (see lib/candidates/projection.ts).
        source: "seed",
        visible: true,
      },
      update: {
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
        // Never clobber a real projection through the seed path.
        source: "seed",
      },
    });
  }

  console.log(`Seeding judge evaluation account "${JUDGE_ACCOUNT.username}"...`);
  await seedJudgeAccount();

  console.log("Seed complete.");
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
