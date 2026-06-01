"use client";

import { Compass } from "lucide-react";
import { LayoutLines } from "@/components/ui/LayoutLines";
import { JudgeTourNavigation } from "@/components/judge/JudgeTourNavigation";
import { JudgeTourOverlay } from "@/components/judge/JudgeTourOverlay";
import { JudgeTourProvider, useJudgeTour } from "@/components/judge/JudgeTourProvider";
import { JudgeTourCurrentView } from "@/components/judge/JudgeTourViews";

export function JudgeTourClient() {
  return (
    <JudgeTourProvider>
      <JudgeTourShell />
    </JudgeTourProvider>
  );
}

function JudgeTourShell() {
  const { isRunning, restart } = useJudgeTour();

  return (
    <div className="bg-background text-foreground relative min-h-screen w-full">
      <LayoutLines />
      <header className="sticky top-0 z-40 border-b border-border/10 bg-background/85 px-4 backdrop-blur">
        <div className="mx-auto flex max-w-container items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Compass className="size-5 text-luminous" />
            Career OS
            <span className="text-muted-foreground ml-1 text-[10px] font-medium uppercase tracking-wider">
              Judge Tour
            </span>
          </div>
          {!isRunning ? (
            <button
              type="button"
              onClick={restart}
              className="text-luminous hover:text-luminous-soft text-xs font-semibold uppercase tracking-[0.18em] transition-colors"
            >
              Restart guided tour
            </button>
          ) : null}
        </div>
      </header>

      <div className="relative z-10 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="px-4 pt-6 lg:pl-4 lg:pr-0">
          <JudgeTourNavigation />
        </div>
        <main className="min-w-0 pb-32">
          <JudgeTourCurrentView />
        </main>
      </div>

      <JudgeTourOverlay />
    </div>
  );
}
