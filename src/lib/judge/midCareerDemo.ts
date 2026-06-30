/**
 * Mid-career demo account — a 35+ candidate with a rich history so the
 * mid-career "Career Health" dashboard (skill-decay matrix, specialization,
 * leadership branches) renders fully populated. Seeded by `seedMidCareerDemo`
 * in prisma/seed.ts and reached via `POST /api/dev/demo-login`.
 *
 * The dashboard reads CandidatesAI: `currentSkills`, `skillsToImprove`
 * (the overlap = "maintained", the rest = "at risk"), `desiredNextMove`,
 * `targetRoles`. We deliberately overlap a few so both columns populate.
 */
export const MID_CAREER_DEMO = {
  username: "demo-midcareer",
  email: "midcareer@careeros.demo",
  password: "demo", // dev-only; account is flag-gated and demo-only
  name: "Jordan Reyes",
  organizationName: "CareerOS Mid-Career Demo",

  profile: {
    field: "Technology and software",
    targetJob: "Principal Engineer",
    headline: "Staff Software Engineer · 12 yrs · platform & teams",
    summary:
      "Staff engineer with 12 years across fintech and developer tooling. Built and scaled payment platforms, led a 7-person team through a re-architecture, and mentors senior ICs.",
    bio: "I care about systems that stay simple as they grow, and about growing the people around me. Currently weighing a deeper IC track vs. people leadership.",
    skills: [
      "Distributed Systems",
      "Go",
      "TypeScript",
      "Postgres",
      "Kubernetes",
      "System Design",
      "Team Leadership",
      "Mentoring",
    ],
  },

  ai: {
    careerStage: "mid-career",
    careerStageMeaning:
      "Mid-career demo: a 35+ staff engineer deciding between deep IC and people leadership.",
    targetRoles: ["Principal Engineer", "Engineering Manager"],
    interestedIndustries: ["Fintech", "Developer Tools", "Infrastructure"],
    opportunityTypes: ["Full-time"],
    locationPreference: "Remote (US) or hybrid",
    availability: "Open to the right move",
    currentSkills: [
      "Distributed Systems",
      "Go",
      "TypeScript",
      "Postgres",
      "Kubernetes",
      "System Design",
      "Team Leadership",
      "Mentoring",
    ],
    // Overlaps currentSkills → these show as actively-maintained; the rest
    // surface in the "watch for decay" column.
    skillsToImprove: ["Kubernetes", "System Design", "Team Leadership"],
    desiredNextMove:
      "Move into a Principal Engineer role owning platform architecture across teams.",
    longTermGoal:
      "Become a technical leader who sets direction for an engineering org.",
    timeline: "6-12 months",
    careerConfidence: "high",
    mainBlocker: "Choosing between the IC and management track.",
    weeklyLearningTime: "3-5 hours",
    dashboardPersonalizationSummary:
      "Mid-career demo: staff engineer maintaining core platform skills while choosing a leadership track.",
    onboardingCompleted: true,
  },

  midCareer: {
    problemsSolved: [
      "Cut payment failure rate 40% by redesigning the retry pipeline",
      "Led a zero-downtime migration of 200+ services to Kubernetes",
      "Mentored 4 engineers to senior in two years",
    ],
    careerPattern: "specialist",
    salaryPrivate: 185000,
    salaryCurrency: "USD",
    lifeFactors: ["remote-only", "caregiver"],
  },

  projects: [
    {
      title: "Payments resilience platform",
      description:
        "Idempotent retry + reconciliation layer processing 2M+ daily transactions.",
    },
    {
      title: "Internal service mesh rollout",
      description:
        "Migrated 200+ services to a standardized mesh with zero customer downtime.",
    },
  ],

  experiences: [
    {
      role: "Staff Software Engineer",
      company: "Northwind Pay",
      period: "2020 — Present",
      detail: "Owns the payments platform; leads a 7-person team.",
    },
    {
      role: "Senior Software Engineer",
      company: "Devtools Inc.",
      period: "2016 — 2020",
      detail: "Built the CI pipeline and the public API.",
    },
    {
      role: "Software Engineer",
      company: "Acme Systems",
      period: "2012 — 2016",
      detail: "Backend services for the billing product.",
    },
  ],

  chapters: [
    {
      name: "Decide IC vs. management track",
      priority: "high",
      date: "2026-07-15",
      time: "10:00",
      subtasks: [
        { id: "s1", label: "Talk to two principal engineers", done: true },
        { id: "s2", label: "Talk to two engineering managers", done: false },
        { id: "s3", label: "Write a one-pager on the trade-offs", done: false },
      ],
    },
    {
      name: "Refresh Kubernetes depth",
      priority: "medium",
      date: "2026-07-22",
      time: "18:00",
      subtasks: [
        { id: "s1", label: "Finish CKA practice exams", done: true },
        { id: "s2", label: "Lead the next mesh upgrade", done: false },
      ],
    },
    {
      name: "Publish architecture case study",
      priority: "medium",
      date: "2026-08-01",
      time: "09:00",
      subtasks: [
        { id: "s1", label: "Draft the payments resilience write-up", done: false },
        { id: "s2", label: "Get review from the staff guild", done: false },
      ],
    },
  ],
};
