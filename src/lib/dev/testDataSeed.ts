/**
 * Mock content builders for dev/test seeding. PURE — these return plain
 * objects only (no Prisma, no I/O); the `/api/dev/data` route writes them
 * to the test account. Kept separate so the demo content is easy to edit
 * without touching route logic.
 */

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Candidate portfolio ─────────────────────────────────────────────
export const DEV_SKILLS = [
  "React",
  "TypeScript",
  "Figma",
  "Python",
  "Systems Design",
  "Public Speaking",
];

export function devPortfolioScalars() {
  return {
    headline: "Product-minded frontend engineer",
    summary:
      "I build polished, accessible interfaces and care about the system behind them.",
    bio: "Dev Tester — a seeded account for exercising the candidate experience.",
    skills: DEV_SKILLS,
  };
}

export function devProjects() {
  return [
    {
      title: "Open-source design system",
      description: "A themeable React + Tailwind component kit used by 3 teams.",
      link: "https://example.dev/design-system",
    },
    {
      title: "Career growth simulator",
      description: "Visualizes skill → readiness loops for a target role.",
      link: null as string | null,
    },
  ];
}

export function devExperiences() {
  return [
    {
      role: "Frontend Engineer",
      company: "Northwind Labs",
      period: "2023 — Present",
      detail: "Owns the component library and design-token contract.",
    },
    {
      role: "Engineering Intern",
      company: "Bright Studio",
      period: "Summer 2022",
      detail: "Shipped the onboarding redesign.",
    },
  ];
}

export function devCertificates() {
  return [
    { title: "Meta Frontend Professional", issuer: "Coursera", year: "2023" },
  ];
}

export function devAwards() {
  return [
    {
      title: "Hackathon — Best UX",
      year: "2023",
      description: "Won best user experience among 40 teams.",
    },
  ];
}

// ── Candidate chapters (Life Chapter Designer timetable) ────────────
export function devChapters() {
  return [
    {
      name: "Polish portfolio case study",
      priority: "high" as const,
      date: daysFromNow(3),
      time: "10:00",
      subtasks: [
        { id: "s1", label: "Pick the project", done: true },
        { id: "s2", label: "Write the story", done: false },
        { id: "s3", label: "Add visuals", done: false },
      ],
    },
    {
      name: "Apply to 3 target roles",
      priority: "medium" as const,
      date: daysFromNow(7),
      time: "14:00",
      subtasks: [
        { id: "s1", label: "Tailor resume", done: false },
        { id: "s2", label: "Submit applications", done: false },
      ],
    },
    {
      name: "Practice system design",
      priority: "low" as const,
      date: daysFromNow(12),
      time: "18:30",
      subtasks: [{ id: "s1", label: "Mock interview", done: false }],
    },
  ];
}

// ── Candidate notifications ─────────────────────────────────────────
export function devCandidateNotifications() {
  return [
    {
      kind: "skill" as const,
      severity: "info" as const,
      title: "Skill acquired · TypeScript",
      body: "Added to your Living Portfolio and trajectory recomputed.",
      read: false,
    },
    {
      kind: "job-match" as const,
      severity: "important" as const,
      title: "You match Frontend Engineer at Northwind",
      body: "Your skills cover every requirement. Want to reach out?",
      actionLabel: "Reach out",
      read: false,
    },
    {
      kind: "system" as const,
      severity: "info" as const,
      title: "Welcome to Career OS",
      body: "Your dashboard adapts to your current career phase.",
      read: false,
    },
  ];
}

// ── Employer notifications ──────────────────────────────────────────
export function devEmployerNotifications(candidateId: string | null) {
  return [
    {
      kind: "invite-accepted" as const,
      title: "Invite accepted",
      body: "A candidate accepted your invite and is open to chatting.",
      candidateId: candidateId ?? undefined,
      read: false,
    },
    {
      kind: "invite-pending" as const,
      title: "Invite pending",
      body: "Your invite is awaiting a response.",
      candidateId: candidateId ?? undefined,
      read: false,
    },
    {
      kind: "system" as const,
      title: "New recommendations",
      body: "Fresh candidate matches are ready in your marketplace.",
      read: false,
    },
  ];
}

// ── Employer chat messages ──────────────────────────────────────────
export function devMessages() {
  return [
    { sender: "employer" as const, body: "Hi! Loved your portfolio — open to a chat?" },
    { sender: "candidate" as const, body: "Thanks! Yes, I'd be happy to." },
    { sender: "employer" as const, body: "Great — how does next week look?" },
  ];
}

// ── Advanced onboarding (CandidatesAI) "present" payload ────────────
// Excludes careerStage + onboardingCompleted — those are controlled by
// the dedicated phase / onboarding toggles.
export function devCandidatesAIPresent() {
  return {
    targetRoles: ["Frontend Engineer", "Product Engineer"],
    interestedIndustries: ["Technology", "Design"],
    opportunityTypes: ["Full-time", "Internship"],
    locationPreference: "Remote · APAC",
    availability: "Actively looking",
    currentSkills: DEV_SKILLS,
    projects: ["Open-source design system", "Career growth simulator"],
    skillsToImprove: ["System design", "Public speaking"],
    weeklyLearningTime: "5–10 hours",
    desiredNextMove: "Land a frontend role at a product company within 6 months.",
    longTermGoal: "Lead a design-system team.",
    timeline: "3–6 months",
    dashboardPersonalizationSummary:
      "Young Adult aiming for Frontend Engineer. Strong in React, TypeScript, Figma.",
  };
}

/** Field reset for "advanced data missing" (leaves phase + completion flag). */
export function devCandidatesAIEmpty() {
  return {
    targetRoles: [],
    interestedIndustries: [],
    opportunityTypes: [],
    locationPreference: null,
    availability: null,
    currentSkills: [],
    projects: [],
    skillsToImprove: [],
    weeklyLearningTime: null,
    desiredNextMove: "",
    longTermGoal: null,
    timeline: null,
    dashboardPersonalizationSummary: null,
  };
}

// ── Advanced hiring prefs (EmployersAI) "present" payload ───────────
export function devEmployersAIPresent() {
  return {
    companyType: "Startup",
    industries: ["Technology", "Design"],
    teamFocus: ["Engineering", "Product"],
    hiringReasons: ["Scaling the team"],
    hiringTimeline: "0–3 months",
    targetRoles: ["Frontend Engineer", "Product Designer"],
    futureRoleDirections: ["Engineering lead"],
    candidateGreenFlags: ["Ships fast", "Strong portfolio"],
    requiredSkills: ["React", "TypeScript"],
    trainableSkills: ["System design"],
    strongFitTypes: ["Builders", "Generalists"],
    workArrangement: "Hybrid",
    hiringLocation: "Kuala Lumpur",
    hiringIntentSummary: "Hiring product-minded frontend engineers to scale the team.",
    bestCandidateTypeSummary: "Fast builders with a strong portfolio and React depth.",
  };
}

export function devEmployersAIEmpty() {
  return {
    companyType: "",
    industries: [],
    teamFocus: [],
    hiringReasons: [],
    hiringTimeline: "",
    targetRoles: [],
    futureRoleDirections: [],
    candidateGreenFlags: [],
    requiredSkills: [],
    trainableSkills: [],
    strongFitTypes: [],
    workArrangement: "",
    hiringLocation: "",
    hiringIntentSummary: null,
    futurePathSummary: null,
    bestCandidateTypeSummary: null,
  };
}
