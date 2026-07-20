"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  LayoutDashboard,
  Briefcase,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { isTestModeEnabled } from "@/lib/dev/testMode";
import { cn } from "@/lib/utils";


type Account = "judge" | "mid-career";
type Role = "candidate" | "employer";

/**
 * Guided judge demo hub. One click per action; each demo-login lands the
 * judge in a pre-filled view. Role switch (candidate ↔ employer) is one click.
 * Layout: a single dark card, back-link top-left, centered badge + question,
 * a 4-column grid of pill actions. Hovering (or focusing) a pill reveals its
 * explanation in a fit pill anchored below — space is pre-reserved so the
 * grid never reflows, only fades/lifts in with an ease-in-out curve.
 */
export function JudgeHub() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function demoLogin(account: Account, role: Role, to: string, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/dev/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, role }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Demo login failed.");
      // Hydrate AuthContext with the new session BEFORE navigating, so the
      // client shells (AppShell/EmployerAppShell) see the judge user instead
      // of bouncing to /auth. (The tour is server-gated and worked without
      // this; the dashboard/marketplace are client-gated and didn't.)
      await refresh();
      router.push(to);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo login failed.");
      setBusy(null);
    }
  }

  async function safeReset() {
    if (!window.confirm("Reset the demo/test account's data to a clean state? Real users are never affected.")) return;
    setBusy("reset");
    setError(null);
    try {
      const res = await fetch("/api/dev/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message ?? "Reset failed.");
      window.alert("Demo/test account data reset.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setBusy(null);
    }
  }

  // Strict per-mode color coding: judge tour = red, candidate = blue
  // (luminous), employer = green (clover), Career Health = neutral/white.
  const steps = [
    {
      key: "tour",
      icon: PlayCircle,
      label: "Tour mode",
      body: "Sign in as the pre-filled judge candidate and walk the guided product tour.",
      action: () => demoLogin("judge", "candidate", "/judge/tour", "tour"),
      ring: "border-destructive/50 hover:border-destructive focus-visible:border-destructive",
      tone: "text-destructive",
    },
    {
      key: "candidate",
      icon: LayoutDashboard,
      label: "Candidate",
      body: "Open the phase-based dashboard with a seeded portfolio and life chapters.",
      action: () => demoLogin("judge", "candidate", "/candidate/dashboard", "candidate"),
      ring: "border-luminous/50 hover:border-luminous focus-visible:border-luminous",
      tone: "text-luminous",
    },
    {
      key: "employer",
      icon: Briefcase,
      label: "Employer",
      body: "Same account, employer mode — marketplace, saved talent, and messages.",
      action: () => demoLogin("judge", "employer", "/employers/dashboard", "employer"),
      ring: "border-clover/50 hover:border-clover focus-visible:border-clover",
      tone: "text-clover",
    },
    // {
    //   key: "midcareer",
    //   icon: Activity,
    //   label: "Career Health",
    //   body: "A 35+ staff engineer with rich history — the fully-populated Career Health suite.",
    //   action: () => demoLogin("mid-career", "candidate", "/candidate/career-health", "midcareer"),
    //   ring: "border-foreground/40 hover:border-foreground focus-visible:border-foreground",
    //   tone: "text-foreground",
    // },
  ];

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-4 py-10">
      <div className="border-luminous/35 from-luminous/50 to-luminous/2 relative w-full max-w-6xl overflow-hidden rounded-3xl border p-6 sm:p-10">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <div className="mt-10 flex flex-col items-center gap-4 text-center sm:mt-14">
          <Badge variant="outline">
            <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.18em]">
              Judge demo
            </span>
          </Badge>
          <h1 className="max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            How would you like to explore Career OS?
          </h1>
        </div>

        {error && (
          <p className="border-destructive/40 bg-destructive/10 text-destructive mx-auto mt-6 max-w-md rounded-lg border px-4 py-3 text-center text-sm">
            {error}
          </p>
        )}

        {/* 3-column pill grid — each cell reserves fixed space below the
            button for its description, so hovering never shifts layout. */}
        <div className="flex justify-center w-full">  
          <div className="mt-12 grid grid-cols-3 gap-x-1 gap-y-4 sm:mt-16 sm:grid-cols-3 sm:gap-x-1">
            {steps.map((s) => (
              <div key={s.key} className="group flex flex-col items-center w-60">
                <button
                  type="button"
                  onClick={s.action}
                  disabled={busy !== null}
                  className={cn(
                    "border-border/25 bg-foreground/3 flex w-40 h-25 flex-col items-center gap-2 rounded-3xl border-2 px-3 py-6 sm:px-4",
                    "transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-foreground/6",
                    "disabled:pointer-events-none disabled:opacity-50",
                    s.ring,
                  )}
                >
                  <s.icon
                    className={cn(
                      "size-7 transition-transform duration-300 ease-in-out group-hover:scale-110",
                      s.tone,
                    )}
                    aria-hidden
                  />
                  <span className="text-center text-xs font-bold uppercase tracking-wide sm:text-sm">
                    {busy === s.key ? "Opening…" : s.label}
                  </span>
                </button>

                {/* Reserved space (never reflows) for the hover/focus reveal. */}
                <div className="mt-3 flex min-h-16 w-full items-start justify-center">
                  <p
                    className={cn(
                      "border-border/15 bg-background/80 text-muted-foreground w-fit max-w-44 text-pretty rounded-full border px-3.5 py-2 text-center text-[0.6875rem] leading-snug shadow-lg backdrop-blur",
                      "translate-y-1 opacity-0 transition-all duration-300 ease-in-out",
                      "group-hover:translate-y-0 group-hover:opacity-100",
                      "group-focus-within:translate-y-0 group-focus-within:opacity-100",
                    )}
                  >
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reset uses the full dev harness (/api/dev/reset), which stays
            test-mode-only — hidden when only the judge-demo flag is on. */}
        {isTestModeEnabled() && (
          <div className="line-t mt-4 flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-muted-foreground text-sm">Made a mess? Put the demo data back.</p>
            <Button variant="outline" onClick={safeReset} disabled={busy !== null}>
              <RotateCcw />
              {busy === "reset" ? "Resetting…" : "Reset demo data"}
            </Button>
          </div>
        )}

        <p className="text-muted-foreground mt-8 text-center text-xs">
          Every button signs you into a pre-filled demo account. No setup,
          nothing real is touched.
        </p>
      </div>
    </main>
  );
}
