"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

/**
 * Idle session guard. After IDLE_LIMIT of no activity, a signed-in user is
 * logged out (server session ended + caches cleared via `logout()`) and told
 * why. The shells already bounce a null user to /auth; this banner is the
 * "here's what happened" so the logout isn't silent/confusing.
 *
 * Timers only run while signed in. Rendered once under AuthProvider.
 */
const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"] as const;

export function SessionTimeout() {
  const { user, logout } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIdle = useCallback(async () => {
    setTimedOut(true);
    await logout();
  }, [logout]);

  useEffect(() => {
    if (!user) return; // no timers while logged out
    // Clear any stale banner on (re)login so a later manual logout doesn't show it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimedOut(false);

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(handleIdle, IDLE_LIMIT_MS);
    };
    reset();
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, reset, { passive: true }),
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user, handleIdle]);

  if (!timedOut) return null;

  return (
    <div
      role="alert"
      className="glass-4 line-t fixed inset-x-3 bottom-3 z-100 mx-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 shadow-lg sm:inset-x-auto sm:right-4"
    >
      <Clock className="text-luminous size-5 shrink-0" />
      <p className="flex-1 text-sm">
        You were signed out after 30 minutes of inactivity.
      </p>
      <Link
        href="/auth?reason=timeout"
        onClick={() => setTimedOut(false)}
        className="text-luminous shrink-0 text-sm font-semibold hover:underline"
      >
        Sign in
      </Link>
    </div>
  );
}
