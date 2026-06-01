"use client";

import { useEffect, useRef } from "react";
import { Col } from "@/components/app/Grid";
import { PhaseWidgetGrid } from "@/components/dashboard/PhaseWidgetGrid";
import { useGrowthLoop } from "@/components/dashboard/useGrowthLoop";
import { SkillEvolutionCard } from "@/components/dashboard/SkillEvolutionCard";
import { ProgressPanel } from "@/components/dashboard/LoopPanels";
import { useNotifications } from "@/lib/context/NotificationsContext";
import { fullyMatchedDestinations } from "@/lib/jobs/destinations";
import type { CandidateDashboardData } from "@/lib/dashboard/types";

/**
 * Preserves Career OS's signature "hidden growth loop": adding a skill
 * cascades through profile → trajectory → readiness and fires skill /
 * job-match notifications.
 *
 * Extracted from the legacy single dashboard page so the behavior lives
 * in one reusable, phase-agnostic widget. It's mounted by the phases
 * where readiness is the point (early_career), and is driven entirely
 * by the passed-in `data` — no direct context coupling beyond the
 * shared notification system.
 */
export function ReadinessGrowthSection({
  data,
}: {
  data: CandidateDashboardData;
}) {
  const { addNotification } = useNotifications();

  const { state, addSkill, isRunning } = useGrowthLoop({
    onSkillAdded: (skill) => {
      addNotification({
        kind: "skill",
        severity: "info",
        title: `Skill acquired · ${skill}`,
        body: "We've added it to your Living Portfolio and recomputed your trajectory.",
      });
    },
  });

  // Seed the loop with the candidate's onboarding skills the first time
  // it mounts, so the readiness view isn't empty for users who already
  // told us their stack. Only the first three to avoid spamming.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (state.skills.length > 0) return;
    const seeds = data.currentSkills.length
      ? data.currentSkills
      : data.portfolio.skills;
    if (seeds.length === 0) return;
    seededRef.current = true;
    for (const skill of seeds.slice(0, 3)) addSkill(skill);
  }, [data.currentSkills, data.portfolio.skills, state.skills.length, addSkill]);

  // Deduped job-match detection — one "important" notification the first
  // time the user covers every required skill for a destination.
  const alreadyFired = useRef<Set<string>>(new Set());
  useEffect(() => {
    const matches = fullyMatchedDestinations(state.skills);
    for (const m of matches) {
      if (alreadyFired.current.has(m.id)) continue;
      alreadyFired.current.add(m.id);
      addNotification({
        kind: "job-match",
        severity: "important",
        title: `You match ${m.title} at ${m.company}`,
        body: "Your skill set covers every requirement. Want to reach out?",
        actionLabel: "Reach out",
        payload: { jobId: m.id, jobTitle: m.title, company: m.company },
      });
    }
  }, [state.skills, addNotification]);

  return (
    <PhaseWidgetGrid topLine>
      <Col span={12}>
        <ProgressPanel state={state} targetJob={data.targetJob} />
      </Col>
      <Col span={12}>
        <SkillEvolutionCard
          state={state}
          isRunning={isRunning}
          onAddSkill={addSkill}
        />
      </Col>
    </PhaseWidgetGrid>
  );
}
