"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import type {
  ChatMessage,
  EmployerNotification,
} from "@/lib/candidates/types";
import type { ContextStatus } from "@/lib/types/contextStatus";

interface SavedCandidatesContextValue {
  /** Candidate IDs saved by the employer. */
  savedIds: string[];
  /** Candidate IDs the employer has invited. */
  invitedIds: string[];
  /** Employer-side notification feed. */
  notifications: EmployerNotification[];
  /** Unread notification count. */
  unreadCount: number;
  /** Chat history keyed by candidate ID. */
  conversations: Record<string, ChatMessage[]>;
  isHydrated: boolean;
  /** Lifecycle status — see `ContextStatus`. */
  status: ContextStatus;
  /** Optional human-readable error message when `status === "error"`. */
  error: string | null;

  toggleSaved: (candidateId: string) => void;
  isSaved: (candidateId: string) => boolean;

  markInvited: (candidateId: string) => void;
  isInvited: (candidateId: string) => boolean;

  addNotification: (
    n: Omit<EmployerNotification, "id" | "createdAt" | "read">,
  ) => string;
  markAllRead: () => void;
  dismissNotification: (id: string) => void;

  /** Ensure a conversation exists with a baseline of mock messages. */
  ensureConversation: (candidateId: string, candidateName: string) => void;
  appendMessage: (
    candidateId: string,
    message: Omit<ChatMessage, "id" | "createdAt">,
  ) => void;

  /**
   * Clear every employer-side prototype slot owned by this context
   * (saved IDs, invites, notifications, chats). Used by the
   * employer sign-out flow.
   */
  resetAll: () => void;
}

const SavedCandidatesContext = createContext<
  SavedCandidatesContextValue | undefined
>(undefined);

const SAVED_KEY = "career-os-employer-saved";
const INVITED_KEY = "career-os-employer-invited";
const NOTIF_KEY = "career-os-employer-notifications";
const CHAT_KEY = "career-os-employer-chats";

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function SavedCandidatesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<EmployerNotification[]>(
    [],
  );
  const [conversations, setConversations] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Hydrate. All setState calls below are one-time SSR-safe hydration
  // from localStorage; the resulting cascading render is intentional
  // and unavoidable without a hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");
    try {
      const saved = localStorage.getItem(SAVED_KEY);
      if (saved) setSavedIds(JSON.parse(saved) as string[]);
      const invited = localStorage.getItem(INVITED_KEY);
      if (invited) setInvitedIds(JSON.parse(invited) as string[]);
      const notifs = localStorage.getItem(NOTIF_KEY);
      if (notifs)
        setNotifications(JSON.parse(notifs) as EmployerNotification[]);
      const chats = localStorage.getItem(CHAT_KEY);
      if (chats)
        setConversations(
          JSON.parse(chats) as Record<string, ChatMessage[]>,
        );
      setStatus("ready");
    } catch (err) {
      console.warn("Saved candidates hydration failed:", err);
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Saved candidates hydration failed",
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist (gated on hydration).
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds));
    } catch {}
  }, [savedIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(INVITED_KEY, JSON.stringify(invitedIds));
    } catch {}
  }, [invitedIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
    } catch {}
  }, [notifications, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations, isHydrated]);

  const toggleSaved = useCallback((candidateId: string) => {
    setSavedIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [candidateId, ...prev],
    );
  }, []);

  const isSaved = useCallback(
    (candidateId: string) => savedIds.includes(candidateId),
    [savedIds],
  );

  const markInvited = useCallback((candidateId: string) => {
    setInvitedIds((prev) =>
      prev.includes(candidateId) ? prev : [candidateId, ...prev],
    );
  }, []);

  const isInvited = useCallback(
    (candidateId: string) => invitedIds.includes(candidateId),
    [invitedIds],
  );

  const addNotification = useCallback(
    (n: Omit<EmployerNotification, "id" | "createdAt" | "read">) => {
      const id = genId("enotif");
      setNotifications((prev) => [
        { ...n, id, createdAt: Date.now(), read: false },
        ...prev,
      ]);
      return id;
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const ensureConversation = useCallback(
    (candidateId: string, candidateName: string) => {
      setConversations((prev) => {
        if (prev[candidateId] && prev[candidateId].length > 0) return prev;
        const now = Date.now();
        const seed: ChatMessage[] = [
          {
            id: genId("msg"),
            sender: "candidate",
            body: `Hi! Thanks for reaching out — I'd love to hear more about the opportunity.`,
            createdAt: now - 1000 * 60 * 2,
          },
          {
            id: genId("msg"),
            sender: "employer",
            body: `Hi ${candidateName.split(" ")[0]}, great to connect. What kind of work are you most excited about right now?`,
            createdAt: now - 1000 * 60,
          },
          {
            id: genId("msg"),
            sender: "candidate",
            body: `Honestly, anything where I can keep compounding on what I'm already building. Happy to share my portfolio.`,
            createdAt: now - 1000 * 30,
          },
        ];
        return { ...prev, [candidateId]: seed };
      });
    },
    [],
  );

  const resetAll = useCallback(() => {
    setSavedIds([]);
    setInvitedIds([]);
    setNotifications([]);
    setConversations({});
    try {
      localStorage.removeItem(SAVED_KEY);
      localStorage.removeItem(INVITED_KEY);
      localStorage.removeItem(NOTIF_KEY);
      localStorage.removeItem(CHAT_KEY);
    } catch (err) {
      console.warn("Saved candidates reset failed:", err);
    }
  }, []);

  const appendMessage = useCallback(
    (
      candidateId: string,
      message: Omit<ChatMessage, "id" | "createdAt">,
    ) => {
      setConversations((prev) => {
        const list = prev[candidateId] ?? [];
        return {
          ...prev,
          [candidateId]: [
            ...list,
            { ...message, id: genId("msg"), createdAt: Date.now() },
          ],
        };
      });
    },
    [],
  );

  const value = useMemo<SavedCandidatesContextValue>(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      savedIds,
      invitedIds,
      notifications,
      unreadCount,
      conversations,
      isHydrated,
      status,
      error,
      toggleSaved,
      isSaved,
      markInvited,
      isInvited,
      addNotification,
      markAllRead,
      dismissNotification,
      ensureConversation,
      appendMessage,
      resetAll,
    };
  }, [
    savedIds,
    invitedIds,
    notifications,
    conversations,
    isHydrated,
    status,
    error,
    toggleSaved,
    isSaved,
    markInvited,
    isInvited,
    addNotification,
    markAllRead,
    dismissNotification,
    ensureConversation,
    appendMessage,
    resetAll,
  ]);

  return (
    <SavedCandidatesContext.Provider value={value}>
      {children}
    </SavedCandidatesContext.Provider>
  );
}

export function useSavedCandidates() {
  const ctx = useContext(SavedCandidatesContext);
  if (!ctx)
    throw new Error(
      "useSavedCandidates must be used inside SavedCandidatesProvider",
    );
  return ctx;
}
