"use client";

import { useEffect, useState } from "react";

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function JudgeTourHighlight({ target }: { target?: string }) {
  const [rect, setRect] = useState<HighlightRect | null>(null);

  useEffect(() => {
    if (!target) {
      return;
    }

    let frame = 0;
    const update = (shouldScroll = false) => {
      const element = document.querySelector(target) as HTMLElement | null;
      if (!element) {
        setRect(null);
        return;
      }
      if (shouldScroll) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const box = element.getBoundingClientRect();
      const pad = 8;
      setRect({
        top: Math.max(8, box.top - pad),
        left: Math.max(8, box.left - pad),
        width: Math.min(window.innerWidth - 16, box.width + pad * 2),
        height: Math.min(window.innerHeight - 16, box.height + pad * 2),
      });
    };

    const updateWithoutScroll = () => update(false);
    frame = window.requestAnimationFrame(() => update(true));
    window.addEventListener("resize", updateWithoutScroll);
    window.addEventListener("scroll", updateWithoutScroll, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateWithoutScroll);
      window.removeEventListener("scroll", updateWithoutScroll, true);
    };
  }, [target]);

  if (!rect) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[60] rounded-2xl border-2 border-luminous shadow-[0_0_0_9999px_rgba(0,0,0,0.46),0_0_36px_rgba(77,122,255,0.6)] transition-all duration-200"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
