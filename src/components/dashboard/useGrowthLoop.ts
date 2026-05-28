"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LoopStep } from "./GrowthLoop";
import type { LoopState } from "./LoopPanels";
import { LOOP_NODES } from "./GrowthLoop";

const STEP_MS = 850; // default dwell time per loop step

/**
 * Resolve the per-step dwell time, honouring the user's
 * `prefers-reduced-motion` setting. We do a JIT lookup (rather than
 * a subscribed React state) because the value is only sampled when
 * a skill is added, which happens far less often than rerenders.
 * SSR-safe: returns the default when `window` is missing.
 */
function getStepDwellMs(): number {
  if (typeof window === "undefined") return STEP_MS;
  if (typeof window.matchMedia !== "function") return STEP_MS;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : STEP_MS;
  } catch {
    return STEP_MS;
  }
}

/**
 * Drives the 8-step growth loop. Calling `addSkill(name)` advances
 * the state machine: add-skill → profile → trajectory → opportunities
 * → visibility → ai → progress → loop → idle.
 */
export function useGrowthLoop({
  onSkillAdded,
  onLoopComplete,
}: {
  onSkillAdded?: (skill: string) => void;
  onLoopComplete?: () => void;
} = {}): {
  state: LoopState;
  addSkill: (skill: string) => void;
  isRunning: boolean;
  resetLoop: () => void;
} {
  const [state, setState] = useState<LoopState>({
    skills: [],
    progress: 10,
    step: "idle",
    reached: new Set<LoopStep>(),
    loops: 0,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const addSkill = useCallback(
    (skill: string) => {
      if (isRunning) return;
      // Sanitize: strip quotes (they break the AI recommendation
      // template `Pair "${latest}" with …`) and cap length so cards
      // don't overflow.
      const safe = skill.replace(/["“”]/g, "").trim().slice(0, 60);
      if (!safe) return;

      // Sample reduced-motion once per skill add so the entire chain
      // for this skill runs at a consistent cadence.
      const dwell = getStepDwellMs();
      setIsRunning(true);

      setState((s) => ({
        ...s,
        skills: [...s.skills, safe],
        step: "add-skill",
        reached: new Set([...s.reached, "add-skill"]),
      }));
      onSkillAdded?.(safe);

      const order: LoopStep[] = LOOP_NODES.slice(1).map((n) => n.step);
      let i = 0;

      const tick = () => {
        const nextStep = order[i];
        if (!nextStep) {
          timeoutRef.current = setTimeout(() => {
            setState((s) => ({
              ...s,
              step: "idle",
              reached: new Set<LoopStep>(),
            }));
            setIsRunning(false);
            onLoopComplete?.();
          }, dwell);
          return;
        }

        setState((s) => {
          const reached = new Set(s.reached);
          reached.add(nextStep);
          const next: LoopState = { ...s, step: nextStep, reached };

          if (nextStep === "progress") {
            next.progress = Math.min(s.progress + 7, 100);
          }
          if (nextStep === "loop") {
            next.loops = s.loops + 1;
          }
          return next;
        });
        i += 1;
        timeoutRef.current = setTimeout(tick, dwell);
      };

      timeoutRef.current = setTimeout(tick, dwell);
    },
    [isRunning, onSkillAdded, onLoopComplete],
  );

  const resetLoop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState({
      skills: [],
      progress: 10,
      step: "idle",
      reached: new Set<LoopStep>(),
      loops: 0,
    });
    setIsRunning(false);
  }, []);

  return { state, addSkill, isRunning, resetLoop };
}
