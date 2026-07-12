"use client";

import { memo } from "react";

const CX = 150;
const CY = 140;
const R = 92;

/**
 * Job-Style Compass — the candidate's archetype work-style vector (luminous)
 * overlaid on the typical role in their field (clover, dashed). Same hand-rolled
 * SVG idiom as SkillRadar/ArchetypeRadar (no chart dep), 8 axes. Descriptive
 * context only — see jobStyleFitEngine's Bias Check.
 */
export const JobStyleCompass = memo(function JobStyleCompass({
  axes,
}: {
  axes: { style: string; you: number; role: number }[];
}) {
  const n = axes.length;
  const point = (i: number, r: number): [number, number] => {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
  };
  const poly = (vals: number[]) =>
    vals.map((v, i) => point(i, (Math.max(0, Math.min(100, v)) / 100) * R).join(",")).join(" ");
  const short = (s: string) =>
    s
      .replace("Orientation", "")
      .replace("Intellectual ", "")
      .replace("Attention to ", "")
      .trim();

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 300 270"
        role="img"
        aria-label={`Working-style compass: you vs the typical role across ${axes
          .map((a) => a.style)
          .join(", ")}`}
        className="w-full overflow-visible"
      >
        {[1 / 3, 2 / 3, 1].map((f) => (
          <polygon
            key={f}
            points={poly(axes.map(() => 100 * f))}
            className="fill-none stroke-border/60"
            strokeWidth={1}
          />
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, R);
          return (
            <line
              key={a.style}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              className="stroke-border/40"
              strokeWidth={1}
            />
          );
        })}

        {/* Typical role — clover dashed (shape-encoded reference) */}
        <polygon
          points={poly(axes.map((a) => a.role))}
          className="fill-clover/10 stroke-clover"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          strokeLinejoin="round"
        />
        {/* You — luminous */}
        <polygon
          points={poly(axes.map((a) => a.you))}
          className="fill-luminous/20 stroke-luminous"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {axes.map((a, i) => {
          const [x, y] = point(i, R + 16);
          const anchor =
            Math.abs(x - CX) < 8 ? "middle" : x > CX ? "start" : "end";
          return (
            <text
              key={a.style}
              x={x}
              y={y + 3}
              textAnchor={anchor}
              className="fill-muted-foreground font-mono text-[9px] uppercase tracking-[0.06em]"
            >
              {short(a.style)}
            </text>
          );
        })}
      </svg>
      <figcaption className="text-muted-foreground mt-1 flex items-center justify-center gap-4 text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-luminous/30 border-luminous inline-block h-2.5 w-2.5 rounded-[3px] border" />
          You
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden>
            <line
              x1="0"
              y1="3"
              x2="18"
              y2="3"
              className="stroke-clover"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          </svg>
          Typical role
        </span>
      </figcaption>
    </figure>
  );
});
