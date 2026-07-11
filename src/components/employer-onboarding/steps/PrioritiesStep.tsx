"use client";

import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import StepShell from "@/components/onboarding/StepShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/candidates/types";

interface PrioritiesStepProps {
  value: Priority[];
  onChange: (value: Priority[]) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
  totalSteps: number;
}

const PRIORITIES: Array<{ id: Priority; label: string; description: string }> =
  [
    {
      id: "technical-skills",
      label: "Technical Skills",
      description: "Depth in the role's core stack or craft.",
    },
    {
      id: "learning-momentum",
      label: "Learning Momentum",
      description: "How fast they're compounding skills right now.",
    },
    {
      id: "communication",
      label: "Communication",
      description: "Clarity, writing, presence on a team.",
    },
    {
      id: "leadership",
      label: "Leadership Potential",
      description: "Signs of ownership, mentorship, or initiative.",
    },
    {
      id: "industry-interest",
      label: "Industry Interest",
      description: "Genuine pull toward your domain.",
    },
    {
      id: "location",
      label: "Location",
      description: "On-site / hybrid alignment with your team.",
    },
    {
      id: "availability",
      label: "Availability",
      description: "How soon they can start.",
    },
    {
      id: "portfolio-strength",
      label: "Portfolio Strength",
      description: "Real evidence of shipped work.",
    },
    {
      id: "growth-signal",
      label: "Growth Signal",
      description: "Trajectory points toward where you're hiring.",
    },
  ];

export default function PrioritiesStep({
  value,
  onChange,
  onNext,
  onBack,
  stepNumber,
  totalSteps,
}: PrioritiesStepProps) {
  const toggle = (id: Priority) => {
    if (value.includes(id)) onChange(value.filter((p) => p !== id));
    else onChange([...value, id]);
  };

  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="What matters"
      title="What matters most for this role?"
      subtitle="Pick anything that should weigh into the match — you can pick more than one."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack} size="lg">
            <ArrowLeft />
            Back
          </Button>
          <Button onClick={onNext} disabled={value.length === 0} size="lg">
            Continue
            <ArrowRight />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {PRIORITIES.map((p) => {
          const isActive = value.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn(
                "col-span-12 rounded-2xl border p-5 text-left transition-all sm:col-span-6 lg:col-span-4",
                isActive
                  ? "border-clover/40 bg-clover/10"
                  : "glass-3 hover:bg-card/40",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "mb-1 font-semibold",
                      isActive && "text-clover",
                    )}
                  >
                    {p.label}
                  </p>
                  <p className="text-muted-foreground text-sm leading-snug">
                    {p.description}
                  </p>
                </div>
                {isActive && (
                  <div className="bg-clover flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
