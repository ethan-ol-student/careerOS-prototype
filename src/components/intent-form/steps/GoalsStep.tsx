"use client";

import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import StepShell from "./StepShell";
import { goals } from "../data";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface GoalsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
  totalSteps: number;
}

export default function GoalsStep({
  value,
  onChange,
  onNext,
  onBack,
  stepNumber,
  totalSteps,
}: GoalsStepProps) {
  const toggleGoal = (goalId: string) => {
    if (value.includes(goalId)) {
      onChange(value.filter((g) => g !== goalId));
    } else {
      onChange([...value, goalId]);
    }
  };

  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="Your goals"
      title="What are you trying to achieve?"
      subtitle="Pick all that apply. We use these to surface the most relevant tools."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack} size="lg">
            <ArrowLeft />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={value.length === 0}
            size="lg"
          >
            Continue
            <ArrowRight />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isActive = value.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "col-span-12 rounded-2xl border p-5 text-left transition-all md:col-span-6",
                isActive
                  ? "border-luminous bg-luminous/10 ring-2 ring-luminous/30"
                  : "glass-3 hover:bg-card/40",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    isActive ? "bg-luminous" : "bg-luminous/15",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5",
                      isActive ? "text-white" : "text-luminous",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "mb-1 font-semibold",
                      isActive && "text-luminous",
                    )}
                  >
                    {goal.label}
                  </p>
                  <p className="text-muted-foreground text-sm leading-snug">
                    {goal.description}
                  </p>
                </div>
                {isActive && (
                  <div className="bg-luminous flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check
                      className="size-3 text-white"
                      strokeWidth={3}
                    />
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
