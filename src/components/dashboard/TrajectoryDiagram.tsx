"use client";

import { ArrowUpRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoopState } from "./LoopPanels";

interface TrajectoryDiagramProps {
  state: LoopState;
  className?: string;
}

const DESTINATIONS = [
  { title: "Robotics Engineer", company: "Universal Robots", match: 88 },
  { title: "Mechanical Design Lead", company: "Dyson", match: 84 },
  { title: "ML / Controls Engineer", company: "Tesla", match: 79 },
  { title: "Product Engineer", company: "Honda Mfg.", match: 72 },
];

export function TrajectoryDiagram({ state, className }: TrajectoryDiagramProps) {
  const active = state.step === "trajectory";

  const PATH_LEN = 380;
  const filledLen = (Math.max(state.progress, 10) / 100) * PATH_LEN;
  const remaining = PATH_LEN - filledLen;

  const PATHS = [
    { d: "M40,130 C150,130 230,40  500,40",  endY: 40  },
    { d: "M40,130 C150,130 230,90  500,90",  endY: 90  },
    { d: "M40,130 C150,130 230,170 500,170", endY: 170 },
    { d: "M40,130 C150,130 230,220 500,220", endY: 220 },
  ];

  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6 transition-shadow",
        active && "ring-luminous/40 shadow-[0_0_0_2px_var(--luminous)] ring-2",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
            Career trajectory
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">
            Pathways diverging from where you are now
          </h3>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Built from people with a similar skill shape to yours.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            active
              ? "border-luminous/40 bg-luminous/10 text-luminous"
              : "border-border/40 text-muted-foreground",
          )}
        >
          {state.progress}% filled
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden rounded-xl border border-border/30 bg-card/30"
        style={{ perspective: "1100px" }}
        role="img"
        aria-label={`Career trajectory: ${DESTINATIONS.length} pathways diverging from your current position toward ${DESTINATIONS.map((d) => d.title).join(", ")}. ${state.progress}% filled.`}
      >
        <div
          aria-hidden
          className="from-luminous/20 pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b to-transparent"
        />

        <svg
          viewBox="0 0 540 260"
          className="block w-full"
          style={{
            transform:
              "rotateX(22deg) rotateY(-3deg) scale(1.04) translateY(8px)",
            transformOrigin: "center 80%",
          }}
          aria-hidden
        >
          <title>Career trajectory diagram</title>
          <defs>
            <pattern id="grid" width="40" height="22" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 22" fill="none" stroke="currentColor" strokeOpacity="0.08" />
            </pattern>
            <filter id="tube-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <linearGradient id="luminous-grad" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--luminous)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--clover)" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="muted-grad" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--luminous)" stopOpacity="0.20" />
              <stop offset="100%" stopColor="var(--luminous)" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          <rect
            x="0"
            y="180"
            width="540"
            height="80"
            fill="url(#grid)"
            className="text-foreground"
          />

          {PATHS.map((p, i) => (
            <g key={`bg-${i}`}>
              <path d={p.d} stroke="url(#muted-grad)" strokeWidth="14" fill="none" filter="url(#tube-glow)" opacity="0.4" />
              <path
                d={p.d}
                stroke="currentColor"
                className="text-muted-foreground"
                strokeOpacity="0.35"
                strokeWidth="1.8"
                strokeDasharray="3 5"
                fill="none"
              />
            </g>
          ))}

          {PATHS.map((p, i) => (
            <g key={`fill-${i}`}>
              <path
                d={p.d}
                stroke="url(#luminous-grad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${filledLen} ${remaining}`}
                fill="none"
                filter="url(#tube-glow)"
                opacity="0.55"
              />
              <path
                d={p.d}
                stroke="url(#luminous-grad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${filledLen} ${remaining}`}
                fill="none"
              />
              <circle
                cx={40 + (filledLen / PATH_LEN) * 460}
                cy={130 + (p.endY - 130) * (filledLen / PATH_LEN)}
                r="3.5"
                fill="var(--clover)"
              />
            </g>
          ))}

          <g>
            <circle cx="40" cy="130" r="14" fill="var(--luminous)" opacity="0.25" />
            <circle cx="40" cy="130" r="6" fill="var(--luminous)" />
          </g>
        </svg>

        <div className="absolute right-3 top-3 hidden flex-col gap-2 sm:flex">
          {DESTINATIONS.map((d, i) => (
            <div
              key={d.title}
              className={cn(
                "border-border/40 bg-background/70 max-w-[200px] rounded-md border px-2.5 py-1.5 text-[11px] shadow-sm backdrop-blur-sm transition-all",
                state.progress >= 30 + i * 10 && "border-luminous/40 bg-luminous/10",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{d.title}</span>
                <span className="text-luminous shrink-0 font-mono">
                  {Math.min(d.match + state.loops * 2, 99)}%
                </span>
              </div>
              <p className="text-muted-foreground truncate">{d.company}</p>
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="bg-luminous size-2 rounded-full" />
          <p className="text-foreground text-[11px] font-medium">You are here</p>
        </div>
      </div>

      {/* Mobile destination list */}
      <ul className="mt-3 flex flex-wrap gap-2 sm:hidden">
        {DESTINATIONS.map((d, i) => {
          const reachable = state.progress >= 30 + i * 10;
          return (
            <li
              key={d.title}
              className={cn(
                "border-border/40 bg-card/40 flex-1 basis-[45%] rounded-md border px-2.5 py-2 text-[11px] transition-colors",
                reachable && "border-luminous/40 bg-luminous/10",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{d.title}</span>
                <span className="text-luminous shrink-0 font-mono text-xs">
                  {Math.min(d.match + state.loops * 2, 99)}%
                </span>
              </div>
              <p className="text-muted-foreground truncate">{d.company}</p>
            </li>
          );
        })}
      </ul>

      <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="from-luminous to-clover inline-block h-1 w-6 rounded-full bg-linear-to-r" />
            Filled — your progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="border-muted-foreground/60 inline-block h-px w-6 border-t border-dashed" />
            Reachable
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Layers className="size-3" />
          {DESTINATIONS.length} aligned destinations
          <ArrowUpRight className="size-3" />
        </span>
      </div>
    </div>
  );
}
