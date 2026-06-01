import { devModeGuard, loadTestContext } from "@/lib/dev/testApi";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * POST /api/dev/seed — ensure the dev test account (admin123) exists
 * with both candidate + employer profiles. Idempotent. Dev only.
 */
export async function POST() {
  const blocked = devModeGuard();
  if (blocked) return blocked;
  try {
    const ctx = await loadTestContext();
    return ok({ username: ctx.user.username, email: ctx.user.email, seeded: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
