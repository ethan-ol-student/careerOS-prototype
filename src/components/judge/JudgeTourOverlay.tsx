"use client";

import { JudgeTourHighlight } from "./JudgeTourHighlight";
import { JudgeTourStepCard } from "./JudgeTourStepCard";
import { useJudgeTour } from "./JudgeTourProvider";

export function JudgeTourOverlay() {
  const { currentStep, isRunning } = useJudgeTour();
  if (!isRunning) return null;

  return (
    <>
      <JudgeTourHighlight target={currentStep.target} />
      <JudgeTourStepCard />
    </>
  );
}
