import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOOP_NODES } from "@/components/dashboard/GrowthLoop";
import type { LoopStep } from "@/components/dashboard/GrowthLoop";

interface PageHeaderProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Path for the "Back" link rendered above the title. */
  backHref?: string;
  backLabel?: string;
  /** Right-aligned actions (buttons, toggles). */
  actions?: React.ReactNode;
  /**
   * When provided + isRunning, surfaces a "Cascading · step X of 8"
   * badge inline so users can feel the hidden loop progressing.
   */
  loopStatus?: {
    isRunning: boolean;
    step: LoopStep;
  };
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
  loopStatus,
  className,
}: PageHeaderProps) {
  const showStatus = !!(loopStatus?.isRunning && loopStatus.step !== "idle");
  const stepIdx = showStatus
    ? LOOP_NODES.findIndex((n) => n.step === loopStatus!.step) + 1
    : 0;

  return (
    <section
      className={cn(
        "line-b relative overflow-hidden px-4 pt-10 pb-12 sm:pt-14",
        className,
      )}
    >
      {/* soft Luminous glow */}
      <div
        aria-hidden
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
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {eyebrow && (
                <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
                  {eyebrow}
                </p>
              )}
              {showStatus && (
                <span
                  role="status"
                  aria-live="polite"
                  className="border-luminous/40 bg-luminous/10 text-luminous inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
                >
                  <Loader2 className="size-3 animate-spin" />
                  Cascading · step {stepIdx} of 8
                </span>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
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

      {/* Slim sliver running the full width — appears only while the loop runs */}
      {showStatus && (
        <div
          aria-hidden
          className="bg-muted/30 absolute inset-x-0 bottom-0 h-0.5 overflow-hidden"
        >
          <div
            className="from-luminous to-clover h-full bg-linear-to-r transition-all duration-700"
            style={{ width: `${(stepIdx / 8) * 100}%` }}
          />
        </div>
      )}
    </section>
  );
}
