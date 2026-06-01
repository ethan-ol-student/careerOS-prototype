-- Marketplace mirror: link real candidate users into the Candidate catalog.

-- Candidate discovery opt-in (candidate-controlled).
ALTER TABLE "CandidateProfile" ADD COLUMN "discoverable" BOOLEAN NOT NULL DEFAULT false;

-- Candidate catalog bridge columns.
ALTER TABLE "Candidate" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'seed';
ALTER TABLE "Candidate" ADD COLUMN "userId" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;

-- One marketplace projection per user.
CREATE UNIQUE INDEX "Candidate_userId_key" ON "Candidate"("userId");
CREATE INDEX "Candidate_visible_idx" ON "Candidate"("visible");
CREATE INDEX "Candidate_source_idx" ON "Candidate"("source");

-- Link projected rows back to the owning user (cascade on user delete).
ALTER TABLE "Candidate"
  ADD CONSTRAINT "Candidate_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
