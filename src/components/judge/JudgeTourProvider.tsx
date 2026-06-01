"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  JUDGE_TOUR_STEPS,
  type JudgeTourStep,
  type JudgeTourView,
} from "@/lib/judge/judgeTourSteps";
import type { CareerPhase } from "@/lib/dashboard/types";

interface JudgeTourContextValue {
  steps: JudgeTourStep[];
  currentStep: JudgeTourStep;
  currentIndex: number;
  currentView: JudgeTourView;
  currentPhase: CareerPhase;
  isRunning: boolean;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
  restart: () => void;
  goToView: (view: JudgeTourView) => void;
}

const JudgeTourContext = createContext<JudgeTourContextValue | undefined>(
  undefined,
);

function phaseForIndex(index: number): CareerPhase {
  for (let i = index; i >= 0; i -= 1) {
    const phase = JUDGE_TOUR_STEPS[i]?.phase;
    if (phase) return phase;
  }
  return "young_adult";
}

export function JudgeTourProvider({ children }: { children: ReactNode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const lastIndex = JUDGE_TOUR_STEPS.length - 1;
  const currentStep = JUDGE_TOUR_STEPS[currentIndex] ?? JUDGE_TOUR_STEPS[0];

  const next = useCallback(() => {
    setIsRunning(true);
    setCurrentIndex((index) => Math.min(index + 1, lastIndex));
  }, [lastIndex]);

  const back = useCallback(() => {
    setIsRunning(true);
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }, []);

  const skip = useCallback(() => {
    setIsRunning(false);
  }, []);

  const finish = useCallback(() => {
    setCurrentIndex(lastIndex);
    setIsRunning(false);
  }, [lastIndex]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setIsRunning(true);
  }, []);

  const goToView = useCallback((view: JudgeTourView) => {
    const index = JUDGE_TOUR_STEPS.findIndex((step) => step.view === view);
    if (index >= 0) {
      setCurrentIndex(index);
      setIsRunning(true);
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") back();
      if (event.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [back, isRunning, next, skip]);

  const value = useMemo<JudgeTourContextValue>(
    () => ({
      steps: JUDGE_TOUR_STEPS,
      currentStep,
      currentIndex,
      currentView: currentStep.view,
      currentPhase: phaseForIndex(currentIndex),
      isRunning,
      isFirst: currentIndex === 0,
      isLast: currentIndex === lastIndex,
      next,
      back,
      skip,
      finish,
      restart,
      goToView,
    }),
    [
      back,
      currentIndex,
      currentStep,
      finish,
      goToView,
      isRunning,
      lastIndex,
      next,
      restart,
      skip,
    ],
  );

  return (
    <JudgeTourContext.Provider value={value}>
      {children}
    </JudgeTourContext.Provider>
  );
}

export function useJudgeTour() {
  const ctx = useContext(JudgeTourContext);
  if (!ctx) throw new Error("useJudgeTour must be used inside JudgeTourProvider");
  return ctx;
}
