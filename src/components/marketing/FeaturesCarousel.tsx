"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Sparkles,
  Activity,
  BookOpenCheck,
  UserCircle2,
  Eye,
  Compass,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureSlide {
  icon: LucideIcon;
  label: string;
  tint: "brand" | "luminous" | "clover";
}

// Mostly visual — minimal text per slide. The carousel is intended
// to be a 3D-perspective visual tour, not a text-heavy feature list.
const SLIDES: FeatureSlide[] = [
  { icon: UserCircle2,   label: "Living Portfolio",       tint: "brand" },
  { icon: Sparkles,      label: "Skill Evolution",        tint: "luminous" },
  { icon: Activity,      label: "Career Trajectory",      tint: "clover" },
  { icon: Eye,           label: "Employer Visibility",    tint: "brand" },
  { icon: BookOpenCheck, label: "Life Chapter Designer",  tint: "luminous" },
  { icon: Compass,       label: "AI Recommendations",     tint: "clover" },
];

const TINT_CLASSES: Record<
  FeatureSlide["tint"],
  { ring: string; halo: string; chip: string }
> = {
  brand: {
    ring: "ring-brand/30",
    halo: "from-brand/25",
    chip: "bg-brand/15 text-brand",
  },
  luminous: {
    ring: "ring-luminous/30",
    halo: "from-luminous/25",
    chip: "bg-luminous/15 text-luminous",
  },
  clover: {
    ring: "ring-clover/30",
    halo: "from-clover/25",
    chip: "bg-clover/15 text-clover",
  },
};

// Tunables — keep motion subtle and consistent across screen sizes.
const SIDE_TRANSLATE = 62; // % of slide width per step away from center
const SIDE_DEPTH = 220; // px translateZ pull-back per step
const SIDE_ROTATION = 26; // deg rotateY per step (negative = inward)
const SIDE_SCALE = 0.13; // scale fall-off per step
const SIDE_OPACITY = 0.32; // opacity fall-off per step
const MAX_VISIBLE = 3; // slides shown on each side; further ones hide
const DRAG_THRESHOLD = 0.18; // fraction of slide width to advance index
const TRANSITION = "transform 520ms cubic-bezier(.2,.8,.2,1), opacity 280ms ease-out";

