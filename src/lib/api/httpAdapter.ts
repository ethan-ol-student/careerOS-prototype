/**
 * HTTP-backed implementation of `ApiAdapter` — the only adapter.
 *
 * Every call goes to the Next.js route handlers under `src/app/api/`.
 * Requests are same-origin by default; set `NEXT_PUBLIC_API_BASE_URL`
 * to target a different host.
 *
 * Conversions:
 *  - The DB schema stores timestamps as `Date` → serialized to ISO
 *    strings over JSON. The frontend types use `number` (unix-ms),
 *    so the adapter converts on the way in.
 *  - The DB `CandidateProfile` is a single flat row; the frontend
 *    splits it into `intent` + `portfolio` shapes. The adapter
 *    splits the bundle on the GET `/api/me` response.
 */

import type { ApiAdapter } from "./adapter";
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
import type {
  ChatMessage,
  EmployerGoal,
  EmployerNotification,
} from "@/lib/candidates/types";
import type { AppNotification } from "@/lib/context/NotificationsContext";
import type { Intent } from "@/lib/context/IntentContext";
import type { PortfolioData } from "@/lib/hooks/usePortfolio";
import type { ChapterEvent, Priority, Subtask } from "@/lib/chapters/data";

// ── Base URL ────────────────────────────────────────────────────
// Empty string → same-origin fetch (works in dev + server-side).
const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

// ── Core JSON helper ────────────────────────────────────────────

async function jsonFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      // Always grab the freshest version; the adapter is the
      // cache layer at the React-state level.
      cache: "no-store",
    });

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // body stays null
    }

    if (!res.ok) {
      const message =
        (body as { error?: { message?: string } } | null)?.error?.message ??
        `HTTP ${res.status}`;
      return {
        ok: false,
        error: { code: "server", message },
      };
    }

    return body as ApiResult<T>;
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "network",
        message: err instanceof Error ? err.message : "Network error.",
        cause: err,
      },
    };
  }
}

// ── Shape converters ────────────────────────────────────────────

/** DB notification row → `AppNotification`. */
function toAppNotification(row: {
  id: string;
  kind: string;
  severity: string;
  title: string;
  body: string;
  actionLabel: string | null;
  payload: unknown;
  read: boolean;
  createdAt: string;
}): AppNotification {
  return {
    id: row.id,
    kind: row.kind as AppNotification["kind"],
    severity: row.severity as AppNotification["severity"],
    title: row.title,
    body: row.body,
    actionLabel: row.actionLabel ?? undefined,
    payload: (row.payload as Record<string, unknown> | null) ?? undefined,
    createdAt: new Date(row.createdAt).getTime(),
    read: row.read,
  };
}

/** DB chapter row → `ChapterEvent`. */
function toChapterEvent(row: {
  id: string;
  name: string;
  priority: string;
  date: string;
  time: string;
  subtasks: unknown;
  createdAt: string;
}): ChapterEvent {
  return {
    id: row.id,
    name: row.name,
    priority: row.priority as Priority,
    date: row.date,
    time: row.time,
    subtasks: (row.subtasks as Subtask[]) ?? [],
    createdAt: row.createdAt,
  };
}

/** DB employer notification row → `EmployerNotification`. */
function toEmployerNotification(row: {
  id: string;
  kind: string;
  title: string;
  body: string;
  candidateId: string | null;
  read: boolean;
  createdAt: string;
}): EmployerNotification {
  return {
    id: row.id,
    kind: row.kind as EmployerNotification["kind"],
    title: row.title,
    body: row.body,
    candidateId: row.candidateId ?? undefined,
    createdAt: new Date(row.createdAt).getTime(),
    read: row.read,
  };
}

/** DB chat-message row → `ChatMessage`. */
function toChatMessage(row: {
  id: string;
  sender: string;
  body: string;
  createdAt: string;
}): ChatMessage {
  return {
    id: row.id,
    sender: row.sender as ChatMessage["sender"],
    body: row.body,
    createdAt: new Date(row.createdAt).getTime(),
  };
}

/** DB candidate-profile row → `Intent` + `PortfolioData` split. */
function toIntent(profile: {
  stage: string;
  goals: string[];
  name: string;
  field: string;
  targetJob: string;
}): Intent {
  return {
    role: "candidate",
    name: profile.name,
    stage: profile.stage,
    goals: profile.goals,
    field: profile.field,
    targetJob: profile.targetJob,
  };
}

