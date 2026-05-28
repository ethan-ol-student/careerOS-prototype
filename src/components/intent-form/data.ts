import {
  Compass, Sparkles, Sprout, Star, Briefcase, Heart,
  User, BookOpen, type LucideIcon,
} from "lucide-react";

export interface Stage {
  id: string;
  label: string;
  description: string;
}

export interface Goal {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface Module {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: LucideIcon;
}

export interface TargetJob {
  id: string;
  label: string;
  description: string;
  /** Skills the job requires — matched case-insensitively. */
  requiredSkills: string[];
}

export const stages: Stage[] = [
  { id: "student", label: "Student", description: "Still in school, exploring what is next" },
  { id: "early-career", label: "Early career", description: "0–3 years of work experience" },
  { id: "mid-career", label: "Mid career", description: "Established but evolving" },
  { id: "career-change", label: "Career change", description: "Pivoting to something new" },
];

export const goals: Goal[] = [
  { id: "find-direction", label: "Find direction", description: "Figure out what is next for me", icon: Compass },
  { id: "build-portfolio", label: "Build my portfolio", description: "Capture my career story clearly", icon: Sparkles },
  { id: "grow-skills", label: "Grow my skills", description: "Develop in a specific area", icon: Sprout },
  { id: "explore-paths", label: "Explore parallel paths", description: "Design multiple life chapters", icon: Star },
  { id: "find-opportunities", label: "Find opportunities", description: "Connect with roles that fit", icon: Briefcase },
  { id: "career-balance", label: "Career balance", description: "Make room for more than work", icon: Heart },
];

export const fields: string[] = [
  "Technology and software",
  "Design and creative",
  "Engineering and manufacturing",
  "Finance and banking",
  "Marketing and communications",
  "Healthcare and medicine",
  "Education",
  "Operations and supply chain",
  "Sales and business development",
  "Legal and policy",
  "Media and entertainment",
  "Hospitality and tourism",
  "Sciences and research",
  "Other",
];

/**
 * Common target jobs. The required-skill lists are intentionally
 * short (3–4 entries) so users can realistically "fill" them by
 * adding skills on the dashboard and trigger a job-match alert.
 */
export const targetJobs: TargetJob[] = [
  {
    id: "robotics-engineer",
    label: "Robotics Engineer",
    description: "Build, control, and ship physical systems.",
    requiredSkills: ["CAD", "Python", "Control systems", "Robotics"],
  },
  {
    id: "mech-design-lead",
    label: "Mechanical Design Lead",
    description: "Design products people interact with daily.",
    requiredSkills: ["CAD", "FEA", "Materials", "Storytelling"],
  },
  {
    id: "ml-engineer",
    label: "ML / Controls Engineer",
    description: "Apply ML and modelling to real-world signals.",
    requiredSkills: ["Python", "ML", "Systems design", "Mathematics"],
  },
  {
    id: "product-engineer",
    label: "Product Engineer",
    description: "Bridge engineering and product decisions.",
    requiredSkills: ["Product analytics", "Storytelling", "Systems design"],
  },
  {
    id: "ux-designer",
    label: "UX Designer",
    description: "Shape human-centred experiences end to end.",
    requiredSkills: ["Figma", "User research", "Storytelling", "Prototyping"],
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    description: "Turn raw data into decisions.",
    requiredSkills: ["SQL", "Python", "Storytelling", "Statistics"],
  },
  {
    id: "founder",
    label: "Founder",
    description: "Start something of your own.",
    requiredSkills: ["Storytelling", "Sales", "Product analytics", "Resilience"],
  },
];

export const modules: Module[] = [
  {
    id: "portfolio",
    label: "Living Portfolio",
    description: "Your AI-readable profile that grows with you",
    route: "/candidate/portfolio",
    icon: User,
  },
  {
    id: "chapters",
    label: "Life Chapter Designer",
    description: "Design parallel scenarios for your next chapter",
    route: "/candidate/chapters",
    icon: BookOpen,
  },
];

export const completionMessage = "You are all set. Let us start building your career story.";
