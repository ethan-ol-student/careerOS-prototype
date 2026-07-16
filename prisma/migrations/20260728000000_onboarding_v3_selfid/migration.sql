-- AlterTable — onboarding v3: nickname (dashboard greeting)
ALTER TABLE "CandidateProfile" ADD COLUMN     "nickname" TEXT NOT NULL DEFAULT '';

-- AlterTable — onboarding v3: focus + optional self-ID (PRIVATE: never
-- projected to the marketplace, never an engine input).
ALTER TABLE "CandidatesAI" ADD COLUMN     "focus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CandidatesAI" ADD COLUMN     "familyStatus" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CandidatesAI" ADD COLUMN     "gender" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CandidatesAI" ADD COLUMN     "religion" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CandidatesAI" ADD COLUMN     "race" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CandidatesAI" ADD COLUMN     "age" INTEGER;
