-- Market corpus (Career Intelligence, slice 2). New tables only — aggregate
-- market signal ingested from JobStreet. No changes to existing tables.

CREATE TABLE "MarketPosting" (
    "id" TEXT NOT NULL,
    "rawTitle" TEXT NOT NULL,
    "normalizedTitle" TEXT NOT NULL,
    "field" TEXT NOT NULL DEFAULT '',
    "classification" TEXT NOT NULL DEFAULT '',
    "salaryMinYr" INTEGER,
    "salaryMaxYr" INTEGER,
    "location" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT 'jobstreet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketPosting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketPosting_field_idx" ON "MarketPosting"("field");
CREATE INDEX "MarketPosting_normalizedTitle_idx" ON "MarketPosting"("normalizedTitle");

CREATE TABLE "MarketFieldDemand" (
    "field" TEXT NOT NULL,
    "postingCount" INTEGER NOT NULL DEFAULT 0,
    "salaryMinYr" INTEGER,
    "salaryMaxYr" INTEGER,
    "salaryMedianYr" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'RM',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketFieldDemand_pkey" PRIMARY KEY ("field")
);

CREATE TABLE "SkillDemand" (
    "id" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "field" TEXT NOT NULL DEFAULT '',
    "postingCount" INTEGER NOT NULL DEFAULT 0,
    "demandScore" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SkillDemand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SkillDemand_skill_field_key" ON "SkillDemand"("skill", "field");
CREATE INDEX "SkillDemand_field_idx" ON "SkillDemand"("field");
