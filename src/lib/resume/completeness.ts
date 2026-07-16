/**
 * Resume completeness meter — pure, deterministic % of sections filled.
 * Each item is user-actionable; the page renders them as a clickable
 * checklist and `key` names the section that completes it.
 */

/** Anchor for the checklist deep-link — the four merged PortfolioBuilder
 *  sections plus the problems-solved editor (inside Experience). */
export type CompletenessKey =
  | "identity"
  | "skills"
  | "experience"
  | "recognition"
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

/** kind is optional metadata — old snapshots/ResumeData rows have none. */
const kindOf = (e: unknown): string =>
  typeof e === "object" && e !== null && "kind" in e
    ? String((e as { kind?: unknown }).kind ?? "role")
    : "role";

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
      done: d.experiences.some((e) => kindOf(e) !== "project"),
    },
    {
      key: "experience",
      label: "A project or problem solved",
      done:
        d.projects.length > 0 ||
        d.experiences.some((e) => kindOf(e) === "project"),
    },
    {
      key: "recognition",
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
