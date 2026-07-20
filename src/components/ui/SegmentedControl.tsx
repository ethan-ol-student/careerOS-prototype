"use client";

import type { ElementType } from "react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
  icon?: ElementType;
}

/**
 * Segmented pill toggle — the tab-like control used for page-level view
 * switches (Edit/Preview, Analysis/Actions, University/Company).
 */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
}: {
  value: T;
  onChange: (id: T) => void;
  options: readonly SegmentedOption<T>[];
  "aria-label": string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "border-border/15 bg-foreground/2 flex rounded-full border p-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "inline-flex min-h-8 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition-colors",
            value === o.id
              ? "bg-luminous/15 text-luminous-soft"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon && <o.icon className="size-3.5" aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
