"use client";

import { ArrowLeft, ArrowRight, Check, FastForward, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { JudgeTourStatus } from "@/lib/judge/judgeTourSteps";
import { useJudgeTour } from "./JudgeTourProvider";

const STATUS_CLASS: Record<JudgeTourStatus, string> = {
  Functional: "border-clover/40 bg-clover/10 text-clover-soft",
  Prototype: "border-luminous/40 bg-luminous/10 text-luminous-soft",
  Planned: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
};

export function JudgeTourStepCard() {
  const {
    currentStep,
    currentIndex,
    steps,
    isFirst,
    isLast,
    back,
    next,
    skip,
    finish,
    restart,
  } = useJudgeTour();

  return (
    <section
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-xl rounded-2xl border border-border/15 bg-background/95 p-4 shadow-2xl backdrop-blur sm:bottom-6 sm:left-auto sm:right-6 sm:mx-0 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[0.625rem] font-mono font-semibold uppercase tracking-[0.18em]">
            Step {currentIndex + 1} of {steps.length}
          </p>
          <h2 className="mt-1 text-base font-semibold leading-tight">
            {currentStep.title}
          </h2>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[0.625rem] font-mono font-semibold uppercase tracking-wider",
            STATUS_CLASS[currentStep.status],
          )}
        >
          {currentStep.status}
        </span>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        {currentStep.body}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/8">
        <div
          className="h-full rounded-full bg-luminous transition-all"
          style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={back}
            disabled={isFirst}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={skip}>
            <FastForward className="size-4" />
            Skip
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {isLast ? (
            <Button type="button" size="sm" onClick={finish}>
              <Check className="size-4" />
              Finish
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={next}>
              Next
              <ArrowRight className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Restart tour"
            onClick={restart}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close tour overlay"
            onClick={skip}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
