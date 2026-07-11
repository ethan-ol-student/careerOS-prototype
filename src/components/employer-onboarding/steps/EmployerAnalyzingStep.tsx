"use client";

import { useEffect, useState } from "react";
import { Compass, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { LayoutLines } from "@/components/ui/LayoutLines";

interface EmployerAnalyzingStepProps {
  onDone: () => void;
  totalDurationMs?: number;
}

const STAGES = [
  "Analyzing hiring goal…",
  "Mapping role requirements…",
  "Prioritizing candidate signals…",
  "Preparing recommendations…",
];

/**
 * Employer-side compiling interstitial — mirrors AnalyzingStep visually
 * but is its own component so the candidate flow stays untouched.
 */
export default function EmployerAnalyzingStep({
  onDone,
  totalDurationMs = 3200,
}: EmployerAnalyzingStepProps) {
  const [stageIdx, setStageIdx] = useState(0);
  const stageMs = Math.floor(totalDurationMs / STAGES.length);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setStageIdx((idx) => (idx < STAGES.length - 1 ? idx + 1 : idx));
    }, stageMs);
    const doneTimer = setTimeout(onDone, totalDurationMs);
    return () => {
      clearInterval(stageTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone, stageMs, totalDurationMs]);

  const progressPct = Math.min(
    Math.round(((stageIdx + 1) / STAGES.length) * 100),
    100,
  );

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <LayoutLines />
      <header className="relative z-10 px-4 pt-6">
        <div className="max-w-container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight"
          >
            <Compass className="size-5 text-clover" />
            Career OS
          </Link>
          <p className="text-muted-foreground font-mono text-xs">
            Building your marketplace…
          </p>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="glass-4 ring-clover/20 relative w-full max-w-md overflow-hidden rounded-2xl p-8 text-center ring-1">
          <div
            aria-hidden
            className="from-clover/25 pointer-events-none absolute -inset-12 rounded-full bg-radial to-transparent blur-2xl"
          />
          <div className="relative flex flex-col items-center gap-6">
            <div className="relative">
              <div className="bg-clover/15 ring-clover/40 flex size-20 items-center justify-center rounded-full ring-2">
                <Loader2 className="text-clover size-10 animate-spin" />
              </div>
              <span
                aria-hidden
                className="bg-clover/30 absolute inset-0 -z-10 animate-ping rounded-full"
              />
            </div>

            <div>
              <p className="text-clover text-xs font-mono font-semibold uppercase tracking-[0.18em]">
                Compiling
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Translating your hiring goal
              </h2>
              <p
                key={stageIdx}
                className="text-muted-foreground mt-3 text-sm animate-appear"
              >
                {STAGES[stageIdx]}
              </p>
            </div>

            <div className="w-full">
              <div className="bg-foreground/8 h-2 w-full overflow-hidden rounded-full">
                <div
                  className="from-clover/60 to-clover h-full rounded-full bg-linear-to-r transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 font-mono text-[10px]">
                {progressPct}%
              </p>
            </div>

            <ul className="flex w-full flex-col gap-1.5 text-left">
              {STAGES.map((label, i) => {
                const done = i < stageIdx;
                const current = i === stageIdx;
                return (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    {done ? (
                      <CheckCircle2 className="text-clover size-3.5" />
                    ) : current ? (
                      <Loader2 className="text-clover size-3.5 animate-spin" />
                    ) : (
                      <span className="border-border/20 size-3.5 rounded-full border" />
                    )}
                    <span
                      className={
                        done
                          ? "text-clover"
                          : current
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
