-- AlterTable — Living Portfolio merge: Experience gains the structured
-- problem/project fields (mentor spec). Additive only; legacy rows default
-- to kind='role'. Legacy Project rows stay and are displayed merged.
ALTER TABLE "Experience" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'role';
ALTER TABLE "Experience" ADD COLUMN     "contribution" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Experience" ADD COLUMN     "approach" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Experience" ADD COLUMN     "impact" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Experience" ADD COLUMN     "skillsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Experience" ADD COLUMN     "link" TEXT;
