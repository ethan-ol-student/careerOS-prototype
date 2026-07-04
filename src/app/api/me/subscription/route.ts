import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/api/currentUser";
import { resolveIsPro } from "@/lib/billing/entitlements";
import { ok, failFromUnknown } from "@/lib/api/respond";

/** GET /api/me/subscription — the caller's plan + effective entitlement. */
export async function GET() {
  try {
    const user = await getAuthUser();
    const sub = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { plan: true },
    });
    return ok({
      plan: sub?.plan ?? "free",
      isPro: await resolveIsPro(user.id),
      isJudge: user.isJudgeAccount,
    });
  } catch (err) {
    return failFromUnknown(err);
  }
}

/**
 * POST /api/me/subscription — upgrade to Pro.
 *
 * ponytail: MOCK billing — flips the plan locally with no payment
 * processor, per the deployment plan's explicit post-deploy deferral of
 * live Stripe. Swap this handler's body for a checkout-session redirect
 * when real payments land; the entitlement checks won't change.
 */
export async function POST() {
  try {
    const user = await getAuthUser();
    const sub = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: "pro" },
      update: { plan: "pro" },
    });
    return ok({ plan: sub.plan, isPro: true });
  } catch (err) {
    return failFromUnknown(err);
  }
}
