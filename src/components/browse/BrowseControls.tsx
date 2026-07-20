"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared controls for the candidate "browse" pages (roles + employers):
 * a streamlined filter ecosystem — quick-toggle pills, collapsible
 * advanced fields, and the trust-signal pill used on every card. Keeping
 * them here keeps both browse surfaces visually identical.
 */

export function QuickToggle({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        active
          ? "border-luminous/40 bg-luminous/12 text-luminous-soft"
          : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {children}
    </button>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground px-0.5 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function MicroLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground/70 font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
      {children}
    </p>
  );
}

/** A card trust badge — the caller supplies the tone via className. */
export function SignalPill({
  icon: Icon,
  className,
  children,
}: {
  icon: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {children}
    </span>
  );
}
