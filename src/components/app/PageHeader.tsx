import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Path for the "Back" link rendered above the title. */
  backHref?: string;
  backLabel?: string;
  /** Right-aligned actions (buttons, toggles). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Re-used as the top of every internal page so they share the
 * launch-ui hero language — eyebrow tag, gradient title, soft
 * Luminous glow underneath, line-b divider at the bottom.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "line-b relative overflow-hidden px-4 pt-10 pb-12 sm:pt-14",
        className,
      )}
    >
      {/* soft Luminous glow (decorative — hidden in calm density) */}
      <div
        aria-hidden
        data-glow
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-radial from-luminous/15 from-0% via-luminous/5 via-40% to-transparent to-70% opacity-90"
      />

      <div className="max-w-container mx-auto grid grid-cols-12 gap-4 sm:gap-6">
        {backHref && (
          <div className="col-span-12 mb-2">
            <Link
              href={backHref}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              {backLabel}
            </Link>
          </div>
        )}
        <div className="col-span-12 flex flex-wrap items-end justify-between gap-4 md:col-span-9">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-luminous mb-2 text-xs font-mono font-semibold uppercase tracking-[0.18em]">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-3 max-w-2xl text-base sm:text-lg">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="col-span-12 flex flex-wrap items-center gap-2 md:col-span-3 md:justify-end">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
}
