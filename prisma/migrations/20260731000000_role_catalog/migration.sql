-- Onboarding v5: role-catalog taxonomy + role associations (additive)
CREATE TABLE "RoleCatalog" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "RoleCatalog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoleCatalog_category_idx" ON "RoleCatalog"("category");

ALTER TABLE "CandidatesAI" ADD COLUMN "currentRoleId" TEXT;
ALTER TABLE "CandidatesAI" ADD COLUMN "currentRoleTitle" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CandidatesAI" ADD COLUMN "desiredRoleIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
