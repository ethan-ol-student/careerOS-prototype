-- CreateTable
CREATE TABLE "EmployersAI" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyType" TEXT NOT NULL DEFAULT '',
    "industries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teamFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiringReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiringTimeline" TEXT NOT NULL DEFAULT '',
    "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "futureRoleDirections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "candidateGreenFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trainableSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strongFitTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workArrangement" TEXT NOT NULL DEFAULT '',
    "hiringLocation" TEXT NOT NULL DEFAULT '',
    "hiringIntentSummary" TEXT,
    "futurePathSummary" TEXT,
    "bestCandidateTypeSummary" TEXT,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployersAI_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployersAI_userId_key" ON "EmployersAI"("userId");

-- AddForeignKey
ALTER TABLE "EmployersAI" ADD CONSTRAINT "EmployersAI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
