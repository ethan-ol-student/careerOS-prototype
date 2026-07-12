-- Timeline Journal (Career Intelligence, slice 3 — narrative source).
-- One additive table; no existing data changed.

CREATE TABLE "TimelineJournalEntry" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reflection" TEXT NOT NULL DEFAULT '',
    "mood" TEXT NOT NULL DEFAULT '',
    "skillsTouched" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pivot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimelineJournalEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TimelineJournalEntry_profileId_date_idx" ON "TimelineJournalEntry"("profileId", "date");

ALTER TABLE "TimelineJournalEntry" ADD CONSTRAINT "TimelineJournalEntry_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
