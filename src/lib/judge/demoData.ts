import { PHASE_CONFIG } from "../dashboard/phaseConfig";
import type { Candidate } from "../candidates/types";
import type { CandidateDashboardData, CareerPhase } from "../dashboard/types";

export const JUDGE_ACCOUNT = {
  username: "judge",
  password: "judge123",
  email: "judge@careeros.demo",
  name: "Judge Evaluation",
  organizationName: "CareerOS Judge Demo",
} as const;

export const JUDGE_DEMO_USER_ID = "judge-demo-candidate";
export const JUDGE_DEMO_MARKETPLACE_SOURCE = "judge-demo";

export const JUDGE_PHASE_DB_STAGE: Record<CareerPhase, string> = {
  student: "student",
  young_adult: "young-adult",
  early_career: "early-career",
  mid_career: "mid-career",
  senior_career: "senior-career",
  executive: "executive",
};

export const JUDGE_PHASE_STORY: Record<
  CareerPhase,
  {
    mainGoal: string;
    relevantWidgets: string;
    transitionMilestone: string;
    systemLearns: string;
  }
> = {
  student: {
    mainGoal: "Help younger candidates discover interests and start a first proof of skill.",
    relevantWidgets: "Exploration tools, subject logs, and early skill tracking.",
    transitionMilestone: "Choose a direction and log first evidence of skill.",
    systemLearns: "Interests, subject strengths, and early skill signals.",
  },
  young_adult: {
    mainGoal: "Turn education and projects into internship or first-role readiness.",
    relevantWidgets: "Target roles, skill mapping, and portfolio completeness.",
    transitionMilestone: "Build a role-specific portfolio with enough proof to apply.",
    systemLearns: "Target role fit, missing skills, and proof quality.",
  },
  early_career: {
    mainGoal: "Land the right role and grow market value through repeatable evidence.",
    relevantWidgets: "Job pipeline, active applications, and market value tracking.",
    transitionMilestone: "Record stable relevant experience and next-role readiness.",
    systemLearns: "Work history, application traction, and readiness gaps.",
  },
  mid_career: {
    mainGoal: "Prevent stagnation and choose a stronger next move.",
    relevantWidgets: "Skill risk, specialization, and leadership path options.",
    transitionMilestone: "Document high-impact proof and pick a specialized track.",
    systemLearns: "Depth, direction, leadership appetite, and risk areas.",
  },
  senior_career: {
    mainGoal: "Translate experience into strategic influence and mentorship.",
    relevantWidgets: "Leadership metrics, advisory options, and mentorship tracking.",
    transitionMilestone: "Show strategic influence and executive readiness.",
    systemLearns: "Scope of impact, mentoring signals, and influence patterns.",
  },
  executive: {
    mainGoal: "Convert experience into legacy, board value, consulting, and mentorship.",
    relevantWidgets: "Board seats, consulting pipeline, master mentorship, and legacy metrics.",
    transitionMilestone: "Choose the next legacy branch; this is the final career phase.",
    systemLearns: "Advisory fit, legacy goals, and where experience compounds for others.",
  },
};

export const JUDGE_DEMO_PORTFOLIO = {
  name: "Avery Tan",
  field: "Product Engineering",
  targetJob: "Product Engineer",
  headline: "Product-minded engineer with proof across design, data, and shipping",
  summary:
    "A judge-safe candidate profile showing how CareerOS turns projects, skills, and planning into readable employer signals.",
  bio: "Avery is a fictional candidate used only for the judge walkthrough.",
  skills: [
    "React",
    "TypeScript",
    "Product Thinking",
    "UX Research",
    "Data Storytelling",
    "Stakeholder Communication",
    "Rapid Prototyping",
    "Accessibility",
  ],
  projects: [
    {
      title: "Portfolio Signal Map",
      description:
        "Mapped project evidence to target-role skills and surfaced proof gaps.",
      link: "https://example.com/judge/portfolio-signal-map",
    },
    {
      title: "Career Growth Simulator",
      description:
        "Built a phase-based dashboard prototype that adapts to milestones.",
      link: "https://example.com/judge/growth-simulator",
    },
    {
      title: "Interview Evidence Pack",
      description:
        "Organized case studies, metrics, and reflections for employer review.",
      link: null as string | null,
    },
  ],
  experiences: [
    {
      role: "Product Engineering Intern",
      company: "Northstar Labs",
      period: "2025",
      detail:
        "Shipped onboarding improvements and documented outcomes for a portfolio case study.",
    },
    {
      role: "Student Product Lead",
      company: "Campus Build Studio",
      period: "2024",
      detail:
        "Led a small team building accessibility-first tools for student services.",
    },
  ],
  certificates: [
    { title: "Human-Centered Design", issuer: "IDEO U", year: "2025" },
    { title: "Frontend Architecture", issuer: "Meta", year: "2024" },
  ],
  awards: [
    {
      title: "Best Product Evidence",
      year: "2025",
      description:
        "Recognized for presenting measurable portfolio outcomes in a demo setting.",
    },
  ],
};

