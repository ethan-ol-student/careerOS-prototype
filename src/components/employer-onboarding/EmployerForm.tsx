"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployer } from "@/lib/context/EmployerContext";
import { useIntent } from "@/lib/context/IntentContext";
import type { Priority, TalentType } from "@/lib/candidates/types";
import TalentTypeStep from "./steps/TalentTypeStep";
import RoleStep from "./steps/RoleStep";
import PrioritiesStep from "./steps/PrioritiesStep";
import EmployerAnalyzingStep from "./steps/EmployerAnalyzingStep";
import EmployerCompleteStep from "./steps/EmployerCompleteStep";

// Visible step counter (analyzing is a transient interstitial, not counted).
const TOTAL_STEPS = 4;

export default function EmployerForm() {
  const router = useRouter();
  const { setGoal, completeOnboarding } = useEmployer();
  const { setIntent } = useIntent();

  const [step, setStep] = useState(0);
  const [talentType, setTalentType] = useState<TalentType | "">("");
  const [role, setRole] = useState<string>("");
  const [priorities, setPriorities] = useState<Priority[]>([]);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  /** After Priorities → save the goal then enter the analyzing screen. */
  const handleSubmitPriorities = () => {
    setGoal({ talentType, role, priorities });
    next();
  };

  const handleEnterMarketplace = () => {
    completeOnboarding();
    // Mark intent as employer so shared navigation/context logic can
    // distinguish the two sides of the marketplace.
    setIntent({ role: "employer" });
    router.push("/employers/marketplace");
  };

  // 0 Talent → 1   1 Role → 2   2 Priorities → 3
  // 3 Analyzing → 4 (transient)
  // 4 Complete → 4
  const stepNumber = Math.min(step + 1, TOTAL_STEPS);

  switch (step) {
    case 0:
      return (
        <TalentTypeStep
          value={talentType}
          onChange={(v) => setTalentType(v)}
          onNext={next}
          stepNumber={stepNumber}
          totalSteps={TOTAL_STEPS}
        />
      );
    case 1:
      return (
        <RoleStep
          value={role}
          onChange={setRole}
          onNext={next}
          onBack={back}
          stepNumber={stepNumber}
          totalSteps={TOTAL_STEPS}
        />
      );
    case 2:
      return (
        <PrioritiesStep
          value={priorities}
          onChange={setPriorities}
          onNext={handleSubmitPriorities}
          onBack={back}
          stepNumber={stepNumber}
          totalSteps={TOTAL_STEPS}
        />
      );
    case 3:
      return <EmployerAnalyzingStep onDone={next} />;
    case 4:
      return (
        <EmployerCompleteStep
          role={role}
          onEnter={handleEnterMarketplace}
          stepNumber={TOTAL_STEPS}
          totalSteps={TOTAL_STEPS}
        />
      );
    default:
      return null;
  }
}
