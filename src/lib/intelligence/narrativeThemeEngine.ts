/**
 * Narrative Theme engine — reads the Timeline Journal (+ portfolio evidence)
 * and surfaces the pattern a candidate can't see across scattered entries:
 * recurring themes, which ones energize vs drain, turning points, and the gap
 * between what they REFLECT on and what their portfolio actually SHOWS.
 *
 * Pure + deterministic (keyword + mood frequency, no LLM). Descriptive career
 * insight only — never a match-score input.
 */
import { normalizeSkill } from "@/lib/jobs/data";
import { extractSkillsFromText } from "@/lib/skills/taxonomy";
import { countOccurrences, type JournalSignal } from "./candidateSignal";
import type { ScoreResult } from "./scoringConfig";

// Mood → valence. Positive moods lift a theme's energy, negative ones sink it;
// "steady"/unset are neutral. (Legal moods owned by the API layer.)
const MOOD_VALENCE: Record<string, number> = {
  energized: 1,
  proud: 1,
  steady: 0,
  drained: -1,
  uncertain: -1,
};

export interface NarrativeTheme {
  /** Display label (the candidate's own wording). */
  theme: string;
  /** Journal entries touching this theme. */
  count: number;
  /** Proven in the Living Portfolio (not just written about). */
  inPortfolio: boolean;
  energy: "energizing" | "draining" | "neutral";
}

export interface NarrativeInsight extends ScoreResult {
  themes: NarrativeTheme[];
  /** Contradictions worth reflecting on (proof gaps, energy drains). */
  tensions: string[];
  pivots: number;
  dominantMood: string | null;
  nextStep: string | null;
}

export interface NarrativeInput {
  journal: JournalSignal[];
  /** Concatenated portfolio prose (from CandidateSignal). */
  portfolioText: string;
}

export function analyzeNarrative(input: NarrativeInput): NarrativeInsight {
  const { journal, portfolioText } = input;

  if (journal.length === 0) {
    return {
      score: 0,
      themes: [],
      tensions: [],
      pivots: 0,
      dominantMood: null,
      nextStep:
        "Start your Timeline Journal — a few reflections turn scattered events into a story.",
      reasons: ["No journal entries yet — nothing to read a narrative from."],
      uncertainty:
        "Themes are drawn from what you write; an empty journal has no signal.",
    };
  }

  // Aggregate themes: explicit skillsTouched + skills mined from each entry's
  // title+reflection. Keyed by canonical skill, one bump per (entry, skill) so
  // a single wordy entry can't inflate a theme.
  const theme = new Map<
    string,
    { display: string; count: number; valence: number }
  >();
  const bump = (raw: string, valence: number, seen: Set<string>) => {
    const canonical = normalizeSkill(raw);
    if (!canonical || seen.has(canonical)) return;
    seen.add(canonical);
    const cur = theme.get(canonical) ?? {
      display: raw.trim() || canonical,
      count: 0,
      valence: 0,
    };
    cur.count += 1;
    cur.valence += valence;
    theme.set(canonical, cur);
  };

  const moodTally = new Map<string, number>();
  let pivots = 0;
  for (const e of journal) {
    const v = MOOD_VALENCE[e.mood] ?? 0;
    if (e.mood) moodTally.set(e.mood, (moodTally.get(e.mood) ?? 0) + 1);
    if (e.pivot) pivots += 1;
    const seen = new Set<string>();
    for (const s of e.skillsTouched) bump(s, v, seen);
    for (const s of extractSkillsFromText(`${e.title} ${e.reflection}`))
      bump(s, v, seen);
  }

  const themes: NarrativeTheme[] = [...theme.values()]
    .filter((t) => t.count >= 2) // a theme = something that recurs
    .sort((a, b) => b.count - a.count || a.display.localeCompare(b.display))
    .slice(0, 6)
    .map((t) => ({
      theme: t.display,
      count: t.count,
      inPortfolio: countOccurrences(portfolioText, t.display) > 0,
      energy: t.valence > 0 ? "energizing" : t.valence < 0 ? "draining" : "neutral",
    }));

  // Tensions — genuine contradictions worth surfacing (energizing themes speak
  // for themselves via their `energy` tag, so they aren't listed here).
  const tensions: string[] = [];
  const proofGap = themes.find((t) => !t.inPortfolio);
  if (proofGap) {
    tensions.push(
      `You reflect on ${proofGap.theme} often, but it isn't in your portfolio yet — turn the reflection into proof.`,
    );
  }
  const drain = themes.find((t) => t.energy === "draining");
  if (drain) {
    tensions.push(
      `${drain.theme} keeps coming up when you feel drained — worth asking whether it belongs in your next chapter.`,
    );
  }

  const dominantMood =
    [...moodTally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Narrative richness: entries + distinct recurring themes + turning points,
  // each capped so no single dimension dominates.
  const score = Math.min(
    100,
    Math.min(50, journal.length * 10) +
      Math.min(30, themes.length * 10) +
      Math.min(20, pivots * 10),
  );

  const nextStep = proofGap
    ? `Add evidence for ${proofGap.theme} to your Living Portfolio.`
    : themes.length === 0
      ? "Tag the skills each entry touches so patterns can surface."
      : `Keep documenting ${themes[0].theme} — it's becoming your throughline.`;

  return {
    score,
    themes,
    tensions,
    pivots,
    dominantMood,
    nextStep,
    reasons: [
      `${journal.length} journal ${journal.length === 1 ? "entry" : "entries"}, ${themes.length} recurring theme${themes.length === 1 ? "" : "s"}${pivots ? `, ${pivots} turning point${pivots === 1 ? "" : "s"}` : ""}.`,
      themes.length
        ? `Most present: ${themes.slice(0, 3).map((t) => t.theme).join(", ")}.`
        : "No theme repeats yet — a few more entries will reveal one.",
    ],
    uncertainty:
      "Themes come from keywords you write and skills you tag — they can't see meaning you leave unsaid.",
  };
}
