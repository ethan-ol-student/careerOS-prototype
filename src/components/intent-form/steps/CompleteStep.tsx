"use client";

import { ArrowRight, Check, Sparkles, Target } from "lucide-react";
import StepShell from "./StepShell";
import {
  stages,
  goals as allGoals,
  completionMessage,
  modules,
} from "../data";
import { Button } from "@/components/ui/Button";

interface CompleteStepProps {
  name: string;
  stage: string;
  goals: string[];
  field: string;
  targetJob: string;
  onEnter: () => void;
  stepNumber: number;
  totalSteps: number;
}

export default function CompleteStep({
  name,
  stage,
  goals: selectedGoals,
  field,
  targetJob,
  onEnter,
  stepNumber,
  totalSteps,
}: CompleteStepProps) {
  const firstName = name.split(" ")[0] || "there";
  const selectedStage = stages.find((s) => s.id === stage);
  const selectedGoalsList = allGoals.filter((g) =>
    selectedGoals.includes(g.id),
  );

  return (
    <StepShell
      stepNumber={stepNumber}
      totalSteps={totalSteps}
      eyebrow="All set"
      title={`Welcome, ${firstName}!`}
      subtitle={completionMessage}
      footer={
        <div className="flex justify-end">
          <Button onClick={onEnter} size="lg">
            Enter Career OS
            <ArrowRight />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-4">
        <div className="glass-3 col-span-12 rounded-2xl p-6 md:col-span-7">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="text-luminous size-4" />
            <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
              Your profile
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <ProfileRow label="Stage" value={selectedStage?.label || "—"} />
            <ProfileRow label="Field" value={field} />
            <div className="flex items-start gap-3">
              <div className="bg-clover mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                <Check className="size-3 text-white" strokeWidth={3} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground mb-1 text-xs uppercase tracking-[0.15em]">
                  Target job
                </p>
                <div className="bg-luminous/10 border-luminous/30 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                  <Target className="text-luminous size-3" />
                  <span className="text-sm font-medium">{targetJob}</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-clover mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                <Check className="size-3 text-white" strokeWidth={3} />
              </div>
              <div>
                <p className="text-muted-foreground mb-1.5 text-xs uppercase tracking-[0.15em]">
                  Goals
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGoalsList.map((g) => (
                    <span
                      key={g.id}
                      className="bg-luminous/15 text-luminous rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      {g.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-4 md:col-span-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.18em]">
            What you can do next
          </p>
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.id} className="glass-3 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-luminous/15 flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="text-luminous size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{module.label}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm leading-snug">
                      {module.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StepShell>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-clover mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
        <Check className="size-3 text-white" strokeWidth={3} />
      </div>
      <div>
        <p className="text-muted-foreground mb-0.5 text-xs uppercase tracking-[0.15em]">
          {label}
        </p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
