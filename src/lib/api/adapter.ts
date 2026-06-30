/**
 * Frontend API adapter contract.
 *
 * Career OS is online-only: every data call goes to the Next.js route
 * handlers under `src/app/api/` via the single `httpAdapter`. This
 * interface is just the typed shape of those operations.
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

// ── Adapter access ──────────────────────────────────────────────

// ponytail: kept async so the 8 `await getApiAdapter()` call sites don't churn.
export async function getApiAdapter(): Promise<ApiAdapter> {
  const { httpAdapter } = await import("./httpAdapter");
  return httpAdapter;
}
