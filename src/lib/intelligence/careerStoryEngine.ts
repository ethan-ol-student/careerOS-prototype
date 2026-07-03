/**
 * Career Story engine (mid-career) — reads the experience timeline and
 * surfaces the career pattern + hidden strengths ("your past is proof of
 * capability, not just job titles").
 *
 * ponytail: token heuristic over role titles. A richer narrative model can
 * replace the body; keep the shape.
 */
import { lower, type ScoreResult } from "./scoringConfig";

export interface StoryExperience {
  role: string;
  company: string;
  period: string;
  detail?: string | null;
}

export interface CareerStoryInput {
  experiences: StoryExperience[];
  /** Self-declared pattern from MidCareerProfile ("" = detect). */
  careerPattern: string;
  problemsSolved: string[];
}

export interface CareerStory extends ScoreResult {
  pattern: string; // "specialist" | "generalist" | "pivot" | "zigzag"
  hiddenStrengths: string[];
}

const tokens = (s: string) =>
  lower(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2);

export function analyzeCareerStory(input: CareerStoryInput): CareerStory {
  const { experiences, problemsSolved } = input;

  // Pattern: self-declared wins; else detect from role-title overlap.
  let pattern = input.careerPattern;
  let patternWhy = `You described your path as "${pattern}".`;
  if (!pattern) {
    const roleTokenSets = experiences.map((e) => new Set(tokens(e.role)));
    const first = roleTokenSets[0] ?? new Set<string>();
    const overlapping = roleTokenSets.filter(
      (s) => [...s].some((t) => first.has(t)),
    ).length;
    pattern =
      experiences.length < 2
        ? "emerging"
        : overlapping === roleTokenSets.length
          ? "specialist"
          : overlapping > roleTokenSets.length / 2
            ? "generalist"
            : "zigzag";
    patternWhy = `Detected from ${experiences.length} roles: ${
      pattern === "specialist"
        ? "your titles share a common core — deepening one craft."
        : pattern === "generalist"
          ? "your titles overlap partially — breadth built around a core."
          : pattern === "zigzag"
            ? "your titles differ widely — range across domains."
            : "not enough history yet to detect a pattern."
    }`;
  }

  // Hidden strengths: solved problems first (proof of capability), then
  // longevity/mobility signals derived from the timeline itself.
  const hiddenStrengths = [...problemsSolved.slice(0, 3)];
  const companies = new Set(experiences.map((e) => lower(e.company))).size;
  if (experiences.length >= 3) {
    hiddenStrengths.push(
      `Sustained progression across ${experiences.length} roles at ${companies} compan${companies === 1 ? "y" : "ies"}.`,
    );
  }

  const score = Math.min(
    100,
    Math.min(60, experiences.length * 20) +
      Math.min(30, problemsSolved.length * 10) +
      (input.careerPattern ? 10 : 0),
  );

  return {
    score,
    pattern,
    hiddenStrengths,
    reasons: [
      patternWhy,
      problemsSolved.length
        ? `${problemsSolved.length} documented problem${problemsSolved.length === 1 ? "" : "s"} solved — concrete proof of capability.`
        : "Add problems you've solved to turn history into proof of capability.",
    ],
    uncertainty:
      "Pattern detection reads role titles only — it can't see scope or impact you haven't written down.",
  };
}
