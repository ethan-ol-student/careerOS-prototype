"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, GraduationCap, X } from "lucide-react";
import { emitCarrie } from "@/components/carrie/carrieBus";
import { cn } from "@/lib/utils";

/**
 * Discovery Radar — a gamified "topographic skill horizon" for the student
 * phase. The map is a field of FIXED, generatively-placed skill landmarks
 * (clustered by area) under a fog of war. The revealed region is an ORGANIC
 * union of soft blobs around every learned landmark — an ink-blot, not a
 * circle. Landmarks inside the revealed horizon light up as discoverable
 * nodes; pressing one opens its detail, and "Learn" opens the fog around it,
 * surfacing neighbouring skills that were hidden before.
 *
 * Pure canvas + rAF, DPR-aware, honors reduce-motion. Colors are literal —
 * canvas can't read Tailwind tokens (aligned to luminous/clover/orange).
 */

interface Cluster {
  cat: string;
  cx: number; // normalized 0..1
  cy: number;
  skills: { name: string; desc: string }[];
}

// Generative source: skill areas placed around the map; each landmark is
// scattered near its cluster so learning one surfaces related skills.
const CLUSTERS: Cluster[] = [
  {
    cat: "Communication",
    cx: 0.5,
    cy: 0.48,
    skills: [
      { name: "Public Speaking", desc: "Hold a room and share ideas with confidence." },
      { name: "Clear Writing", desc: "Turn thoughts into words people actually read." },
      { name: "Languages", desc: "Open doors by speaking someone else's language." },
    ],
  },
  {
    cat: "Technology",
    cx: 0.76,
    cy: 0.26,
    skills: [
      { name: "Web Basics", desc: "Build a simple page — HTML, CSS, a little logic." },
      { name: "Coding Foundations", desc: "Think in steps and make a computer follow them." },
      { name: "Data & Sheets", desc: "Organise, sort, and reason about information." },
    ],
  },
  {
    cat: "Creative",
    cx: 0.26,
    cy: 0.24,
    skills: [
      { name: "Visual Design", desc: "Make things look clear, balanced, and intentional." },
      { name: "Storytelling", desc: "Shape a beginning, middle, and end that lands." },
      { name: "Video Editing", desc: "Cut raw clips into something people want to watch." },
    ],
  },
  {
    cat: "People",
    cx: 0.19,
    cy: 0.58,
    skills: [
      { name: "Teamwork", desc: "Pull in the same direction and lift the group." },
      { name: "Empathy", desc: "Read the room and understand what others need." },
    ],
  },
  {
    cat: "Business",
    cx: 0.8,
    cy: 0.62,
    skills: [
      { name: "Entrepreneurship", desc: "Spot a need and turn it into something real." },
      { name: "Marketing", desc: "Help the right people find what you've made." },
    ],
  },
  {
    cat: "Analytical",
    cx: 0.52,
    cy: 0.8,
    skills: [
      { name: "Problem Solving", desc: "Break a big, messy problem into solvable parts." },
      { name: "Research", desc: "Find, judge, and use good information." },
    ],
  },
  {
    cat: "Hands-on",
    cx: 0.28,
    cy: 0.82,
    skills: [
      { name: "Electronics", desc: "Wire up circuits and make hardware do things." },
      { name: "Making & Crafts", desc: "Build with your hands — prototype, fix, create." },
    ],
  },
];

const CAT_COLOR: Record<string, string> = {
  Communication: "#7b9dff",
  Technology: "#5d82e8",
  Creative: "#c084fc",
  People: "#4cbb55",
  Business: "#ffb454",
  Analytical: "#38bdf8",
  "Hands-on": "#ff8a3d",
};

interface Landmark {
  id: string;
  cat: string;
  name: string;
  desc: string;
  nx: number; // normalized position (persists across resize)
  ny: number;
}

interface Geom {
  w: number;
  h: number;
  R: number;
  dpr: number;
  levels: Path2D[];
  cover: HTMLCanvasElement;
  bright: HTMLCanvasElement;
}

const dist2 = (ax: number, ay: number, bx: number, by: number) =>
  (ax - bx) ** 2 + (ay - by) ** 2;

