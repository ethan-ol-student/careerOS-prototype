/**
 * Minimal in-memory rate limiter for auth endpoints (brute-force
 * protection). Keyed by client IP (+ optional identifier), fixed-window.
 *
 * NOTE: state is per server instance, so on a multi-instance/serverless
 * deploy this is best-effort, not global. It's intentionally simple and
 * dependency-free; swap for a shared store (e.g. Redis/Upstash) if a
 * hard global guarantee is needed. Good enough to blunt naive
 * credential-stuffing against a single instance.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (for `Retry-After`). */
  retryAfterSec: number;
  remaining: number;
}

export interface RateLimitOptions {
  /** Max attempts allowed per window. */
  limit?: number;
  /** Window length in milliseconds. */
  windowMs?: number;
}

/** Count one attempt against `key`. Returns whether it's allowed. */
export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: RateLimitOptions = {},
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now > b.resetAt) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0, remaining: limit - 1 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
      remaining: 0,
    };
  }
  return {
    ok: true,
    retryAfterSec: 0,
    remaining: Math.max(0, limit - existing.count),
  };
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
