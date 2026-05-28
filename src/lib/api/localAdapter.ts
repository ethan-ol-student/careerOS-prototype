/**
 * localStorage-backed implementation of `ApiAdapter`.
 *
 * This adapter mirrors the existing context-provider storage keys
 * so the swap from "context owns the data" to "API owns the data,
 * context just consumes it" can happen incrementally — each
 * provider can move to the adapter one at a time without changing
 * the keys on disk.
 *
 * Network behaviour is faked with `await Promise.resolve()` so call
 * sites get a real async surface today.
 */

import type { ApiAdapter } from "./adapter";
import type {
  ApiError,
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
import {
  CANDIDATES,
  findCandidateById,
} from "@/lib/candidates/data";
import type {
  ChatMessage,
  EmployerGoal,
  EmployerNotification,
} from "@/lib/candidates/types";
import type { AppNotification } from "@/lib/context/NotificationsContext";
import type { Intent } from "@/lib/context/IntentContext";
import type { PortfolioData } from "@/lib/hooks/usePortfolio";
import type { ChapterEvent } from "@/lib/chapters/data";

// ── Storage key registry ────────────────────────────────────────
// These must stay in lockstep with the keys used in the existing
// context providers so consumers don't lose data when the swap
// happens.
const KEYS = {
  intent: "career-os-intent",
  portfolio: "career-os-portfolio",
  events: "career-os-events",
  candidateNotifications: "career-os-candidate-notifications",
  employerGoal: "career-os-employer-goal",
  employerOnboarded: "career-os-employer-onboarded",
  employerSaved: "career-os-employer-saved",
  employerInvited: "career-os-employer-invited",
  employerNotifications: "career-os-employer-notifications",
  employerChats: "career-os-employer-chats",
} as const;

// ── Helpers ─────────────────────────────────────────────────────

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}
function fail<T = never>(error: ApiError): ApiResult<T> {
  return { ok: false, error };
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeParse(localStorage.getItem(key), fallback);
}

function writeJson(key: string, value: unknown): ApiResult<void> {
  if (typeof window === "undefined") {
    return fail({
      code: "network",
      message: "Local storage not available on the server.",
    });
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return ok(undefined);
  } catch (err) {
    return fail({
      code: "server",
      message: "Could not persist data locally.",
      cause: err,
    });
  }
}

const initialIntent: Intent = {
  role: null,
  stage: "",
  goals: [],
  name: "",
  field: "",
  targetJob: "",
};

const initialGoal: EmployerGoal = {
  talentType: "",
  role: "",
  priorities: [],
  locationPreference: "",
};

