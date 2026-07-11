"use client";

import { memo } from "react";

const CX = 130;
const CY = 120;
const R = 82;

/**
 * Working-style radar — the four archetype scores as one luminous polygon
 * over a dashed neutral grid. Same hand-rolled SVG language as
 * `SkillRadar` (no chart dep), adapted to the personality result: each
 * spoke is an archetype, the dominant one carries a filled ring vertex.
 * Scores are normalised relative to the strongest archetype so the shape
 * reads regardless of the raw point totals. Descriptive only — never a
 * score input (see personalityEngine.ts).
 */
export const ArchetypeRadar = memo(function ArchetypeRadar({
  order,
  scores,
  labels,
  dominant,
}: {
  order: string[];
  scores: Record<string, number>;
  /** id → short axis label (e.g. "Builder"). */
  labels: Record<string, string>;
  dominant: string;
}) {
  const n = order.length;
  const max = Math.max(1, ...order.map((id) => scores[id] ?? 0));

  const point = (i: number, r: number): [number, number] => {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
  };
  const polygon = (radii: number[]) =>
    radii.map((r, i) => point(i, r).join(",")).join(" ");

  const values = order.map((id) => ((scores[id] ?? 0) / max) * R);

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 260 240"
        role="img"
        aria-label={`Working-style radar across ${order
          .map((id) => labels[id])
          .join(", ")} — strongest is ${labels[dominant]}`}
        className="w-full overflow-visible"
      >
        {/* Recessive grid rings + spokes */}
        {[1 / 3, 2 / 3, 1].map((f) => (
          <polygon
            key={f}
            points={polygon(order.map(() => R * f))}
            className="fill-none stroke-border/60"
            strokeWidth={1}
          />
        ))}
        {order.map((id, i) => {
          const [x, y] = point(i, R);
          return (
            <line
              key={id}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              className="stroke-border/40"
              strokeWidth={1}
            />
          );
        })}

        {/* Outer reference ring (dashed neutral — shape-encoded) */}
        <polygon
          points={polygon(order.map(() => R))}
          className="fill-none stroke-foreground/25"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          strokeLinejoin="round"
        />

        {/* The working-style shape */}
        <g
          className="animate-appear-zoom"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <polygon
            points={polygon(values)}
            className="fill-luminous/20 stroke-luminous"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {order.map((id, i) => {
            const [x, y] = point(i, values[i]);
            const isDominant = id === dominant;
            return (
              <circle
                key={id}
                cx={x}
                cy={y}
                r={isDominant ? 5 : 3.5}
                className={
                  isDominant
                    ? "fill-luminous stroke-background"
                    : "fill-background stroke-luminous"
                }
                strokeWidth={isDominant ? 2 : 1.5}
              >
                <title>{`${labels[id]}: ${scores[id] ?? 0} pts`}</title>
              </circle>
            );
          })}
        </g>

        {/* Axis labels — mono, never series colour */}
        {order.map((id, i) => {
          const [x, y] = point(i, R + 18);
          const anchor =
            Math.abs(x - CX) < 8 ? "middle" : x > CX ? "start" : "end";
          return (
            <text
              key={id}
              x={x}
              y={y + 3}
              textAnchor={anchor}
              className={
                id === dominant
                  ? "fill-luminous-soft font-mono text-[10px] font-semibold uppercase tracking-[0.1em]"
                  : "fill-muted-foreground font-mono text-[10px] uppercase tracking-[0.1em]"
              }
            >
              {labels[id]}
            </text>
          );
        })}
      </svg>
    </figure>
  );
});
