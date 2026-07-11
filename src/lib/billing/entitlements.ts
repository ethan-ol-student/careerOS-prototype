import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/currentUser";
import { PaymentRequiredError } from "@/lib/api/errors";

/**
 * Server-side entitlement checks (Feature 15). Plan-grained, not
 * feature-grained: one "pro" tier unlocks all three gated features.
 *
 * Judge bypass follows the established `user.isJudgeAccount || <gate>`
 * idiom (see /api/auth/me): always re-resolved fresh from the DB per
 * request — never trusted from the JWT or a client flag.
 */

/** Is this user Pro (or a judge, who bypasses every gate)? */
export async function resolveIsPro(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isJudgeAccount: true, subscription: { select: { plan: true } } },
  });
  if (!user) return false;
  return user.isJudgeAccount || user.subscription?.plan === "pro";
}

/**
 * Throwing gate for fully-Pro routes (mirrors getCurrentCandidateProfile's
 * throw-based shape). 401 when unauthenticated, 402 when not entitled.
 */
export async function requireEntitlement(): Promise<void> {
  // getAuthUser both authenticates (401 if unauthenticated / revoked
  // session) and confirms the user still exists before the Pro check.
  const user = await getAuthUser();
  if (!(await resolveIsPro(user.id))) {
    throw new PaymentRequiredError();
  }
}
