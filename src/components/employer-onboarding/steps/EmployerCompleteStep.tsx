"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import StepShell from "@/components/onboarding/StepShell";
import { Button } from "@/components/ui/Button";

interface EmployerCompleteStepProps {
  role: string;
  onEnter: () => void;
  stepNumber: number;
  totalSteps: number;
}

export default function EmployerCompleteStep({
  role,
  onEnter,
  stepNumber,
  totalSteps,
}: EmployerCompleteStepProps) {
  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="All set"
      title="Your hiring goal has been translated into recommendations."
      subtitle={
        role
          ? `We've prepared a marketplace view tailored to your search for ${role}.`
          : "We've prepared a marketplace view tailored to your hiring goal."
      }
      footer={
        <div className="flex justify-end">
          <Button onClick={onEnter} size="lg">
            Done
            <ArrowRight />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="glass-4 ring-clover/20 col-span-12 flex flex-col items-center gap-4 rounded-2xl p-8 text-center ring-1">
          <div className="bg-clover/15 text-clover-soft ring-2 ring-clover/40 flex size-14 items-center justify-center rounded-full">
            <Sparkles className="size-7" />
          </div>
          <h3 className="text-xl font-semibold tracking-tight">
            Marketplace ready
          </h3>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Candidates are ranked by match, readiness, and growth signal — and
            you can filter by category, search, or save anyone for later.
          </p>
        </div>
      </div>
    </StepShell>
  );
}
