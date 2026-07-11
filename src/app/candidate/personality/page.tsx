"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Loader2, RotateCcw, ShieldCheck, Check } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ArchetypeRadar } from "@/components/personality/ArchetypeRadar";
import { QUIZ_QUESTIONS, ARCHETYPE_ORDER } from "@/lib/intelligence/personalityEngine";
import { ARCHETYPES } from "@/lib/intelligence/scoringConfig";
import { cn } from "@/lib/utils";

interface StoredResult {
  archetype: string;
  scores: Record<string, number>;
}

/** Short axis label per archetype ("The Builder" → "Builder"). */
const SHORT_LABEL: Record<string, string> = Object.fromEntries(
  ARCHETYPE_ORDER.map((id) => [id, ARCHETYPES[id].name.replace(/^The\s+/i, "")]),
);

/** Accent-pill eyebrow, matching the dashboard cockpit cards. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-luminous/30 bg-luminous/10 text-luminous-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] [&_svg]:size-3">
      {children}
    </p>
  );
}

/**
 * Working-style profile (Feature 2). Deliberately framed as strength
 * context — professional tone, no confetti — so it reads right for a
 * 35+ candidate while staying light for younger ones. Descriptive only:
 * the archetype never changes match scores and is never a filter.
 */
export default function PersonalityPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<StoredResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me/personality", { cache: "no-store" });
      const json = await res.json();
      if (json.ok && json.data.result) {
        setResult({
          archetype: json.data.result.archetype,
          scores: json.data.result.scores,
        });
      }
      setLoaded(true);
    })();
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me/personality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      setResult({
        archetype: json.data.result.archetype,
        scores: json.data.result.scores,
      });
    } else {
      setError(json.error?.message ?? "Could not save your result.");
    }
  }

  const answered = QUIZ_QUESTIONS.filter((q) => answers[q.id]).length;
  const pct = Math.round((answered / QUIZ_QUESTIONS.length) * 100);
  const archetype = result ? ARCHETYPES[result.archetype] : null;
  const q = QUIZ_QUESTIONS[step];

  /** Record the answer, then auto-advance to the next question. */
  function pick(optionId: string) {
    setAnswers((a) => ({ ...a, [q.id]: optionId }));
    if (step < QUIZ_QUESTIONS.length - 1) {
      // ponytail: 250ms pause so the selection highlight registers before the slide
      setTimeout(() => setStep(step + 1), 250);
    }
  }

  return (
    <AppShell>
      <section className="max-w-container mx-auto w-full px-4 pb-10 pt-4">
        <p className="text-luminous font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
          Working-style profile
        </p>
        <h1 className="mt-0.5 mb-5 text-xl font-extrabold tracking-tight sm:text-2xl">
          Working Style <span className="text-luminous">Quiz</span>
        </h1>
        {!loaded ? (
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : archetype && result ? (
          /* ── Result view — radar + breakdown, cockpit language ── */
          <Grid12>
            {/* Left: the working-style shape */}
            <Col span={12} lg={5}>
              <section className="glass-3 flex flex-col rounded-2xl p-6">
                <Eyebrow>
                  <Fingerprint aria-hidden />
                  Your working style
                </Eyebrow>
                <div className="mt-4 flex flex-col items-center">
                  <ArchetypeRadar
                    order={ARCHETYPE_ORDER}
                    scores={result.scores}
                    labels={SHORT_LABEL}
                    dominant={result.archetype}
                  />
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    {archetype.name}
                  </h2>
                  <p className="text-luminous-soft text-sm">{archetype.tagline}</p>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {archetype.strengths.map((s) => (
                    <Chip key={s} tone="luminous">
                      {s}
                    </Chip>
                  ))}
                </div>
              </section>
            </Col>

            {/* Right: narrative + score breakdown + bias note */}
            <Col span={12} lg={7}>
              <section className="glass-3 rounded-2xl p-6">
                <Eyebrow>Explanation &amp; scoring</Eyebrow>
                <p className="mt-3 text-sm leading-relaxed">
                  {archetype.description}
                </p>

                <p className="text-muted-foreground mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Score breakdown
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {ARCHETYPE_ORDER.map((id) => (
                    <ScoreBar
                      key={id}
                      label={SHORT_LABEL[id]}
                      value={Math.min(100, (result.scores[id] ?? 0) * 6)}
                      accent={id === result.archetype ? "luminous" : "clover"}
                      size="sm"
                      surfaceClassName={
                        id === result.archetype
                          ? "border border-luminous/30 bg-luminous/5"
                          : "glass-4"
                      }
                    />
                  ))}
                </div>

                <p className="border-border/15 bg-foreground/2 text-muted-foreground mt-5 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
                  <ShieldCheck className="text-clover mt-0.5 size-4 shrink-0" aria-hidden />
                  Employers see this as interpretation context only — with an
                  explicit note that it is <strong>not</strong> a screening signal.
                </p>

                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                    setStep(0);
                  }}
                >
                  <RotateCcw />
                  Retake
                </Button>
              </section>
            </Col>
          </Grid12>
        ) : (
          /* ── Quiz view — one question at a time, ring progress ── */
          <Grid12>
            <Col span={12} lg={8}>
              <section key={q.id} className="glass-3 animate-appear rounded-2xl p-6">
                <div className="flex items-center justify-between gap-2">
                  <Eyebrow>
                    Question {step + 1} of {QUIZ_QUESTIONS.length}
                  </Eyebrow>
                </div>
                <p className="mt-4 text-lg font-semibold tracking-tight">
                  {q.prompt}
                </p>
                <Grid12 className="mt-4">
                  {q.options.map((o) => {
                    const active = answers[q.id] === o.id;
                    return (
                      <Col key={o.id} span={12} md={6}>
                        <button
                          type="button"
                          onClick={() => pick(o.id)}
                          aria-pressed={active}
                          className={cn(
                            "flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                            active
                              ? "border-luminous/60 bg-luminous/10"
                              : "border-border/15 bg-foreground/2 hover:border-luminous/40",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                              active
                                ? "border-luminous bg-luminous text-background"
                                : "border-border/30",
                            )}
                          >
                            {active && <Check className="size-3" />}
                          </span>
                          <span className="min-w-0">{o.label}</span>
                        </button>
                      </Col>
                    );
                  })}
                </Grid12>

                <div className="line-t mt-6 flex items-center justify-between pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                  {answers[q.id] && step < QUIZ_QUESTIONS.length - 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setStep(step + 1)}>
                      Next
                    </Button>
                  )}
                  {answered === QUIZ_QUESTIONS.length && (
                    <Button onClick={submit} disabled={busy}>
                      {busy ? "Scoring…" : "See my working style"}
                    </Button>
                  )}
                </div>
                {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
              </section>
            </Col>

            {/* Progress companion — the cockpit's ring language */}
            <Col span={12} lg={4}>
              <section className="glass-3 flex flex-col items-center rounded-2xl p-6">
                <Eyebrow>Progress</Eyebrow>
                <ProgressRing
                  value={pct}
                  label="Answered"
                  size={128}
                  className="mt-5"
                />
                <p className="text-muted-foreground mt-4 text-center text-xs">
                  {answered} of {QUIZ_QUESTIONS.length} answered. Pick the option
                  that fits how you actually work — there are no wrong answers.
                </p>
              </section>
            </Col>
          </Grid12>
        )}
      </section>
    </AppShell>
  );
}
