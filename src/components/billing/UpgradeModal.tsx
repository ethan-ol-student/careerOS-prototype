"use client";

import { useState } from "react";
import { Crown, Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PLAN_INFO } from "@/lib/billing/plans";

/**
 * Freemium upgrade modal (Feature 15) — thin wrapper over the shared
 * Modal. "Upgrade" hits the MOCK subscription endpoint (no payment
 * processor — real checkout is post-deploy scope); `onUpgraded` lets the
 * caller refetch whatever the gate was hiding.
 */
export function UpgradeModal({
  isOpen,
  onClose,
  onUpgraded,
  feature,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUpgraded: () => void;
  /** The gated feature that opened this modal (for context copy). */
  feature?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pro = PLAN_INFO.pro;

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
      onUpgraded();
      onClose();
    } catch {
      setError("Upgrade failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade to Career OS Pro"
      description={
        feature
          ? `${feature} is part of Pro.`
          : "Turn insight into a concrete plan."
      }
      size="md"
      footer={
        <div className="border-border/15 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Not now
          </Button>
          <Button onClick={upgrade} disabled={busy}>
            <Crown />
            {busy ? "Upgrading…" : `Upgrade — ${pro.priceLabel}`}
          </Button>
        </div>
      }
    >
      <p className="text-muted-foreground text-sm">{pro.tagline}</p>
      <ul className="mt-4 space-y-2">
        {pro.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="text-clover mt-0.5 size-4 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground/80 mt-4 text-[0.6875rem] italic">
        Research preview: upgrading is free and instant — no card required.
      </p>
      {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
    </Modal>
  );
}
