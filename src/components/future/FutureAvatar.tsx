"use client";

import {
  Code2,
  Cog,
  Compass,
  FlaskConical,
  LineChart,
  Palette,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The "Future Self" avatar — a stylized stick figure standing on a glowing
 * spotlight platform, themed to the selected career's industry: attire and
 * hand-held props are drawn into the SVG, and lucide icons float around the
 * figure as environmental cues. Hand-rolled (design system: no chart/3D
 * deps); glow + float animations ride the global reduce-motion kill-switch.
 */

type Theme = "tech" | "engineering" | "business" | "creative" | "science" | "default";

export function themeForField(field: string, title = ""): Theme {
  const s = `${field} ${title}`.toLowerCase();
  if (/design|creative|media|art|ux|ui/.test(s)) return "creative";
  if (/tech|software|developer|data|ai|cloud|cyber/.test(s)) return "tech";
  if (/engineer|manufactur|mechanic|robot|electric/.test(s)) return "engineering";
  if (/finance|business|account|market|sales|manage/.test(s)) return "business";
  if (/science|health|medic|research|bio|lab/.test(s)) return "science";
  return "default";
}

const THEME_META: Record<
  Theme,
  { accent: string; soft: string; orbit: [typeof Code2, typeof Code2] }
> = {
  tech: { accent: "#4d7aff", soft: "rgba(77,122,255,", orbit: [Code2, Cog] },
  engineering: { accent: "#ff8a3d", soft: "rgba(255,138,61,", orbit: [Wrench, Cog] },
  business: { accent: "#4cbb55", soft: "rgba(76,187,85,", orbit: [LineChart, Compass] },
  creative: { accent: "#c084fc", soft: "rgba(192,132,252,", orbit: [Palette, Code2] },
  science: { accent: "#38bdf8", soft: "rgba(56,189,248,", orbit: [FlaskConical, Cog] },
  default: { accent: "#4d7aff", soft: "rgba(77,122,255,", orbit: [Compass, Cog] },
};

const INK = "#e8ecf6";

export function FutureAvatar({ field, title }: { field: string; title: string }) {
  const theme = themeForField(field, title);
  const m = THEME_META[theme];
  const [OrbitA, OrbitB] = m.orbit;

  return (
    <div className="relative flex h-full min-h-80 flex-col items-center justify-end">
      {/* Floating environmental cues */}
      <span
        className="carrie-bob absolute left-[12%] top-[18%] rounded-xl border p-2 backdrop-blur"
        style={{ borderColor: `${m.soft}0.35)`, backgroundColor: `${m.soft}0.08)`, color: m.accent }}
        aria-hidden
      >
        <OrbitA className="size-4" />
      </span>
      <span
        className="carrie-bob absolute right-[12%] top-[30%] rounded-xl border p-2 backdrop-blur [animation-delay:0.9s]"
        style={{ borderColor: `${m.soft}0.35)`, backgroundColor: `${m.soft}0.08)`, color: m.accent }}
        aria-hidden
      >
        <OrbitB className="size-4" />
      </span>

      {/* Figure + spotlight */}
      <svg viewBox="0 0 200 250" className="relative z-10 w-full max-w-75" role="img" aria-label={`Your future self as a ${title}`}>
        <defs>
          <radialGradient id="fs-spot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`${m.soft}0.5)`} />
            <stop offset="60%" stopColor={`${m.soft}0.18)`} />
            <stop offset="100%" stopColor={`${m.soft}0)`} />
          </radialGradient>
          <linearGradient id="fs-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`${m.soft}0)`} />
            <stop offset="100%" stopColor={`${m.soft}0.14)`} />
          </linearGradient>
        </defs>

        {/* Light beam + platform */}
        <polygon points="60,0 140,0 168,206 32,206" fill="url(#fs-beam)" />
        <ellipse cx="100" cy="212" rx="72" ry="18" fill="url(#fs-spot)" />
        <ellipse cx="100" cy="212" rx="52" ry="12" fill="none" stroke={`${m.soft}0.65)`} strokeWidth="2" />
        <ellipse cx="100" cy="212" rx="62" ry="15" fill="none" stroke={`${m.soft}0.25)`} strokeWidth="1" />

        {/* ── Stick figure (glowing hero) ── */}
        <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none"
          style={{ filter: `drop-shadow(0 0 10px ${m.soft}0.55))` }}>
          {/* head */}
          <circle cx="100" cy="66" r="16" fill="#10141f" />
          {/* torso */}
          <path d="M100 82 L100 142" />
          {/* legs */}
          <path d="M100 142 L78 200" />
          <path d="M100 142 L122 200" />
          {/* arms — pose varies with the prop */}
          {theme === "tech" || theme === "creative" ? (
            // holding a device with both hands
            <>
              <path d="M100 96 L70 118" />
              <path d="M100 96 L130 118" />
            </>
          ) : theme === "engineering" ? (
            // one arm raised with tool
            <>
              <path d="M100 96 L66 84" />
              <path d="M100 96 L132 122" />
            </>
          ) : (
            // confident stance, one hand carrying
            <>
              <path d="M100 96 L72 126" />
              <path d="M100 96 L128 126" />
            </>
          )}
        </g>

        {/* ── Attire & props per theme ── */}
        {theme === "tech" && (
          <g>
            {/* hood */}
            <path d="M82 60 a18 18 0 0 1 36 0" fill="none" stroke={m.accent} strokeWidth="4" strokeLinecap="round" />
            {/* laptop */}
            <rect x="72" y="112" width="56" height="8" rx="2" fill={m.accent} />
            <rect x="78" y="94" width="44" height="20" rx="3" fill="#10141f" stroke={m.accent} strokeWidth="2.5" />
            <text x="100" y="108" textAnchor="middle" fill={m.accent} fontSize="10" fontFamily="monospace" fontWeight="700">
              {"</>"}
            </text>
          </g>
        )}
        {theme === "creative" && (
          <g>
            {/* beret */}
            <path d="M83 56 q17 -14 34 0 l-4 4 q-13 -8 -26 0 z" fill={m.accent} />
            <circle cx="100" cy="46" r="3" fill={m.accent} />
            {/* tablet + pen */}
            <rect x="76" y="98" width="48" height="26" rx="4" fill="#10141f" stroke={m.accent} strokeWidth="2.5" transform="rotate(-6 100 111)" />
            <path d="M88 108 q10 -8 22 4" stroke={m.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" transform="rotate(-6 100 111)" />
          </g>
        )}
        {theme === "engineering" && (
          <g>
            {/* hard hat */}
            <path d="M82 58 a18 14 0 0 1 36 0 z" fill={m.accent} />
            <rect x="78" y="56" width="44" height="5" rx="2.5" fill={m.accent} />
            {/* wrench in raised hand */}
            <g transform="translate(58 76) rotate(-30)">
              <rect x="0" y="0" width="22" height="5" rx="2.5" fill={INK} />
              <circle cx="24" cy="2.5" r="5.5" fill="none" stroke={INK} strokeWidth="4" />
            </g>
          </g>
        )}
        {theme === "business" && (
          <g>
            {/* tie */}
            <path d="M100 84 l5 8 l-5 22 l-5 -22 z" fill={m.accent} />
            {/* briefcase in hand */}
            <rect x="118" y="124" width="26" height="18" rx="3" fill="#10141f" stroke={m.accent} strokeWidth="2.5" />
            <path d="M126 124 v-4 h10 v4" stroke={m.accent} strokeWidth="2.5" fill="none" />
          </g>
        )}
        {theme === "science" && (
          <g>
            {/* goggles */}
            <circle cx="93" cy="64" r="5" fill="none" stroke={m.accent} strokeWidth="2.5" />
            <circle cx="107" cy="64" r="5" fill="none" stroke={m.accent} strokeWidth="2.5" />
            <path d="M98 64 h4" stroke={m.accent} strokeWidth="2.5" />
            {/* flask in hand */}
            <path d="M66 118 l-4 12 a6 6 0 0 0 6 8 l4 0 a6 6 0 0 0 6 -8 l-4 -12 z" fill={`${m.soft}0.35)`} stroke={m.accent} strokeWidth="2.5" />
          </g>
        )}
        {theme === "default" && (
          <g>
            <path d="M84 58 a16 10 0 0 1 32 0" fill="none" stroke={m.accent} strokeWidth="4" strokeLinecap="round" />
          </g>
        )}
      </svg>

      {/* Job title under the figure (wireframe: [JOB TITLE]) */}
      <p className="relative z-10 -mt-1 text-center">
        <span
          className={cn("rounded-full border px-3 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]")}
          style={{ borderColor: `${m.soft}0.4)`, backgroundColor: `${m.soft}0.1)`, color: m.accent }}
        >
          {title}
        </span>
      </p>
    </div>
  );
}
