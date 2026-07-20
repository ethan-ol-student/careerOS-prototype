"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, MapPin, Route } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Grid12, Col } from "@/components/app/Grid";
import { Chip } from "@/components/ui/Chip";
import { InfoHint } from "@/components/ui/InfoHint";
import { useCandidateDashboard } from "@/lib/dashboard/useCandidateDashboard";
import { getPhaseConfig } from "@/lib/dashboard/phaseConfig";
import type { CareerPhase } from "@/lib/dashboard/types";

/** The six phases in order — the "map" the traveller moves along. */
const PHASE_ORDER: CareerPhase[] = [
  "student",
  "young_adult",
  "early_career",
  "mid_career",
  "senior_career",
  "executive",
];

export default function CareerPathPage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Career Path Navigation"
        title={
          <>
            Your journey, <span className="text-luminous">mapped</span>
          </>
        }
      />
      <section className="max-w-container mx-auto px-4 py-8 sm:py-10">
        <PathContent />
      </section>
    </AppShell>
  );
}

function PathContent() {
  const { status, data } = useCandidateDashboard();

  if (status === "loading" || !data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" /> Loading your path…
      </div>
    );
  }

  const phase = data.phase;
  const cfg = getPhaseConfig(phase);
  const idx = PHASE_ORDER.indexOf(phase);
  // Current + up to two upcoming phases become landmarks on the map.
  const upcoming = PHASE_ORDER.slice(idx + 1, idx + 3).map(getPhaseConfig);

  return (
    <Grid12 className="gap-4">
      <Col span={12} lg={8}>
        <div className="glass-3 overflow-hidden rounded-2xl p-2">
          <p className="text-luminous px-3 pb-2 pt-2 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
            Phase: {cfg.label}
          </p>
          <PerspectiveMap
            currentLabel={cfg.label}
            upcomingLabels={upcoming.map((c) => c.label)}
          />
        </div>
      </Col>

      <Col span={12} lg={4}>
        <div className="glass-3 flex h-full flex-col rounded-2xl p-6">
          <p className="border-luminous/30 bg-luminous/10 text-luminous-soft inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em]">
            <Route className="size-3" aria-hidden />
            Details on the current track
          </p>
          <h2 className="mt-3 text-lg font-semibold tracking-tight">{cfg.label}</h2>
          <InfoHint className="text-muted-foreground mt-1.5 block text-sm leading-relaxed">
            {cfg.purpose}
          </InfoHint>

          {upcoming.length > 0 && (
            <div className="mt-5">
              <p className="text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-wider">
                What&apos;s up ahead
              </p>
              <ul className="mt-2 space-y-2">
                {upcoming.map((c) => (
                  <li
                    key={c.phase}
                    className="border-border/15 bg-foreground/2 flex items-start gap-2 rounded-lg border p-3"
                  >
                    <MapPin className="text-muted-foreground mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>
                      <span className="text-sm font-medium">{c.label}</span>
                      <InfoHint className="text-muted-foreground block text-xs leading-snug">
                        {c.purpose}
                      </InfoHint>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-border/15 mt-auto border-t pt-4">
            <Chip tone="neutral">Preview</Chip>
            <p className="text-muted-foreground mt-2 text-xs">
              <InfoHint>
                Full turn-by-turn navigation — milestones, unlocks, and the moves
                between phases — is on the roadmap.
              </InfoHint>{" "}
              Plan your next steps in the{" "}
              <Link href="/candidate/chapters" className="text-luminous hover:underline">
                Life Chapter Designer
              </Link>
              .
            </p>
          </div>
        </div>
      </Col>
    </Grid12>
  );
}

/**
 * The "matrix grid landscape" map: a low-poly folded-paper terrain (canvas,
 * adapted from the Folded Map Terrain effect — recoloured luminous-on-navy to
 * fit the candidate theme) forms the BACKGROUND, with the dashed journey path
 * and the "You are here" landmark pins drawn as an SVG overlay on top.
 * Decorative — no data beyond the labels.
 */
function PerspectiveMap({
  currentLabel,
  upcomingLabels,
}: {
  currentLabel: string;
  upcomingLabels: string[];
}) {
  const W = 800;
  const H = 460;

  // Landmark stops along the path (near → far = present → future).
  const stops = [
    { x: 150, y: 380, label: currentLabel, current: true },
    ...upcomingLabels.map((label, i) => ({
      x: i === 0 ? 470 : 650,
      y: i === 0 ? 300 : 235,
      label,
      current: false,
    })),
  ];
  const pathD = [
    `M 60 440`,
    `C 160 400 120 340 ${stops[0].x} ${stops[0].y}`,
    ...stops.slice(1).map((s, i) => {
      const prev = stops[i];
      return `S ${(prev.x + s.x) / 2} ${s.y + 40} ${s.x} ${s.y}`;
    }),
    `S 760 200 780 190`,
  ].join(" ");

  return (
    <div className="relative aspect-800/460 w-full overflow-hidden rounded-xl">
      {/* 3D terrain background */}
      <PathTerrain />

      {/* Path + landmark overlay (aligned to the same 800×460 space) */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="pointer-events-none absolute inset-0 size-full"
        role="img"
        aria-label={`Career path map — currently ${currentLabel}`}
      >
        {/* Dark backing under the path so it reads over bright ridges */}
        <path
          d={pathD}
          stroke="rgba(10,13,22,0.8)"
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={pathD}
          className="stroke-luminous"
          strokeWidth={3}
          strokeDasharray="9 9"
          strokeLinecap="round"
          fill="none"
        />

        {/* Landmark pins — labels carry a dark halo (paint-order) for legibility */}
        {stops.map((s, i) => (
          <g key={i} transform={`translate(${s.x} ${s.y})`}>
            {s.current && (
              <circle r="16" className="fill-clover/25 stroke-clover" strokeWidth={2}>
                <animate attributeName="r" values="14;18;14" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              r="7"
              className={s.current ? "fill-clover stroke-background" : "fill-foreground/70 stroke-background"}
              strokeWidth={2}
            />
            <text
              y={s.current ? 34 : -14}
              textAnchor="middle"
              stroke="#0a0d16"
              strokeWidth={3.5}
              style={{ paintOrder: "stroke" }}
              className={
                s.current
                  ? "fill-foreground text-[0.8125rem] font-semibold"
                  : "fill-foreground/80 text-[0.6875rem]"
              }
            >
              {s.current ? `You are here — ${s.label}` : s.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Low-poly folded-paper terrain (canvas). 14×14 sine-hill quad grid in an
 * isometric-ish projection with face-normal sun lighting; palette recoloured
 * from the source green to navy valleys → luminous ridges. DPR-aware, pauses
 * when the tab is hidden, and renders a single static frame under
 * `prefers-reduced-motion` or the app's `html.reduce-motion` toggle.
 */
function PathTerrain() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("reduce-motion");

    const G = 14; // grid resolution
    const sun = { x: -0.5, y: -0.62, z: 0.6 };
    {
      const m = Math.hypot(sun.x, sun.y, sun.z);
      sun.x /= m;
      sun.y /= m;
      sun.z /= m;
    }

    let W = 0,
      H = 0,
      cx = 0,
      cy = 0,
      scale = 1,
      raf = 0,
      t = 0;

    function size() {
      const DPR = Math.min(devicePixelRatio || 1, 2);
      W = cv!.clientWidth;
      H = cv!.clientHeight;
      cv!.width = Math.max(1, Math.round(W * DPR));
      cv!.height = Math.max(1, Math.round(H * DPR));
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2;
      cy = H / 2;
      scale = Math.min(W, H) / 440;
    }

    function project(gx: number, gy: number, h: number): [number, number] {
      const cell = 72 * scale;
      const ox = (gx - (G - 1) / 2) * cell;
      const oy = (gy - (G - 1) / 2) * cell;
      const px = ox + oy * 0.5; // shear for depth
      const py = oy * 0.46 - h * 52 * scale; // foreshorten + lift by height
      return [cx + px, cy + py * 0.92 + 18 * scale];
    }
    function height(gx: number, gy: number, tt: number): number {
      const a = Math.sin(gx * 0.85 + tt * 0.9) * Math.cos(gy * 0.7 - tt * 0.6);
      const b = Math.sin((gx + gy) * 0.55 - tt * 1.1) * 0.6;
      return (a * 0.6 + b) * 0.62;
    }

    function frame() {
      t += reduce ? 0 : 0.01;
      ctx!.fillStyle = "#0a0d16";
      ctx!.fillRect(0, 0, W, H);

      const hs: number[][] = [];
      const pj: [number, number][][] = [];
      for (let y = 0; y < G; y++) {
        hs[y] = [];
        pj[y] = [];
        for (let x = 0; x < G; x++) {
          const h = height(x, y, t);
          hs[y][x] = h;
          pj[y][x] = project(x, y, h);
        }
      }

      const cell = 72 * scale,
        span = 52 * scale;
      for (let y = 0; y < G - 1; y++) {
        for (let x = 0; x < G - 1; x++) {
          const p0 = pj[y][x],
            p1 = pj[y][x + 1],
            p2 = pj[y + 1][x + 1],
            p3 = pj[y + 1][x];
          // face normal from the height gradient
          const dzx = (hs[y][x + 1] - hs[y][x]) * span;
          const dzy = (hs[y + 1][x] - hs[y][x]) * span;
          let nx = -dzx,
            ny = -dzy,
            nz = cell;
          const nl = Math.hypot(nx, ny, nz);
          nx /= nl;
          ny /= nl;
          nz /= nl;
          const lum = Math.max(0, nx * sun.x + ny * sun.y + nz * sun.z);
          const ah = (hs[y][x] + 0.4) / 1.6; // altitude tint 0..1
          const shade = 0.2 + lum * 0.95;
          // navy valley → luminous ridge
          const r = Math.round((16 + ah * 72) * shade);
          const g = Math.round((22 + ah * 100) * shade);
          const b = Math.round((46 + ah * 205) * shade);
          ctx!.beginPath();
          ctx!.moveTo(p0[0], p0[1]);
          ctx!.lineTo(p1[0], p1[1]);
          ctx!.lineTo(p2[0], p2[1]);
          ctx!.lineTo(p3[0], p3[1]);
          ctx!.closePath();
          ctx!.fillStyle = `rgb(${r},${g},${b})`;
          ctx!.fill();
          // luminous fold seams, brighter on lit faces
          ctx!.strokeStyle = `rgba(77,122,255,${(0.05 + lum * 0.22).toFixed(3)})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    size();
    const onResize = () => {
      size();
      if (reduce) frame(); // repaint the static frame at the new size
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!reduce && !raf) {
        raf = requestAnimationFrame(frame);
      }
    };
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    if (reduce) frame();
    else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 size-full" />;
}
