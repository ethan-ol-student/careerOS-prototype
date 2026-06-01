-- CreateTable
CREATE TABLE "CandidatesAI" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerStage" TEXT NOT NULL DEFAULT '',
    "careerStageMeaning" TEXT NOT NULL DEFAULT '',
    "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interestedIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "opportunityTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locationPreference" TEXT,
    "availability" TEXT,
    "currentSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillLevels" JSONB,
    "projects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillsToImprove" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weeklyLearningTime" TEXT,
    "desiredNextMove" TEXT NOT NULL DEFAULT '',
    "longTermGoal" TEXT,
    "timeline" TEXT,
    "careerConfidence" TEXT,
    "mainBlocker" TEXT,
    "applicationsSent" TEXT,
    "interviewExperience" TEXT,
    "rejectionsOrChallenges" TEXT,
    "resumeConfidence" TEXT,
    "portfolioConfidence" TEXT,
    "interviewConfidence" TEXT,
    "dashboardPersonalizationSummary" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidatesAI_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidatesAI_userId_key" ON "CandidatesAI"("userId");

-- AddForeignKey
ALTER TABLE "CandidatesAI" ADD CONSTRAINT "CandidatesAI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
