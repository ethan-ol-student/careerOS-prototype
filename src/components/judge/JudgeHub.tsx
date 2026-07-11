"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  LayoutDashboard,
  Briefcase,
  Activity,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { isTestModeEnabled } from "@/lib/dev/testMode";
import { cn } from "@/lib/utils";

type Account = "judge" | "mid-career";
type Role = "candidate" | "employer";

/**
 * Guided judge demo hub. One click per action; each demo-login lands the
 * judge in a pre-filled view. Role switch (candidate ↔ employer) is one click.
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
      title: "Start the guided tour",
      body: "Sign in as the pre-filled judge candidate and walk the product tour.",
      action: () => demoLogin("judge", "candidate", "/judge/tour", "tour"),
      label: "Start tour",
      mode: "Judge demo",
      card: "border-destructive/40",
      accent: "bg-destructive/15 text-destructive",
      text: "text-destructive",
    },
    {
      key: "candidate",
      icon: LayoutDashboard,
      title: "Open the candidate dashboard",
      body: "See the phase-based dashboard with seeded portfolio + chapters.",
      action: () => demoLogin("judge", "candidate", "/candidate/dashboard", "candidate"),
      label: "Candidate view",
      mode: "Candidate mode",
      card: "border-luminous/40",
      accent: "bg-luminous/15 text-luminous-soft",
      text: "text-luminous",
    },
    {
      key: "employer",
      icon: Briefcase,
      title: "Switch to the employer view",
      body: "Same account, employer mode — marketplace, saved talent, messages.",
      action: () => demoLogin("judge", "employer", "/employers/dashboard", "employer"),
      label: "Employer view",
      mode: "Employer mode",
      card: "border-clover/40",
      accent: "bg-clover/15 text-clover-soft",
      text: "text-clover",
    },
    {
      key: "midcareer",
      icon: Activity,
      title: "Mid-career Career Health",
      body: "A 35+ staff engineer with rich history — the fully-populated Career Health dashboard.",
      action: () => demoLogin("mid-career", "candidate", "/candidate/career-health", "midcareer"),
      label: "Open Career Health",
      mode: "Career Health",
      card: "border-foreground/30",
      accent: "bg-foreground/10 text-foreground",
      text: "text-foreground",
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" /> Back to home
      </Link>

      <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
        Judge demo
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Explore Career OS in a few clicks</h1>
      <p className="text-muted-foreground mt-2">
        Every button signs you into a pre-filled demo account. No setup, nothing real is touched.
      </p>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive mt-6 rounded-lg border px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <ol className="mt-8 space-y-4">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={cn(
              "glass-3 flex items-center gap-4 rounded-2xl border p-5",
              s.card,
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg font-semibold",
                s.accent,
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <s.icon className={cn("size-4 shrink-0", s.text)} />
                {s.title}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider",
                    s.accent,
                  )}
                >
                  {s.mode}
                </span>
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">{s.body}</p>
            </div>
            <Button onClick={s.action} disabled={busy !== null} className="shrink-0">
              {busy === s.key ? "Opening…" : s.label}
            </Button>
          </li>
        ))}
      </ol>

      {/* Reset uses the full dev harness (/api/dev/reset), which stays
          test-mode-only — hidden when only the judge-demo flag is on. */}
      {isTestModeEnabled() && (
        <div className="line-t mt-8 flex items-center justify-between pt-6">
          <p className="text-muted-foreground text-sm">Made a mess? Put the demo data back.</p>
          <Button variant="outline" onClick={safeReset} disabled={busy !== null}>
            <RotateCcw />
            {busy === "reset" ? "Resetting…" : "Reset demo data"}
          </Button>
        </div>
      )}
    </main>
  );
}
