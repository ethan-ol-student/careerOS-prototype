-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "location" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "CandidatesAI" ADD COLUMN     "desiredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "expectedGraduation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fieldOfStudy" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxCommuteMinutes" INTEGER,
ADD COLUMN     "minSalaryAmount" INTEGER,
ADD COLUMN     "minSalaryPeriod" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "openToRelocate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduleFlexibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "topValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "travelWillingness" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "workArrangement" TEXT[] DEFAULT ARRAY[]::TEXT[];