const initialPortfolio: PortfolioData = {
  headline: "",
  summary: "",
  skills: [],
  certificates: [],
  awards: [],
  projects: [],
  experiences: [],
  bio: "",
  legacySkills: [],
  legacyExperiences: [],
  aspirations: [],
  reflections: [],
  lastUpdated: null,
  totalAdditions: 0,
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Adapter ─────────────────────────────────────────────────────

export const localAdapter: ApiAdapter = {
  async getCandidateProfile(): Promise<ApiResult<CandidateProfileResponse>> {
    await Promise.resolve();
    return ok({
      intent: { ...initialIntent, ...readJson<Partial<Intent>>(KEYS.intent, {}) },
      portfolio: {
        ...initialPortfolio,
        ...readJson<Partial<PortfolioData>>(KEYS.portfolio, {}),
      },
      chapters: readJson<ChapterEvent[]>(KEYS.events, []),
      notifications: readJson<AppNotification[]>(KEYS.candidateNotifications, []),
    });
  },

  async patchIntent(patch: IntentPatch): Promise<ApiResult<void>> {
    await Promise.resolve();
    const current = readJson<Intent>(KEYS.intent, initialIntent);
    return writeJson(KEYS.intent, { ...current, ...patch });
  },

  async patchPortfolio(patch: PortfolioPatch): Promise<ApiResult<void>> {
    await Promise.resolve();
    const current = readJson<PortfolioData>(KEYS.portfolio, initialPortfolio);
    return writeJson(KEYS.portfolio, { ...current, ...patch });
  },

  async getEmployerProfile(): Promise<ApiResult<EmployerProfileResponse>> {
    await Promise.resolve();
    return ok({
      goal: {
        ...initialGoal,
        ...readJson<Partial<EmployerGoal>>(KEYS.employerGoal, {}),
      },
      hasCompletedOnboarding:
        readJson<string>(KEYS.employerOnboarded, "") === "1",
      savedIds: readJson<string[]>(KEYS.employerSaved, []),
      invitedIds: readJson<string[]>(KEYS.employerInvited, []),
      notifications: readJson<EmployerNotification[]>(
        KEYS.employerNotifications,
        [],
      ),
    });
  },

  async patchEmployerGoal(patch: EmployerGoalPatch): Promise<ApiResult<void>> {
    await Promise.resolve();
    const current = readJson<EmployerGoal>(KEYS.employerGoal, initialGoal);
    return writeJson(KEYS.employerGoal, { ...current, ...patch });
  },

  async completeEmployerOnboarding(): Promise<ApiResult<void>> {
    await Promise.resolve();
    return writeJson(KEYS.employerOnboarded, "1");
  },

  async listCandidates(
    query: MarketplaceQuery,
  ): Promise<ApiResult<MarketplacePage>> {
    await Promise.resolve();
    const q = query.query?.trim().toLowerCase() ?? "";
    const category = query.category;
    const filtered = CANDIDATES.filter((c) => {
      if (category && category !== "Recommended" && c.category !== category) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        c.name,
        c.careerDirection,
        c.targetRole,
        c.category,
        c.industry,
        c.location,
        ...c.topSkills,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => b.matchScore - a.matchScore);

    const limited =
      typeof query.limit === "number" ? filtered.slice(0, query.limit) : filtered;
    return ok({ candidates: limited, total: filtered.length });
  },

  async sendChatMessage(
    request: SendChatMessageRequest,
  ): Promise<ApiResult<SendChatMessageResponse>> {
    await Promise.resolve();
    const candidate = findCandidateById(request.candidateId);
    if (!candidate) {
      return fail({
        code: "not_found",
        message: "Candidate not found.",
      });
    }
    const conversations = readJson<Record<string, ChatMessage[]>>(
      KEYS.employerChats,
      {},
    );
    const list = conversations[request.candidateId] ?? [];
    const message: ChatMessage = {
      id: genId("msg"),
      sender: "employer",
      body: request.body,
      createdAt: Date.now(),
    };
    const next: ChatMessage[] = [...list, message];
    conversations[request.candidateId] = next;
    writeJson(KEYS.employerChats, conversations);
    // No automatic reply at the adapter layer — the *prototype demo*
    // reply is composed in the chat UI (`ChatInterface.handleSend`),
    // so swapping this adapter for a real backend doesn't require
    // pruning fake messages out of localStorage. Real-time replies
    // will come back through a future subscription channel.
    return ok({ message });
  },

  async getConversation(candidateId: string): Promise<ApiResult<ChatMessage[]>> {
    await Promise.resolve();
    const conversations = readJson<Record<string, ChatMessage[]>>(
      KEYS.employerChats,
      {},
    );
    return ok(conversations[candidateId] ?? []);
  },

  async sendInvite(
    request: SendInviteRequest,
  ): Promise<ApiResult<SendInviteResponse>> {
    await Promise.resolve();
    const candidate = findCandidateById(request.candidateId);
    if (!candidate) {
      return fail({
        code: "not_found",
        message: "Candidate not found.",
      });
    }
    const invited = readJson<string[]>(KEYS.employerInvited, []);
    if (!invited.includes(request.candidateId)) {
      writeJson(KEYS.employerInvited, [request.candidateId, ...invited]);
    }
    const notification: EmployerNotification = {
      id: genId("enotif"),
      kind: "invite-pending",
      title: `Invite sent to ${candidate.name}.`,
      body: `Subject: ${request.subject}`,
      candidateId: candidate.id,
      createdAt: Date.now(),
      read: false,
    };
    return ok({
      inviteId: genId("inv"),
      notification,
    });
  },
};
