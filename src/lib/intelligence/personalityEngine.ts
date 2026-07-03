/**
 * Working-style quiz engine (Feature 2). Deterministic: each answer adds
 * fixed points to archetype buckets; highest total wins, ties broken by a
 * fixed archetype order. Result is descriptive context ONLY — it never
 * feeds a match score and is never a filter.
 */
import { ARCHETYPES, type ScoreResult } from "./scoringConfig";

export interface QuizOption {
  id: string;
  label: string;
  /** Points per archetype id this option contributes. */
  points: Record<string, number>;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

/** Fixed tie-break order (also the display order). */
export const ARCHETYPE_ORDER = ["builder", "strategist", "connector", "explorer"];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "A new project lands with no clear plan. Your first move?",
    options: [
      { id: "a", label: "Build a rough working version to learn from", points: { builder: 2 } },
      { id: "b", label: "Map the problem, constraints, and trade-offs", points: { strategist: 2 } },
      { id: "c", label: "Talk to the people involved to align on the goal", points: { connector: 2 } },
      { id: "d", label: "Research how others have approached it — then diverge", points: { explorer: 2 } },
    ],
  },
  {
    id: "q2",
    prompt: "What kind of work leaves you most energised at the end of a day?",
    options: [
      { id: "a", label: "Something concrete now exists that didn't this morning", points: { builder: 2 } },
      { id: "b", label: "A messy situation now has a clear direction", points: { strategist: 2 } },
      { id: "c", label: "Two groups that were stuck are now moving together", points: { connector: 2 } },
      { id: "d", label: "I learned something genuinely new", points: { explorer: 2 } },
    ],
  },
  {
    id: "q3",
    prompt: "Your team disagrees on an approach. You usually…",
    options: [
      { id: "a", label: "Prototype both options and let results decide", points: { builder: 2, explorer: 1 } },
      { id: "b", label: "Frame the decision criteria and trade-offs explicitly", points: { strategist: 2 } },
      { id: "c", label: "Make sure every side actually hears the others first", points: { connector: 2 } },
      { id: "d", label: "Look for a third option nobody has considered", points: { explorer: 2 } },
    ],
  },
  {
    id: "q4",
    prompt: "Which compliment lands the hardest?",
    options: [
      { id: "a", label: "\"You ship. It's real because of you.\"", points: { builder: 2 } },
      { id: "b", label: "\"You saw this coming before anyone.\"", points: { strategist: 2 } },
      { id: "c", label: "\"This team works because of you.\"", points: { connector: 2 } },
      { id: "d", label: "\"Where do you even find these ideas?\"", points: { explorer: 2 } },
    ],
  },
  {
    id: "q5",
    prompt: "The part of a role you'd protect from being delegated:",
    options: [
      { id: "a", label: "Hands-on making — code, designs, prototypes", points: { builder: 2 } },
      { id: "b", label: "Setting direction and sequencing the roadmap", points: { strategist: 2 } },
      { id: "c", label: "The 1:1s, mentoring, and cross-team relationships", points: { connector: 2 } },
      { id: "d", label: "Scouting new tools, methods, and opportunities", points: { explorer: 2 } },
    ],
  },
  {
    id: "q6",
    prompt: "Under a hard deadline, your instinct is to…",
    options: [
      { id: "a", label: "Cut scope and ship the core thing well", points: { builder: 2, strategist: 1 } },
      { id: "b", label: "Re-plan: what actually matters by when?", points: { strategist: 2 } },
      { id: "c", label: "Rally people — clear blockers, redistribute load", points: { connector: 2 } },
      { id: "d", label: "Find the unconventional shortcut", points: { explorer: 2 } },
    ],
  },
  {
    id: "q7",
    prompt: "A year from now, the growth you'd be proudest of:",
    options: [
      { id: "a", label: "Mastery — measurably better at my craft", points: { builder: 2 } },
      { id: "b", label: "Judgment — trusted with bigger, fuzzier calls", points: { strategist: 2 } },
      { id: "c", label: "Leverage — others grew because I was there", points: { connector: 2 } },
      { id: "d", label: "Range — competent in a domain I hadn't touched", points: { explorer: 2 } },
    ],
  },
  {
    id: "q8",
    prompt: "Your ideal week has the most time for…",
    options: [
      { id: "a", label: "Deep, uninterrupted making", points: { builder: 2 } },
      { id: "b", label: "Thinking, writing, and deciding", points: { strategist: 2 } },
      { id: "c", label: "Working sessions with people I rate", points: { connector: 2 } },
      { id: "d", label: "Experiments with no guaranteed outcome", points: { explorer: 2 } },
    ],
  },
];

export interface QuizOutcome extends ScoreResult {
  archetype: string;
  /** Per-archetype totals (the explainable breakdown). */
  totals: Record<string, number>;
}

/**
 * Score a completed quiz: answers = { [questionId]: optionId }.
 * Unanswered questions simply contribute nothing (partial quizzes allowed).
 */
export function scoreQuiz(answers: Record<string, string>): QuizOutcome {
  const totals: Record<string, number> = Object.fromEntries(
    ARCHETYPE_ORDER.map((id) => [id, 0]),
  );
  for (const q of QUIZ_QUESTIONS) {
    const opt = q.options.find((o) => o.id === answers[q.id]);
    if (!opt) continue;
    for (const [arch, pts] of Object.entries(opt.points)) {
      totals[arch] = (totals[arch] ?? 0) + pts;
    }
  }
  const winner = ARCHETYPE_ORDER.reduce((best, id) =>
    totals[id] > totals[best] ? id : best,
  );
  const a = ARCHETYPES[winner];
  const answered = Object.keys(answers).length;
  const max = Math.max(...Object.values(totals));
  return {
    archetype: winner,
    totals,
    score: max,
    reasons: [
      `${a.name} scored highest (${totals[winner]} pts) across ${answered} answers.`,
      a.description,
      "This is working-style context — it never changes match scores and is never used to exclude anyone.",
    ],
    uncertainty:
      "Self-reported preferences on a short quiz — a conversation starter, not a verdict.",
  };
}
