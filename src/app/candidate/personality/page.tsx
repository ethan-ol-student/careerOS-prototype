"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Loader2, RotateCcw } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { QUIZ_QUESTIONS, ARCHETYPE_ORDER } from "@/lib/intelligence/personalityEngine";
import { ARCHETYPES } from "@/lib/intelligence/scoringConfig";
import { cn } from "@/lib/utils";

interface StoredResult {
  archetype: string;
  scores: Record<string, number>;
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
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
          Working-style profile
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
          <Fingerprint className="text-luminous size-6" />
          How you work best
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Eight questions about how you actually operate — the result is
          strength context for your profile, not a label. It never changes
          your match scores and is never used to screen you out.
        </p>

        {!loaded ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : archetype ? (
          /* ── Result view ── */
          <section className="glass-3 mt-8 rounded-2xl p-6">
            <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
              Your working style
            </p>
            <h2 className="mt-1 text-2xl font-semibold">{archetype.name}</h2>
            <p className="text-muted-foreground text-sm">{archetype.tagline}</p>
            <p className="mt-3 text-sm leading-relaxed">{archetype.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {archetype.strengths.map((s) => (
                <Chip key={s} tone="clover">
                  {s}
                </Chip>
              ))}
            </div>

            {result && (
              <div className="mt-6">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  Score breakdown
                </p>
                <div className="mt-2 space-y-1.5">
                  {ARCHETYPE_ORDER.map((id) => (
                    <div key={id} className="flex items-center gap-3 text-sm">
                      <span className="w-28 shrink-0">{ARCHETYPES[id].name}</span>
                      <div className="bg-card/60 h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            id === result.archetype ? "bg-luminous" : "bg-border",
                          )}
                          style={{
                            width: `${Math.min(100, (result.scores[id] ?? 0) * 6)}%`,
                          }}
                        />
                      </div>
                      <span className="text-muted-foreground w-6 text-right text-xs">
                        {result.scores[id] ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-muted-foreground mt-6 text-xs italic">
              Employers see this as interpretation context only — with an
              explicit note that it is not a screening signal.
            </p>
            <Button
              variant="outline"
              className="mt-4"
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
        ) : (
          /* ── Quiz view — one question at a time, auto-advance ── */
          <>
            <section
              key={q.id}
              className="glass-3 animate-appear mt-8 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-luminous text-xs font-semibold uppercase tracking-wider">
                  Question {step + 1} of {QUIZ_QUESTIONS.length}
                </p>
                <p className="text-muted-foreground text-xs">
                  {answered}/{QUIZ_QUESTIONS.length} answered
                </p>
              </div>
              <p className="mt-3 font-medium">{q.prompt}</p>
              <Grid12 className="mt-4">
                {q.options.map((o) => (
                  <Col key={o.id} span={12} md={6}>
                    <button
                      type="button"
                      onClick={() => pick(o.id)}
                      className={cn(
                        "min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        answers[q.id] === o.id
                          ? "border-luminous/60 bg-luminous/10"
                          : "border-border/40 bg-card/40 hover:border-luminous/40",
                      )}
                    >
                      {o.label}
                    </button>
                  </Col>
                ))}
              </Grid12>
            </section>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
                {answers[q.id] && step < QUIZ_QUESTIONS.length - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(step + 1)}
                  >
                    Next
                  </Button>
                )}
              </div>
              {answered === QUIZ_QUESTIONS.length && (
                <Button onClick={submit} disabled={busy}>
                  {busy ? "Scoring…" : "See my working style"}
                </Button>
              )}
            </div>
            {error && <p className="text-destructive mt-3 text-sm">{error}</p>}
          </>
        )}
      </main>
    </AppShell>
  );
}
