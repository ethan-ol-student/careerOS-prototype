/**
 * Session helpers: sign / verify JWTs and read / write the auth
 * cookie. Single source of truth for "who is logged in?".
 */

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { AuthRole, SessionPayload } from "./types";

/**
 * Insecure fallback used ONLY in non-production when `AUTH_SECRET` is
 * unset, so local dev works out of the box. It is never used in
 * production — see `getSecret()`.
 */
const DEV_FALLBACK_SECRET = "career-os-INSECURE-dev-only-secret";

if (!process.env.AUTH_SECRET && process.env.NODE_ENV !== "production") {
  // Loud, one-time warning so the missing secret is obvious in dev.
  console.warn(
    "[auth] AUTH_SECRET is not set — using an INSECURE development fallback. " +
      "Set AUTH_SECRET in your environment before deploying.",
  );
}

/**
 * Resolve the signing key lazily (at sign/verify time, not module
 * load) so that:
 *  - production FAILS CLOSED with a clear error if `AUTH_SECRET` is
 *    missing — sessions can never be signed/verified with a known key;
 *  - `next build` (which imports this module under NODE_ENV=production
 *    but never calls these functions) is not broken;
 *  - local dev still works via the clearly-marked fallback above.
 */
function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (raw && raw.length > 0) {
    return new TextEncoder().encode(raw);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is required in production. Refusing to sign or verify " +
        "sessions with an insecure fallback key.",
    );
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

const COOKIE_NAME = "career-os-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
    isJudge: payload.isJudge === true,
    sv: payload.sessionVersion ?? 0,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/**
 * A token is still valid only if the version it was signed with matches
 * the user's current `sessionVersion`. Bumping the user's counter (on
 * logout) instantly invalidates every previously-issued token. Missing
 * `sv` (pre-revocation tokens) is treated as 0. Pure — unit-checkable.
 */
export function sessionMatchesVersion(
  tokenVersion: number | undefined,
  userVersion: number,
): boolean {
  return (tokenVersion ?? 0) === userVersion;
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.userId !== "string" ||
      (payload.role !== "candidate" && payload.role !== "employer")
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role as AuthRole,
      isJudge: payload.isJudge === true,
      sessionVersion: typeof payload.sv === "number" ? payload.sv : 0,
    };
  } catch {
    return null;
  }
}

/** Set the auth cookie on the outgoing response. */
export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Read the session cookie + verify. Returns null when missing/invalid. */
export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

// ── Transient tokens (OAuth handshakes) ─────────────────────────
// Short-lived signed payloads (e.g. the pending Google-SSO identity
// between callback and role selection). Same fail-closed secret as
// sessions; never usable AS a session (different shape, no userId role).

export async function signTransientToken(
  payload: Record<string, unknown>,
  expiresIn: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyTransientToken(
  token: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
