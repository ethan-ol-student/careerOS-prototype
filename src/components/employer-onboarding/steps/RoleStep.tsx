"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import StepShell from "@/components/intent-form/steps/StepShell";
import { Button } from "@/components/ui/Button";
import { validateRoleTitle } from "@/lib/validation";
import { cn } from "@/lib/utils";

interface RoleStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
  totalSteps: number;
}

const ROLE_SUGGESTIONS = [
  "Frontend Developer",
  "Data Analyst",
  "UI/UX Designer",
  "Marketing Executive",
  "Mechanical Engineer",
  "Software Engineer",
  "Product Designer",
];

export default function RoleStep({
  value,
  onChange,
  onNext,
  onBack,
  stepNumber,
  totalSteps,
}: RoleStepProps) {
  const [error, setError] = useState<string | null>(null);

  // Run validation inline so the Continue button reflects current
  // state; we also re-run on submit to surface the error message.
  const validation = validateRoleTitle(value);
  const canContinue = validation.ok;

  const handleContinue = () => {
    const result = validateRoleTitle(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // Persist the sanitized value back to the parent so the goal
    // store doesn't keep stray whitespace / control chars.
    if (result.value !== value) onChange(result.value);
    setError(null);
    onNext();
  };

  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="The role"
      title="What role are you hiring or scouting for?"
      subtitle="Pick a suggestion or type your own — we'll match candidates whose direction lines up."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack} size="lg">
            <ArrowLeft />
            Back
          </Button>
          <Button onClick={handleContinue} disabled={!canContinue} size="lg">
            Continue
            <ArrowRight />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <label
            htmlFor="role-input"
            className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]"
          >
            Role title
          </label>
          <input
            id="role-input"
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Frontend Developer"
            maxLength={80}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "role-input-error" : undefined}
            className={cn(
              "glass-3 focus-visible:border-luminous focus-visible:ring-luminous/40 mt-2 w-full rounded-xl border border-transparent px-4 py-3 text-base outline-none transition-colors focus-visible:ring-2",
              error && "border-destructive/60 focus-visible:ring-destructive/40",
            )}
          />
          {error ? (
            <p
              id="role-input-error"
              role="alert"
              className="text-destructive mt-2 inline-flex items-center gap-1.5 text-xs"
            >
              <AlertCircle className="size-3.5" aria-hidden />
              {error}
            </p>
          ) : null}
        </div>

        <div className="col-span-12">
          <p className="text-muted-foreground mb-3 text-xs uppercase tracking-wider">
            Common picks
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLE_SUGGESTIONS.map((role) => {
              const isActive = value.trim().toLowerCase() === role.toLowerCase();
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    onChange(role);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-all",
                    isActive
                      ? "border-luminous bg-luminous/10 text-luminous ring-2 ring-luminous/30"
                      : "border-border/60 bg-card/40 text-foreground hover:border-luminous/60 hover:text-luminous",
                  )}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </StepShell>
  );
}
