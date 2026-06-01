"use client";

import * as React from "react";
import { FlaskConical } from "lucide-react";
import { Grid12 } from "@/components/app/Grid";
import { cn } from "@/lib/utils";
import type { PhaseAccent } from "@/lib/dashboard/types";

/**
 * Shared, reusable building blocks for phase dashboards.
 *
 * Every phase composes its widgets from these primitives so the visual
 * language stays identical to the rest of Career OS (glass-3 cards,
 * luminous/clover accents, muted uppercase eyebrows). Mock/demo widgets
 * mark themselves with `<MockBadge />` so demo data is never mistaken
 * for real backend data.
 */

const ACCENT_TEXT: Record<PhaseAccent, string> = {
  luminous: "text-luminous",
  clover: "text-clover",
};
const ACCENT_BG: Record<PhaseAccent, string> = {
  luminous: "bg-luminous",
  clover: "bg-clover",
};
const ACCENT_SOFT_BG: Record<PhaseAccent, string> = {
  luminous: "bg-luminous/15",
  clover: "bg-clover/15",
};

/** Section wrapper: full-width band + 12-col grid (responsive by default). */
export function PhaseWidgetGrid({
  children,
  className,
  topLine = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Render a top hairline divider (used for stacked sections). */
  topLine?: boolean;
}) {
  return (
    <section
      className={cn("px-4 py-8 sm:py-12", topLine && "line-t", className)}
    >
      <Grid12>{children}</Grid12>
    </section>
  );
}

/** Glass card matching the existing dashboard panels. */
export function DashboardCard({
  className,
  children,
  glow,
  ...rest
}: React.ComponentProps<"div"> & { glow?: PhaseAccent }) {
  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6",
        className,
      )}
      {...rest}
    >
      {glow ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-radial to-transparent",
            glow === "luminous" ? "from-luminous/15" : "from-clover/15",
          )}
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}

/** Card header: eyebrow + title + optional description, hint chip, action. */
export function WidgetHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  hint,
  action,
  accent = "luminous",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  accent?: PhaseAccent;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
              ACCENT_TEXT[accent],
            )}
          >
            {Icon ? <Icon className="size-3.5" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h3>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {hint ? (
        <span className="border-border/60 text-muted-foreground shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
          {hint}
        </span>
      ) : null}
      {action}
    </div>
  );
}

/** Small metric tile (label + value + optional sub-caption). */
export function StatTile({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: PhaseAccent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card/40 border-border/30 rounded-lg border p-3",
        className,
      )}
    >
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-xl",
          accent ? ACCENT_TEXT[accent] : "text-foreground",
        )}
      >
        {value}
      </p>
      {sub ? (
        <p className="text-muted-foreground mt-0.5 text-[11px]">{sub}</p>
      ) : null}
    </div>
  );
}

/** Labeled progress meter (0–100). */
export function MeterRow({
  label,
  value,
  accent = "luminous",
  caption,
  className,
}: {
  label: React.ReactNode;
  value: number;
  accent?: PhaseAccent;
  caption?: React.ReactNode;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-mono">{safe}%</span>
      </div>
      <div className="bg-muted/40 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full transition-all", ACCENT_BG[accent])}
          style={{ width: `${safe}%` }}
        />
      </div>
      {caption ? (
        <p className="text-muted-foreground text-[11px]">{caption}</p>
      ) : null}
    </div>
  );
}

/** Dashed-border hint used for empty states + guidance. */
export function EmptyHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "border-border/50 text-muted-foreground rounded-md border border-dashed px-3 py-4 text-center text-xs",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Badge flagging a widget as demo/mock data. Use it whenever a widget
 * renders fabricated values because no backend signal exists yet — it
 * keeps mock data visibly distinct from real data.
 */
export function MockBadge({
  label = "Demo data",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-yellow-400",
        className,
      )}
      title="Sample data — not yet backed by a live source"
    >
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/** Small icon chip used in card headers. */
export function IconChip({
  icon: Icon,
  accent = "luminous",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent?: PhaseAccent;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl",
        ACCENT_SOFT_BG[accent],
        ACCENT_TEXT[accent],
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
