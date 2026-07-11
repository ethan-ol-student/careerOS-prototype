"use client";

import { useEffect, useState } from "react";
import { resolveUiDensity } from "./uiDensity";
import type { CareerPhase, UiDensity } from "./types";

/**
 * Resolved UI density: the user's saved override (from
 * `/api/me/ui-density`) falling back to the phase default.
 * ponytail: fetch-only — the phase default paints instantly, so the
 * only "flash" hits users whose override differs from their default.
 */
export function useUiDensity(phase: CareerPhase): UiDensity {
  const [override, setOverride] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/ui-density", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { uiDensity?: string } }
          | null;
        if (!cancelled && body?.ok) setOverride(body.data?.uiDensity ?? "");
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
