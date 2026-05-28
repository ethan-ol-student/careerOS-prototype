"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import StepShell from "./StepShell";
import { fields } from "../data";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DetailsStepProps {
  name: string;
  field: string;
  onNameChange: (value: string) => void;
  onFieldChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
  totalSteps: number;
}

export default function DetailsStep({
  name,
  field,
  onNameChange,
  onFieldChange,
  onNext,
  onBack,
  stepNumber,
  totalSteps,
}: DetailsStepProps) {
  const canContinue = name.trim().length > 0 && field !== "";

  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="A few details"
      title="A few quick details"
      subtitle="So we can personalise the experience to you."
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
      <div className="grid grid-cols-12 gap-6">
        <div className="glass-3 col-span-12 rounded-2xl p-6 md:col-span-5">
          <label className="text-luminous mb-2 block text-xs font-medium uppercase tracking-[0.15em]">
            Your name
          </label>
          <p className="text-muted-foreground mb-4 text-sm">
            What should we call you?
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Aisyah"
            className="bg-background/60 border-border focus:border-luminous focus:ring-luminous/30 w-full rounded-lg border px-4 py-3 text-base outline-none transition-colors focus:ring-2"
            autoFocus
          />
        </div>

        <div className="glass-3 col-span-12 rounded-2xl p-6 md:col-span-7">
          <label className="text-luminous mb-2 block text-xs font-medium uppercase tracking-[0.15em]">
            Your field
          </label>
          <p className="text-muted-foreground mb-4 text-sm">
            Pick the closest match — you can change it later.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {fields.map((f) => {
              const isActive = field === f;
              return (
                <button
                  key={f}
                  onClick={() => onFieldChange(f)}
                  className={cn(
                    "col-span-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors sm:col-span-1",
                    isActive
                      ? "border-luminous bg-luminous/15 text-luminous font-medium"
                      : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
