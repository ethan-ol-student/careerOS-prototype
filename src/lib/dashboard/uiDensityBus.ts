"use client";

import type { UiDensity } from "./types";

/**
 * Live channel for the UI-density choice so a change from ANY surface
 * (Settings, Carrie's Actions menu) updates every consumer instantly —
 * not just on the next mount. `useUiDensity` subscribes; setters
 * broadcast + persist. Mirrors the performance-mode custom-event pattern.
 */

export const DENSITY_EVENT = "career-os:ui-density";
export type DensityChoice = "" | UiDensity;

/** Update every live consumer this tick (no reload). */
export function broadcastDensity(v: DensityChoice) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DensityChoice>(DENSITY_EVENT, { detail: v }));
}

/** Persist the choice server-side (the durable source of truth). */
export async function persistDensity(v: DensityChoice): Promise<boolean> {
  try {
    const res = await fetch("/api/me/ui-density", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uiDensity: v }),
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return !!body?.ok;
  } catch {
    return false;
  }
}

/** Broadcast now (instant), then persist. */
export async function setDensity(v: DensityChoice): Promise<boolean> {
  broadcastDensity(v);
  return persistDensity(v);
}
