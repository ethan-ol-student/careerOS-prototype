"use client";

import { usePerformanceMode } from "@/lib/hooks/usePerformanceMode";

/**
 * Applies the device-level performance preference (Settings → Motion &
 * performance) as `html.reduce-motion` on every page load. Renders
 * nothing — globals.css does the actual motion-stopping.
 */
export function MotionProvider() {
  usePerformanceMode();
  return null;
}
