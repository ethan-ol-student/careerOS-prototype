"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Chrome's non-standard install-prompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "career-os-install-dismissed";

/**
 * PWA plumbing (Feature 11): registers the minimal service worker and
 * shows a small, dismissible install banner when the browser fires
 * `beforeinstallprompt` (Chrome/Android — the target platform). One
 * mount in the root layout; renders nothing until installable.
 */
export function PwaProvider() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* SW is progressive enhancement — never block the app on it */
        });
      } else {
        // Dev: cache-first /_next/static/* + Turbopack's unhashed dev chunk
        // paths = stale-module errors after every edit. Unregister any
        // previously-installed worker so dev browsers self-heal.
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => void r.unregister()))
          .catch(() => {});
      }
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      try {
        if (window.localStorage.getItem(DISMISS_KEY) === "true") return;
      } catch {
        /* storage unavailable — still offer install */
      }
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!installEvent) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  }

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      /* best-effort */
    }
    setInstallEvent(null);
  }

  return (
    <div
      role="complementary"
      aria-label="Install Career OS"
      className="glass-4 line-t fixed inset-x-3 bottom-3 z-100 mx-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 shadow-lg sm:inset-x-auto sm:left-4"
    >
      <MonitorSmartphone className="text-luminous size-5 shrink-0" />
      <p className="flex-1 text-sm">
        Install Career OS — full-screen, right from your home screen.
      </p>
      <Button size="sm" onClick={install}>
        Install
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="text-muted-foreground hover:text-foreground p-1"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
