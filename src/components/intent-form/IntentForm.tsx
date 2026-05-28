"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIntent } from "@/lib/context/IntentContext";
import StageStep from "./steps/StageStep";
import GoalsStep from "./steps/GoalsStep";
import DetailsStep from "./steps/DetailsStep";
import TargetJobStep from "./steps/TargetJobStep";
import AnalyzingStep from "./steps/AnalyzingStep";
import CompleteStep from "./steps/CompleteStep";

// Visible step counter (Analyzing is a transient interstitial, not counted).
const TOTAL_STEPS = 5;

export default function IntentForm() {
  const router = useRouter();
  const { setIntent } = useIntent();

  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [name, setName] = useState<string>("");
  const [field, setField] = useState<string>("");
  const [targetJob, setTargetJob] = useState<string>("");

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  /** After TargetJob → save full intent, then enter Analyzing. */
  const handleSubmitTargetJob = () => {
    setIntent({
      role: "candidate",
      stage,
      goals: selectedGoals,
      name,
      field,
      targetJob,
    });
    handleNext(); // → AnalyzingStep
  };

  const handleEnterApp = () => {
    router.push("/candidate/dashboard");
  };

  // Map step index → visible step counter (1..TOTAL_STEPS).
  // 0 Stage → 1   1 Goals → 2   2 Details → 3   3 Target → 4
  // 4 Analyzing → 5 (not user-controlled)
  // 5 Complete → 5
  const stepNumber = Math.min(step + 1, TOTAL_STEPS);

  switch (step) {
    case 0:
      return (
        <StageStep
          value={stage}
          onChange={setStage}
          onNext={handleNext}
          stepNumber={stepNumber}
          totalSteps={TOTAL_STEPS}
        />
      );
    case 1:
      return (
        <GoalsStep
          value={selectedGoals}
          onChange={setSelectedGoals}
          onNext={handleNext}
          onBack={handleBack}
          stepNumber={stepNumber}
          totalSteps={TOTAL_STEPS}
        />
      );
    case 2:
      return (
        <DetailsStep
          name={name}
          field={field}
          onNameChange={setName}
          onFieldChange={setField}
          onNext={handleNext}
          onBack={handleBack}
          stepNumber={stepNumber}
          totalSteps={TOTAL_STEPS}
        />
      );
    case 3:
      return (
        <TargetJobStep
          value={targetJob}
          onChange={setTargetJob}
          onNext={handleSubmitTargetJob}
          onBack={handleBack}
          stepNumber={stepNumber}
          totalSteps={TOTAL_STEPS}
        />
      );
    case 4:
      return <AnalyzingStep onDone={handleNext} />;
    case 5:
      return (
        <CompleteStep
          name={name}
          stage={stage}
          goals={selectedGoals}
          field={field}
          targetJob={targetJob}
          onEnter={handleEnterApp}
          stepNumber={TOTAL_STEPS}
          totalSteps={TOTAL_STEPS}
        />
      );
    default:
      return null;
  }
}
