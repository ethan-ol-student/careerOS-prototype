/**
 * One-off backfill — project all existing discoverable candidates into
 * the marketplace catalog.
 *
 * WHY THIS EXISTS
 * The marketplace mirror (`Candidate.source = "real"`) is normally
 * created lazily: `syncMarketplaceMirror` runs whenever a candidate
 * edits their profile/onboarding/portfolio or toggles discovery. So a
 * candidate who became `discoverable = true` BEFORE that wiring existed
 * (or via a direct DB change / import) won't have a mirror row until
 * their next edit, and employers won't see them. This script projects
 * every currently-discoverable candidate in one pass.
 *
 * SAFETY
 * - Idempotent: `syncMarketplaceMirror` upserts, so re-running is a no-op
 *   beyond refreshing each row to the latest profile data.
 * - Scoped: only touches candidates with `discoverable = true`. Seed
 *   rows (`source = "seed"`) and hidden candidates are never modified.
 * - Reuses the real projection logic (no duplicated mapping rules).
 *
 * USAGE
 *   npm run db:backfill-discovery
 *   # or, explicitly:
 *   DATABASE_URL=... npx tsx prisma/backfill-discovery.ts
 */

import { PrismaClient } from "@prisma/client";
import {
  syncMarketplaceMirror,
  mirrorIdForUser,
} from "../src/lib/candidates/projection";

const prisma = new PrismaClient();

async function main(): Promise<number> {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Set it in your environment (or .env.local) before running the backfill.",
    );
    return 1;
  }

  const discoverable = await prisma.candidateProfile.findMany({
    where: { discoverable: true },
    select: { userId: true, name: true },
  });

  console.log(
    `Found ${discoverable.length} discoverable candidate${
      discoverable.length === 1 ? "" : "s"
    } to project.`,
  );
  if (discoverable.length === 0) {
    console.log("Nothing to backfill — no candidates have discovery enabled.");
    return 0;
  }

  let projected = 0;
  let failed = 0;

  for (const { userId, name } of discoverable) {
    // `syncMarketplaceMirror` never throws (it logs + swallows internally
    // so a projection failure can't break a user's own write), so we
    // verify the mirror row actually landed instead of trusting a return.
    await syncMarketplaceMirror(userId);
    const row = await prisma.candidate.findUnique({
      where: { id: mirrorIdForUser(userId) },
      select: { id: true, source: true, visible: true },
    });
    if (row && row.source === "real" && row.visible) {
      projected += 1;
      console.log(`  ✓ ${name || userId} → ${row.id}`);
    } else {
      failed += 1;
      console.warn(
        `  ✗ ${name || userId} (${userId}) — projection did not land (see logs above)`,
      );
    }
  }

  console.log(
    `\nBackfill complete: ${projected} projected, ${failed} failed.`,
  );
  return failed > 0 ? 1 : 0;
}

main()
  .then(async (code) => {
    await prisma.$disconnect();
    // Explicit exit: the projection module holds its own Prisma singleton
    // (with an open pool), which can otherwise keep the event loop alive.
    process.exit(code);
  })
  .catch(async (err) => {
    console.error("Backfill failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