export function DiscoveryRadar() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const marks = useRef<Landmark[]>([]);
  const grow = useRef<Record<string, number>>({}); // learned id → 0..1 reveal
  const geom = useRef<Geom | null>(null);
  const raf = useRef<number | null>(null);
  const size = useRef({ w: 0, h: 0 });

  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Landmark | null>(null);
  const [totalMarks, setTotalMarks] = useState(0);

  const reduced = () =>
    typeof window !== "undefined" &&
    (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("reduce-motion"));

  const px = (m: Landmark, g: Geom) => [m.nx * g.w, m.ny * g.h] as const;
  const revealR = (g: Geom) => g.R * 0.5;

  /** Max coverage at a point from all learned reveal blobs (0..1). */
  const coverageAt = useCallback((x: number, y: number, g: Geom) => {
    let cov = 0;
    for (const m of marks.current) {
      const gr = grow.current[m.id];
      if (!gr) continue;
      const [mx, my] = px(m, g);
      const Rc = revealR(g) * gr;
      const d = Math.sqrt(dist2(x, y, mx, my));
      const a = d <= 0.7 * Rc ? 1 : d >= Rc ? 0 : 1 - (d - 0.7 * Rc) / (0.3 * Rc);
      if (a > cov) cov = a;
    }
    return cov;
  }, []);

  const isDiscoverable = useCallback(
    (m: Landmark, g: Geom) => {
      if (grow.current[m.id]) return false; // already learned
      const [mx, my] = px(m, g);
      return coverageAt(mx, my, g) > 0.12;
    },
    [coverageAt],
  );

  const draw = useCallback(() => {
    const g = geom.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (!g || !ctx) return;
    const { w, h, dpr, levels, cover, bright } = g;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 1 — Fog: faint contours across the whole field.
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(120,140,180,0.07)";
    for (const lv of levels) ctx.stroke(lv);

    // 2 — Coverage (union of soft reveal blobs) → cover canvas.
    const cctx = cover.getContext("2d")!;
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cctx.clearRect(0, 0, w, h);
    for (const m of marks.current) {
      const gr = grow.current[m.id];
      if (!gr) continue;
      const [mx, my] = px(m, g);
      const Rc = revealR(g) * gr;
      const grad = cctx.createRadialGradient(mx, my, Rc * 0.4, mx, my, Rc);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.7, "rgba(255,255,255,1)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      cctx.fillStyle = grad;
      cctx.beginPath();
      cctx.arc(mx, my, Rc, 0, Math.PI * 2);
      cctx.fill();
    }

    // 3 — Revealed layer: tint + bright contours, then clip to coverage.
    const bctx = bright.getContext("2d")!;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.clearRect(0, 0, w, h);
    bctx.fillStyle = "rgba(77,122,255,0.08)";
    bctx.fillRect(0, 0, w, h);
    bctx.lineWidth = 1.2;
    bctx.strokeStyle = "rgba(125,157,255,0.5)";
    for (const lv of levels) bctx.stroke(lv);
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.globalCompositeOperation = "destination-in";
    bctx.drawImage(cover, 0, 0);
    bctx.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bright, 0, 0);
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 4 — Adjacency hints: dashed lines from learned to discoverable neighbours.
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(125,157,255,0.28)";
    for (const l of marks.current) {
      if (!grow.current[l.id]) continue;
      const [lx, ly] = px(l, g);
      for (const m of marks.current) {
        if (!isDiscoverable(m, g)) continue;
        const [mx, my] = px(m, g);
        if (dist2(lx, ly, mx, my) < (revealR(g) * 1.05) ** 2) {
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // 5 — Landmarks. Learned = solid peak; discoverable = ringed node.
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    for (const m of marks.current) {
      const [x, y] = px(m, g);
      const isLearned = !!grow.current[m.id];
      const disc = !isLearned && isDiscoverable(m, g);
      if (!isLearned && !disc) continue; // hidden in the fog
      const color = CAT_COLOR[m.cat] ?? "#7b9dff";

      if (isLearned) {
        // peak marker
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x + 6, y + 5);
        ctx.lineTo(x - 6, y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // discoverable ring + pulse dot
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // label with dark halo
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(8,11,18,0.9)";
      ctx.fillStyle = isLearned ? "rgba(230,235,245,0.95)" : color;
      const ly = y + 18;
      ctx.strokeText(m.name, x, ly);
      ctx.fillText(m.name, x, ly);
      ctx.restore();
    }
  }, [isDiscoverable]);

  /** Marching-squares contours over a smooth multi-hill field. */
  const buildLevels = useCallback((w: number, h: number): Path2D[] => {
    const cell = 12;
    const cols = Math.ceil(w / cell) + 1;
    const rows = Math.ceil(h / cell) + 1;
    const R = Math.min(w, h) / 2;
    const hills = Array.from({ length: 6 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      a: 0.6 + Math.random() * 0.9,
      s: R * (0.35 + Math.random() * 0.5),
    }));
    const field = (x: number, y: number) =>
      hills.reduce(
        (s, H) => s + H.a * Math.exp(-((x - H.x) ** 2 + (y - H.y) ** 2) / (2 * H.s * H.s)),
        0,
      );
    const g = new Float32Array(cols * rows);
    let min = Infinity;
    let max = -Infinity;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const v = field(i * cell, j * cell);
        g[j * cols + i] = v;
        if (v < min) min = v;
        if (v > max) max = v;
      }
    const levels: Path2D[] = [];
    const N = 15;
    for (let l = 1; l < N; l++) {
      const t = min + ((max - min) * l) / N;
      const path = new Path2D();
      for (let j = 0; j < rows - 1; j++)
        for (let i = 0; i < cols - 1; i++) {
          const x = i * cell;
          const y = j * cell;
          const a = g[j * cols + i];
          const b = g[j * cols + i + 1];
          const c = g[(j + 1) * cols + i + 1];
          const d = g[(j + 1) * cols + i];
          let idx = 0;
          if (a > t) idx |= 8;
          if (b > t) idx |= 4;
          if (c > t) idx |= 2;
          if (d > t) idx |= 1;
          if (idx === 0 || idx === 15) continue;
          const top = (): [number, number] => [x + (cell * (t - a)) / (b - a), y];
          const right = (): [number, number] => [x + cell, y + (cell * (t - b)) / (c - b)];
          const bottom = (): [number, number] => [x + (cell * (t - d)) / (c - d), y + cell];
          const left = (): [number, number] => [x, y + (cell * (t - a)) / (d - a)];
          const seg = (p: [number, number], q: [number, number]) => {
            path.moveTo(p[0], p[1]);
            path.lineTo(q[0], q[1]);
          };
          switch (idx) {
            case 1: case 14: seg(left(), bottom()); break;
            case 2: case 13: seg(bottom(), right()); break;
            case 3: case 12: seg(left(), right()); break;
            case 4: case 11: seg(top(), right()); break;
            case 5: seg(left(), top()); seg(bottom(), right()); break;
            case 6: case 9: seg(top(), bottom()); break;
            case 7: case 8: seg(left(), top()); break;
            case 10: seg(left(), bottom()); seg(top(), right()); break;
          }
        }
      levels.push(path);
    }
    return levels;
  }, []);

  const build = useCallback(() => {
    const wrap = wrapRef.current;
    const cvs = canvasRef.current;
    if (!wrap || !cvs) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 2 || h < 2) return;
    if (Math.abs(w - size.current.w) < 2 && Math.abs(h - size.current.h) < 2 && geom.current)
      return;
    size.current = { w, h };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cvs.width = Math.round(w * dpr);
    cvs.height = Math.round(h * dpr);
    const mk = (): HTMLCanvasElement => {
      const c = document.createElement("canvas");
      c.width = cvs.width;
      c.height = cvs.height;
      return c;
    };
    geom.current = {
      w,
      h,
      R: Math.min(w, h) / 2,
      dpr,
      levels: buildLevels(w, h),
      cover: mk(),
      bright: mk(),
    };
    draw();
  }, [buildLevels, draw]);

  const startAnim = useCallback(() => {
    if (reduced()) {
      for (const id of Object.keys(grow.current)) grow.current[id] = 1;
      draw();
      return;
    }
    if (raf.current != null) return;
    const loop = () => {
      let moving = false;
      for (const id of Object.keys(grow.current)) {
        const diff = 1 - grow.current[id];
        if (diff > 0.005) {
          grow.current[id] += diff * 0.12;
          moving = true;
        } else {
          grow.current[id] = 1;
        }
      }
      draw();
      raf.current = moving ? requestAnimationFrame(loop) : null;
    };
    raf.current = requestAnimationFrame(loop);
  }, [draw]);

  const learn = useCallback(
    (m: Landmark) => {
      grow.current[m.id] = grow.current[m.id] || 0.001; // begin reveal
      setLearned((prev) => new Set(prev).add(m.id));
      setSelected(null);
      emitCarrie("success", `Discovered “${m.name}” — the horizon just opened up!`);
      startAnim();
    },
    [startAnim],
  );

  // Generate the fixed landmark field once (Math.random + ref writes belong
  // in an effect, not render). Positions persist for the session.
  useEffect(() => {
    if (marks.current.length) return;
    const out: Landmark[] = [];
    for (const c of CLUSTERS) {
      c.skills.forEach((s, i) => {
        const ang = (i / c.skills.length) * Math.PI * 2 + Math.random() * 1.2;
        const rad = 0.06 + Math.random() * 0.07;
        out.push({
          id: `${c.cat}-${s.name}`,
          cat: c.cat,
          name: s.name,
          desc: s.desc,
          nx: Math.min(0.92, Math.max(0.08, c.cx + Math.cos(ang) * rad)),
          ny: Math.min(0.9, Math.max(0.1, c.cy + Math.sin(ang) * rad * 1.15)),
        });
      });
    }
    marks.current = out;
    // Seed the landmark nearest the centre as the learned foundation, so a
    // small region opens with a few neighbours already on the horizon.
    let seed = out[0];
    let best = Infinity;
    for (const m of out) {
      const d = (m.nx - 0.5) ** 2 + (m.ny - 0.5) ** 2;
      if (d < best) {
        best = d;
        seed = m;
      }
    }
    grow.current[seed.id] = 1;
    setLearned(new Set([seed.id]));
    setTotalMarks(out.length);
    build();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Setup + responsive rebuild + redraw when the learned set changes.
  useEffect(() => {
    build();
    const ro = new ResizeObserver(() => build());
    if (wrapRef.current) ro.observe(wrapRef.current);
    const onVis = () => !document.hidden && draw();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [build, draw]);

  useEffect(() => {
    draw();
  }, [learned, draw]);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const g = geom.current;
    if (!g) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    let hit: Landmark | null = null;
    let bestD = 22 * 22;
    for (const m of marks.current) {
      if (!isDiscoverable(m, g)) continue;
      const [x, y] = px(m, g);
      const d = dist2(cx, cy, x, y);
      if (d < bestD) {
        bestD = d;
        hit = m;
      }
    }
    if (hit) setSelected(hit);
  };

  return (
    <div
      ref={wrapRef}
      className="border-border/15 relative min-h-115 overflow-hidden rounded-2xl border bg-[#080b12] lg:h-full"
    >
      <canvas
        ref={canvasRef}
        onClick={onCanvasClick}
        className="absolute inset-0 size-full cursor-pointer"
        aria-label="Discovery Radar — your topographic skill horizon"
      />

      {/* Header + HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <p className="text-luminous flex items-center gap-1.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.18em]">
            <Compass className="size-3" aria-hidden /> Discovery Radar
          </p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight">
            Topographic Skill Horizon
          </h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {learned.size} of {totalMarks} skills discovered · press a glowing
            landmark to explore
          </p>
        </div>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[0.625rem]">
          <span className="bg-luminous size-2 rounded-full" /> On the horizon
        </span>
      </div>

      {/* Detail sheet — appears when a landmark is selected */}
      {selected && (
        <div className="absolute inset-x-3 bottom-3">
          <div className="border-border/20 bg-background/85 flex items-start gap-3 rounded-xl border p-3.5 backdrop-blur-xl">
            <span
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${CAT_COLOR[selected.cat] ?? "#7b9dff"}22`,
                color: CAT_COLOR[selected.cat] ?? "#7b9dff",
              }}
            >
              <GraduationCap className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em]"
                style={{ color: CAT_COLOR[selected.cat] ?? "#7b9dff" }}
              >
                {selected.cat}
              </p>
              <h3 className="text-sm font-semibold tracking-tight">{selected.name}</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">{selected.desc}</p>
              <button
                type="button"
                onClick={() => learn(selected)}
                className="bg-luminous hover:bg-luminous-soft mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <GraduationCap className="size-3.5" aria-hidden /> Learn this skill
              </button>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelected(null)}
              className={cn(
                "text-muted-foreground hover:text-foreground shrink-0 transition-colors",
              )}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
