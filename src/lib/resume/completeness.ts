import type { ResumeData } from "./data";

/**
 * Resume completeness meter — pure, deterministic % of sections filled.
 * Each item is user-actionable; the page renders them as a checklist.
 */
export interface CompletenessItem {
  label: string;
  done: boolean;
}

export function resumeCompleteness(d: ResumeData): {
  pct: number;
  items: CompletenessItem[];
} {
  const items: CompletenessItem[] = [
    { label: "Headline", done: d.headline.trim().length > 0 },
    { label: "Professional summary", done: d.summary.trim().length > 0 },
    { label: "At least 3 skills", done: d.skills.length >= 3 },
    { label: "Work experience", done: d.experiences.length > 0 },
    { label: "A project", done: d.projects.length > 0 },
    {
      label: "A certificate or award",
      done: d.certificates.length > 0 || d.awards.length > 0,
    },
    {
      label: "Problems solved (proof of capability)",
      done: d.problemsSolved.length > 0,
    },
  ];
  const pct = Math.round(
    (items.filter((i) => i.done).length / items.length) * 100,
  );
  return { pct, items };
}
