"use client";

/**
 * Future Self path choice — the target career picked in the Future Self
 * module (`/candidate/future-self`). Stored under the `career-os-` prefix
 * so the existing account-switch/logout cache purge clears it with the
 * rest of the paint caches. Dashboard + Skill Radar prefer this job as
 * their "vs" comparison when present.
 */

export interface FutureSelfChoice {
  jobId: string;
  title: string;
  field: string;
}

const KEY = "career-os-future-self";

export function getFutureSelf(): FutureSelfChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<FutureSelfChoice>;
    return typeof v.jobId === "string" && typeof v.title === "string"
      ? { jobId: v.jobId, title: v.title, field: v.field ?? "" }
      : null;
  } catch {
    return null;
  }
}

export function setFutureSelf(c: FutureSelfChoice) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable — the choice just doesn't persist */
  }
}
