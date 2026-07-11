"use client";

import { ArrowRight } from "lucide-react";
import StepShell from "@/components/onboarding/StepShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { TalentType } from "@/lib/candidates/types";

interface TalentTypeStepProps {
  value: TalentType | "";
  onChange: (value: TalentType) => void;
  onNext: () => void;
  stepNumber: number;
  totalSteps: number;
}

const TALENT_TYPES: Array<{
  id: TalentType;
  label: string;
  description: string;
}> = [
  {
    id: "interns",
    label: "Interns",
    description: "Students or fresh-into-industry candidates ready to learn.",
  },
  {
    id: "fresh-graduates",
    label: "Fresh Graduates",
    description: "0–1 years experience, looking for their first full role.",
  },
  {
    id: "junior-professionals",
    label: "Junior Professionals",
    description: "1–3 years in, growing into their craft.",
  },
  {
    id: "mid-level",
    label: "Mid-level Professionals",
    description: "3–6 years in, ready to lead initiatives.",
  },
  {
    id: "future-pipeline",
    label: "Future Talent Pipeline",
    description: "Build relationships now for hires later.",
  },
];

export default function TalentTypeStep({
  value,
  onChange,
  onNext,
  stepNumber,
  totalSteps,
}: TalentTypeStepProps) {
  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="Hiring intent"
      title="What kind of talent are you looking for?"
      subtitle="This shapes how we shortlist candidates from the Career OS pool."
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
        {TALENT_TYPES.map((t) => {
          const isActive = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={cn(
                "col-span-12 rounded-2xl border p-5 text-left transition-all md:col-span-6",
                isActive
                  ? "border-clover/40 bg-clover/10"
                  : "glass-3 hover:bg-card/40",
              )}
            >
              <p
                className={cn(
                  "mb-1 font-semibold",
                  isActive && "text-clover",
                )}
              >
                {t.label}
              </p>
              <p className="text-muted-foreground text-sm leading-snug">
                {t.description}
              </p>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
