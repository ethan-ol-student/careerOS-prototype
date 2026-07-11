"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small "How we score" affordance shown next to candidate match /
 * readiness scores. Clicking the icon opens a short popover that
 * explains the prototype scoring is computed from mock demo
 * signals — not from any opaque algorithm.
 *
 * The component is intentionally light-weight (no portal, no focus
 * trap) because it's an inline informational opener used inside
 * compact card layouts. When real backend scoring lands, replace
 * the body text with the real factor list and link to a longer
 * methodology page.
 */
export function ScoringInfo({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="How we score"
        onClick={() => setIsOpen((v) => !v)}
        className="text-muted-foreground hover:text-luminous focus-visible:ring-luminous/40 inline-flex size-5 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2"
      >
        <Info className="size-3.5" aria-hidden />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="How we score"
          className="bg-popover text-popover-foreground border-border/20 absolute right-0 top-full z-50 mt-1 w-72 origin-top-right rounded-xl border p-4 shadow-xl"
        >
          <p className="text-luminous text-[10px] font-mono font-semibold uppercase tracking-[0.18em]">
            How we score
          </p>
          <p className="text-foreground/90 mt-1.5 text-sm font-medium">
            Match & Readiness are prototype signals.
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
            In this preview, each score is composed from mock demo
            signals on the candidate&apos;s profile —{" "}
            <span className="text-foreground/80">skills coverage</span>,{" "}
            <span className="text-foreground/80">readiness signals</span>,{" "}
            <span className="text-foreground/80">portfolio evidence</span>{" "}
            and a <span className="text-foreground/80">growth trend</span>.
            Once real data lands, scoring will be computed server-side
            and the inputs surfaced explicitly here.
          </p>
        </div>
      ) : null}
    </div>
  );
}
