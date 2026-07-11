-- CreateTable
CREATE TABLE "SkillClaim" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 3,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "evidence" TEXT NOT NULL DEFAULT '',
    "endorsedBy" TEXT NOT NULL DEFAULT '',
    "endorserNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillClaim_profileId_name_key" ON "SkillClaim"("profileId", "name");

-- AddForeignKey
ALTER TABLE "SkillClaim" ADD CONSTRAINT "SkillClaim_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
