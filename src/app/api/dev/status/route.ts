import { devModeGuard, buildDevStatus } from "@/lib/dev/testApi";
import { ok, failFromUnknown } from "@/lib/api/respond";

/** GET /api/dev/status — snapshot of the test account (dev only). */
export async function GET() {
  const blocked = devModeGuard();
  if (blocked) return blocked;
  try {
    return ok(await buildDevStatus());
  } catch (err) {
    return failFromUnknown(err);
  }
}
