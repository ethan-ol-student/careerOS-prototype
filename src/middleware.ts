import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — two concerns:
 *
 * 1. CSRF for mutating `/api/*` requests. Cookie-authenticated state
 *    changes are the CSRF attack surface, so every mutating
 *    (`POST/PUT/PATCH/DELETE`) `/api/*` request must originate from the
 *    same site (validated via `Origin`, falling back to `Referer`).
 * 2. Defense-in-depth page gate for `/candidate/*` and `/employers/*`:
 *    an anonymous navigation (no session cookie) is redirected to
 *    `/auth` before the protected shell ever ships. This only checks
 *    cookie *presence* — the API routes still fully verify the session
 *    (signature + revocation) and remain the real authorization gate;
 *    the client shells still enforce role + onboarding.
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// httpOnly session cookie (see src/lib/auth/session.ts COOKIE_NAME).
const SESSION_COOKIE = "career-os-session";
const PROTECTED_PREFIXES = ["/candidate", "/employers"];

function forbidden(message: string) {
  return NextResponse.json(
    { ok: false, error: { code: "forbidden", message } },
    { status: 403 },
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Page gate (non-API routes) ────────────────────────────────
  if (!pathname.startsWith("/api")) {
    const isProtected = PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (isProtected && !req.cookies.get(SESSION_COOKIE)) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── CSRF (mutating API requests only) ─────────────────────────
  if (!MUTATING_METHODS.has(req.method)) return NextResponse.next();

  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Prefer the Origin header (always sent by browsers on non-GET).
  if (origin) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      return forbidden("Invalid Origin.");
    }
    if (!host || originHost !== host) {
      return forbidden("Cross-origin request blocked.");
    }
    return NextResponse.next();
  }

  // Fallback: validate the Referer host when Origin is absent.
  if (referer) {
    try {
      if (new URL(referer).host !== host) {
        return forbidden("Cross-origin request blocked.");
      }
    } catch {
      return forbidden("Invalid Referer.");
    }
  }

  // Neither header present (rare for browser fetches) — allow through;
  // the route's own auth/session checks remain the primary gate.
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/candidate/:path*", "/employers/:path*"],
};
