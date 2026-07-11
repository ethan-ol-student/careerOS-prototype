"use client";

import { useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Flag,
  Lightbulb,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { CockpitDashboard } from "@/components/dashboard/CockpitDashboard";
import {
  JUDGE_CANDIDATE_MESSAGES,
  JUDGE_DEMO_CANDIDATES,
  JUDGE_DEMO_CHAPTERS,
  JUDGE_DEMO_PORTFOLIO,
  JUDGE_EMPLOYER_GOAL,
  JUDGE_EMPLOYER_MESSAGES,
  JUDGE_PHASE_STORY,
  buildJudgeDashboardData,
} from "@/lib/judge/demoData";
import type { Candidate } from "@/lib/candidates/types";
import type { CareerPhase } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { useJudgeTour } from "./JudgeTourProvider";

export function JudgeTourCurrentView() {
  const { currentView, currentPhase } = useJudgeTour();

  if (currentView === "start") return <JudgeStartView />;
  if (currentView === "candidate-dashboard") {
    return <JudgeCandidateDashboardView phase={currentPhase} />;
  }
  if (currentView === "living-portfolio") return <JudgePortfolioView />;
  if (currentView === "life-chapters") return <JudgeChaptersView />;
  if (currentView === "candidate-messages") return <JudgeCandidateMessagesView />;
  if (
    currentView === "employer-marketplace" ||
    currentView === "candidate-profile"
  ) {
    return <JudgeEmployerMarketplaceView forceProfile={currentView === "candidate-profile"} />;
  }
  if (currentView === "employer-messages") return <JudgeEmployerMessagesView />;
  return <JudgeFinalView />;
}

function JudgeStartView() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-6 px-4 py-8">
      <section
        data-judge-target="tour-start"
        className="glass-4 rounded-2xl p-6 sm:p-8"
      >
        <Badge variant="outline" className="mb-4">
          <Sparkles className="size-3 text-luminous" />
          Judge-only walkthrough
        </Badge>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
          CareerOS evaluation tour
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl text-sm leading-relaxed sm:text-base">
          This guided walkthrough demonstrates the candidate growth loop, the
          six career phases, portfolio evidence, life planning, employer
          matching, candidate details, and messaging.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoPanel
          target="demo-data"
          icon={BadgeCheck}
          title="Isolated demo account"
          eyebrow="Security"
        >
          The judge account uses seeded demo rows and hidden marketplace
          candidates. Normal users cannot enter this route or see judge controls.
        </InfoPanel>
        <InfoPanel
          target="career-loop"
          icon={TrendingUp}
          title="Candidate to employer loop"
          eyebrow="Product story"
        >
          Candidates build evidence and direction. CareerOS turns that evidence
          into readable signals. Employers discover relevant talent and connect.
        </InfoPanel>
      </div>
    </div>
  );
}

function JudgeCandidateDashboardView({ phase }: { phase: CareerPhase }) {
  const data = useMemo(() => buildJudgeDashboardData(phase), [phase]);
  const story = JUDGE_PHASE_STORY[phase];

  return (
    <div data-judge-target="candidate-dashboard" className="pb-8">
      <div className="mx-auto max-w-container px-4 pt-6">
        <div className="glass-3 mb-4 grid gap-3 rounded-2xl p-4 lg:grid-cols-4">
          <MiniSignal label="Main goal" value={story.mainGoal} />
          <MiniSignal label="Widgets" value={story.relevantWidgets} />
          <MiniSignal label="Milestone" value={story.transitionMilestone} />
          <MiniSignal label="System learns" value={story.systemLearns} />
        </div>
      </div>
      <div data-judge-target="phase-widgets">
        <CockpitDashboard data={data} />
      </div>
    </div>
  );
}

