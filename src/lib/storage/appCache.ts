/**
 * Centralized client-side cache registry + helpers.
 *
 * Every localStorage key the app owns is namespaced here so that:
 *  - logout can clear ALL of them in one place (privacy), and
 *  - per-user/per-role scoping prevents cross-account leakage and
 *    stale-before-hydration flashes.
 *
 * These are PAINT caches only — the server (scoped to the httpOnly
 * session cookie) is always the source of truth. Clearing them never
 * deletes database records.
 */

/** Legacy/global prefix used by older keys (drafts, dev caches, adapters). */
const LEGACY_CACHE_PREFIX = "career-os-";
/** Prefix for the new per-user scoped keys. */
export const SCOPED_CACHE_PREFIX = "careeros:";

/**
 * Stable base names for the per-user paint caches. Scope them with
 * `scopedCacheKey()` before reading/writing.
 */
export const CACHE_BASE = {
  intent: "intent",
  portfolio: "portfolio",
  chapters: "chapters",
  candidateNotifications: "candidate-notifications",
  candidatesAI: "candidates-ai",
  employersAI: "employers-ai",
  employerGoal: "employer-goal",
  employerOnboarded: "employer-onboarded",
  employerSaved: "employer-saved",
  employerInvited: "employer-invited",
  employerNotifications: "employer-notifications",
  employerChats: "employer-chats",
} as const;

/**
 * Marker recording which user the current browser caches belong to.
 * Read on auth-resolve to detect an account switch (different user on
 * the same browser) and purge stale caches. Intentionally uses the
 * legacy prefix so `clearAllAppCache()` also clears it.
 */
const ACTIVE_USER_KEY = `${LEGACY_CACHE_PREFIX}active-user`;

/** Minimal shape we need to scope a key — matches `AuthUser`. */
interface ScopeUser {
  id?: string | null;
  role?: string | null;
}

/**
 * Module-level "who owns the caches right now". Published by
 * `AuthContext` the moment auth resolves (and cleared on logout) so
 * providers can build user-scoped keys at call time without each one
 * re-plumbing auth state. Combined with `reconcileActiveUser()` (which
 * purges on account switch), this guarantees no cross-account leakage.
 */
let activeScope: ScopeUser | null = null;

/** Set/clear the active cache scope. Called by `AuthContext`. */
export function setActiveScope(user: ScopeUser | null): void {
  activeScope = user;
}

/** Scoped key for the currently-active user (or `anon` before auth). */
export function currentScopedKey(base: string): string {
  return scopedCacheKey(base, activeScope);
}

/**
 * Build a per-user, per-role cache key, e.g.
 * `careeros:candidate:abc123:portfolio`. Before auth resolves (no
 * user) it returns an `anon` key so nothing private is ever written
 * under a shared name.
 */
export function scopedCacheKey(
  base: string,
  user: ScopeUser | null | undefined,
): string {
  const id = user?.id;
  if (!id) return `${SCOPED_CACHE_PREFIX}anon:${base}`;
  return `${SCOPED_CACHE_PREFIX}${user?.role ?? "user"}:${id}:${base}`;
}

/**
 * Remove every app-owned cache/draft/marker key from localStorage.
 * Matches both the legacy (`career-os-*`) and scoped (`careeros:*`)
 * namespaces so new keys are covered automatically. Never touches the
 * httpOnly session cookie or any database record.
 */
export function clearAllAppCache(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(LEGACY_CACHE_PREFIX) ||
          key.startsWith(SCOPED_CACHE_PREFIX))
      ) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) localStorage.removeItem(key);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** Read the cached "active user" marker, or null. */
function readActiveUserMarker(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

/** Record the active user id (after any account-switch purge). */
function writeActiveUserMarker(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_USER_KEY, userId);
  } catch {
    /* ignore */
  }
}

/**
 * Reconcile the browser caches with the freshly-resolved user.
 * If a *different* user previously owned this browser's caches, purge
 * everything so their data can never paint for the new user. Call this
 * the moment auth resolves a user.
 */
export function reconcileActiveUser(userId: string): void {
  const previous = readActiveUserMarker();
  if (previous && previous !== userId) {
    clearAllAppCache();
  }
  writeActiveUserMarker(userId);
}
