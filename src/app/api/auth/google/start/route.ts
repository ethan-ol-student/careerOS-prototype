import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  googleSsoConfigured,
  newHandshake,
  buildAuthUrl,
  redirectUri,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
} from "@/lib/auth/google";
import { failFromCode } from "@/lib/api/respond";

/**
 * GET /api/auth/google/start — begin the Google OAuth handshake.
 * 404s when Google SSO isn't configured (feature stays invisible),
 * so a broken OAuth config can be "turned off" by unsetting the env.
 */
export async function GET(request: Request) {
  if (!googleSsoConfigured()) {
    return failFromCode("not_found", "Not found.", 404);
  }

  const { state, verifier, challenge } = newHandshake();
  const store = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 minutes — one handshake
  };
  store.set({ name: GOOGLE_STATE_COOKIE, value: state, ...cookieOpts });
  store.set({ name: GOOGLE_VERIFIER_COOKIE, value: verifier, ...cookieOpts });

  return NextResponse.redirect(
    buildAuthUrl({ state, challenge, redirectUri: redirectUri(request.url) }),
  );
}
