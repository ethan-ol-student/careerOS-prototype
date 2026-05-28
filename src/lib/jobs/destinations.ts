/**
 * Canonical list of trajectory destinations. Used by:
 *   - TrajectoryDiagram (visual)
 *   - useJobMatch (notification firing)
 *   - ProgressPanel (target-job readiness)
 *
 * `requiredSkills` are matched case-insensitively, partial: a user
 * skill counts toward a required slot if either string contains the
 * other (case-insensitive). Keeps the demo forgiving when a user
 * types "Python for engineering" but the slot expects "Python".
 */

export interface Destination {
  id: string;
  title: string;
  company: string;
  match: number;
  requiredSkills: string[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: "robotics-engineer",
    title: "Robotics Engineer",
    company: "Universal Robots",
    match: 88,
    requiredSkills: ["Python", "ROS", "Controls", "Mathematics"],
  },
  {
    id: "mechanical-design-lead",
    title: "Mechanical Design Lead",
    company: "Dyson",
    match: 84,
    requiredSkills: ["CAD", "FEA", "Project management", "Materials"],
  },
  {
    id: "ml-controls-engineer",
    title: "ML / Controls Engineer",
    company: "Tesla",
    match: 79,
    requiredSkills: ["Python", "ML", "Systems design", "Mathematics"],
  },
  {
    id: "product-engineer",
    title: "Product Engineer",
    company: "Honda Mfg.",
    match: 72,
    requiredSkills: ["Product analytics", "Storytelling", "Systems design"],
  },
];

/**
 * Returns how many of `required` are covered by `userSkills`
 * (case-insensitive, partial-substring match).
 */
export function countMatches(
  required: string[],
  userSkills: string[],
): number {
  const skills = userSkills.map((s) => s.toLowerCase());
  let n = 0;
  for (const req of required) {
    const r = req.toLowerCase();
    if (skills.some((s) => s === r || s.includes(r) || r.includes(s))) n += 1;
  }
  return n;
}

/** % coverage (0..100) of required skills by user skills. */
export function coverage(required: string[], userSkills: string[]): number {
  if (required.length === 0) return 0;
  return Math.round((countMatches(required, userSkills) / required.length) * 100);
}

/**
 * Find destinations the user has 100% required-skill coverage for.
 */
export function fullyMatchedDestinations(
  userSkills: string[],
): Destination[] {
  return DESTINATIONS.filter(
    (d) => countMatches(d.requiredSkills, userSkills) === d.requiredSkills.length,
  );
}
