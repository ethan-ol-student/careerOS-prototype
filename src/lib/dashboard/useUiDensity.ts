"use client";

import { useEffect, useState } from "react";
import { currentScopedKey } from "@/lib/storage/appCache";
import { resolveUiDensity } from "./uiDensity";
import type { CareerPhase, UiDensity } from "./types";

/**
 * Resolved UI density for the dashboard: the user's saved override
 * (fetched from `/api/me/ui-density`, painted cache-first from the
 * user-scoped localStorage cache per the app-wide convention) falling
 * back to the phase default. The server value is the source of truth;
 * the cache only prevents a density flash on repeat visits.
 */
export function useUiDensity(phase: CareerPhase): UiDensity {
  const [override, setOverride] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(currentScopedKey("ui-density")) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/ui-density", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { uiDensity?: string } }
          | null;
        if (cancelled || !body?.ok) return;
        const value = body.data?.uiDensity ?? "";
        setOverride(value);
        try {
          window.localStorage.setItem(currentScopedKey("ui-density"), value);
        } catch {
          /* cache is best-effort */
        }
      } catch {
        /* offline/error — phase default still applies */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return resolveUiDensity(phase, override);
}
