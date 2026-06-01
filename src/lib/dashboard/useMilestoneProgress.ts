"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CandidateDashboardData,
  MilestoneProgress,
  TransitionMilestone,
} from "./types";

/**
 * ──────────────────────────────────────────────────────────────────
 * LOCAL-ONLY milestone persistence (temporary fallback).
 *
 * There is no milestone/progress table or route in the backend today
 * (see `prisma/schema.prisma` — `CandidateProfile` / `CandidatesAI`
 * have no per-milestone progress fields). So a milestone's checked
 * state is computed two ways:
 *
 *   1. `derive(data)` — read straight from real candidate data
 *      (portfolio + onboarding answers) when the signal exists.
 *   2. explicit user override — when the user ticks/unticks a box,
 *      we store an explicit boolean here, cached in localStorage,
 *      scoped per `userId + phase` so it never leaks across accounts
 *      on a shared device.
 *
 * TODO(backend): when a `MilestoneProgress` model + `GET/PATCH
 * /api/me/milestones` route exist, swap the two functions below for
 * API calls. The hook's public shape (and the `MilestoneProgress`
 * map) is designed to map 1:1 onto such an endpoint, so no consumer
 * changes are needed.
 * ──────────────────────────────────────────────────────────────────
 */

const STORAGE_PREFIX = "career-os-milestones";

function storageKey(userId: string, phase: string): string {
  return `${STORAGE_PREFIX}::${userId}::${phase}`;
}

/** TODO(backend): replace with `GET /api/me/milestones`. */
function loadOverrides(userId: string, phase: string): MilestoneProgress {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(storageKey(userId, phase));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      // Keep only boolean values — defend against stale shapes.
      const out: MilestoneProgress = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "boolean") out[k] = v;
      }
      return out;
    }
  } catch {
    /* ignore malformed cache */
  }
  return {};
}

/** TODO(backend): replace with `PATCH /api/me/milestones`. */
function saveOverrides(
  userId: string,
  phase: string,
  value: MilestoneProgress,
): void {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId, phase), JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export interface MilestoneItem {
  milestone: TransitionMilestone;
  /** Effective checked state shown in the UI. */
  checked: boolean;
  /** Whether real backend/profile data derives this as complete. */
  derived: boolean;
  /** True when the user has explicitly diverged from the derived state. */
  overridden: boolean;
}

export interface MilestoneProgressState {
  items: MilestoneItem[];
  completed: number;
  total: number;
  /** 0–100 completion across the phase's milestones. */
  pct: number;
  /** Flip a milestone's effective checked state (persists the override). */
  toggle: (id: string) => void;
  /** Drop a manual override so the milestone follows derived data again. */
  resetOverride: (id: string) => void;
  /** True once local overrides have hydrated (avoids SSR / first-paint flash). */
  hydrated: boolean;
}

/**
 * Computes interactive milestone state for a phase. Derived completion
 * comes from real data; explicit user toggles are layered on top and
 * cached locally (see the module header for the backend swap plan).
 */
export function useMilestoneProgress(
  userId: string,
  phase: string,
  milestones: TransitionMilestone[],
  data: CandidateDashboardData,
): MilestoneProgressState {
  const [overrides, setOverrides] = useState<MilestoneProgress>({});
  const [hydrated, setHydrated] = useState(false);

  // Hydrate per user+phase. Re-runs if either changes (e.g. phase
  // advances) so we never show another scope's overrides.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time local cache hydration per user+phase.
    setOverrides(loadOverrides(userId, phase));
    setHydrated(true);
  }, [userId, phase]);

  const items = useMemo<MilestoneItem[]>(
    () =>
      milestones.map((m) => {
        const derived = m.derive ? !!m.derive(data) : false;
        const override = overrides[m.id];
        const checked = override === undefined ? derived : override;
        return {
          milestone: m,
          checked,
          derived,
          overridden: override !== undefined && override !== derived,
        };
      }),
    [milestones, data, overrides],
  );

  const toggle = useCallback(
    (id: string) => {
      const milestone = milestones.find((m) => m.id === id);
      const derived = milestone?.derive ? !!milestone.derive(data) : false;
      setOverrides((prev) => {
        const current = prev[id];
        const effective = current === undefined ? derived : current;
        const next: MilestoneProgress = { ...prev, [id]: !effective };
        saveOverrides(userId, phase, next);
        return next;
      });
    },
    [userId, phase, milestones, data],
  );

  const resetOverride = useCallback(
    (id: string) => {
      setOverrides((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        saveOverrides(userId, phase, next);
        return next;
      });
    },
    [userId, phase],
  );

  const completed = items.filter((i) => i.checked).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return { items, completed, total, pct, toggle, resetOverride, hydrated };
}
