import type { Candidate, CandidateCategory } from "./types";

/**
 * Feature flag for the employer-side mock candidate pool.
 *
 * Defaults to **enabled** so the research-preview marketplace keeps
 * working out of the box. Set `NEXT_PUBLIC_ENABLE_MOCKS=false` in the
 * environment to flip every employer surface into an empty state —
 * useful once real candidate data lands. Read this flag (instead of
 * reading `CANDIDATES` directly) in any code that should respect the
 * production-mode disable.
 */
export const MOCKS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_MOCKS !== "false";

/**
 * Mock candidate pool for the employer-side prototype. Numbers are
 * fixed (not random) so the Marketplace renders consistently between
 * reloads and so demoers can speak to specific cards.
 *
 * NOTE: every record here is fictional. The marketplace is wrapped in
 * a global `DemoDataBanner` so employers see this clearly.
 */
export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "c-amelia-tan",
    name: "Amelia Tan",
    careerDirection: "Frontend engineer with a design fluency",
    targetRole: "Frontend Developer",
    industry: "SaaS",
    category: "Technology",
    matchScore: 94,
    readinessScore: 88,
    growthSignal: "Accelerating",
    topSkills: ["React", "TypeScript", "Tailwind", "Design Systems"],
    portfolioProjects: ["Open-source UI kit", "Career OS preview clone"],
    whyRecommended:
      "Ships polished frontend work weekly, has shipped 3 design-system projects, and tags her chapters around frontend architecture.",
    location: "Kuala Lumpur",
    availability: "Actively looking",
    headline: "Building beautiful, accessible product surfaces.",
    stage: "Junior",
  },
  {
    id: "c-ravi-shankar",
    name: "Ravi Shankar",
    careerDirection: "Full-stack engineer leaning into platform work",
    targetRole: "Software Engineer",
    industry: "FinTech",
    category: "Technology",
    matchScore: 91,
    readinessScore: 85,
    growthSignal: "Compounding",
    topSkills: ["Node", "Postgres", "AWS", "Go"],
    portfolioProjects: ["FX rate aggregator", "Open-banking sandbox"],
    whyRecommended:
      "Has shipped two production services solo and is now compounding into platform-level work.",
    location: "Singapore",
    availability: "Open to opportunities",
    headline: "From feature work to platform reliability.",
    stage: "Mid-level",
  },
  {
    id: "c-zara-malik",
    name: "Zara Malik",
    careerDirection: "UX designer focused on financial empowerment",
    targetRole: "UI/UX Designer",
    industry: "FinTech",
    category: "Design",
    matchScore: 89,
    readinessScore: 82,
    growthSignal: "Steady",
    topSkills: ["Figma", "User Research", "Prototyping", "Design Tokens"],
    portfolioProjects: ["Salary planner app", "Investing for beginners flow"],
    whyRecommended:
      "Her last three chapters are all about onboarding flows for first-time investors — high signal for fintech work.",
    location: "Petaling Jaya",
    availability: "Actively looking",
    headline: "Designing financial confidence for first-timers.",
    stage: "Junior",
  },
  {
    id: "c-leo-chen",
    name: "Leo Chen",
    careerDirection: "Product designer with frontend craft",
    targetRole: "Product Designer",
    industry: "SaaS",
    category: "Design",
    matchScore: 87,
    readinessScore: 80,
    growthSignal: "Accelerating",
    topSkills: ["Figma", "Framer", "React", "Motion"],
    portfolioProjects: ["Calendar redesign", "AI assistant UX studies"],
    whyRecommended:
      "Bridges design + frontend — ships interactive prototypes that ship to production with minor changes.",
    location: "Bangkok",
    availability: "Open to opportunities",
    headline: "Design that prototypes itself into product.",
    stage: "Mid-level",
  },
  {
    id: "c-maya-fernandez",
    name: "Maya Fernandez",
    careerDirection: "Marketing executive focused on growth experiments",
    targetRole: "Marketing Executive",
    industry: "Consumer",
    category: "Marketing",
    matchScore: 84,
    readinessScore: 78,
    growthSignal: "Emerging",
    topSkills: ["Lifecycle Marketing", "Copywriting", "Analytics", "SEO"],
    portfolioProjects: ["Newsletter growth study", "Referral loop teardown"],
    whyRecommended:
      "Strong growth-experiment portfolio for a junior — already running A/Bs in her side projects.",
    location: "Manila",
    availability: "Open to opportunities",
    headline: "Growth marketer who treats every channel as a hypothesis.",
    stage: "Junior",
  },
  {
    id: "c-harith-amir",
    name: "Harith Amir",
    careerDirection: "Mechanical engineer with manufacturing tech bent",
    targetRole: "Mechanical Engineer",
    industry: "Manufacturing",
    category: "Engineering",
    matchScore: 82,
    readinessScore: 76,
    growthSignal: "Steady",
    topSkills: ["SolidWorks", "Matlab", "CAD", "DFMA"],
    portfolioProjects: ["EV battery cooling rig", "Robotic gripper prototype"],
    whyRecommended:
      "Active in manufacturing automation chapters — moving from pure mech-e toward mech-e + software.",
    location: "Penang",
    availability: "Future-ready (graduating soon)",
    headline: "Mechanical engineer leaning into automation.",
    stage: "Fresh grad",
  },
  {
    id: "c-nadia-iskandar",
    name: "Nadia Iskandar",
    careerDirection: "Data analyst aiming at decision intelligence",
    targetRole: "Data Analyst",
    industry: "E-commerce",
    category: "Data",
    matchScore: 90,
    readinessScore: 84,
    growthSignal: "Compounding",
    topSkills: ["SQL", "Python", "dbt", "Looker"],
    portfolioProjects: ["Customer cohort analysis", "Inventory forecast study"],
    whyRecommended:
      "Has compounded SQL → dbt → analytics-engineering chapters; very high signal for analytics roles.",
    location: "Jakarta",
    availability: "Actively looking",
    headline: "From dashboards to decisions.",
    stage: "Junior",
  },
  {
    id: "c-aaron-ho",
    name: "Aaron Ho",
    careerDirection: "ML engineer interested in applied recommendation",
    targetRole: "Software Engineer",
    industry: "Media",
    category: "Data",
    matchScore: 88,
    readinessScore: 81,
    growthSignal: "Accelerating",
    topSkills: ["PyTorch", "Python", "Pandas", "MLOps"],
    portfolioProjects: ["Anime recommender", "Podcast clustering tool"],
    whyRecommended:
      "Three of his last four chapters explicitly target recommender systems — direction is consistent.",
    location: "Taipei",
    availability: "Open to opportunities",
    headline: "Building recommenders that actually recommend.",
    stage: "Junior",
  },
  {
    id: "c-priya-rao",
    name: "Priya Rao",
    careerDirection: "Business analyst pivoting toward product ops",
    targetRole: "Business Analyst",
    industry: "Logistics",
    category: "Business",
    matchScore: 80,
    readinessScore: 74,
    growthSignal: "Steady",
    topSkills: ["SQL", "Excel", "Process Mapping", "Stakeholder Mgmt"],
    portfolioProjects: ["Warehouse SOP redesign", "Demand-forecast pilot"],
    whyRecommended:
      "Bridges ops + analytics — last three chapters are about turning ops insight into product changes.",
    location: "Mumbai",
    availability: "Open to opportunities",
    headline: "Translating ops insight into product decisions.",
    stage: "Mid-level",
  },
  {
    id: "c-iman-khalid",
    name: "Iman Khalid",
    careerDirection: "Brand designer growing into creative direction",
    targetRole: "Creative Lead",
    industry: "Agency",
    category: "Creative",
    matchScore: 86,
    readinessScore: 79,
    growthSignal: "Emerging",
    topSkills: ["Branding", "Illustration", "Typography", "Art Direction"],
    portfolioProjects: ["Indie record-label rebrand", "Festival visual system"],
    whyRecommended:
      "Has a clear narrative arc from brand designer → creative lead reflected across her chapter goals.",
    location: "Kuala Lumpur",
    availability: "Open to opportunities",
    headline: "Brand systems that scale across surfaces.",
    stage: "Mid-level",
  },
  {
    id: "c-marcus-lim",
    name: "Marcus Lim",
    careerDirection: "Operations specialist scaling supply chains",
    targetRole: "Operations Analyst",
    industry: "Logistics",
    category: "Operations",
    matchScore: 79,
    readinessScore: 72,
    growthSignal: "Steady",
    topSkills: ["Supply Chain", "Excel", "Tableau", "Lean"],
    portfolioProjects: ["Last-mile cost study", "Procurement scorecards"],
    whyRecommended:
      "Has shipped two ops automations end-to-end — rare for a junior ops profile.",
    location: "Singapore",
    availability: "Open to opportunities",
    headline: "Make-it-work operator with an analyst's eye.",
    stage: "Junior",
  },
  {
    id: "c-hana-takeda",
    name: "Hana Takeda",
    careerDirection: "Frontend dev with accessibility specialty",
    targetRole: "Frontend Developer",
    industry: "Health",
    category: "Technology",
    matchScore: 92,
    readinessScore: 86,
    growthSignal: "Compounding",
    topSkills: ["React", "ARIA", "Testing", "TypeScript"],
    portfolioProjects: ["Accessible booking flow", "Hospital intake forms"],
    whyRecommended:
      "Accessibility chapters compounding into hard-to-find a11y skills — high readiness for regulated industries.",
    location: "Tokyo",
    availability: "Actively looking",
    headline: "Frontend that everyone can actually use.",
    stage: "Junior",
  },
  {
    id: "c-david-park",
    name: "David Park",
    careerDirection: "Junior product manager with data instincts",
    targetRole: "Product Manager",
    industry: "SaaS",
    category: "Business",
    matchScore: 83,
    readinessScore: 77,
    growthSignal: "Emerging",
    topSkills: ["Product Discovery", "SQL", "Roadmapping", "Notion"],
    portfolioProjects: ["Onboarding teardown", "Activation experiments"],
    whyRecommended:
      "Strong qualitative + quantitative signal — chapters alternate between user research and metrics.",
    location: "Seoul",
    availability: "Open to opportunities",
    headline: "PM by instinct, analyst by training.",
    stage: "Junior",
  },
  {
    id: "c-sara-yusof",
    name: "Sara Yusof",
    careerDirection: "Content marketer aiming for editorial lead",
    targetRole: "Content Marketer",
    industry: "Media",
    category: "Marketing",
    matchScore: 78,
    readinessScore: 71,
    growthSignal: "Steady",
    topSkills: ["Content Strategy", "SEO", "Editing", "Storytelling"],
    portfolioProjects: ["Tech-careers newsletter", "Podcast show notes system"],
    whyRecommended:
      "Consistent publishing cadence across her chapters — momentum signal is strong.",
    location: "Putrajaya",
    availability: "Open to opportunities",
    headline: "Editorial thinking for product-led brands.",
    stage: "Junior",
  },
  {
    id: "c-rafa-haziq",
    name: "Rafa Haziq",
    careerDirection: "Computer engineering intern aiming at embedded",
    targetRole: "Embedded Engineer Intern",
    industry: "Hardware",
    category: "Engineering",
    matchScore: 76,
    readinessScore: 64,
    growthSignal: "Emerging",
    topSkills: ["C", "Embedded Linux", "PCB Design", "Python"],
    portfolioProjects: ["Home weather station", "STM32 motor controller"],
    whyRecommended:
      "Hardware-side internships are rare — Rafa has solo-built two real boards.",
    location: "Cyberjaya",
    availability: "Open to internships",
    headline: "Hardware-leaning engineer who actually ships boards.",
    stage: "Intern",
  },
  {
    id: "c-ling-wei",
    name: "Ling Wei",
    careerDirection: "Junior UI designer focused on consumer mobile",
    targetRole: "UI/UX Designer",
    industry: "Consumer",
    category: "Design",
    matchScore: 85,
    readinessScore: 75,
    growthSignal: "Accelerating",
    topSkills: ["Figma", "Mobile UI", "Motion", "Prototyping"],
    portfolioProjects: ["Travel app concept", "Food delivery redesign"],
    whyRecommended:
      "Quick visual instincts + a real interest in motion — rare for a junior portfolio.",
    location: "Hong Kong",
    availability: "Future-ready (graduating soon)",
    headline: "Mobile-first designer with motion taste.",
    stage: "Fresh grad",
  },
  {
    id: "c-yusuf-rahman",
    name: "Yusuf Rahman",
    careerDirection: "Junior backend engineer interested in APIs",
    targetRole: "Backend Engineer",
    industry: "FinTech",
    category: "Technology",
    matchScore: 81,
    readinessScore: 73,
    growthSignal: "Steady",
    topSkills: ["Node", "Express", "Postgres", "REST"],
    portfolioProjects: ["Open banking demo", "Mock investment API"],
    whyRecommended:
      "Steady, durable backend learner — every chapter builds on the last.",
    location: "Shah Alam",
    availability: "Open to opportunities",
    headline: "API-first backend engineer in the making.",
    stage: "Junior",
  },
];

/**
 * Backwards-compatible alias. When `NEXT_PUBLIC_ENABLE_MOCKS=false`
 * is set the array goes empty, so the marketplace renders its
 * empty-state and no detail page accidentally exposes mock profiles.
 * In every other case this is identical to `MOCK_CANDIDATES`.
 */
export const CANDIDATES: Candidate[] = MOCKS_ENABLED ? MOCK_CANDIDATES : [];

/** Stable ordering — used to render filter tabs. */
export const CANDIDATE_CATEGORIES: CandidateCategory[] = [
  "Technology",
  "Engineering",
  "Design",
  "Data",
  "Marketing",
  "Business",
  "Creative",
  "Operations",
];

/**
 * Find a single candidate by ID. Respects `MOCKS_ENABLED` via the
 * `CANDIDATES` export, so a disabled mocks build returns undefined
 * and detail pages cleanly fall through to `notFound()`.
 */
export function findCandidateById(id: string): Candidate | undefined {
  return CANDIDATES.find((c) => c.id === id);
}
