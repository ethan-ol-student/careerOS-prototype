import { listUniversities } from "@/lib/services/leaderboard.service";
import { ok, failFromUnknown } from "@/lib/api/respond";

/** GET /api/leaderboard — curated, cited university employability ranking. */
export async function GET() {
  try {
    return ok({ universities: await listUniversities() });
  } catch (err) {
    return failFromUnknown(err);
  }
}
