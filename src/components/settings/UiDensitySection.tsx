"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, BookOpenText, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Choice = "" | "calm" | "vibrant";

const OPTIONS: { value: Choice; label: string; hint: string; icon: typeof Wand2 }[] = [
  {
    value: "",
    label: "Auto",
    hint: "Match my career phase",
    icon: Wand2,
  },
  {
    value: "calm",
    label: "Calm",
    hint: "Editorial — larger text, fewer effects",
    icon: BookOpenText,
  },
  {
    value: "vibrant",
    label: "Vibrant",
    hint: "Visual — glows, streaks, energy",
    icon: Sparkles,
  },
];

/**
 * Age-adaptive UI override (Feature 14). The dashboard adapts to your
 * career phase by default, but the mode is a preference, never a lock —
 * this is the "never locked to age" control. Follows DiscoverySection's
 * optimistic-update + rollback pattern against PATCH /api/me/ui-density.
 */
export function UiDensitySection() {
  const [choice, setChoice] = useState<Choice>("");
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
        if (v === "" || v === "calm" || v === "vibrant") setChoice(v);
      } catch {
        /* defaults to Auto */
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
        setError(body?.error?.message ?? "Couldn't save your preference.");
        return;
      }
      setSaved(true);
    } catch (err) {
      setChoice(prev);
      setError(err instanceof Error ? err.message : "Couldn't save your preference.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Your dashboard adapts to your career phase — calmer and more
        editorial for experienced professionals, more visual for earlier
        phases. It&apos;s a preference, not a rule: pick whichever reads
        best to you.
      </p>

      <div
        role="radiogroup"
        aria-label="Dashboard style"
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
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
