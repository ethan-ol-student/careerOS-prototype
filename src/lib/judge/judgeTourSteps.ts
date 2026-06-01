import type { CareerPhase } from "../dashboard/types";

export type JudgeTourView =
  | "start"
  | "candidate-dashboard"
  | "living-portfolio"
  | "life-chapters"
  | "candidate-messages"
  | "employer-marketplace"
  | "candidate-profile"
  | "employer-messages"
  | "final";

export type JudgeTourStatus = "Functional" | "Prototype" | "Planned";

export interface JudgeTourStep {
  id: string;
  view: JudgeTourView;
  title: string;
  body: string;
  target?: string;
  phase?: CareerPhase;
  status: JudgeTourStatus;
}

export const JUDGE_TOUR_STEPS: JudgeTourStep[] = [
  {
    id: "welcome",
    view: "start",
    title: "Welcome to CareerOS",
    body:
      "This judge-only walkthrough shows the full loop: candidates grow through phase-based guidance, then employers discover talent through evidence and readiness signals.",
    target: "[data-judge-target='tour-start']",
    status: "Functional",
  },
  {
    id: "demo-data",
    view: "start",
    title: "Demo-safe data",
    body:
      "Everything in this tour uses isolated judge demo data. It does not expose real users and it does not mutate production candidate or employer records.",
    target: "[data-judge-target='demo-data']",
    status: "Functional",
  },
  {
    id: "core-loop",
    view: "start",
    title: "The CareerOS loop",
    body:
      "CareerOS helps candidates build direction and evidence. Employers read those signals as trajectory, readiness, and fit rather than only keyword matches.",
    target: "[data-judge-target='career-loop']",
    status: "Prototype",
  },
  {
    id: "candidate-dashboard-open",
    view: "candidate-dashboard",
    title: "Candidate dashboard",
    body:
      "The candidate dashboard is the command center. It resolves the candidate's current career phase and renders the right guidance for that moment.",
    target: "[data-judge-target='candidate-dashboard']",
    status: "Functional",
  },
  {
    id: "phase-architecture",
    view: "candidate-dashboard",
    title: "Phase-driven architecture",
    body:
      "A single dashboard route swaps phase-specific widgets behind a stable shell. The URL stays steady while the experience adapts.",
    target: "[data-judge-target='phase-widgets']",
    status: "Functional",
  },
  {
    id: "active-phase",
    view: "candidate-dashboard",
    title: "Active phase indicator",
    body:
      "The active phase indicator explains the candidate's current phase, the purpose of that phase, and progress toward the next one.",
    target: "[data-judge-target='phase-indicator']",
    status: "Functional",
  },
  {
    id: "layout-adapts",
    view: "candidate-dashboard",
    title: "Layouts adapt by phase",
    body:
      "Each phase changes the goal, widgets, milestones, and learning signals shown to the candidate without changing the route.",
    target: "[data-judge-target='phase-widgets']",
    status: "Functional",
  },
  {
    id: "phase-student",
    view: "candidate-dashboard",
    title: "Student phase",
    body:
      "Goal: discover interests and start early proof. Widgets focus on exploration, subject logs, and first skills. CareerOS learns interests and early strengths.",
    target: "[data-judge-target='candidate-dashboard']",
    phase: "student",
    status: "Prototype",
  },
  {
    id: "phase-young-adult",
    view: "candidate-dashboard",
    title: "Young Adult phase",
    body:
      "Goal: build portfolio and internship readiness. Widgets focus on target roles, skill mapping, and portfolio completeness. Milestones push toward application readiness.",
    target: "[data-judge-target='candidate-dashboard']",
    phase: "young_adult",
    status: "Functional",
  },
  {
    id: "phase-early-career",
    view: "candidate-dashboard",
    title: "Early Career phase",
    body:
      "Goal: land the right role and grow market value. Widgets focus on pipeline, applications, and readiness gaps. CareerOS learns traction and work evidence.",
    target: "[data-judge-target='candidate-dashboard']",
    phase: "early_career",
    status: "Prototype",
  },
  {
    id: "phase-mid-career",
    view: "candidate-dashboard",
    title: "Mid-Career phase",
    body:
      "Goal: prevent stagnation and choose a stronger next move. Widgets focus on specialization, risk, and leadership branches. Milestones emphasize high-impact proof.",
    target: "[data-judge-target='candidate-dashboard']",
    phase: "mid_career",
    status: "Prototype",
  },
  {
    id: "phase-senior-career",
    view: "candidate-dashboard",
    title: "Senior Career phase",
    body:
      "Goal: turn experience into influence. Widgets focus on leadership, advisory options, and mentorship. CareerOS learns scope of impact and readiness for executive paths.",
    target: "[data-judge-target='candidate-dashboard']",
    phase: "senior_career",
    status: "Prototype",
  },
  {
    id: "phase-executive",
    view: "candidate-dashboard",
    title: "Executive phase",
    body:
      "Goal: convert experience into legacy. Widgets focus on board seats, consulting, master mentorship, and legacy metrics. This is the final phase.",
    target: "[data-judge-target='candidate-dashboard']",
    phase: "executive",
    status: "Prototype",
  },
  {
    id: "gatekeeper",
    view: "candidate-dashboard",
    title: "Gatekeeper checklist",
    body:
      "Milestones explain what must happen before a candidate moves forward. Some are auto-detected from profile evidence; others remain manual until backend milestone persistence ships.",
    target: "[data-judge-target='gatekeeper-checklist']",
    status: "Functional",
  },
  {
    id: "portfolio-open",
    view: "living-portfolio",
    title: "Living Portfolio",
    body:
      "The Living Portfolio turns skills, projects, certifications, experience, and evidence into a CV-like source of truth that grows with the candidate.",
    target: "[data-judge-target='portfolio-overview']",
    status: "Functional",
  },
  {
    id: "portfolio-proof",
    view: "living-portfolio",
    title: "Evidence employers can read",
    body:
      "Employers can later interpret portfolio projects as proof, not just claims. Richer verification and evidence scoring are planned next.",
    target: "[data-judge-target='portfolio-evidence']",
    status: "Planned",
  },
  {
    id: "life-chapters",
    view: "life-chapters",
    title: "Life Chapter Designer",
    body:
      "The timetable helps candidates plan goals, tasks, and personal commitments around career progress so momentum becomes consistent.",
    target: "[data-judge-target='chapter-timetable']",
    status: "Functional",
  },
  {
    id: "life-planning",
    view: "life-chapters",
    title: "Beyond career tasks",
    body:
      "CareerOS treats personal planning as part of career growth. Automated task generation and richer planning analytics are future implementation.",
    target: "[data-judge-target='chapter-tasks']",
    status: "Planned",
  },
  {
    id: "candidate-messages",
    view: "candidate-messages",
    title: "Candidate messages",
    body:
      "Messaging is the bridge between marketplace discovery and human connection. This demo shows the candidate side of an employer conversation.",
    target: "[data-judge-target='candidate-messages']",
    status: "Prototype",
  },
  {
    id: "employer-marketplace",
    view: "employer-marketplace",
    title: "Employer marketplace",
    body:
      "Now the tour switches to the employer side. The employer goal summarizes what the organization is looking for before recommendations appear.",
    target: "[data-judge-target='employer-goal']",
    status: "Functional",
  },
  {
    id: "recommendations",
    view: "employer-marketplace",
    title: "Candidate recommendations",
    body:
      "Recommendations combine match score, readiness score, growth signal, skills, and a plain-language reason for why the candidate appears.",
    target: "[data-judge-target='candidate-recommendations']",
    status: "Prototype",
  },
  {
    id: "scoring",
    view: "employer-marketplace",
    title: "Signals, not only keywords",
    body:
      "The demo scoring is explainable and intentionally simple. A deeper AI recommendation engine and stronger backend scoring are planned.",
    target: "[data-judge-target='candidate-score']",
    status: "Planned",
  },
  {
    id: "candidate-profile",
    view: "candidate-profile",
    title: "Candidate profile",
    body:
      "The profile shows trajectory, projects, skills, readiness, and why the match exists. Employers evaluate direction and evidence, not only a static resume.",
    target: "[data-judge-target='candidate-profile-modal']",
    status: "Prototype",
  },
  {
    id: "save-candidate",
    view: "candidate-profile",
    title: "Save candidate",
    body:
      "Saving a candidate lets the employer keep a shortlist. In this tour the action is demo-only and scoped to judge state.",
    target: "[data-judge-target='save-candidate']",
    status: "Functional",
  },
  {
    id: "invite-candidate",
    view: "candidate-profile",
    title: "Invite or contact",
    body:
      "Inviting starts the Candidate-Employer connection. Production messaging, analytics, and invite workflows can be expanded beyond this prototype.",
    target: "[data-judge-target='invite-candidate']",
    status: "Prototype",
  },
  {
    id: "employer-messages",
    view: "employer-messages",
    title: "Employer messages",
    body:
      "The employer message view completes the bridge: discover a candidate, evaluate evidence, save or invite, then continue the conversation.",
    target: "[data-judge-target='employer-messages']",
    status: "Prototype",
  },
  {
    id: "full-loop",
    view: "final",
    title: "The full loop",
    body:
      "Candidate builds evidence and direction. CareerOS turns it into readable signals. Employer sees relevant talent. Both sides connect through marketplace and messaging.",
    target: "[data-judge-target='final-loop']",
    status: "Prototype",
  },
  {
    id: "future-implementation",
    view: "final",
    title: "What is next",
    body:
      "Future work includes real AI recommendations, deeper employer matching, production messaging, analytics, automated task generation, and richer portfolio verification.",
    target: "[data-judge-target='future-work']",
    status: "Planned",
  },
  {
    id: "finish",
    view: "final",
    title: "Finish tour",
    body:
      "Judges can finish, restart, or explore freely inside this judge-only route. Normal users never see these controls.",
    target: "[data-judge-target='final-actions']",
    status: "Functional",
  },
];
