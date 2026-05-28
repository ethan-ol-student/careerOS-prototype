"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Target } from "lucide-react";
import StepShell from "./StepShell";
import { targetJobs } from "../data";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TargetJobStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
  totalSteps: number;
}

export default function TargetJobStep({
  value,
  onChange,
  onNext,
  onBack,
  stepNumber,
  totalSteps,
}: TargetJobStepProps) {
  const [custom, setCustom] = useState("");
  // If the current value is not a known preset, treat it as custom.
  const presetIds = new Set(targetJobs.map((j) => j.label));
  const usingCustom = value !== "" && !presetIds.has(value);

  const canContinue = value.trim().length > 0;

  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="Your target"
      title="What job are you aiming for?"
      subtitle="Pick a target. Career OS uses this to compute your readiness, suggest bridge skills, and tell you when you match an employer."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack} size="lg">
            <ArrowLeft />
            Back
          </Button>
          <Button onClick={onNext} disabled={!canContinue} size="lg">
            Continue
            <ArrowRight />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {targetJobs.map((job) => {
          const isActive = value === job.label;
          return (
            <button
              key={job.id}
              type="button"
              onClick={() => {
                onChange(job.label);
                setCustom("");
              }}
              className={cn(
                "col-span-12 rounded-2xl border p-5 text-left transition-all md:col-span-6 lg:col-span-4",
                isActive
                  ? "border-luminous bg-luminous/10 ring-2 ring-luminous/30"
                  : "glass-3 hover:bg-card/40",
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    isActive ? "bg-luminous text-white" : "bg-luminous/15 text-luminous",
                  )}
                >
                  <Target className="size-4" />
                </div>
                <p
                  className={cn(
                    "font-semibold",
                    isActive && "text-luminous",
                  )}
                >
                  {job.label}
                </p>
              </div>
              <p className="text-muted-foreground text-sm leading-snug">
                {job.description}
              </p>
              <p className="text-muted-foreground mt-3 text-[11px] uppercase tracking-wider">
                Requires:{" "}
                <span className="text-foreground/80">
                  {job.requiredSkills.join(" · ")}
                </span>
              </p>
            </button>
          );
        })}

        {/* Custom target */}
        <div
          className={cn(
            "col-span-12 rounded-2xl border p-5 transition-all",
            usingCustom
              ? "border-luminous bg-luminous/10 ring-2 ring-luminous/30"
              : "glass-3",
          )}
        >
          <p className="text-luminous mb-1 text-xs font-medium uppercase tracking-[0.15em]">
            Or write your own
          </p>
          <p className="text-muted-foreground mb-3 text-sm">
            Anything not on the list? Add a custom target — we&apos;ll still
            track your progress toward it.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={custom}
              maxLength={60}
              onChange={(e) => {
                setCustom(e.target.value);
                onChange(e.target.value.trim());
              }}
              placeholder="e.g. Wildlife Photographer, Climate Policy Lead"
              className="bg-background/60 border-border focus:border-luminous focus:ring-luminous/30 min-h-11 flex-1 rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
            />
          </div>
        </div>
      </div>
    </StepShell>
  );
}
