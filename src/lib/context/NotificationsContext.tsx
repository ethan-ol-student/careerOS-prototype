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
import { httpAdapter as api } from "@/lib/api/httpAdapter";
import { useAuth } from "@/lib/context/AuthContext";
import { currentScopedKey, CACHE_BASE } from "@/lib/storage/appCache";
import type { ContextStatus } from "@/lib/types/contextStatus";

export type NotificationKind = "skill" | "system" | "job-match";
export type NotificationSeverity = "info" | "important";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body: string;
  actionLabel?: string;
  payload?: Record<string, unknown>;
  createdAt: number;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  hasImportant: boolean;
  isHydrated: boolean;
  status: ContextStatus;
  error: string | null;
  addNotification: (
    n: Omit<AppNotification, "id" | "createdAt" | "read">,
  ) => string;
  dismissNotification: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined,
);


export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Auth-keyed hydration: re-runs on login/logout so a fresh sign-in
  // gets data without a manual reload (providers mount at the root).
  const { user, status: authStatus } = useAuth();
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  // Load on auth change: quick paint from cache, then authoritative fetch.
  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!userId || userRole !== "candidate") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auth-keyed reset
      setNotifications([]);
      setStatus("idle");
      setError(null);
      setIsHydrated(true);
      return;
    }
     
    setStatus("loading");
    try {
      const cached = localStorage.getItem(currentScopedKey(CACHE_BASE.candidateNotifications));
      if (cached) {
        const parsed = JSON.parse(cached) as AppNotification[];
        if (Array.isArray(parsed)) setNotifications(parsed);
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await api.getCandidateProfile();
        if (cancelled) return;
        if (!result.ok) {
          setStatus("error");
          setError(result.error.message);
          setIsHydrated(true);
          return;
        }
        setNotifications(result.data.notifications);
        try {
          localStorage.setItem(
            currentScopedKey(CACHE_BASE.candidateNotifications),
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
          err instanceof Error ? err.message : "Failed to load notifications.",
        );
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, userId, userRole]);

  // Persistence side-effect: write the React state back to the cache
  // whenever it changes (post-hydration), so a refresh paints fast.
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.candidateNotifications), JSON.stringify(notifications));
    } catch {
      /* ignore */
    }
  }, [notifications, isHydrated]);

  const addNotification: NotificationsContextValue["addNotification"] =
    useCallback((n) => {
      const tempId = `notif_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const optimistic: AppNotification = {
        ...n,
        id: tempId,
        createdAt: Date.now(),
        read: false,
      };
      setNotifications((prev) => [optimistic, ...prev]);

      // Persist to the server so candidate notifications survive reloads
      // and sync across devices, then reconcile the temp id → server id.
      void (async () => {
        try {
          const res = await fetch("/api/me/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: n.kind,
              severity: n.severity,
              title: n.title,
              body: n.body,
              ...(n.actionLabel ? { actionLabel: n.actionLabel } : {}),
              ...(n.payload ? { payload: n.payload } : {}),
            }),
          });
          const body = (await res.json().catch(() => null)) as
            | { ok?: boolean; data?: { id?: string } }
            | null;
          if (body?.ok && body.data?.id) {
            const serverId = body.data.id;
            setNotifications((prev) =>
              prev.map((x) => (x.id === tempId ? { ...x, id: serverId } : x)),
            );
          }
        } catch {
          /* swallow — optimistic row remains visible from the paint cache */
        }
      })();

      return tempId;
    }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    void (async () => {
      try {
        await fetch(`/api/me/notifications/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    void (async () => {
      try {
        await fetch(`/api/me/notifications`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markAllRead" }),
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    void (async () => {
      try {
        await fetch(`/api/me/notifications`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clearAll" }),
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const value = useMemo<NotificationsContextValue>(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    const hasImportant = notifications.some(
      (n) => n.severity === "important" && !n.read,
    );
    return {
      notifications,
      unreadCount,
      hasImportant,
      isHydrated,
      status,
      error,
      addNotification,
      dismissNotification,
      markAllRead,
      clearAll,
    };
  }, [
    notifications,
    isHydrated,
    status,
    error,
    addNotification,
    dismissNotification,
    markAllRead,
    clearAll,
  ]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationsProvider",
    );
  return ctx;
}

export function formatTimeAgo(createdAt: number, now = Date.now()): string {
  const diff = Math.max(0, now - createdAt);
  const s = Math.floor(diff / 1000);
  if (s < 30) return "Just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