export function FeaturesCarousel() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0); // fractional offset while dragging
  const [isDragging, setIsDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [slideWidth, setSlideWidth] = useState(1);

  // Drag state held in refs to avoid re-render churn.
  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const lastXRef = useRef(0);
  const dragRafRef = useRef(0);

  // Detect reduced motion once on mount, and subscribe to changes.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time read of a media query that isn't available during SSR; subscribed below.
    setReduceMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Track stage width so drag distance maps to slide proportion.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const slide = stage.querySelector<HTMLElement>("[data-slide]");
      setSlideWidth(slide?.offsetWidth || stage.offsetWidth || 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback((next: number) => {
    setActive((prev) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      return clamped === prev ? prev : clamped;
    });
  }, []);

  const goPrev = useCallback(() => goTo(active - 1), [goTo, active]);
  const goNext = useCallback(() => goTo(active + 1), [goTo, active]);

  // Keyboard navigation when the carousel is focused.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(SLIDES.length - 1);
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, goTo]);

  // ── Pointer (mouse + touch + pen) drag handling ────────────────
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    // Only primary button on mouse.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    lastXRef.current = e.clientX;
    if (!dragRafRef.current) {
      dragRafRef.current = window.requestAnimationFrame(() => {
        dragRafRef.current = 0;
        const dx = lastXRef.current - startXRef.current;
        // Negative dx = swiping left = next slide.
        setDrag(-dx / Math.max(1, slideWidth));
      });
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = 0;
    }
    const dx = lastXRef.current - startXRef.current;
    const fraction = -dx / Math.max(1, slideWidth);
    setIsDragging(false);
    setDrag(0);
    if (Math.abs(fraction) > DRAG_THRESHOLD) {
      const dir = fraction > 0 ? 1 : -1;
      goTo(active + dir);
    }
  };

  // Combined offset = active index + live drag fraction.
  const livePosition = active + drag;

  return (
    <div
      ref={rootRef}
      data-carousel-3d
      role="region"
      aria-roledescription="carousel"
      aria-label="Career OS features"
      tabIndex={0}
      // Inline `perspective` is critical for the 3D effect — relying on
      // a custom Tailwind @utility was unreliable when the build hadn't
      // re-scanned. Inline style guarantees the 3D context.
      style={{ perspective: "1500px" }}
      className="focus-visible:ring-brand/40 relative outline-none focus-visible:ring-2 focus-visible:rounded-3xl"
    >
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // Inline `transform-style: preserve-3d` is critical — without it
        // child translateZ/rotateY get flattened into 2D.
        style={{ transformStyle: "preserve-3d", perspective: "1500px" }}
        className={cn(
          "relative mx-auto h-[440px] w-full max-w-5xl select-none sm:h-[480px]",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {SLIDES.map((slide, i) => {
          const Icon = slide.icon;
          const tint = TINT_CLASSES[slide.tint];
          const distance = i - livePosition;
          const absDist = Math.abs(distance);
          const sign = Math.sign(distance);
          const tx = sign * Math.min(absDist, MAX_VISIBLE) * SIDE_TRANSLATE;
          const tz = -Math.min(absDist, MAX_VISIBLE) * SIDE_DEPTH;
          const ry = -sign * Math.min(absDist, MAX_VISIBLE) * SIDE_ROTATION;
          const scale = Math.max(0.55, 1 - absDist * SIDE_SCALE);
          const opacity = Math.max(0.05, 1 - absDist * SIDE_OPACITY);
          const hidden = absDist > MAX_VISIBLE;
          const isActive = i === active && !isDragging;

          return (
            <div
              key={slide.label}
              data-slide
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}: ${slide.label}`}
              aria-hidden={hidden}
              onClick={() => !isDragging && goTo(i)}
              className={cn(
                "absolute left-1/2 top-1/2 flex aspect-[4/5] w-[60%] max-w-[360px] flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl p-8 ring-1 sm:aspect-square sm:w-[44%] md:w-[36%]",
                "glass-3",
                tint.ring,
                isActive ? "shadow-2xl" : "shadow-md",
              )}
              style={{
                translate: `calc(-50% + ${tx}%) -50% ${tz}px`,
                rotate: `y ${ry}deg`,
                scale: `${scale}`,
                
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                opacity: hidden ? 0 : opacity,
                pointerEvents: hidden ? "none" : "auto",
                zIndex: 100 - Math.round(absDist * 10),
                transition: isDragging ? "none" : TRANSITION,
                willChange: "transform, opacity",
              }}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-radial to-transparent",
                  tint.halo,
                )}
              />
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-radial to-transparent opacity-60",
                  tint.halo,
                )}
              />

              <div
                className={cn(
                  "flex size-24 items-center justify-center rounded-3xl shadow-inner sm:size-28",
                  tint.chip,
                )}
              >
                <Icon className="size-12 sm:size-14" />
              </div>

              <p className="relative text-center text-lg font-semibold tracking-tight sm:text-xl">
                {slide.label}
              </p>

              <span className="text-muted-foreground absolute bottom-4 right-5 font-mono text-[10px] uppercase tracking-wider">
                {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={active === 0}
            aria-label="Previous feature"
            className="border-border/60 bg-card/40 hover:border-brand/60 hover:text-brand text-muted-foreground flex size-10 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={active === SLIDES.length - 1}
            aria-label="Next feature"
            className="border-border/60 bg-card/40 hover:border-brand/60 hover:text-brand text-muted-foreground flex size-10 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Feature slides"
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Go to ${slide.label}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                active === i
                  ? "bg-brand w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/60 w-4",
              )}
            />
          ))}
        </div>

        <p className="text-muted-foreground font-mono text-xs tabular-nums">
          {String(active + 1).padStart(2, "0")}
          <span className="text-muted-foreground/50"> / </span>
          {String(SLIDES.length).padStart(2, "0")}
        </p>
      </div>

      <p className="text-muted-foreground mt-3 text-center text-[11px]">
        Drag, swipe, or use the arrow keys to navigate.
      </p>
    </div>
  );
}
