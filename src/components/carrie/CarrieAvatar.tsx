"use client";

import { cn } from "@/lib/utils";

/**
 * Carrie's face — a hand-rolled SVG avatar with the seven system states
 * from the emotion-data spec (asset ids pa_idle_happy … pa_confused).
 * Face colors are the spec's asset palette (mapped onto design-token
 * values where one exists); features are a constant dark ink so the face
 * reads on every base color. Idle blinking + bobbing are CSS keyframes
 * in globals.css — `html.reduce-motion` freezes them automatically.
 */

export type CarrieEmotion =
  | "idle" // pa_idle_happy — Active / Default
  | "processing" // pa_processing — Thinking / Loading
  | "success" // pa_success — Task Confirmed
  | "error" // pa_error — Alert / Failure
  | "listening" // pa_listening — Input Active
  | "offline" // pa_offline — Sleep
  | "confused"; // pa_confused — Query Not Understood

/** Base colors per the emotion-data spec (Clover/Destructive/Luminous
 *  align with the design tokens; yellow + slate are Carrie-only). */
const FACE_COLOR: Record<CarrieEmotion, string> = {
  idle: "#FFDE00",
  processing: "#FFDE00",
  success: "#22C55E",
  error: "#EF4444",
  listening: "#3B82F6",
  offline: "#94A3B8",
  confused: "#F59E0B",
};

const INK = "#1c1e26";

function Eyes({ emotion }: { emotion: CarrieEmotion }) {
  switch (emotion) {
    case "processing":
      // Left oval standard; right slightly flattened.
      return (
        <>
          <ellipse cx={23} cy={27} rx={4} ry={7} fill={INK} />
          <ellipse cx={41} cy={28} rx={4.5} ry={4} fill={INK} />
        </>
      );
    case "success":
      // Left standard; right closed upward arc ^.
      return (
        <>
          <ellipse cx={23} cy={27} rx={4} ry={7} fill={INK} />
          <path d="M36 29 q5 -7 10 0" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </>
      );
    case "error":
      // Two widened circles.
      return (
        <>
          <circle cx={22} cy={27} r={6} fill={INK} />
          <circle cx={42} cy={27} r={6} fill={INK} />
        </>
      );
    case "listening":
      // Standard ovals, slightly wider spacing.
      return (
        <>
          <ellipse cx={19} cy={27} rx={4} ry={7} fill={INK} />
          <ellipse cx={45} cy={27} rx={4} ry={7} fill={INK} />
        </>
      );
    case "offline":
      // Two closed downward arcs v v.
      return (
        <>
          <path d="M17 25 q6 7 11 0" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <path d="M36 25 q6 7 11 0" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </>
      );
    case "confused":
      // One standard oval; one enlarged circular oval.
      return (
        <>
          <ellipse cx={22} cy={27} rx={4} ry={7} fill={INK} />
          <circle cx={42} cy={27} r={7.5} fill={INK} />
        </>
      );
    default:
      // idle — two standard vertical ovals (blink via CSS).
      return (
        <g className="carrie-blink" style={{ transformOrigin: "32px 27px" }}>
          <ellipse cx={23} cy={27} rx={4} ry={7} fill={INK} />
          <ellipse cx={41} cy={27} rx={4} ry={7} fill={INK} />
        </g>
      );
  }
}

function Mouth({ emotion }: { emotion: CarrieEmotion }) {
  switch (emotion) {
    case "processing":
      // Narrow, flat horizontal line.
      return <path d="M26 45 h12" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />;
    case "success":
      // Broad open-arc smile.
      return <path d="M19 41 q13 14 26 0 z" fill={INK} />;
    case "error":
      // Downward inverted arc with dropped corner ticks.
      return (
        <>
          <path d="M21 48 q11 -10 22 0" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <path d="M21 48 l-2 3 M43 48 l2 3" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </>
      );
    case "listening":
      // Small, centered open circle O.
      return <circle cx={32} cy={45} r={4.5} fill={INK} />;
    case "offline":
      // Asymmetrical wavy line.
      return (
        <path d="M21 45 q4 -5 8 0 t8 0 q3 3 6 -1" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
      );
    case "confused":
      // Short diagonal line slanting upward.
      return <path d="M25 47 L39 42" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />;
    default:
      // idle — wide upward arc with corner ticks.
      return (
        <>
          <path d="M19 40 q13 12 26 0" stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          <path d="M19 40 l-2 -2 M45 40 l2 -2" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </>
      );
  }
}

export function CarrieAvatar({
  emotion = "idle",
  className,
  bob = false,
}: {
  emotion?: CarrieEmotion;
  className?: string;
  /** Gentle idle bobbing (used on the floating button). */
  bob?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Carrie — ${emotion}`}
      className={cn(bob && "carrie-bob", className)}
    >
      <circle
        cx={32}
        cy={32}
        r={29}
        fill={FACE_COLOR[emotion]}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={2}
        style={{ transition: "fill 0.3s ease" }}
      />
      <Eyes emotion={emotion} />
      <Mouth emotion={emotion} />
    </svg>
  );
}
