"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Compass, Crown, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { PLAN_INFO, PLANS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

/**
 * Pricing (Feature 15). Two tiers; the free tier is deliberately strong
 * (Career Health Score and every dashboard module stay free — Pro sells
 * the three "turn insight into a plan" reports). Upgrading is the MOCK
 * flow: instant, no card, per the research-preview framing.
 */
export default function PricingPage() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/subscription", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setError(json?.error?.message ?? "Upgrade failed — please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Upgrade failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>

        <p className="text-luminous mt-8 flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          <Compass className="size-4" /> Pricing
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          The career OS is free. The playbook is Pro.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Research preview — upgrading is instant and free, no card required.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {PLANS.map((id) => {
            const plan = PLAN_INFO[id];
            const pro = id === "pro";
            return (
              <section
                key={id}
                className={cn(
                  "glass-3 rounded-2xl border p-6",
                  pro ? "border-luminous/50" : "border-border/15",
                )}
              >
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {pro && <Crown className="text-luminous size-4" />}
                    {plan.name}
                  </h2>
                  {pro && <Badge variant="outline">Most insight</Badge>}
                </div>
                <p className="mt-1 text-2xl font-semibold">{plan.priceLabel}</p>
                <p className="text-muted-foreground text-sm">{plan.tagline}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="text-clover mt-0.5 size-4 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {pro ? (
                    done ? (
                      <p className="text-clover text-sm font-medium">
                        You&apos;re on Pro — head back to your dashboard.
                      </p>
                    ) : user ? (
                      <Button onClick={upgrade} disabled={busy} className="w-full">
                        {busy ? "Upgrading…" : "Upgrade to Pro"}
                      </Button>
                    ) : (
                      <Link href="/auth?mode=signup&role=candidate" className="block">
                        <Button className="w-full">Sign up, then upgrade</Button>
                      </Link>
                    )
                  ) : (
                    <Link href="/auth?mode=signup&role=candidate" className="block">
                      <Button variant="outline" className="w-full">
                        Start free
                      </Button>
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {error && <p className="text-destructive mt-4 text-sm">{error}</p>}

        <p className="text-muted-foreground/80 mt-8 text-xs italic">
          Every score stays explainable on both tiers — &quot;Why this
          recommendation?&quot; is never paywalled.
        </p>
      </div>
    </main>
  );
}
