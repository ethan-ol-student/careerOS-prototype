"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Performance mode (Settings → Motion & performance): a DEVICE-level
 * preference persisted in localStorage (like the PWA install-dismiss
 * key — deliberately not per-account: it's about this machine's GPU).
 *
 * The hook's only side-effect is toggling `reduce-motion` on <html>;
 * all actual motion-stopping lives in globals.css, so components stay
 * animation-agnostic and a future animation library swap (e.g. Framer
 * Motion) only needs to honor the same class. A custom window event
 * keeps every hook instance (Settings toggle, MotionProvider) in sync;
 * the `storage` listener syncs across tabs.
 */

const KEY = "career-os-performance-mode";
const EVENT = "career-os-performance-mode-change";

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function usePerformanceMode(): [boolean, (on: boolean) => void] {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from device storage post-mount (SSR renders the default)
    setEnabledState(read());
    const sync = () => setEnabledState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", enabled);
  }, [enabled]);

  const setEnabled = useCallback((on: boolean) => {
    try {
      window.localStorage.setItem(KEY, String(on));
    } catch {
      /* storage unavailable — the event still updates this session */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [enabled, setEnabled];
}
