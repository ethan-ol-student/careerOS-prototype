// Curated catalogue of target jobs. Used by:
//   • Onboarding "desired job" picker.
//   • Career Readiness panel (progress toward picked job).
//   • Notification system (matches when all required skills are met).

export interface TargetJob {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  field: string;
  /** Lower-case canonical names — matched case-insensitively against
   *  the user's added skills. */
  requiredSkills: string[];
  /** Base match % used in the Opportunities and Trajectory panels. */
  baseMatch: number;
}

export const TARGET_JOBS: TargetJob[] = [
  {
    id: "robotics-engineer",
    title: "Robotics Engineer",
    company: "Universal Robots",
    location: "Remote",
    duration: "Full-time",
    field: "Engineering and manufacturing",
    requiredSkills: ["robotics", "control systems", "python", "cad design"],
    baseMatch: 88,
  },
  {
    id: "mechanical-design-lead",
    title: "Mechanical Design Lead",
    company: "Dyson",
    location: "Singapore",
    duration: "Full-time",
    field: "Engineering and manufacturing",
    requiredSkills: ["cad design", "fea", "materials science", "project management"],
    baseMatch: 84,
  },
  {
    id: "ml-controls-engineer",
    title: "ML / Controls Engineer",
    company: "Tesla",
    location: "Singapore",
    duration: "Full-time",
    field: "Technology and software",
    requiredSkills: ["python", "machine learning", "control systems", "systems design"],
    baseMatch: 79,
  },
  {
    id: "product-engineer",
    title: "Product Engineer",
    company: "Honda Mfg.",
    location: "Kuala Lumpur",
    duration: "Full-time",
    field: "Engineering and manufacturing",
    requiredSkills: ["cad design", "product analytics", "project management"],
    baseMatch: 72,
  },
  {
    id: "design-engineer-intern",
    title: "Design Engineer Intern",
    company: "Tesla",
    location: "Singapore",
    duration: "6 months",
    field: "Engineering and manufacturing",
    requiredSkills: ["cad design", "thermodynamics", "storytelling"],
    baseMatch: 78,
  },
  {
    id: "product-manager",
    title: "Associate Product Manager",
    company: "Grab",
    location: "Singapore",
    duration: "Full-time",
    field: "Technology and software",
    requiredSkills: ["product analytics", "storytelling", "systems design"],
    baseMatch: 76,
  },
];

/**
 * Case-insensitive normalisation we use to compare a user's free-form
 * skill input against the canonical `requiredSkills` list.
 */
export function normalizeSkill(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Returns the set of `requiredSkills` for `job` that the user has
 * acquired. Also returns the missing ones.
 */
export function jobReadiness(job: TargetJob, userSkills: string[]) {
  const have = new Set(userSkills.map(normalizeSkill));
  const matched = job.requiredSkills.filter((s) => have.has(s));
  const missing = job.requiredSkills.filter((s) => !have.has(s));
  const pct =
    job.requiredSkills.length === 0
      ? 0
      : Math.round((matched.length / job.requiredSkills.length) * 100);
  return { matched, missing, pct, complete: missing.length === 0 };
}

export function findJobById(id: string): TargetJob | undefined {
  return TARGET_JOBS.find((j) => j.id === id);
}
