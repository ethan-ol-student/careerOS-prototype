/**
 * Resume completeness meter — pure, deterministic % of sections filled.
 * Each item is user-actionable; the page renders them as a clickable
 * checklist and `key` names the section that completes it.
 */

/** Anchor for the checklist deep-link — six PortfolioBuilder sections plus
 *  the problems-solved editor on the Living Portfolio page. */
export type CompletenessKey =
  | "identity"
  | "skills"
  | "experience"
  | "projects"
  | "certificates"
  | "awards"
  | "problems";

export interface CompletenessItem {
  key: CompletenessKey;
  label: string;
  done: boolean;
}

/** Structural subset of ResumeData — lets the client recompute the meter
 *  live from portfolio state with the exact same rules the server uses. */
export interface CompletenessInput {
  headline: string;
  summary: string;
  skills: string[];
  problemsSolved: string[];
  experiences: unknown[];
  projects: unknown[];
  certificates: unknown[];
  awards: unknown[];
}

export function resumeCompleteness(d: CompletenessInput): {
  pct: number;
  items: CompletenessItem[];
} {
  const items: CompletenessItem[] = [
    { key: "identity", label: "Headline", done: d.headline.trim().length > 0 },
    {
      key: "identity",
      label: "Professional summary",
      done: d.summary.trim().length > 0,
    },
    { key: "skills", label: "At least 3 skills", done: d.skills.length >= 3 },
    {
      key: "experience",
      label: "Work experience",
      done: d.experiences.length > 0,
    },
    { key: "projects", label: "A project", done: d.projects.length > 0 },
    {
      key: "certificates",
      label: "A certificate or award",
      done: d.certificates.length > 0 || d.awards.length > 0,
    },
    {
      key: "problems",
      label: "Problems solved (proof of capability)",
      done: d.problemsSolved.length > 0,
    },
  ];
  const pct = Math.round(
    (items.filter((i) => i.done).length / items.length) * 100,
  );
  return { pct, items };
}
