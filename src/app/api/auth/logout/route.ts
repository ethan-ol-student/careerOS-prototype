import { clearSessionCookie } from "@/lib/auth/session";
import { ok, failFromUnknown } from "@/lib/api/respond";

/** POST /api/auth/logout — clear the auth cookie. */
export async function POST() {
  try {
    await clearSessionCookie();
    return ok({ signedOut: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
