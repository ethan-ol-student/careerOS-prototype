-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "timelineMeta" JSONB,
ADD COLUMN     "timelinePrefix" TEXT NOT NULL DEFAULT 'My Journey';
