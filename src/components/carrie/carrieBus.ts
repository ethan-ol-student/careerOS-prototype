"use client";

/**
 * Carrie's reaction bus — a tiny window-event channel so ANY surface can
 * make the assistant emote without importing the widget (no context, no
 * provider, no coupling). Fire-and-forget: if Carrie isn't mounted the
 * event just dissolves.
 *
 *   emitCarrie("success", "Skill added — evidence raises its weight!")
 */

import type { CarrieEmotion } from "./CarrieAvatar";

export interface CarrieEvent {
  emotion: CarrieEmotion;
  message: string;
}

const EVENT = "career-os:carrie";

export function emitCarrie(emotion: CarrieEmotion, message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CarrieEvent>(EVENT, { detail: { emotion, message } }));
}

export function onCarrie(cb: (e: CarrieEvent) => void): () => void {
  const handler = (ev: Event) => cb((ev as CustomEvent<CarrieEvent>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