export const JUDGE_DEMO_CHAPTERS = [
  {
    name: "Finalize marketplace-ready case study",
    priority: "high" as const,
    dateOffset: 2,
    time: "10:00",
    subtasks: [
      { id: "case-1", label: "Tighten problem statement", done: true },
      { id: "case-2", label: "Add project metrics", done: true },
      { id: "case-3", label: "Record reflection", done: false },
    ],
  },
  {
    name: "Practice employer intro conversation",
    priority: "medium" as const,
    dateOffset: 5,
    time: "15:30",
    subtasks: [
      { id: "intro-1", label: "Prepare role story", done: true },
      { id: "intro-2", label: "Draft questions", done: false },
    ],
  },
  {
    name: "Skill sprint: analytics storytelling",
    priority: "low" as const,
    dateOffset: 9,
    time: "18:00",
    subtasks: [
      { id: "skill-1", label: "Review dashboard examples", done: false },
      { id: "skill-2", label: "Add learning notes", done: false },
    ],
  },
];

export const JUDGE_CANDIDATE_MESSAGES = [
  {
    sender: "employer" as const,
    body: "Your case study shows strong product judgment. Would you be open to a short chat?",
  },
  {
    sender: "candidate" as const,
    body: "Yes, happy to. I can walk through the prototype and what I learned.",
  },
  {
    sender: "employer" as const,
    body: "Great. CareerOS flagged your growth signal and portfolio evidence as a strong match.",
  },
];

export const JUDGE_EMPLOYER_GOAL = {
  organization: "Northstar Labs",
  hiringGoal: "Find early-career product engineers with strong evidence of shipping.",
  targetRoles: ["Product Engineer", "Frontend Engineer", "UX Engineer"],
  preferredSkills: ["React", "TypeScript", "Product Thinking", "Communication"],
  priorities: ["Portfolio strength", "Learning momentum", "Growth signal"],
};

export const JUDGE_DEMO_CANDIDATES: Candidate[] = [
  {
    id: "judge-demo-avery-tan",
    name: "Avery Tan",
    careerDirection:
      "Product engineer growing from frontend craft into measurable product ownership.",
    targetRole: "Product Engineer",
    industry: "Technology",
    category: "Technology",
    matchScore: 94,
    readinessScore: 88,
    growthSignal: "Compounding",
    topSkills: ["React", "TypeScript", "Product Thinking", "UX Research"],
    portfolioProjects: [
      "Portfolio Signal Map",
      "Career Growth Simulator",
      "Interview Evidence Pack",
    ],
    whyRecommended:
      "Avery matches the employer's product-engineering goal through strong portfolio proof, clear target-role direction, and consistent skill growth.",
    location: "Singapore",
    availability: "Actively looking",
    headline:
      "Evidence-led product engineer with strong frontend execution and clear growth trajectory.",
    stage: "Early-career",
    source: "seed",
    visible: false,
  },
  {
    id: "judge-demo-maya-chen",
    name: "Maya Chen",
    careerDirection:
      "UX engineer combining accessible interface craft with analytics fluency.",
    targetRole: "UX Engineer",
    industry: "Design",
    category: "Design",
    matchScore: 89,
    readinessScore: 82,
    growthSignal: "Accelerating",
    topSkills: ["Accessibility", "Figma", "React", "User Testing"],
    portfolioProjects: [
      "Accessible Design Kit",
      "Checkout Research Sprint",
      "Design Token Audit",
    ],
    whyRecommended:
      "Maya is recommended because her portfolio demonstrates design systems, frontend collaboration, and recent momentum.",
    location: "Remote",
    availability: "Open to opportunities",
    headline:
      "UX engineer with accessible design-system evidence and strong collaboration signals.",
    stage: "Junior",
    source: "seed",
    visible: false,
  },
  {
    id: "judge-demo-ravi-kumar",
    name: "Ravi Kumar",
    careerDirection:
      "Data-informed builder moving toward product analytics and growth tooling.",
    targetRole: "Growth Engineer",
    industry: "Data",
    category: "Data",
    matchScore: 84,
    readinessScore: 79,
    growthSignal: "Steady",
    topSkills: ["Python", "SQL", "Experiment Design", "Dashboards"],
    portfolioProjects: [
      "Activation Funnel Study",
      "Experiment Tracker",
      "Retention Metrics Brief",
    ],
    whyRecommended:
      "Ravi brings a strong analytical spine and has evidence that can support growth-engineering roles.",
    location: "Kuala Lumpur",
    availability: "Open to internships",
    headline:
      "Analytical builder with clear growth tooling projects and strong learning consistency.",
    stage: "Student",
    source: "seed",
    visible: false,
  },
];

