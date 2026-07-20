"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, BookOpenText } from "lucide-react";
import { InfoHint } from "@/components/ui/InfoHint";
import { broadcastDensity } from "@/lib/dashboard/uiDensityBus";
import { cn } from "@/lib/utils";

type Choice = "calm" | "vibrant";

const OPTIONS: { value: Choice; label: string; hint: string; icon: typeof Sparkles }[] = [
  {
    value: "calm",
    label: "Detailed",
    hint: "Complete descriptions on every page",
    icon: BookOpenText,
  },
  {
    value: "vibrant",
    label: "Vibrant",
    hint: "Compact — key info first, details behind ⓘ",
    icon: Sparkles,
  },
];

/**
 * Dashboard style: a binary Detailed | Vibrant choice ("calm" stays the
 * stored value for Detailed — no data migration). Follows
 * DiscoverySection's optimistic-update + rollback pattern against
 * PATCH /api/me/ui-density.
 */
export function UiDensitySection() {
  const [choice, setChoice] = useState<Choice>("calm");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/ui-density", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { uiDensity?: string } }
          | null;
        if (cancelled || !body?.ok) return;
        const v = body.data?.uiDensity ?? "";
        // "" (never chosen) reads as the Detailed default.
        if (v === "calm" || v === "vibrant") setChoice(v);
      } catch {
        /* defaults to Detailed */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function pick(next: Choice) {
    if (next === choice || saving) return;
    const prev = choice;
    setChoice(next); // optimistic
    broadcastDensity(next); // live-update the whole app immediately
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/me/ui-density", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uiDensity: next }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;
      if (!res.ok || body?.ok === false) {
        setChoice(prev); // roll back
        broadcastDensity(prev);
        setError(body?.error?.message ?? "Couldn't save your preference.");
        return;
      }
      setSaved(true);
    } catch (err) {
      setChoice(prev);
      broadcastDensity(prev);
      setError(err instanceof Error ? err.message : "Couldn't save your preference.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <InfoHint className="text-muted-foreground block text-sm">
        <span className="font-medium">Detailed</span> spells everything out
        in full sentences. <span className="font-medium">Vibrant</span>{" "}
        compresses the layout — secondary explanations tuck behind small
        info icons so key numbers lead.
      </InfoHint>

      <div
        role="radiogroup"
        aria-label="Dashboard style"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      >
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={choice === o.value}
            disabled={saving}
            onClick={() => pick(o.value)}
            className={cn(
              "min-h-11 rounded-xl border p-3 text-left transition-colors",
              choice === o.value
                ? "border-luminous/60 bg-luminous/10"
                : "border-border/15 bg-card/40 hover:border-luminous/40",
            )}
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <o.icon className="text-luminous size-4" aria-hidden />
              {o.label}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">{o.hint}</p>
          </button>
        ))}
      </div>

      {saved && (
        <p className="text-clover inline-flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="size-3.5" />
          Saved — your dashboard updates next time it loads.
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
