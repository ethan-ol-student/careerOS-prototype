"use client";

import { memo } from "react";
import {
  TIER_LABEL,
  type RadarAxis,
} from "@/lib/intelligence/skillTruthEngine";
import { ScoreBar } from "@/components/ui/ScoreBar";

const CX = 170;
const CY = 150;
const R = 100;
const SIDES = 5; // pentagon

/** Spoke as rendered — carries a stable React key so blank padding spokes
 *  (added only to complete the pentagon) don't collide on an empty label. */
type Spoke = RadarAxis & { key: string; filler: boolean };

/**
 * Trust-weighted skill radar: the candidate's validated strength (luminous
 * polygon) against the role requirement (dashed neutral ring). One colored
 * series + a shape-encoded reference — legible without color vision, no
 * chart dependency. Always drawn as a 5-spoke PENTAGON: real role/extra
 * skills first, topped up with blank spokes so the frame is consistent.
 * Memoized: `axes` is referentially stable (useMemo upstream), so parent
 * re-renders (e.g. role-search keystrokes) skip the chart entirely.
 */
export const SkillRadar = memo(function SkillRadar({
  axes,
}: {
  axes: RadarAxis[];
}) {
  // Nothing to draw → fall back to bars (the page handles the true empty state).
  if (axes.length === 0) {
    return (
      <div className="space-y-3">
        {axes.map((a) => (
          <ScoreBar key={a.skill} label={a.skill} value={a.you} size="sm" />
        ))}
      </div>
    );
  }

  // Exactly 5 spokes: real skills first, blank fillers to complete the pentagon.
  const spokes: Spoke[] = axes
    .slice(0, SIDES)
    .map((a, i) => ({ ...a, key: `${i}-${a.skill}`, filler: false }));
  while (spokes.length < SIDES) {
    const i = spokes.length;
    spokes.push({
      key: `filler-${i}`,
      skill: "",
      you: 0,
      required: 0,
      tier: null,
      filler: true,
    });
  }

  const n = SIDES;
  const point = (i: number, r: number): [number, number] => {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    return [CX + r * Math.cos(ang), CY + r * Math.sin(ang)];
  };
  const polygon = (radii: number[]) =>
    radii.map((r, i) => point(i, r).join(",")).join(" ");

  const skillNames = spokes.filter((s) => !s.filler).map((s) => s.skill);

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 340 300"
        role="img"
        aria-label={`Skill radar: validated strength vs role requirement across ${skillNames.join(
          ", ",
        )}`}
        className="w-full overflow-visible"
      >
        {/* Recessive grid: rings + spokes */}
        {[1 / 3, 2 / 3, 1].map((f) => (
          <polygon
            key={f}
            points={polygon(spokes.map(() => R * f))}
            className="fill-none stroke-border/60"
            strokeWidth={1}
          />
        ))}
        {spokes.map((a, i) => {
          const [x, y] = point(i, R);
          return (
            <line
              key={a.key}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              className="stroke-border/40"
              strokeWidth={1}
            />
          );
        })}

        {/* Data layers animate in together; keyed so switching the target
            role re-triggers the draw-in. transform-box makes the CSS scale
            originate from the group's own centre inside the SVG. */}
        <g
          key={spokes.map((a) => a.key).join("|")}
          className="animate-appear-zoom"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          {/* Bottom layer: what the role requires — the reference draws the
              target as a dashed neutral ring (shape-encoded, not color) */}
          <polygon
            points={polygon(spokes.map((a) => (a.required / 100) * R))}
            className="fill-none stroke-foreground/30"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeLinejoin="round"
          />

          {/* Top layer: your trust-weighted validated strength */}
          <polygon
            points={polygon(spokes.map((a) => (a.you / 100) * R))}
            className="fill-luminous/20 stroke-luminous"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Vertices with native tooltips (≥8px visual, larger hit area).
              Filler spokes carry no data → no vertex/tooltip. */}
          {spokes.map((a, i) => {
            if (a.filler) return null;
            const [x, y] = point(i, (a.you / 100) * R);
            return (
              <g key={a.key}>
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  className={
                    a.tier ? "fill-luminous" : "fill-background stroke-luminous"
                  }
                  strokeWidth={1.5}
                />
                <circle cx={x} cy={y} r={12} className="fill-transparent">
                  <title>
                    {`${a.skill} — ${a.you}/100 (${a.tier ? TIER_LABEL[a.tier] : "not claimed"})${
                      a.you < a.required
                        ? `, short by ${a.required - a.you} points`
                        : ""
                    }`}
                  </title>
                </circle>
              </g>
            );
          })}
        </g>

        {/* Axis labels in text tokens, never series color */}
        {spokes.map((a, i) => {
          if (a.filler) return null;
          const [x, y] = point(i, R + 16);
          const anchor =
            Math.abs(x - CX) < 8 ? "middle" : x > CX ? "start" : "end";
          return (
            <text
              key={a.key}
              x={x}
              y={y + 3}
              textAnchor={anchor}
              className="fill-muted-foreground text-[10px]"
            >
              {/* Ellipsize long axis names; the vertex tooltip has the full name. */}
              {a.skill.length > 16 ? `${a.skill.slice(0, 15)}…` : a.skill}
              <title>{a.skill}</title>
            </text>
          );
        })}
      </svg>

      <figcaption className="text-muted-foreground mt-1 flex items-center justify-center gap-4 text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-luminous/30 border-luminous inline-block h-2.5 w-2.5 rounded-[3px] border" />
          Validated you
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="18" height="6" aria-hidden>
            <line
              x1="0"
              y1="3"
              x2="18"
              y2="3"
              className="stroke-foreground/40"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          </svg>
          Role requires
        </span>
      </figcaption>
    </figure>
  );
});
