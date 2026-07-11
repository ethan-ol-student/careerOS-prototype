import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  signSession,
  setSessionCookie,
  signTransientToken,
} from "@/lib/auth/session";
import {
  googleSsoConfigured,
  exchangeAndVerify,
  redirectUri,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  GOOGLE_PENDING_COOKIE,
} from "@/lib/auth/google";
import { failFromCode } from "@/lib/api/respond";
import type { AuthRole } from "@/lib/auth/types";

/**
 * GET /api/auth/google/callback — finish the handshake and mint the SAME
 * `jose` session cookie password auth uses. Resolution order:
 *   1. OAuthAccount (provider, sub) exists → sign in that user.
 *   2. A user with Google's VERIFIED email exists → link (create
 *      OAuthAccount) and sign in. Unverified emails never link.
 *   3. Brand-new → stash a 10-min pending token and send to role select.
 * Errors land back on /auth with a query flag, never a raw 500 page.
 */
export async function GET(request: Request) {
  if (!googleSsoConfigured()) {
    return failFromCode("not_found", "Not found.", 404);
  }
  const url = new URL(request.url);
  const store = await cookies();

  const clearHandshake = () => {
    store.delete(GOOGLE_STATE_COOKIE);
    store.delete(GOOGLE_VERIFIER_COOKIE);
  };
  const bounce = (reason: string) => {
    clearHandshake();
    return NextResponse.redirect(
      new URL(`/auth?mode=login&sso_error=${reason}`, request.url),
    );
  };

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = store.get(GOOGLE_STATE_COOKIE)?.value;
    const verifier = store.get(GOOGLE_VERIFIER_COOKIE)?.value;

    // CSRF: state must match the value we set when starting the handshake.
    if (!code || !state || !cookieState || !verifier || state !== cookieState) {
      return bounce("state");
    }

    const identity = await exchangeAndVerify({
      code,
      verifier,
      redirectUri: redirectUri(request.url),
    });
    clearHandshake();

    // 1) Known Google identity → sign in.
    const linked = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: identity.sub,
        },
      },
      include: { user: true },
    });
    if (linked) {
      return signInAndRedirect(request, linked.user.id);
    }

    // 2) Existing account with this email.
    const existing = await prisma.user.findUnique({
      where: { email: identity.email },
    });
    if (existing) {
      // Link ONLY on a verified email — an unverified email must not be
      // able to take over an existing account.
      if (!identity.emailVerified) return bounce("unverified-email");
      await prisma.oAuthAccount.create({
        data: {
          userId: existing.id,
          provider: "google",
          providerAccountId: identity.sub,
          email: identity.email,
        },
      });
      return signInAndRedirect(request, existing.id);
    }

    // 3) Brand-new user → role select carries the verified identity.
    const pending = await signTransientToken(
      {
        kind: "google-pending",
        sub: identity.sub,
        email: identity.email,
        emailVerified: identity.emailVerified,
        name: identity.name,
      },
      "10m",
    );
    store.set({
      name: GOOGLE_PENDING_COOKIE,
      value: pending,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });
    return NextResponse.redirect(new URL("/auth/google/role", request.url));
  } catch (err) {
    console.error("[auth/google]", err);
    return bounce("exchange");
  }
}

/** Mint the standard session and land on the user's correct surface. */
async function signInAndRedirect(request: Request, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      candidatesAI: { select: { onboardingCompleted: true } },
      employerProfile: { select: { hasCompletedOnboarding: true } },
    },
  });
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth?mode=login&sso_error=missing-user", request.url),
    );
  }
  const role: AuthRole = user.role === "EMPLOYER" ? "employer" : "candidate";
  const token = await signSession({
    userId: user.id,
    role,
    isJudge: user.isJudgeAccount,
    sessionVersion: user.sessionVersion,
  });
  await setSessionCookie(token);

  const dest =
    role === "employer"
      ? user.employerProfile?.hasCompletedOnboarding
        ? "/employers/dashboard"
        : "/employers/onboarding"
      : user.candidatesAI?.onboardingCompleted
        ? "/candidate/dashboard"
        : "/candidate/onboarding";
  return NextResponse.redirect(new URL(dest, request.url));
}
