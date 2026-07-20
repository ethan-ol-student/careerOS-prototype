"use client";

import { useEffect, useState } from "react";
import { resolveUiDensity } from "./uiDensity";
import { DENSITY_EVENT, type DensityChoice } from "./uiDensityBus";
import type { UiDensity } from "./types";

/**
 * Resolved UI density: the user's saved choice from `/api/me/ui-density`,
 * falling back to Detailed ("calm"). Also subscribes to the density bus so
 * a change from Settings or Carrie updates this consumer live (no reload).
 */
export function useUiDensity(): UiDensity {
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
        /* offline/error — Detailed default still applies */
      }
    })();
    // Live updates from any setter (Settings / Carrie).
    const onChange = (e: Event) =>
      setOverride((e as CustomEvent<DensityChoice>).detail);
    window.addEventListener(DENSITY_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(DENSITY_EVENT, onChange);
    };
  }, []);

  return resolveUiDensity(override);
}
