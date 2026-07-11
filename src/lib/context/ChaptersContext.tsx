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
import type {
  ChapterEvent,
  Priority,
  Subtask,
} from "@/lib/chapters/data";
import type { ContextStatus } from "@/lib/types/contextStatus";

interface ChaptersContextValue {
  events: ChapterEvent[];
  addEvent: (data: {
    name: string;
    priority: Priority;
    date: string;
    time: string;
    subtasks: { label: string; done?: boolean }[];
  }) => void;
  removeEvent: (id: string) => void;
  toggleSubtask: (eventId: string, subtaskId: string) => void;
  resetEvents: () => void;
  isHydrated: boolean;
  status: ContextStatus;
  error: string | null;
}

const ChaptersContext = createContext<ChaptersContextValue | undefined>(
  undefined,
);
const newId = (p: string) =>
  `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function ChaptersProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Auth-keyed hydration: re-runs on login/logout so a fresh sign-in
  // gets data without a manual reload (providers mount at the root).
  const { user, status: authStatus } = useAuth();
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!userId || userRole !== "candidate") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auth-keyed reset
      setEvents([]);
      setStatus("idle");
      setError(null);
      setIsHydrated(true);
      return;
    }
     
    setStatus("loading");
    try {
      const cached = localStorage.getItem(currentScopedKey(CACHE_BASE.chapters));
      if (cached) {
        const parsed = JSON.parse(cached) as ChapterEvent[];
        if (Array.isArray(parsed)) setEvents(parsed);
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
        setEvents(result.data.chapters);
        try {
          localStorage.setItem(currentScopedKey(CACHE_BASE.chapters), JSON.stringify(result.data.chapters));
        } catch {
          /* ignore */
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to load chapters.",
        );
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, userId, userRole]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(currentScopedKey(CACHE_BASE.chapters), JSON.stringify(events));
    } catch {
      /* ignore */
    }
  }, [events, isHydrated]);

  const addEvent = useCallback<ChaptersContextValue["addEvent"]>((data) => {
    const tempId = newId("evt");
    const subtasks: Subtask[] = data.subtasks
      .filter((s) => s.label.trim())
      .map((s) => ({
        id: newId("sub"),
        label: s.label.trim(),
        done: !!s.done,
      }));
    const optimistic: ChapterEvent = {
      id: tempId,
      name: data.name.trim().slice(0, 80) || "Untitled",
      priority: data.priority,
      date: data.date,
      time: data.time,
      subtasks,
      createdAt: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, optimistic]);

    void (async () => {
      try {
        const res = await fetch("/api/me/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: optimistic.name,
            priority: optimistic.priority,
            date: optimistic.date,
            time: optimistic.time,
            subtasks,
          }),
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { id: string } }
          | null;
        if (body?.ok && body.data) {
          // Reconcile temp ID with server ID
          setEvents((prev) =>
            prev.map((e) => (e.id === tempId ? { ...e, id: body.data!.id } : e)),
          );
        }
      } catch {
        /* keep optimistic */
      }
    })();
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    void (async () => {
      try {
        await fetch(`/api/me/chapters/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const toggleSubtask = useCallback((eventId: string, subtaskId: string) => {
    let nextSubtasks: Subtask[] | null = null;
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const updated = e.subtasks.map((s: Subtask) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s,
        );
        nextSubtasks = updated;
        return { ...e, subtasks: updated };
      }),
    );
    if (nextSubtasks) {
      void (async () => {
        try {
          await fetch(`/api/me/chapters/${encodeURIComponent(eventId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subtasks: nextSubtasks }),
          });
        } catch {
          /* ignore */
        }
      })();
    }
  }, []);

  const resetEvents = useCallback(() => {
    setEvents([]);
    try {
      localStorage.removeItem(currentScopedKey(CACHE_BASE.chapters));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<ChaptersContextValue>(
    () => ({
      events,
      addEvent,
      removeEvent,
      toggleSubtask,
      resetEvents,
      isHydrated,
      status,
      error,
    }),
    [events, addEvent, removeEvent, toggleSubtask, resetEvents, isHydrated, status, error],
  );

  return (
    <ChaptersContext.Provider value={value}>
      {children}
    </ChaptersContext.Provider>
  );
}

export function useChapters() {
  const ctx = useContext(ChaptersContext);
  if (!ctx) throw new Error("useChapters must be used inside ChaptersProvider");
  return ctx;
}
