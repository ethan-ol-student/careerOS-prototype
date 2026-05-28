"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ParallaxProps {
  /**
   * Vertical drift magnitude. Roughly = pixels of total travel as the
   * element moves from the bottom edge of the viewport to the top.
   * Positive = element drifts UP slower than scroll (classic parallax).
   * Negative = element drifts opposite. Keep values 20–80 for subtle,
   * professional motion.
   */
  speed?: number;
  /** Optional horizontal drift, same units. Default 0. */
  speedX?: number;
  className?: string;
  /** Extra class applied to the inner moving layer. */
  innerClassName?: string;
  children: ReactNode;
}

/**
 * Lightweight scroll-driven parallax wrapper.
 *
 * Design notes:
 *   - Always-on scroll listener with rAF throttling. We dropped the
 *     IntersectionObserver gate that previously made the first paint
 *     silent — for ~5 wrappers on a marketing page, the overhead of
 *     reading getBoundingClientRect on each scroll event is trivial.
 *   - GPU-only output: translate3d. No layout writes from React.
 *   - Respects prefers-reduced-motion — becomes a no-op div.
 *   - Sets the initial transform once on mount based on the current
 *     scroll position, so a user landing mid-page still sees the
 *     parallax offset applied (no "jump" on first scroll).
 */
export function Parallax({
  speed = 40,
  speedX = 0,
  className,
  innerClassName,
  children,
}: ParallaxProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    // OS-level reduced-motion preference — no listener, no work.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let rafId = 0;

    const update = () => {
      rafId = 0;
      const rect = outer.getBoundingClientRect();
      const viewportH = window.innerHeight || 1;
      // Progress: 0 = element centre exactly at viewport centre.
      // Range roughly -1 (element below viewport) to 1 (element above).
      const elementCentre = rect.top + rect.height / 2;
      const progress = (elementCentre - viewportH / 2) / viewportH;
      // `speed` controls travel in pixels per unit of progress.
      // Multiply by -1 so positive speed drifts UP as you scroll DOWN.
      const ty = -progress * speed;
      const tx = -progress * speedX;
      // inner.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      inner.style.translate = `${tx.toFixed(2)}px ${ty.toFixed(2)}px`;
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    // window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Prime the transform immediately so the element doesn't pop on
    // first scroll. Run after layout settles via a microtask + rAF.
    Promise.resolve().then(() => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [speed, speedX]);

  return (
    <div
      ref={outerRef}
      data-parallax
      className={cn("relative", className)}
    >
      <div
        ref={innerRef}
        className={innerClassName}
        style={{
          // transform: "translate3d(0,0,0)",
          translate: "0px 0px",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
