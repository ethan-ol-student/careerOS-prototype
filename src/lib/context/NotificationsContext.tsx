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
import type { ContextStatus } from "@/lib/types/contextStatus";

export type NotificationKind = "skill" | "system" | "job-match";
export type NotificationSeverity = "info" | "important";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body: string;
  /** Optional CTA — e.g. "Reach out" on a job-match alert. */
  actionLabel?: string;
  /** Arbitrary payload passed back to the action handler. */
  payload?: Record<string, unknown>;
  createdAt: number;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  hasImportant: boolean;
  isHydrated: boolean;
  /** Lifecycle status — see `ContextStatus`. */
  status: ContextStatus;
  /** Optional human-readable error message when `status === "error"`. */
  error: string | null;
  /** Add a notification. Returns the generated id. */
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

const STORAGE_KEY = "career-os-candidate-notifications";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  // Initial render (server + first client paint) must match — start
  // empty. We hydrate from localStorage in an effect after mount and
  // gate writes on `isHydrated` so we never overwrite saved data with
  // an empty list.
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Hydrate once on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppNotification[];
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
      setStatus("ready");
    } catch (err) {
      console.warn("Notifications hydration failed:", err);
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Notifications hydration failed",
      );
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist (gated on hydration so we don't clobber storage on first paint).
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (err) {
      console.warn("Notifications save failed:", err);
    }
  }, [notifications, isHydrated]);

  const addNotification: NotificationsContextValue["addNotification"] =
    useCallback((n) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setNotifications((prev) => [
        { ...n, id, createdAt: Date.now(), read: false },
        ...prev,
      ]);
      return id;
    }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
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
    throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}

/** Format a unix-ms timestamp into a short "Just now / Xm ago / Xh ago" string. */
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
