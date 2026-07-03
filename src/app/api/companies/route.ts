import { listCompaniesWithMetrics } from "@/lib/services/companies.service";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * GET /api/companies — responsiveness leaderboard. Ranked most
 * candidate-friendly first (real application metrics when they exist,
 * deterministic demo fallback otherwise — flagged `demoMetrics`).
 */
export async function GET() {
  try {
    return ok({ companies: await listCompaniesWithMetrics() });
  } catch (err) {
    return failFromUnknown(err);
  }
}
