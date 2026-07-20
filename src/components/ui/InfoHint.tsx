"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Density-aware secondary text. Wrap a verbose explanatory line in this
 * and it renders as full prose under Detailed density, but collapses to
 * a compact info icon under Vibrant (`[data-ui-density="vibrant"]` —
 * see globals.css "Density hints"). Pure CSS swap: both variants render,
 * the density attribute picks one.
 *
 * The popover is PORTALED to document.body with position:fixed and a
 * maximal z-index, so no overflow-hidden ancestor, scroll zone, or
 * stacking context can ever clip or cover it.
 */
export function InfoHint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null);

  const open = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    // Flip below the icon when there's no headroom above it.
    const below = r.top < 132;
    setPos({ x: r.left + r.width / 2, y: below ? r.bottom + 6 : r.top - 6, below });
  };
  const close = () => setPos(null);

  // A fixed-position popover goes stale if the page scrolls under it.
  useEffect(() => {
    if (!pos) return;
    const onScroll = () => close();
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [pos]);

  return (
    <span className={className}>
      <span className="dv-hint-full">{children}</span>
      <span className="dv-hint-compact">
        <button
          ref={btnRef}
          type="button"
          aria-label="More info"
          onMouseEnter={open}
          onMouseLeave={close}
          onFocus={open}
          onBlur={close}
          onClick={() => (pos ? close() : open())}
          className={cn(
            "text-muted-foreground hover:text-luminous hover:border-luminous/40",
            "border-border/15 bg-foreground/2 inline-flex size-5 items-center justify-center rounded-full border transition-colors",
          )}
        >
          <Info className="size-3" aria-hidden />
        </button>
        {pos &&
          typeof document !== "undefined" &&
          createPortal(
            <span
              role="tooltip"
              style={{
                position: "fixed",
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%, ${pos.below ? "0" : "-100%"})`,
                zIndex: 2147483647, // always the top layer — nothing may cover a hint
              }}
              className="border-border/20 bg-popover text-muted-foreground pointer-events-none block w-60 rounded-lg border p-2.5 text-left font-sans text-xs font-normal normal-case tracking-normal shadow-xl"
            >
              {children}
            </span>,
            document.body,
          )}
      </span>
    </span>
  );
}
