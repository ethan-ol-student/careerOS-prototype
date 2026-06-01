import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared card wrapper for a Settings section. `danger` switches to the
 * destructive "danger zone" treatment used by Delete Account.
 */
export function SettingsSection({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-6",
        danger ? "border-destructive/40 bg-destructive/5" : "glass-3",
      )}
    >
      <h2
        className={cn(
          "text-lg font-semibold tracking-tight",
          danger && "text-destructive",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Labeled field wrapper for settings forms. */
export function SettingsField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="text-muted-foreground/70 text-[11px]">{hint}</span>
      ) : null}
    </label>
  );
}

export const settingsInputClass =
  "glass-3 focus-visible:border-luminous focus-visible:ring-luminous/40 w-full rounded-md border border-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:opacity-60";