function toPortfolio(profile: {
  headline: string;
  summary: string;
  skills: string[];
  bio: string;
  totalAdditions: number;
  lastUpdated: string | null;
  certificates: { id: string; title: string; issuer: string; year: string }[];
  awards: {
    id: string;
    title: string;
    year: string;
    description: string | null;
  }[];
  projects: {
    id: string;
    title: string;
    description: string;
    link: string | null;
  }[];
  experiences: {
    id: string;
    role: string;
    company: string;
    period: string;
    detail: string | null;
  }[];
}): PortfolioData {
  return {
    headline: profile.headline,
    summary: profile.summary,
    skills: profile.skills,
    bio: profile.bio,
    certificates: profile.certificates,
    awards: profile.awards.map((a) => ({
      id: a.id,
      title: a.title,
      year: a.year,
      description: a.description ?? undefined,
    })),
    projects: profile.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      link: p.link ?? undefined,
    })),
    experiences: profile.experiences.map((e) => ({
      id: e.id,
      role: e.role,
      company: e.company,
      period: e.period,
      detail: e.detail ?? undefined,
    })),
    legacySkills: [],
    legacyExperiences: [],
    aspirations: [],
    reflections: [],
    lastUpdated: profile.lastUpdated,
    totalAdditions: profile.totalAdditions,
  };
}

function toEmployerGoal(profile: {
  talentType: string;
  role: string;
  priorities: string[];
  locationPreference: string | null;
}): EmployerGoal {
  return {
    talentType: profile.talentType as EmployerGoal["talentType"],
    role: profile.role,
    priorities: profile.priorities as EmployerGoal["priorities"],
    locationPreference: profile.locationPreference ?? undefined,
  };
}

// ── Adapter ─────────────────────────────────────────────────────

type RawProfileBundle = {
  profile: Parameters<typeof toIntent>[0] & Parameters<typeof toPortfolio>[0];
  chapters: Parameters<typeof toChapterEvent>[0][];
  notifications: Parameters<typeof toAppNotification>[0][];
};

type RawEmployerBundle = {
  profile: Parameters<typeof toEmployerGoal>[0] & {
    hasCompletedOnboarding: boolean;
  };
  savedIds: string[];
  invitedIds: string[];
  notifications: Parameters<typeof toEmployerNotification>[0][];
};

export const httpAdapter: ApiAdapter = {
  async getCandidateProfile(): Promise<ApiResult<CandidateProfileResponse>> {
    const result = await jsonFetch<RawProfileBundle>("/api/me");
    if (!result.ok) return result;
    return {
      ok: true,
      data: {
        intent: toIntent(result.data.profile),
        portfolio: toPortfolio(result.data.profile),
        chapters: result.data.chapters.map(toChapterEvent),
        notifications: result.data.notifications.map(toAppNotification),
      },
    };
  },

  patchIntent(patch: IntentPatch) {
    return jsonFetch<void>("/api/me/intent", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  patchPortfolio(patch: PortfolioPatch) {
    return jsonFetch<void>("/api/me/portfolio", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async getEmployerProfile(): Promise<ApiResult<EmployerProfileResponse>> {
    const result = await jsonFetch<RawEmployerBundle>("/api/employer/me");
    if (!result.ok) return result;
    return {
      ok: true,
      data: {
        goal: toEmployerGoal(result.data.profile),
        hasCompletedOnboarding: result.data.profile.hasCompletedOnboarding,
        savedIds: result.data.savedIds,
        invitedIds: result.data.invitedIds,
        notifications: result.data.notifications.map(toEmployerNotification),
      },
    };
  },

  patchEmployerGoal(patch: EmployerGoalPatch) {
    return jsonFetch<void>("/api/employer/goal", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  completeEmployerOnboarding() {
    return jsonFetch<void>("/api/employer/onboarding", { method: "POST" });
  },

  async listCandidates(
    query: MarketplaceQuery,
  ): Promise<ApiResult<MarketplacePage>> {
    const params = new URLSearchParams();
    if (query.query) params.set("query", query.query);
    if (query.category) params.set("category", query.category);
    if (typeof query.limit === "number")
      params.set("limit", String(query.limit));
    if (query.cursor) params.set("cursor", query.cursor);
    return jsonFetch<MarketplacePage>(`/api/marketplace?${params.toString()}`);
  },

  async sendChatMessage(
    request: SendChatMessageRequest,
  ): Promise<ApiResult<SendChatMessageResponse>> {
    const result = await jsonFetch<{ message: Parameters<typeof toChatMessage>[0] }>(
      `/api/messages/${encodeURIComponent(request.candidateId)}`,
      { method: "POST", body: JSON.stringify({ body: request.body }) },
    );
    if (!result.ok) return result;
    return {
      ok: true,
      data: { message: toChatMessage(result.data.message) },
    };
  },

  async getConversation(candidateId: string): Promise<ApiResult<ChatMessage[]>> {
    const result = await jsonFetch<Parameters<typeof toChatMessage>[0][]>(
      `/api/messages/${encodeURIComponent(candidateId)}`,
    );
    if (!result.ok) return result;
    return { ok: true, data: result.data.map(toChatMessage) };
  },

  async sendInvite(
    request: SendInviteRequest,
  ): Promise<ApiResult<SendInviteResponse>> {
    const result = await jsonFetch<{
      inviteId: string;
      notification: Parameters<typeof toEmployerNotification>[0];
    }>("/api/invites", {
      method: "POST",
      body: JSON.stringify(request),
    });
    if (!result.ok) return result;
    return {
      ok: true,
      data: {
        inviteId: result.data.inviteId,
        notification: toEmployerNotification(result.data.notification),
      },
    };
  },
};
