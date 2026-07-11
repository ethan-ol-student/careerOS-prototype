import { prisma } from "@/lib/prisma";
import { readSession, clearSessionCookie } from "@/lib/auth/session";
import { ok, failFromUnknown } from "@/lib/api/respond";

/**
 * POST /api/auth/logout — sign out.
 *
 * Bumps the user's `sessionVersion` BEFORE clearing the cookie so any
 * token issued for this user (including one copied off this device)
 * stops verifying immediately — a real server-side logout, not just a
 * cookie wipe. Consequence: logging out ends every active session for
 * the account ("log out everywhere"), which is the safe default.
 *
 * Exception: shared demo/judge accounts are NOT bumped — they carry no
 * stolen-token risk, and bumping would knock out any other judge using
 * the same demo account concurrently.
 */
export async function POST() {
  try {
    const session = await readSession();
    if (session && !session.isJudge) {
      // Best-effort: never let a bump failure block the sign-out.
      await prisma.user
        .update({
          where: { id: session.userId },
          data: { sessionVersion: { increment: 1 } },
        })
        .catch(() => {});
    }
    await clearSessionCookie();
    return ok({ signedOut: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