function JudgePortfolioView() {
  return (
    <div className="mx-auto max-w-container px-4 py-8">
      <header data-judge-target="portfolio-overview" className="mb-6">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Living Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Evidence that grows with the candidate
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
          This is demo-safe candidate evidence. The production portfolio editor
          already stores user-owned skills, projects, certifications,
          experience, and CV content.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-3 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="size-5 text-luminous" />
            {JUDGE_DEMO_PORTFOLIO.headline}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {JUDGE_DEMO_PORTFOLIO.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {JUDGE_DEMO_PORTFOLIO.skills.map((skill) => (
              <Chip key={skill} tone="luminous">
                {skill}
              </Chip>
            ))}
          </div>
        </section>

        <section data-judge-target="portfolio-evidence" className="glass-3 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="size-5 text-clover" />
            Proof employers can inspect
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {JUDGE_DEMO_PORTFOLIO.projects.map((project) => (
              <li
                key={project.title}
                className="border-border/15 rounded-xl border bg-card/30 p-3"
              >
                <p className="text-sm font-semibold">{project.title}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {project.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function JudgeChaptersView() {
  return (
    <div className="mx-auto max-w-container px-4 py-8">
      <header className="mb-6">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Life Chapter Designer
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Planning career progress inside real life
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section data-judge-target="chapter-timetable" className="glass-3 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="size-5 text-luminous" />
            Upcoming timetable
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {JUDGE_DEMO_CHAPTERS.map((chapter) => (
              <li
                key={chapter.name}
                className="flex items-start gap-3 rounded-xl border border-border/15 bg-card/30 p-3"
              >
                <span className="mt-1 size-2 rounded-full bg-luminous" />
                <div>
                  <p className="text-sm font-semibold">{chapter.name}</p>
                  <p className="text-muted-foreground text-xs">
                    In {chapter.dateOffset} days at {chapter.time} - {chapter.priority} priority
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section data-judge-target="chapter-tasks" className="glass-3 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Check className="size-5 text-clover" />
            Goals and tasks
          </h2>
          <div className="mt-4 grid gap-3">
            {JUDGE_DEMO_CHAPTERS.map((chapter) => (
              <div key={chapter.name} className="rounded-xl border border-border/15 bg-card/30 p-3">
                <p className="text-sm font-semibold">{chapter.name}</p>
                <ul className="mt-2 grid gap-2">
                  {chapter.subtasks.map((task) => (
                    <li key={task.id} className="flex items-center gap-2 text-xs">
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded border",
                          task.done
                            ? "border-clover bg-clover text-white"
                            : "border-border bg-background/40",
                        )}
                      >
                        {task.done ? <Check className="size-3" /> : null}
                      </span>
                      {task.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function JudgeCandidateMessagesView() {
  return (
    <MessageDemo
      target="candidate-messages"
      title="Candidate inbox"
      eyebrow="Candidate messages"
      messages={JUDGE_CANDIDATE_MESSAGES}
      accent="luminous"
    />
  );
}

function JudgeEmployerMarketplaceView({ forceProfile }: { forceProfile: boolean }) {
  const { currentStep } = useJudgeTour();
  const [saved, setSaved] = useState(false);
  const [invited, setInvited] = useState(false);
  const [manualCandidate, setManualCandidate] = useState<Candidate | null>(null);
  const primary = JUDGE_DEMO_CANDIDATES[0];
  const activeCandidate = forceProfile ? primary : manualCandidate;
  const stepSaved =
    currentStep.id === "save-candidate" ||
    currentStep.id === "invite-candidate";
  const stepInvited = currentStep.id === "invite-candidate";
  const primarySaved = saved || stepSaved;
  const primaryInvited = invited || stepInvited;

  return (
    <div className="mx-auto max-w-container px-4 py-8">
      <section data-judge-target="employer-goal" className="glass-4 mb-6 rounded-2xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-clover text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Employer goal
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              {JUDGE_EMPLOYER_GOAL.organization}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
              {JUDGE_EMPLOYER_GOAL.hiringGoal}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {JUDGE_EMPLOYER_GOAL.preferredSkills.map((skill) => (
              <Chip key={skill} tone="clover">
                {skill}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section data-judge-target="candidate-recommendations">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
            Recommended candidates
          </p>
          <Badge variant="outline">{JUDGE_DEMO_CANDIDATES.length} demo matches</Badge>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {JUDGE_DEMO_CANDIDATES.map((candidate, index) => (
            <DemoCandidateCard
              key={candidate.id}
              candidate={candidate}
              featured={index === 0}
              saved={candidate.id === primary.id && primarySaved}
              invited={candidate.id === primary.id && primaryInvited}
              onOpen={() => setManualCandidate(candidate)}
              onSave={() => setSaved((value) => !value)}
            />
          ))}
        </div>
      </section>

      {activeCandidate ? (
        <DemoCandidateModal
          candidate={activeCandidate}
          saved={activeCandidate.id === primary.id ? primarySaved : saved}
          invited={activeCandidate.id === primary.id ? primaryInvited : invited}
          onSave={() => setSaved((value) => !value)}
          onInvite={() => setInvited(true)}
          onClose={() => setManualCandidate(null)}
        />
      ) : null}
    </div>
  );
}

function DemoCandidateCard({
  candidate,
  featured,
  saved,
  invited,
  onOpen,
  onSave,
}: {
  candidate: Candidate;
  featured: boolean;
  saved: boolean;
  invited: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  return (
    <article className="glass-3 flex h-full flex-col gap-4 rounded-2xl p-5">
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-2"
        >
          {initials(candidate.name)}
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{candidate.name}</h2>
          <p className="text-muted-foreground truncate text-xs">
            {candidate.targetRole} - {candidate.stage}
          </p>
        </div>
        {featured ? <Star className="size-4 text-yellow-300" /> : null}
      </header>
      <p className="text-sm leading-snug">{candidate.careerDirection}</p>
      <div data-judge-target={featured ? "candidate-score" : undefined} className="grid grid-cols-2 gap-2">
        <ScoreBar label="Match" value={candidate.matchScore} accent="luminous" size="sm" />
        <ScoreBar label="Readiness" value={candidate.readinessScore} accent="clover" size="sm" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip tone="clover" icon={<TrendingUp className="size-3" />}>
          {candidate.growthSignal}
        </Chip>
        {candidate.topSkills.slice(0, 3).map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
      </div>
      <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
        {candidate.whyRecommended}
      </p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onOpen}>
          Profile
        </Button>
        <Button type="button" variant={saved ? "secondary" : "outline"} size="sm" onClick={onSave}>
          {saved ? "Saved" : "Save"}
        </Button>
      </div>
      {invited ? (
        <p className="text-clover text-xs">Invite sent in judge demo state.</p>
      ) : null}
    </article>
  );
}

function DemoCandidateModal({
  candidate,
  saved,
  invited,
  onSave,
  onInvite,
  onClose,
}: {
  candidate: Candidate;
  saved: boolean;
  invited: boolean;
  onSave: () => void;
  onInvite: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={candidate.name}
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 border-t border-border/15 pt-4 sm:flex-row sm:justify-end">
          <Button
            data-judge-target="save-candidate"
            type="button"
            variant={saved ? "secondary" : "outline"}
            onClick={onSave}
          >
            <Star className="size-4" />
            {saved ? "Saved" : "Save Candidate"}
          </Button>
          <Button
            data-judge-target="invite-candidate"
            type="button"
            onClick={onInvite}
          >
            <Send className="size-4" />
            {invited ? "Invite Sent" : "Invite Candidate"}
          </Button>
        </div>
      }
    >
      <div data-judge-target="candidate-profile-modal">
        <div className="mb-5 flex items-start gap-4">
          <div className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ring-2">
            {initials(candidate.name)}
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight">{candidate.name}</p>
            <p className="text-muted-foreground text-sm">
              {candidate.targetRole} - {candidate.industry}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{candidate.headline}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ScoreBar label="Match" value={candidate.matchScore} accent="luminous" />
          <ScoreBar label="Readiness" value={candidate.readinessScore} accent="clover" />
          <div className="glass-3 rounded-lg p-3">
            <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
              Growth signal
            </p>
            <p className="text-clover mt-1 flex items-center gap-1 text-sm font-semibold">
              <TrendingUp className="size-4" />
              {candidate.growthSignal}
            </p>
          </div>
        </div>
        <section className="mt-5">
          <p className="text-luminous text-[10px] font-mono font-semibold uppercase tracking-[0.18em]">
            Why recommended
          </p>
          <p className="mt-2 text-sm leading-relaxed">{candidate.whyRecommended}</p>
        </section>
        <section className="mt-5">
          <p className="text-luminous text-[10px] font-mono font-semibold uppercase tracking-[0.18em]">
            Portfolio evidence
          </p>
          <ul className="mt-2 grid gap-2">
            {candidate.portfolioProjects.map((project) => (
              <li key={project} className="glass-3 rounded-lg p-3 text-sm">
                {project}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}

function JudgeEmployerMessagesView() {
  return (
    <MessageDemo
      target="employer-messages"
      title="Employer conversations"
      eyebrow="Employer messages"
      messages={JUDGE_EMPLOYER_MESSAGES.flatMap((thread) =>
        thread.messages.map((message) => ({
          sender: message.sender,
          body: `${thread.candidateName}: ${message.body}`,
        })),
      )}
      accent="clover"
    />
  );
}

function JudgeFinalView() {
  const { restart, skip, finish } = useJudgeTour();
  return (
    <div className="mx-auto grid max-w-container gap-4 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section data-judge-target="final-loop" className="glass-4 rounded-2xl p-6">
        <Flag className="mb-4 size-8 text-luminous" />
        <h1 className="text-3xl font-semibold tracking-tight">Full loop summary</h1>
        <div className="mt-5 grid gap-3">
          {[
            "Candidate builds evidence and direction.",
            "CareerOS turns progress into readable signals.",
            "Employer sees relevant talent through matching.",
            "Both sides connect through marketplace and messaging.",
          ].map((item) => (
            <p key={item} className="flex items-center gap-2 text-sm">
              <ArrowRight className="size-4 text-luminous" />
              {item}
            </p>
          ))}
        </div>
      </section>

      <section data-judge-target="future-work" className="glass-3 rounded-2xl p-6">
        <Lightbulb className="mb-4 size-8 text-yellow-300" />
        <h2 className="text-xl font-semibold tracking-tight">
          Current vs future implementation
        </h2>
        <ul className="text-muted-foreground mt-4 grid gap-2 text-sm">
          <li>Functional: auth-protected judge route, dashboard phases, portfolio, saved state.</li>
          <li>Prototype: recommendation scoring, profile modal, messaging bridge.</li>
          <li>Planned: real AI engine, deeper matching, production analytics, task generation, portfolio verification.</li>
        </ul>
        <div data-judge-target="final-actions" className="mt-5 flex flex-wrap gap-2">
          <Button type="button" onClick={finish}>
            <Check className="size-4" />
            Finish Tour
          </Button>
          <Button type="button" variant="outline" onClick={restart}>
            <RotateCcw className="size-4" />
            Restart Tour
          </Button>
          <Button type="button" variant="ghost" onClick={skip}>
            Explore Freely
          </Button>
        </div>
      </section>
    </div>
  );
}

function MessageDemo({
  target,
  title,
  eyebrow,
  messages,
  accent,
}: {
  target: string;
  title: string;
  eyebrow: string;
  messages: Array<{ sender: "candidate" | "employer"; body: string }>;
  accent: "luminous" | "clover";
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <section data-judge-target={target} className="glass-4 rounded-2xl p-5">
        <p
          className={cn(
            "text-xs font-mono font-semibold uppercase tracking-[0.18em]",
            accent === "luminous" ? "text-luminous" : "text-clover",
          )}
        >
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-6 flex flex-col gap-3">
          {messages.map((message, index) => {
            const own =
              (accent === "luminous" && message.sender === "candidate") ||
              (accent === "clover" && message.sender === "employer");
            return (
              <div
                key={`${message.sender}-${index}`}
                className={cn("flex", own ? "justify-end" : "justify-start")}
              >
                <p
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    own
                      ? accent === "luminous"
                        ? "bg-luminous text-white"
                        : "bg-clover text-white"
                      : "bg-card/60 text-foreground",
                  )}
                >
                  {message.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function InfoPanel({
  target,
  icon: Icon,
  title,
  eyebrow,
  children,
}: {
  target: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section data-judge-target={target} className="glass-3 rounded-2xl p-5">
      <Icon className="mb-3 size-6 text-luminous" />
      <p className="text-luminous text-[10px] font-mono font-semibold uppercase tracking-[0.18em]">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {children}
      </p>
    </section>
  );
}

function MiniSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/15 bg-card/30 p-3">
      <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 text-xs leading-relaxed">{value}</p>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
