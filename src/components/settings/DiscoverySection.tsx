"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { InfoHint } from "@/components/ui/InfoHint";
import { cn } from "@/lib/utils";

/**
 * Marketplace discovery opt-in (principle #4 — "candidates need to be
 * findable at the right moment, for the right reason").
 *
 * Toggling this flips `CandidateProfile.discoverable` via
 * `PATCH /api/me/discovery`, which projects the candidate into (or
 * hides them from) the employer marketplace. Discovery is OFF by
 * default — being found is the candidate's explicit choice, never the
 * system's.
 */
export function DiscoverySection() {
  const [discoverable, setDiscoverable] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/discovery", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { discoverable?: boolean } }
          | null;
        if (cancelled) return;
        if (body?.ok && body.data) setDiscoverable(!!body.data.discoverable);
      } catch {
        /* ignore — defaults to off */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async () => {
    const next = !discoverable;
    setSaving(true);
    setSaved(false);
    setError(null);
    // Optimistic flip.
    setDiscoverable(next);
    try {
      const res = await fetch("/api/me/discovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverable: next }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: { discoverable?: boolean }; error?: { message?: string } }
        | null;
      if (!res.ok || body?.ok === false) {
        setDiscoverable(!next); // roll back
        setError(body?.error?.message ?? "Couldn't update discovery.");
        return;
      }
      if (body?.data) setDiscoverable(!!body.data.discoverable);
      setSaved(true);
    } catch (err) {
      setDiscoverable(!next); // roll back
      setError(err instanceof Error ? err.message : "Couldn't update discovery.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <InfoHint className="text-muted-foreground block text-sm">
        When discovery is on, your Living Portfolio is projected into the
        employer marketplace so the right employers can find and message you.
        It&apos;s off by default — you decide when you&apos;re visible, and you
        can turn it off anytime.
      </InfoHint>

      <div className="border-border/15 bg-card/40 flex items-center justify-between gap-4 rounded-xl border p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              discoverable
                ? "bg-clover/15 text-clover-soft"
                : "bg-muted/40 text-muted-foreground",
            )}
          >
            {discoverable ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {discoverable ? "Discoverable by employers" : "Hidden from employers"}
            </p>
            <p className="text-muted-foreground text-xs">
              {discoverable
                ? "You appear in the marketplace and can receive messages."
                : "You won't appear in employer searches."}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={discoverable}
          aria-label="Toggle marketplace discovery"
          disabled={!loaded || saving}
          onClick={() => void toggle()}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clover/40 disabled:opacity-50",
            discoverable ? "bg-clover" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "inline-block size-5 transform rounded-full bg-white transition-transform",
              discoverable ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      <div className="flex min-h-5 items-center gap-3 text-xs">
        {saving ? (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="size-3.5 animate-spin" /> Saving…
          </span>
        ) : saved ? (
          <span className="text-clover inline-flex items-center gap-1">
            <CheckCircle2 className="size-3.5" /> Saved
          </span>
        ) : null}
        {error ? (
          <span role="alert" className="text-destructive">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
