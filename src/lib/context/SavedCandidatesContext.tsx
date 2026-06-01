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
import { getApiAdapter } from "@/lib/api";
import { currentScopedKey, CACHE_BASE } from "@/lib/storage/appCache";
import type {
  ChatMessage,
  EmployerNotification,
} from "@/lib/candidates/types";
import type { ContextStatus } from "@/lib/types/contextStatus";

interface SavedCandidatesContextValue {
  savedIds: string[];
  invitedIds: string[];
  notifications: EmployerNotification[];
  unreadCount: number;
  conversations: Record<string, ChatMessage[]>;
  isHydrated: boolean;
  status: ContextStatus;
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
  ensureConversation: (candidateId: string, candidateName: string) => void;
  appendMessage: (
    candidateId: string,
    message: Omit<ChatMessage, "id" | "createdAt">,
  ) => void;
  resetAll: () => void;
}

const SavedCandidatesContext = createContext<
  SavedCandidatesContextValue | undefined
>(undefined);


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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");
    try {
      const s = localStorage.getItem(currentScopedKey(CACHE_BASE.employerSaved));
      if (s) setSavedIds(JSON.parse(s));
      const i = localStorage.getItem(currentScopedKey(CACHE_BASE.employerInvited));
      if (i) setInvitedIds(JSON.parse(i));
      const n = localStorage.getItem(currentScopedKey(CACHE_BASE.employerNotifications));
      if (n) setNotifications(JSON.parse(n));
      const c = localStorage.getItem(currentScopedKey(CACHE_BASE.employerChats));
      if (c) setConversations(JSON.parse(c));
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const api = await getApiAdapter();
        const result = await api.getEmployerProfile();
        if (cancelled) return;
        if (!result.ok) {
          setStatus("error");
          setError(result.error.message);
          setIsHydrated(true);
          return;
        }
        setSavedIds(result.data.savedIds);
        setInvitedIds(result.data.invitedIds);
        setNotifications(result.data.notifications);
        try {
          localStorage.setItem(currentScopedKey(CACHE_BASE.employerSaved), JSON.stringify(result.data.savedIds));
          localStorage.setItem(
            currentScopedKey(CACHE_BASE.employerInvited),
            JSON.stringify(result.data.invitedIds),
          );
          localStorage.setItem(
            currentScopedKey(CACHE_BASE.employerNotifications),
            JSON.stringify(result.data.notifications),
          );
        } catch {
          /* ignore */
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load saved data.",
        );
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cache writes when state mutates post-hydration.
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.employerSaved), JSON.stringify(savedIds));
    } catch {}
  }, [savedIds, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.employerInvited), JSON.stringify(invitedIds));
    } catch {}
  }, [invitedIds, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.employerNotifications), JSON.stringify(notifications));
    } catch {}
  }, [notifications, isHydrated]);
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.employerChats), JSON.stringify(conversations));
    } catch {}
  }, [conversations, isHydrated]);

  const toggleSaved = useCallback((candidateId: string) => {
    // Optimistic flip.
    setSavedIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [candidateId, ...prev],
    );
    void (async () => {
      try {
        const res = await fetch("/api/employer/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId }),
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { saved?: boolean }; error?: { message?: string } }
          | null;
        if (!res.ok || body?.ok === false) {
          throw new Error(body?.error?.message ?? "Couldn't update saved list.");
        }
        // Reconcile to the server's authoritative saved state.
        const saved = body?.data?.saved;
        if (typeof saved === "boolean") {
          setSavedIds((prev) => {
            const has = prev.includes(candidateId);
            if (saved && !has) return [candidateId, ...prev];
            if (!saved && has) return prev.filter((id) => id !== candidateId);
            return prev;
          });
        }
        setError(null);
      } catch (err) {
        // Roll back so the UI never claims a save that didn't persist.
        setSavedIds((prev) =>
          prev.includes(candidateId)
            ? prev.filter((id) => id !== candidateId)
            : [candidateId, ...prev],
        );
        setError(
          err instanceof Error ? err.message : "Couldn't update saved list.",
        );
      }
    })();
  }, []);

  const isSaved = useCallback(
    (candidateId: string) => savedIds.includes(candidateId),
    [savedIds],
  );

  const markInvited = useCallback((candidateId: string) => {
    const alreadyInvited = invitedIds.includes(candidateId);
    setInvitedIds((prev) =>
      prev.includes(candidateId) ? prev : [candidateId, ...prev],
    );
    void (async () => {
      try {
        const res = await fetch("/api/employer/invited", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId }),
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: { message?: string } }
          | null;
        if (!res.ok || body?.ok === false) {
          throw new Error(body?.error?.message ?? "Couldn't record the invite.");
        }
        setError(null);
      } catch (err) {
        // Roll back only if WE added it (don't drop a pre-existing invite).
        if (!alreadyInvited) {
          setInvitedIds((prev) => prev.filter((id) => id !== candidateId));
        }
        setError(
          err instanceof Error ? err.message : "Couldn't record the invite.",
        );
      }
    })();
  }, [invitedIds]);

  const isInvited = useCallback(
    (candidateId: string) => invitedIds.includes(candidateId),
    [invitedIds],
  );

  const addNotification = useCallback(
    (n: Omit<EmployerNotification, "id" | "createdAt" | "read">) => {
      const tempId = genId("enotif");
      const optimistic: EmployerNotification = {
        ...n,
        id: tempId,
        createdAt: Date.now(),
        read: false,
      };
      setNotifications((prev) => [optimistic, ...prev]);
      void (async () => {
        try {
          await fetch("/api/employer/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(n),
          });
        } catch {
          /* ignore */
        }
      })();
      return tempId;
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void (async () => {
      try {
        await fetch("/api/employer/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markAllRead" }),
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void (async () => {
      try {
        await fetch(`/api/employer/notifications/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const ensureConversation = useCallback(
    (candidateId: string, candidateName: string) => {
      // DEMO-ONLY local seed so the prototype chat feels alive. OFF by
      // default (gated on the same flag as the simulated reply) so
      // production NEVER shows fabricated candidate messages as if they
      // were real — real threads come from the server hydrate below.
      const demoChat = process.env.NEXT_PUBLIC_ENABLE_DEMO_CHAT === "true";
      if (demoChat) {
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
              body: `Hi ${candidateName.split(" ")[0]}, great to connect.`,
              createdAt: now - 1000 * 60,
            },
          ];
          return { ...prev, [candidateId]: seed };
        });
      }
      // Server hydrate (authoritative — always runs).
      void (async () => {
        try {
          const res = await fetch(
            `/api/messages/${encodeURIComponent(candidateId)}`,
            { cache: "no-store" },
          );
          const body = (await res.json().catch(() => null)) as
            | { ok?: boolean; data?: ChatMessage[] }
            | null;
          if (body?.ok && Array.isArray(body.data) && body.data.length > 0) {
            setConversations((prev) => ({ ...prev, [candidateId]: body.data! }));
          }
        } catch {
          /* keep local seed */
        }
      })();
    },
    [],
  );

  const appendMessage = useCallback(
    (
      candidateId: string,
      message: Omit<ChatMessage, "id" | "createdAt">,
    ) => {
      const tempId = genId("msg");
      const optimistic: ChatMessage = {
        ...message,
        id: tempId,
        createdAt: Date.now(),
      };
      setConversations((prev) => ({
        ...prev,
        [candidateId]: [...(prev[candidateId] ?? []), optimistic],
      }));
      if (message.sender === "employer") {
        void (async () => {
          try {
            await fetch(`/api/messages/${encodeURIComponent(candidateId)}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: message.body }),
            });
          } catch {
            /* ignore */
          }
        })();
      }
    },
    [],
  );

  const resetAll = useCallback(() => {
    setSavedIds([]);
    setInvitedIds([]);
    setNotifications([]);
    setConversations({});
    try {
      localStorage.removeItem(currentScopedKey(CACHE_BASE.employerSaved));
      localStorage.removeItem(currentScopedKey(CACHE_BASE.employerInvited));
      localStorage.removeItem(currentScopedKey(CACHE_BASE.employerNotifications));
      localStorage.removeItem(currentScopedKey(CACHE_BASE.employerChats));
    } catch {
      /* ignore */
    }
  }, []);

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
