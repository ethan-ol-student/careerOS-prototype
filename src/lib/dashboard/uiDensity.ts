import type { UiDensity } from "./types";

/**
 * UI density resolution. TS source of truth for the
 * `CandidateProfile.uiDensity` String field ("" | "calm" | "vibrant").
 * Binary choice (Settings → Dashboard style): "calm" renders as
 * **Detailed** (complete descriptive text, the default) and "vibrant"
 * as the **compact** visual mode (secondary prose collapses to info
 * hints). "" (never set) resolves to the Detailed default.
 */

function isUiDensity(v: unknown): v is UiDensity {
  return v === "calm" || v === "vibrant";
}

/** The user's saved choice; Detailed ("calm") when unset. */
export function resolveUiDensity(override: string | null | undefined): UiDensity {
  return isUiDensity(override) ? override : "calm";
}
