/**
 * Frontend API contracts for Career OS.
 *
 * These types describe the shape of every request/response the
 * application will eventually exchange with a backend. They live
 * here (decoupled from individual contexts) so that:
 *
 *  1. The current localStorage-backed providers can be swapped to
 *     real API calls without touching consumer components.
 *  2. The team has a single, reviewable surface for whatever HTTP/
 *     gRPC contract we adopt later.
 *  3. Types stay consistent across contexts that touch overlapping
 *     domains (e.g. candidate IDs, intent fields).
 *
 * Naming convention: domain types are duplicated from
 * `@/lib/candidates/types` and the context files only where it
 * helps frame *what the API will hand us*. If a domain shape is
 * still in flux, prefer re-exporting from the existing module.
 */

import type {
  Candidate,
  ChatMessage,
  EmployerGoal,
  EmployerNotification,
} from "@/lib/candidates/types";
import type {
  AppNotification,
} from "@/lib/context/NotificationsContext";
import type { Intent } from "@/lib/context/IntentContext";
import type { PortfolioData } from "@/lib/hooks/usePortfolio";
import type { ChapterEvent } from "@/lib/chapters/data";

// ── Generic envelope ────────────────────────────────────────────

/**
 * Discriminated-union result type returned by every adapter call.
 * Consumers either get `{ ok: true, data }` or `{ ok: false, error }`
 * and can switch on `result.ok`.
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface ApiError {
  /** Short machine-readable code. */
  code: ApiErrorCode;
  /** User-facing message safe to render. */
  message: string;
  /** Optional cause (e.g. an HTTP response or thrown Error). */
  cause?: unknown;
}

export type ApiErrorCode =
  | "network"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "rate_limited"
  | "server"
  | "unknown";

// ── Candidate (Intent + Portfolio + Chapters + Notifications) ───

/** GET /api/me — the current candidate's full profile snapshot. */
export interface CandidateProfileResponse {
  intent: Intent;
  portfolio: PortfolioData;
  chapters: ChapterEvent[];
  notifications: AppNotification[];
}

/** PATCH /api/me/intent — partial intent updates. */
export type IntentPatch = Partial<Intent>;

/** PATCH /api/me/portfolio — full or partial portfolio replacement. */
export type PortfolioPatch = Partial<PortfolioData>;

// ── Employer ────────────────────────────────────────────────────

/** GET /api/employer/me — current employer goal + onboarding state. */
export interface EmployerProfileResponse {
  goal: EmployerGoal;
  hasCompletedOnboarding: boolean;
  savedIds: string[];
  invitedIds: string[];
  notifications: EmployerNotification[];
}

export type EmployerGoalPatch = Partial<EmployerGoal>;

// ── Marketplace ─────────────────────────────────────────────────

export interface MarketplaceQuery {
  query?: string;
  category?: string;
  /** Optional pagination — backend may ignore for now. */
  limit?: number;
  cursor?: string;
}

export interface MarketplacePage {
  candidates: Candidate[];
  nextCursor?: string;
  total?: number;
}

// ── Messaging ───────────────────────────────────────────────────

export interface SendChatMessageRequest {
  candidateId: string;
  body: string;
}

export interface SendChatMessageResponse {
  /** The newly-persisted message (with server id + timestamp). */
  message: ChatMessage;
  /**
   * Optional auto-reply. In the current prototype this is a mock
   * candidate response generated client-side; once the real backend
   * lands, the field is repurposed for messages already pushed from
   * the other party (or omitted entirely if none is available yet).
   */
  reply?: ChatMessage;
}

export interface SendInviteRequest {
  candidateId: string;
  subject: string;
  message: string;
}

export interface SendInviteResponse {
  /** Server-generated invite id; mirrored locally for dedupe. */
  inviteId: string;
  /** The notification record the server enqueued for the employer. */
  notification: EmployerNotification;
}
