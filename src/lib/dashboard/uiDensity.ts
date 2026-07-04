import type { CareerPhase, UiDensity } from "./types";
import { PHASE_CONFIG } from "./phaseConfig";

/**
 * Age-adaptive UI density resolution (Feature 14). TS source of truth
 * for the `CandidateProfile.uiDensity` String field ("" | "calm" |
 * "vibrant"). Mirrors `cadenceForPhase()` in gamification.service.ts:
 * a pure phase→mode function, with the user's Settings override always
 * winning — the experience adapts to age but is never locked to it.
 */

export const UI_DENSITIES = ["calm", "vibrant"] as const;

export function isUiDensity(v: unknown): v is UiDensity {
  return v === "calm" || v === "vibrant";
}

/** Settings override first; otherwise the phase's default. */
export function resolveUiDensity(
  phase: CareerPhase,
  override: string | null | undefined,
): UiDensity {
  if (isUiDensity(override)) return override;
  return PHASE_CONFIG[phase].density;
}
