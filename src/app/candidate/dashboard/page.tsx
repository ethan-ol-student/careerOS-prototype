"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { useIntent } from "@/lib/context/IntentContext";
import { useNotifications } from "@/lib/context/NotificationsContext";
import { useGrowthLoop } from "@/components/dashboard/useGrowthLoop";
import { ChapterTimetableCard } from "@/components/dashboard/ChapterTimetableCard";
import { SkillEvolutionCard } from "@/components/dashboard/SkillEvolutionCard";
import { TrajectoryDiagram } from "@/components/dashboard/TrajectoryDiagram";
import {
  ProfilePanel,
  VisibilityPanel,
  AiRecommendationsPanel,
  ProgressPanel,
} from "@/components/dashboard/LoopPanels";
import { fullyMatchedDestinations } from "@/lib/jobs/destinations";

export default function CandidateDashboardPage() {
  return (
    <AppShell>
      <CandidateDashboardContent />
    </AppShell>
  );
}

function CandidateDashboardContent() {
  const { intent } = useIntent();
  const { addNotification } = useNotifications();

  // Stable callbacks for the growth loop. addSkill is fired *once*
  // per submission and is allowed to capture skill name; job-match
  // checks run in a useEffect against final state.skills.
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

  // Deduped job-match detection — fire one "important" notification
  // the first time the user covers every required skill for a job.
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
        body: `Your skill set covers every requirement. Want to reach out?`,
        actionLabel: "Reach out",
        payload: { jobId: m.id, jobTitle: m.title, company: m.company },
      });
    }
  }, [state.skills, addNotification]);

  const firstName = intent.name.split(" ")[0] || "there";

  return (
    <>
      <PageHeader
        eyebrow={`Aiming for ${intent.targetJob || "your next chapter"}`}
        title={
          <>
            Good day, <span className="text-luminous">{firstName}</span>.
          </>
        }
        description="Your dashboard runs a quiet feedback loop in the background. Add a skill in Skill Evolution and watch your profile, trajectory, visibility, and recommendations update."
        loopStatus={{ isRunning, step: state.step }}
        actions={
          <Badge variant="outline" className="hidden sm:inline-flex">
            <Sparkles className="size-3 text-luminous" />
            <span className="text-muted-foreground">
              {state.loops} {state.loops === 1 ? "loop" : "loops"} this session
            </span>
          </Badge>
        }
      />

      {/* Row 1: Readiness (target-job progress) full width */}
      <section className="px-4 py-8 sm:py-12">
        <Grid12>
          <Col span={12}>
            <ProgressPanel state={state} targetJob={intent.targetJob} />
          </Col>
          <Col span={12} lg={7}>
            <SkillEvolutionCard
              state={state}
              isRunning={isRunning}
              onAddSkill={addSkill}
              className="h-full"
            />
          </Col>
          <Col span={12} lg={5}>
            <ChapterTimetableCard className="h-full" />
          </Col>
        </Grid12>
      </section>

      {/* Row 2: 3D Trajectory */}
      <section className="line-t px-4 py-8 sm:py-12">
        <Grid12>
          <Col span={12}>
            <TrajectoryDiagram state={state} />
          </Col>
        </Grid12>
      </section>

      {/* Row 3: Balanced trio — Profile · Visibility · AI */}
      <section className="line-t px-4 py-8 sm:py-12">
        <Grid12>
          <Col span={12} lg={4}>
            <ProfilePanel
              state={state}
              firstName={firstName}
              field={intent.field}
              className="h-full"
            />
          </Col>
          <Col span={12} lg={4}>
            <VisibilityPanel state={state} className="h-full" />
          </Col>
          <Col span={12} lg={4}>
            <AiRecommendationsPanel state={state} className="h-full" />
          </Col>
        </Grid12>
      </section>
    </>
  );
}
