"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MatrixSkill {
  name: string;
  /** Importance 1–10 — one vertex of the matrix. */
  weight: number;
}

export const MATRIX_MIN = 3;
export const MATRIX_MAX = 5;

/**
 * Adaptive skill matrix for job posts: one vertex per required skill
 * (min 3 = triangle, max 5 = pentagon), each valued 1–10. The filled
 * shape is a clip-path polygon with a CSS transition, so dragging a
 * slider animates the shape smoothly — no animation dependency.
 * Controlled component; the form owns the state and validation.
 */
export function SkillMatrixInput({
  value,
  onChange,
}: {
  value: MatrixSkill[];
  onChange: (next: MatrixSkill[]) => void;
}) {
  const n = value.length;

  // Percent-space geometry (center 50,50). Same spoke math as SkillRadar.
  const point = (i: number, r: number): [number, number] => {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    return [50 + r * Math.cos(ang), 50 + r * Math.sin(ang)];
  };
  const shape = `polygon(${value
    .map((s, i) =>
      point(i, (Math.max(1, Math.min(10, s.weight)) / 10) * 38)
        .map((v) => `${v}%`)
        .join(" "),
    )
    .join(", ")})`;

  const update = (i: number, patch: Partial<MatrixSkill>) =>
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* ── The matrix visual ── */}
      <div className="relative mx-auto aspect-square w-full max-w-56 select-none">
        {/* Grid rings + spokes (SVG underlay, static per vertex count) */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {[1 / 3, 2 / 3, 1].map((f) => (
            <polygon
              key={f}
              points={value.map((_, i) => point(i, 38 * f).join(",")).join(" ")}
              className="fill-none stroke-border/60"
              strokeWidth={0.5}
            />
          ))}
          {value.map((_, i) => {
            const [x, y] = point(i, 38);
            return (
              <line key={i} x1={50} y1={50} x2={x} y2={y} className="stroke-border/40" strokeWidth={0.5} />
            );
          })}
        </svg>

        {/* Filled shape — clip-path transitions make weight changes animate */}
        <div
          className="bg-clover/30 absolute inset-0 transition-[clip-path] duration-300 ease-out"
          style={{ clipPath: shape }}
          aria-hidden
        />

        {/* Vertex dots + labels */}
        {value.map((s, i) => {
          const [dx, dy] = point(i, (Math.max(1, Math.min(10, s.weight)) / 10) * 38);
          const [lx, ly] = point(i, 47);
          const label = s.name.trim() || `Skill ${i + 1}`;
          return (
            <div key={i} aria-hidden>
              <span
                className="bg-clover absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-out"
                style={{ left: `${dx}%`, top: `${dy}%` }}
              />
              <span
                className={cn(
                  "text-muted-foreground absolute max-w-24 truncate text-[10px] transition-all duration-300",
                  ly < 40 ? "-translate-y-full" : "",
                  lx < 45 ? "-translate-x-full" : lx > 55 ? "" : "-translate-x-1/2",
                )}
                style={{ left: `${lx}%`, top: `${ly}%` }}
              >
                {label.length > 14 ? `${label.slice(0, 13)}…` : label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Vertex editors ── */}
      <div className="flex flex-col gap-2.5">
        {value.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder={`Skill ${i + 1}`}
              aria-label={`Skill ${i + 1} name`}
              maxLength={40}
              className="bg-foreground/2 border-border/15 focus:border-clover min-h-9 w-32 rounded-lg border px-2.5 py-1.5 text-sm outline-none"
            />
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={s.weight}
              onChange={(e) => update(i, { weight: Number(e.target.value) })}
              aria-label={`${s.name.trim() || `Skill ${i + 1}`} importance, 1 to 10`}
              className="accent-clover min-w-0 flex-1"
            />
            <span className="text-clover w-6 shrink-0 text-right text-sm font-semibold tabular-nums">
              {s.weight}
            </span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              disabled={n <= MATRIX_MIN}
              aria-label={`Remove ${s.name.trim() || `skill ${i + 1}`}`}
              className="text-muted-foreground hover:text-destructive disabled:opacity-30 rounded-lg p-1 transition-colors disabled:pointer-events-none"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        {n < MATRIX_MAX && (
          <button
            type="button"
            onClick={() => onChange([...value, { name: "", weight: 5 }])}
            className="border-border/20 text-muted-foreground hover:border-clover/60 hover:text-clover inline-flex min-h-9 w-fit items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Plus className="size-3.5" />
            Add skill ({n}/{MATRIX_MAX})
          </button>
        )}
        <p className="text-muted-foreground text-[11px]">
          {MATRIX_MIN}–{MATRIX_MAX} skills — the shape adapts: 3 = triangle,
          4 = square, 5 = pentagon.
        </p>
      </div>
    </div>
  );
}
