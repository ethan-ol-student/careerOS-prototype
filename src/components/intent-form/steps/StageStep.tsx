"use client";

import { ArrowRight } from "lucide-react";
import StepShell from "./StepShell";
import { stages } from "../data";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface StageStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  stepNumber: number;
  totalSteps: number;
}

export default function StageStep({
  value,
  onChange,
  onNext,
  stepNumber,
  totalSteps,
}: StageStepProps) {
  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="Your stage"
      title="Where are you in your career?"
      subtitle="This shapes how we tailor everything else for you."
      footer={
        <div className="flex justify-end">
          <Button onClick={onNext} disabled={!value} size="lg">
            Continue
            <ArrowRight />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {stages.map((stage) => {
          const isActive = value === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => onChange(stage.id)}
              className={cn(
                "col-span-12 rounded-2xl border p-5 text-left transition-all md:col-span-6",
                isActive
                  ? "border-luminous bg-luminous/10 ring-2 ring-luminous/30"
                  : "glass-3 hover:bg-card/40",
              )}
            >
              <p
                className={cn(
                  "mb-1 font-semibold",
                  isActive && "text-luminous",
                )}
              >
                {stage.label}
              </p>
              <p className="text-muted-foreground text-sm leading-snug">
                {stage.description}
              </p>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
