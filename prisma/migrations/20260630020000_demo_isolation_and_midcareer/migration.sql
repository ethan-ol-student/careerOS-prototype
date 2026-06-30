-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "sourceUrl" TEXT;

-- CreateTable
CREATE TABLE "SalaryBenchmark" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "companySize" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "p25" INTEGER NOT NULL,
    "p50" INTEGER NOT NULL,
    "p75" INTEGER NOT NULL,
    "p90" INTEGER NOT NULL,
    "sourceUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MidCareerProfile" (
    "id" TEXT NOT NULL,
    "candidateProfileId" TEXT NOT NULL,
    "problemsSolved" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careerPattern" TEXT NOT NULL DEFAULT '',
    "salaryPrivate" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "lifeFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MidCareerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryBenchmark_role_idx" ON "SalaryBenchmark"("role");

-- CreateIndex
CREATE INDEX "SalaryBenchmark_isDemo_idx" ON "SalaryBenchmark"("isDemo");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryBenchmark_role_industry_companySize_location_key" ON "SalaryBenchmark"("role", "industry", "companySize", "location");

-- CreateIndex
CREATE UNIQUE INDEX "MidCareerProfile_candidateProfileId_key" ON "MidCareerProfile"("candidateProfileId");

-- CreateIndex
CREATE INDEX "Candidate_isDemo_idx" ON "Candidate"("isDemo");

-- CreateIndex
CREATE INDEX "Company_isDemo_idx" ON "Company"("isDemo");

-- CreateIndex
CREATE INDEX "Job_isDemo_idx" ON "Job"("isDemo");

-- AddForeignKey
ALTER TABLE "MidCareerProfile" ADD CONSTRAINT "MidCareerProfile_candidateProfileId_fkey" FOREIGN KEY ("candidateProfileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

