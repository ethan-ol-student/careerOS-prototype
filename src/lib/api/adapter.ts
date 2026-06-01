/**
 * Frontend API adapter contract.
 *
 * The adapter is a thin seam between Career OS components and
 * whatever data source is wired up below — today that's
 * localStorage, tomorrow it'll be a real backend. Keep this file
 * small and focused on the *shape* of operations.
 *
 * Implementations:
 *  - `localAdapter`   (in `./localAdapter`)  — current default
 *  - `httpAdapter`    (future)                — real backend
 *  - `mockAdapter`    (future, optional)      — fixtures for tests
 *
 * Components should never call adapters directly. Wrap calls in a
 * context/provider or hook so swapping the implementation only
 * happens in one place (`getApiAdapter()` below).
 */

import type {
  ApiResult,
  CandidateProfileResponse,
  EmployerGoalPatch,
  EmployerProfileResponse,
  IntentPatch,
  MarketplacePage,
  MarketplaceQuery,
  PortfolioPatch,
  SendChatMessageRequest,
  SendChatMessageResponse,
  SendInviteRequest,
  SendInviteResponse,
} from "./types";
import type { ChatMessage } from "@/lib/candidates/types";

export interface ApiAdapter {
  // ── Candidate ────────────────────────────────────────────────
  getCandidateProfile(): Promise<ApiResult<CandidateProfileResponse>>;
  patchIntent(patch: IntentPatch): Promise<ApiResult<void>>;
  patchPortfolio(patch: PortfolioPatch): Promise<ApiResult<void>>;

  // ── Employer ─────────────────────────────────────────────────
  getEmployerProfile(): Promise<ApiResult<EmployerProfileResponse>>;
  patchEmployerGoal(patch: EmployerGoalPatch): Promise<ApiResult<void>>;
  completeEmployerOnboarding(): Promise<ApiResult<void>>;

  // ── Marketplace ──────────────────────────────────────────────
  listCandidates(query: MarketplaceQuery): Promise<ApiResult<MarketplacePage>>;

  // ── Messaging ────────────────────────────────────────────────
  /**
   * Persist an employer→candidate message and (optionally) return
   * any reply the server has already pushed.
   *
   * In the current prototype the local adapter returns a mocked
   * reply after a short delay so the UI has something to render;
   * a real backend implementation MUST drop the mock reply and
   * surface real messages through whatever live-update channel
   * we adopt (WebSocket, SSE, polling, …).
   */
  sendChatMessage(
    request: SendChatMessageRequest,
  ): Promise<ApiResult<SendChatMessageResponse>>;

  /** Get conversation history for a candidate. */
  getConversation(candidateId: string): Promise<ApiResult<ChatMessage[]>>;

  /** Send an invite (the email-style form). */
  sendInvite(
    request: SendInviteRequest,
  ): Promise<ApiResult<SendInviteResponse>>;
}

// ── Adapter selection ───────────────────────────────────────────

let cachedAdapter: ApiAdapter | null = null;

/**
 * Returns the currently-active API adapter.
 *
 * The HTTP adapter (real backend + access control) is ALWAYS the
 * default. The localStorage-only `localAdapter` is an explicit
 * dev-only opt-in via `NEXT_PUBLIC_USE_LOCAL_ADAPTER=true`, and is
 * hard-blocked in production so backend persistence/authorization can
 * never be silently bypassed.
 *
 * Centralizing the choice here means components never need to change.
 */
export async function getApiAdapter(): Promise<ApiAdapter> {
  if (cachedAdapter) return cachedAdapter;

  const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_ADAPTER === "true";

  // Fail closed: the local adapter must never run in production.
  if (useLocal && process.env.NODE_ENV === "production") {
    throw new Error(
      "The localStorage adapter cannot be used in production. " +
        "Unset NEXT_PUBLIC_USE_LOCAL_ADAPTER to use the HTTP/API backend.",
    );
  }

  if (useLocal) {
    const { localAdapter } = await import("./localAdapter");
    cachedAdapter = localAdapter;
  } else {
    const { httpAdapter } = await import("./httpAdapter");
    cachedAdapter = httpAdapter;
  }
  return cachedAdapter;
}

/** Convenience helper used in tests/dev tools to force a fresh adapter. */
export function _resetApiAdapterForTests(next: ApiAdapter | null) {
  cachedAdapter = next;
}
