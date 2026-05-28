"use client";

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode,
} from "react";
import type {
  Chapter, ChapterEvent, Priority, Subtask,
} from "@/lib/chapters/data";
import type { ContextStatus } from "@/lib/types/contextStatus";

interface ChaptersContextValue {
  // New event API
  events: ChapterEvent[];
  addEvent: (data: {
    name: string; priority: Priority; date: string; time: string;
    subtasks: { label: string; done?: boolean }[];
  }) => void;
  removeEvent: (id: string) => void;
  toggleSubtask: (eventId: string, subtaskId: string) => void;
  resetEvents: () => void;

  // Legacy compat — stubs so old chapters API still type-checks
  chapters: Chapter[];
  isHydrated: boolean;
  /** Lifecycle status — see `ContextStatus`. */
  status: ContextStatus;
  /** Optional human-readable error message when `status === "error"`. */
  error: string | null;
  addChapter: (c: Omit<Chapter, "id" | "createdAt" | "updatedAt">) => string;
  updateChapter: (id: string, updates: Partial<Omit<Chapter, "id" | "createdAt">>) => void;
  deleteChapter: (id: string) => void;
  resetChapters: () => void;
}

const ChaptersContext = createContext<ChaptersContextValue | undefined>(undefined);
const STORAGE_KEY = "career-os-events";
const newId = (p: string) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function ChaptersProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [status, setStatus] = useState<ContextStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time SSR-safe hydration; initial loading transition is intentional.
    setStatus("loading");
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setEvents(JSON.parse(saved) as ChapterEvent[]);
      }
      setStatus("ready");
    } catch (err) {
      console.warn("Events hydration failed:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Events hydration failed");
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }
    catch (err) { console.warn("Events save failed:", err); }
  }, [events, isHydrated]);

  const addEvent = useCallback<ChaptersContextValue["addEvent"]>((data) => {
    setEvents((prev) => [
      ...prev,
      {
        id: newId("evt"),
        name: data.name.trim().slice(0, 80) || "Untitled",
        priority: data.priority,
        date: data.date,
        time: data.time,
        subtasks: data.subtasks
          .filter((s) => s.label.trim())
          .map((s) => ({ id: newId("sub"), label: s.label.trim(), done: !!s.done })),
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleSubtask = useCallback((eventId: string, subtaskId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id !== eventId ? e :
        { ...e, subtasks: e.subtasks.map((s: Subtask) => s.id === subtaskId ? { ...s, done: !s.done } : s) },
      ),
    );
  }, []);

  const resetEvents = useCallback(() => {
    setEvents([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  // Legacy stubs
  const noopChapter = useCallback(() => "", []);
  const noop = useCallback(() => {}, []);

  const value = useMemo<ChaptersContextValue>(() => ({
    events, addEvent, removeEvent, toggleSubtask, resetEvents,
    chapters: [], isHydrated, status, error,
    addChapter: noopChapter, updateChapter: noop, deleteChapter: noop, resetChapters: resetEvents,
  }), [events, addEvent, removeEvent, toggleSubtask, resetEvents, isHydrated, status, error, noopChapter, noop]);

  return <ChaptersContext.Provider value={value}>{children}</ChaptersContext.Provider>;
}

export function useChapters() {
  const ctx = useContext(ChaptersContext);
  if (!ctx) throw new Error("useChapters must be used inside ChaptersProvider");
  return ctx;
}