export const JUDGE_EMPLOYER_MESSAGES = [
  {
    candidateName: "Avery Tan",
    role: "Product Engineer",
    messages: [
      {
        sender: "employer" as const,
        body: "Your portfolio tells a clear story. Could we discuss the signal map project?",
      },
      {
        sender: "candidate" as const,
        body: "Absolutely. I can explain how I mapped skills to evidence.",
      },
    ],
  },
  {
    candidateName: "Maya Chen",
    role: "UX Engineer",
    messages: [
      {
        sender: "employer" as const,
        body: "Your accessibility work stood out. Are you open to hybrid roles?",
      },
      {
        sender: "candidate" as const,
        body: "Yes, hybrid works well for me.",
      },
    ],
  },
];

export function buildJudgeDashboardData(
  phase: CareerPhase,
): CandidateDashboardData {
  const config = PHASE_CONFIG[phase];
  const story = JUDGE_PHASE_STORY[phase];

  return {
    userId: JUDGE_DEMO_USER_ID,
    name: JUDGE_DEMO_PORTFOLIO.name,
    firstName: "Avery",
    phase,
    rawPhase: JUDGE_PHASE_DB_STAGE[phase],
    ai: {
      careerStage: JUDGE_PHASE_DB_STAGE[phase],
      careerStageMeaning: config.purpose,
      targetRoles: JUDGE_EMPLOYER_GOAL.targetRoles,
      interestedIndustries: ["Technology", "Design", "Education"],
      opportunityTypes: ["Full-time", "Internship", "Apprenticeship"],
      locationPreference: "Singapore or remote",
      availability: "Actively looking",
      currentSkills: JUDGE_DEMO_PORTFOLIO.skills,
      skillLevels: {
        React: "expert",
        TypeScript: "intermediate",
        "Product Thinking": "intermediate",
        "UX Research": "intermediate",
      },
      projects: JUDGE_DEMO_PORTFOLIO.projects.map((project) => project.title),
      skillsToImprove: ["Backend fundamentals", "Analytics storytelling"],
      weeklyLearningTime: "5-8 hours",
      desiredNextMove:
        "Earn a product engineering role where portfolio evidence matters.",
      longTermGoal:
        "Grow into a product-minded technical lead who mentors early talent.",
      timeline: "3-6 months",
      careerConfidence: "high",
      mainBlocker: "Needs a sharper signal for employers scanning quickly.",
      applicationsSent: "5-10",
      interviewExperience: "Some interviews",
      rejectionsOrChallenges: "Needs clearer proof packaging",
      resumeConfidence: "medium",
      portfolioConfidence: "high",
      interviewConfidence: "medium",
      dashboardPersonalizationSummary: `${story.mainGoal} ${story.systemLearns}`,
      onboardingCompleted: true,
    },
    field: JUDGE_DEMO_PORTFOLIO.field,
    targetJob: JUDGE_DEMO_PORTFOLIO.targetJob,
    targetRoles: JUDGE_EMPLOYER_GOAL.targetRoles,
    currentSkills: JUDGE_DEMO_PORTFOLIO.skills,
    skillsToImprove: ["Backend fundamentals", "Analytics storytelling"],
    projects: JUDGE_DEMO_PORTFOLIO.projects.map((project) => project.title),
    desiredNextMove:
      "Earn a product engineering role where portfolio evidence matters.",
    longTermGoal:
      "Grow into a product-minded technical lead who mentors early talent.",
    portfolio: {
      headline: JUDGE_DEMO_PORTFOLIO.headline,
      summary: JUDGE_DEMO_PORTFOLIO.summary,
      skills: JUDGE_DEMO_PORTFOLIO.skills,
      projectCount: JUDGE_DEMO_PORTFOLIO.projects.length,
      certificateCount: JUDGE_DEMO_PORTFOLIO.certificates.length,
      awardCount: JUDGE_DEMO_PORTFOLIO.awards.length,
      experienceCount: JUDGE_DEMO_PORTFOLIO.experiences.length,
      totalAdditions:
        JUDGE_DEMO_PORTFOLIO.skills.length +
        JUDGE_DEMO_PORTFOLIO.projects.length +
        JUDGE_DEMO_PORTFOLIO.certificates.length +
        JUDGE_DEMO_PORTFOLIO.awards.length +
        JUDGE_DEMO_PORTFOLIO.experiences.length,
      hasBio: true,
    },
  };
}
