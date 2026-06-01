import { NextResponse, type NextRequest } from "next/server";

/**
 * CSRF / cross-origin protection for mutating API requests.
 *
 * Cookie-authenticated state changes are the CSRF attack surface, so
 * every mutating (`POST/PUT/PATCH/DELETE`) request to `/api/*` must
 * originate from the same site. We validate the `Origin` header (sent
 * by browsers on non-GET requests), falling back to `Referer`. A
 * present-but-mismatched value is rejected with 403; legitimate
 * same-origin app requests pass untouched. Safe methods (GET/HEAD) and
 * non-API routes are never affected.
 */

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function forbidden(message: string) {
  return NextResponse.json(
    { ok: false, error: { code: "forbidden", message } },
    { status: 403 },
  );
}

export function middleware(req: NextRequest) {
  // Only guard mutating API requests.
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
  matcher: ["/api/:path*"],
};
