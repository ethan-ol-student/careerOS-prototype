import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google OAuth helpers (Feature 7) — server-only.
 *
 * No new dependency: PKCE via node:crypto, id_token verification via
 * jose's remote JWKS. The callback mints the SAME session cookie as
 * password auth (see docs/sso-google-design.md) — nothing downstream
 * changes. The whole feature is inert unless GOOGLE_CLIENT_ID +
 * GOOGLE_CLIENT_SECRET are set (routes 404, button hidden).
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export const GOOGLE_STATE_COOKIE = "google-oauth-state";
export const GOOGLE_VERIFIER_COOKIE = "google-oauth-verifier";
export const GOOGLE_PENDING_COOKIE = "google-pending-signup";

export function googleSsoConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

/** Redirect URI: explicit env override, else derived from the request. */
export function redirectUri(requestUrl: string): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return new URL("/api/auth/google/callback", requestUrl).toString();
}

const b64url = (buf: Buffer) => buf.toString("base64url");

/** Fresh state + PKCE pair for one handshake. */
export function newHandshake() {
  const state = b64url(randomBytes(16));
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { state, verifier, challenge };
}

export function buildAuthUrl(opts: {
  state: string;
  challenge: string;
  redirectUri: string;
}): string {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", opts.state);
  url.searchParams.set("code_challenge", opts.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

/** Exchange the auth code (+ PKCE verifier) and verify the id_token. */
export async function exchangeAndVerify(opts: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code: opts.code,
      code_verifier: opts.verifier,
      grant_type: "authorization_code",
      redirect_uri: opts.redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}).`);
  }
  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google returned no id_token.");

  // Verify signature + issuer + audience — never trust the raw token.
  const { payload } = await jwtVerify(tokens.id_token, JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID!,
  });
  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google id_token missing sub/email.");
  }
  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : null,
  };
}
