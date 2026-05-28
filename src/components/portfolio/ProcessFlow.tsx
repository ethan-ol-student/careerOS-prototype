"use client";

import { MessageCircle, MessageSquareText, Sparkles, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessFlowProps {
  currentStep: number;
}

const steps = [
  { icon: MessageCircle, label: "AI asks" },
  { icon: MessageSquareText, label: "You respond" },
  { icon: Sparkles, label: "Portfolio updates" },
  { icon: RotateCw, label: "Repeat or pause" },
];

export default function ProcessFlow({ currentStep }: ProcessFlowProps) {
  return (
    <div className="glass-3 rounded-2xl px-5 py-4">
      <p className="text-muted-foreground mb-4 text-xs font-medium uppercase tracking-[0.18em]">
        How Living Portfolio works
      </p>
      <div className="flex items-center gap-2 md:gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isComplete = i < currentStep;
          return (
            <div
              key={step.label}
              className="flex min-w-0 flex-1 items-center gap-2 md:gap-3"
            >
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border transition-colors",
                    isActive &&
                      "border-luminous bg-luminous text-white shadow-[0_0_0_4px_rgba(77,122,255,0.18)]",
                    isComplete && "border-clover/40 bg-clover/15 text-clover",
                    !isActive && !isComplete && "border-border/60 bg-card/40 text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <p
                  className={cn(
                    "text-center text-[11px] md:text-xs",
                    isActive
                      ? "text-foreground"
                      : isComplete
                        ? "text-clover"
                        : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "-mt-5 h-px w-4 md:w-8",
                    isComplete ? "bg-clover" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
