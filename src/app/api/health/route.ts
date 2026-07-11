import { prisma } from "@/lib/prisma";
import { ok, failFromCode } from "@/lib/api/respond";

/**
 * GET /api/health — liveness + DB reachability probe for uptime checks
 * and load-balancer health. Runs a trivial `SELECT 1`; returns 503 (not
 * 500) when the database is unreachable so monitors read it as "down,
 * not crashed". No auth, no secrets, no PII.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok", db: "up" });
  } catch {
    return failFromCode("server", "Database unreachable.", 503);
  }
}
