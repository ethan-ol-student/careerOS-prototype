"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

// ── Step content ─────────────────────────────────────────────────

const STAGES = [
  {
    id: "student",
    label: "Student",
    age: "13–17",
    meaning:
      "Discover paths, choose streams, colleges, and early skills.",
  },
  {
    id: "young-adult",
    label: "Young Adult",
    age: "18–22",
    meaning:
      "Build portfolios, land internships, connect with alumni.",
  },
  {
    id: "early-career",
    label: "Early Career",
    age: "23–34",
    meaning:
      "Land the right first job, understand market value, track career trajectory.",
  },
  {
    id: "mid-career",
    label: "Mid-Career",
    age: "35–44",
    meaning:
      "Identify likely next moves and close skill gaps before they matter.",
  },
  {
    id: "senior-career",
    label: "Senior Career",
    age: "45–54",
    meaning:
      "Pivot into leadership, advisory, or new industries; mentor the next cohort.",
  },
  {
    id: "executive",
    label: "Executive & Beyond",
    age: "55+",
    meaning:
      "Board roles, consultancy, graceful wind-down; experience becomes a shortcut for the next generation.",
  },
];

const INDUSTRY_OPTIONS = [
  "Technology",
  "Design",
  "Engineering",
  "Marketing",
  "Business",
  "Data",
  "Creative",
  "Operations",
  "Healthcare",
  "Finance",
];
const OPPORTUNITY_TYPES = [
  "Full-time",
  "Internship",
  "Contract",
  "Freelance",
  "Apprenticeship",
];
const TIMELINES = ["0–3 months", "3–6 months", "6–12 months", "1–2 years", "2+ years"];
const WEEKLY_LEARNING = [
  "<2 hours",
  "2–5 hours",
  "5–10 hours",
  "10+ hours",
];
const CONFIDENCE = ["low", "medium", "high"] as const;
type Confidence = (typeof CONFIDENCE)[number];

// ── Draft type + storage ────────────────────────────────────────

interface Draft {
  careerStage: string;
  careerStageMeaning: string;
  targetRoles: string[];
  interestedIndustries: string[];
  opportunityTypes: string[];
  locationPreference: string;
  availability: string;
  currentSkills: string[];
  skillLevels: Record<string, "beginner" | "intermediate" | "expert">;
  projects: string[];
  skillsToImprove: string[];
  weeklyLearningTime: string;
  desiredNextMove: string;
  longTermGoal: string;
  timeline: string;
  careerConfidence: Confidence | "";
  mainBlocker: string;
  applicationsSent: string;
  interviewExperience: string;
  rejectionsOrChallenges: string;
  resumeConfidence: Confidence | "";
  portfolioConfidence: Confidence | "";
  interviewConfidence: Confidence | "";
}

const DRAFT_KEY = "career-os-candidate-onboarding-draft";

/**
 * Normalizes any partial draft input (server payload, cached JSON,
 * old shape, etc.) into a fully-populated `Draft` with no `null` /
 * `undefined` values. Controlled inputs need non-null defaults to
 * avoid React's "changing uncontrolled to controlled" warnings.
 */
function normalizeDraft(input: unknown): Draft {
  const i: Record<string, unknown> = (input as Record<string, unknown>) ?? {};
  const safeString = (v: unknown): string => (typeof v === "string" ? v : "");
  const safeArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const safeConfidence = (v: unknown): Confidence | "" => {
    if (v === "low" || v === "medium" || v === "high") return v;
    return "";
  };
  const safeSkillLevels = (
    v: unknown,
  ): Record<string, "beginner" | "intermediate" | "expert"> => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, "beginner" | "intermediate" | "expert"> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === "beginner" || val === "intermediate" || val === "expert") {
        out[k] = val;
      }
    }
    return out;
  };
  return {
    careerStage: safeString(i.careerStage),
    careerStageMeaning: safeString(i.careerStageMeaning),
    targetRoles: safeArray(i.targetRoles),
    interestedIndustries: safeArray(i.interestedIndustries),
    opportunityTypes: safeArray(i.opportunityTypes),
    locationPreference: safeString(i.locationPreference),
    availability: safeString(i.availability),
    currentSkills: safeArray(i.currentSkills),
    skillLevels: safeSkillLevels(i.skillLevels),
    projects: safeArray(i.projects),
    skillsToImprove: safeArray(i.skillsToImprove),
    weeklyLearningTime: safeString(i.weeklyLearningTime),
    desiredNextMove: safeString(i.desiredNextMove),
    longTermGoal: safeString(i.longTermGoal),
    timeline: safeString(i.timeline),
    careerConfidence: safeConfidence(i.careerConfidence),
    mainBlocker: safeString(i.mainBlocker),
    applicationsSent: safeString(i.applicationsSent),
    interviewExperience: safeString(i.interviewExperience),
    rejectionsOrChallenges: safeString(i.rejectionsOrChallenges),
    resumeConfidence: safeConfidence(i.resumeConfidence),
    portfolioConfidence: safeConfidence(i.portfolioConfidence),
    interviewConfidence: safeConfidence(i.interviewConfidence),
  };
}

const emptyDraft: Draft = {
  careerStage: "",
  careerStageMeaning: "",
  targetRoles: [],
  interestedIndustries: [],
  opportunityTypes: [],
  locationPreference: "",
  availability: "",
  currentSkills: [],
  skillLevels: {},
  projects: [],
  skillsToImprove: [],
  weeklyLearningTime: "",
  desiredNextMove: "",
  longTermGoal: "",
  timeline: "",
  careerConfidence: "",
  mainBlocker: "",
  applicationsSent: "",
  interviewExperience: "",
  rejectionsOrChallenges: "",
  resumeConfidence: "",
  portfolioConfidence: "",
  interviewConfidence: "",
};

// ── Component ────────────────────────────────────────────────────

export default function CandidateOnboardingPage() {
  const router = useRouter();
  const {
    user,
    candidateOnboardingCompleted,
    status: authStatus,
    refresh,
  } = useAuth();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const totalSteps = 5;

  // Explicit edit mode (?edit=1 from Settings). Read post-mount so SSR
  // and first client render match (no hydration mismatch); the guard
  // waits for `editChecked` before deciding any redirect.
  const [editMode, setEditMode] = useState(false);
  const [editChecked, setEditChecked] = useState(false);
  useEffect(() => {
    const isEdit =
      new URLSearchParams(window.location.search).get("edit") === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time URL flag read on mount.
    setEditMode(isEdit);
    setEditChecked(true);
  }, []);

  // Auth guard: redirect if not signed in or wrong role. Completed
  // users are bounced to the dashboard UNLESS they're intentionally
  // editing (edit mode), which keeps onboarding from restarting.
  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!editChecked) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.role !== "candidate") {
      router.replace("/employers/marketplace");
      return;
    }
    if (candidateOnboardingCompleted && !editMode) {
      router.replace("/candidate/dashboard");
    }
  }, [authStatus, user, candidateOnboardingCompleted, editMode, editChecked, router]);

  // Load draft from cache + server.
  useEffect(() => {
    try {
      const cached = localStorage.getItem(DRAFT_KEY);
      if (cached) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time draft hydration from local cache.
        setDraft(normalizeDraft(JSON.parse(cached)));
      }
    } catch {
      /* ignore */
    }
    void (async () => {
      try {
        const res = await fetch("/api/me/onboarding", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: Partial<Draft> }
          | null;
        if (body?.ok && body.data) {
          // Merge server data over the current draft, then normalize so
          // any nullable Prisma columns (locationPreference, availability,
          // confidence enums, skillLevels JSON, …) become safe defaults.
          setDraft((prev) => normalizeDraft({ ...prev, ...body.data }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Auto-save draft to localStorage as the user moves.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const persistPartial = async () => {
    try {
      await fetch("/api/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripEmpty(draft)),
      });
    } catch {
      /* ignore — local cache still has it */
    }
  };

  const validateStep = (i: number): string | null => {
    if (i === 0 && !draft.careerStage) return "Pick the career stage that fits you best.";
    if (i === 1 && draft.targetRoles.length === 0)
      return "Add at least one target role.";
    if (i === 2 && draft.currentSkills.length === 0)
      return "Add at least one current skill.";
    if (i === 3 && draft.desiredNextMove.trim().length < 3)
      return "Describe your desired next move.";
    return null;
  };

  const handleNext = async () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    await persistPartial();
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    try {
      const personalizationSummary = buildSummary(draft);
      const res = await fetch("/api/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...stripEmpty(draft),
          dashboardPersonalizationSummary: personalizationSummary,
          onboardingCompleted: true,
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;
      if (!body?.ok) {
        setError(body?.error?.message ?? "Failed to save onboarding.");
        setSubmitting(false);
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      await refresh();
      // Editing from Settings returns there; first-time completion opens
      // the dashboard.
      router.replace(editMode ? "/candidate/settings" : "/candidate/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding.");
      setSubmitting(false);
    }
  };

  const isLast = step === totalSteps - 1;

  return (
    <main className="bg-background text-foreground relative min-h-screen w-full px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <span className="text-luminous inline-flex items-center gap-2 text-sm font-semibold">
            <Compass className="size-4" />
            Career OS · Candidate setup
          </span>
          <span className="text-muted-foreground text-xs">
            Step {step + 1} of {totalSteps}
          </span>
        </header>

        {/* Progress bar */}
        <div className="bg-muted/40 h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-luminous h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <section className="glass-4 ring-luminous/20 rounded-2xl p-6 ring-1 sm:p-8">
          {step === 0 && <StageStep draft={draft} update={update} />}
          {step === 1 && <DiscoveryStep draft={draft} update={update} />}
          {step === 2 && <GrowthStep draft={draft} update={update} />}
          {step === 3 && <ProgressionStep draft={draft} update={update} />}
          {step === 4 && <FeedbackStep draft={draft} update={update} />}

          {error ? (
            <p
              role="alert"
              className="text-destructive mt-4 inline-flex items-center gap-1.5 text-xs"
            >
              {error}
            </p>
          ) : null}

          <div className="border-border/40 mt-6 flex items-center justify-between border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 0 || submitting}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {isLast ? (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                <Sparkles className="size-4" />
                {submitting ? "Saving…" : "Finish & open dashboard"}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={submitting}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </section>

        <p className="text-muted-foreground text-center text-[11px]">
          Your answers are saved as you go. You can refresh — nothing is lost.
        </p>
      </div>
    </main>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function stripEmpty<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === "" || v == null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v as object).length === 0
    ) {
      continue;
    }
    out[k] = v;
  }
  return out as Partial<T>;
}

function buildSummary(d: Draft): string {
  const stage = STAGES.find((s) => s.id === d.careerStage)?.label ?? "";
  const roles = d.targetRoles.slice(0, 3).join(", ");
  const skills = d.currentSkills.slice(0, 3).join(", ");
  return `${stage} aiming for ${roles || "their next role"}. Strong in ${
    skills || "evolving skills"
  }. Wants to grow toward "${d.desiredNextMove || "their next move"}".`;
}

// ── Step components ─────────────────────────────────────────────

function StepHeader({
  step,
  title,
  subtitle,
}: {
  step: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-luminous text-[11px] font-semibold uppercase tracking-[0.18em]">
        Step {step}
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
    </div>
  );
}

function StageStep({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  return (
    <>
      <StepHeader
        step={1}
        title="Which phase are you in right now?"
        subtitle="Pick the one that fits today — you can change it later."
      />
      <ul className="flex flex-col gap-2">
        {STAGES.map((s) => {
          const selected = draft.careerStage === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  update("careerStage", s.id);
                  update("careerStageMeaning", s.meaning);
                }}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  selected
                    ? "border-luminous bg-luminous/10 ring-2 ring-luminous/30"
                    : "border-border/60 bg-card/40 hover:border-luminous/40",
                )}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-muted-foreground text-xs">
                    · {s.age}
                  </span>
                  {selected ? (
                    <Check className="text-luminous ml-auto size-4" />
                  ) : null}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                  {s.meaning}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DiscoveryStep({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  return (
    <>
      <StepHeader
        step={2}
        title="What career paths are you open to?"
        subtitle="Add your target roles, industries you're curious about, and how you want to work."
      />
      <Field label="Target roles">
        <TagInput
          values={draft.targetRoles}
          onChange={(v) => update("targetRoles", v)}
          placeholder="e.g. Frontend Engineer, Product Designer"
        />
      </Field>
      <Field label="Interested industries">
        <ChipMultiSelect
          options={INDUSTRY_OPTIONS}
          values={draft.interestedIndustries}
          onChange={(v) => update("interestedIndustries", v)}
        />
      </Field>
      <Field label="Opportunity types">
        <ChipMultiSelect
          options={OPPORTUNITY_TYPES}
          values={draft.opportunityTypes}
          onChange={(v) => update("opportunityTypes", v)}
        />
      </Field>
      <Field label="Location preference">
        <input
          type="text"
          placeholder="e.g. Remote · Kuala Lumpur · APAC"
          value={draft.locationPreference ?? ""}
          onChange={(e) => update("locationPreference", e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Availability">
        <input
          type="text"
          placeholder="e.g. Actively looking, Open to chats"
          value={draft.availability ?? ""}
          onChange={(e) => update("availability", e.target.value)}
          className={inputClass}
        />
      </Field>
    </>
  );
}

function GrowthStep({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  return (
    <>
      <StepHeader
        step={3}
        title="What skills or projects represent you?"
        subtitle="We use this to seed your Living Portfolio."
      />
      <Field label="Current skills">
        <TagInput
          values={draft.currentSkills}
          onChange={(v) => update("currentSkills", v)}
          placeholder="React, Figma, Mandarin…"
        />
      </Field>
      {draft.currentSkills.length > 0 ? (
        <Field label="Set a level for each skill (optional)">
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {draft.currentSkills.map((s) => (
              <li key={s} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">{s}</span>
                <select
                  value={draft.skillLevels?.[s] ?? ""}
                  onChange={(e) => {
                    const next = { ...(draft.skillLevels ?? {}) };
                    if (!e.target.value) delete next[s];
                    else
                      next[s] = e.target.value as
                        | "beginner"
                        | "intermediate"
                        | "expert";
                    update("skillLevels", next);
                  }}
                  className="border-border/60 bg-card/40 rounded-md border px-2 py-1 text-[11px]"
                >
                  <option value="">level…</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </li>
            ))}
          </ul>
        </Field>
      ) : null}
      <Field label="Projects (short blurbs)">
        <TagInput
          values={draft.projects}
          onChange={(v) => update("projects", v)}
          placeholder="e.g. Open-source UI kit"
        />
      </Field>
      <Field label="Skills you want to improve">
        <TagInput
          values={draft.skillsToImprove}
          onChange={(v) => update("skillsToImprove", v)}
          placeholder="e.g. System design, Public speaking"
        />
      </Field>
      <Field label="Weekly learning time">
        <ChipSingleSelect
          options={WEEKLY_LEARNING}
          value={draft.weeklyLearningTime ?? ""}
          onChange={(v) => update("weeklyLearningTime", v)}
        />
      </Field>
    </>
  );
}

function ProgressionStep({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  return (
    <>
      <StepHeader
        step={4}
        title="Where do you want to move next?"
        subtitle="What does success look like in the next chapter?"
      />
      <Field label="Desired next move *">
        <textarea
          rows={3}
          required
          maxLength={400}
          value={draft.desiredNextMove ?? ""}
          onChange={(e) => update("desiredNextMove", e.target.value)}
          placeholder="e.g. Land a frontend role at a product company within 6 months."
          className={inputClass}
        />
      </Field>
      <Field label="Long-term goal">
        <input
          type="text"
          maxLength={400}
          value={draft.longTermGoal ?? ""}
          onChange={(e) => update("longTermGoal", e.target.value)}
          placeholder="e.g. Lead a design-system team"
          className={inputClass}
        />
      </Field>
      <Field label="Timeline">
        <ChipSingleSelect
          options={TIMELINES}
          value={draft.timeline ?? ""}
          onChange={(v) => update("timeline", v)}
        />
      </Field>
      <Field label="Career confidence">
        <ConfidencePicker
          value={draft.careerConfidence ?? ""}
          onChange={(v) => update("careerConfidence", v)}
        />
      </Field>
      <Field label="Main blocker">
        <input
          type="text"
          maxLength={400}
          value={draft.mainBlocker ?? ""}
          onChange={(e) => update("mainBlocker", e.target.value)}
          placeholder="e.g. No relevant portfolio yet"
          className={inputClass}
        />
      </Field>
    </>
  );
}

function FeedbackStep({
  draft,
  update,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
}) {
  return (
    <>
      <StepHeader
        step={5}
        title="What has happened so far?"
        subtitle="No judgment — context helps us recommend the right next moves."
      />
      <Field label="Applications sent">
        <input
          type="text"
          maxLength={40}
          value={draft.applicationsSent ?? ""}
          onChange={(e) => update("applicationsSent", e.target.value)}
          placeholder="e.g. 12 over the last 3 months"
          className={inputClass}
        />
      </Field>
      <Field label="Interview experience">
        <textarea
          rows={2}
          maxLength={400}
          value={draft.interviewExperience ?? ""}
          onChange={(e) => update("interviewExperience", e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Rejections or challenges">
        <textarea
          rows={2}
          maxLength={400}
          value={draft.rejectionsOrChallenges ?? ""}
          onChange={(e) => update("rejectionsOrChallenges", e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Resume confidence">
        <ConfidencePicker
          value={draft.resumeConfidence ?? ""}
          onChange={(v) => update("resumeConfidence", v)}
        />
      </Field>
      <Field label="Portfolio confidence">
        <ConfidencePicker
          value={draft.portfolioConfidence ?? ""}
          onChange={(v) => update("portfolioConfidence", v)}
        />
      </Field>
      <Field label="Interview confidence">
        <ConfidencePicker
          value={draft.interviewConfidence ?? ""}
          onChange={(v) => update("interviewConfidence", v)}
        />
      </Field>
    </>
  );
}

// ── Form atoms ──────────────────────────────────────────────────

const inputClass =
  "glass-3 focus-visible:border-luminous focus-visible:ring-luminous/40 w-full rounded-md border border-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 flex flex-col gap-1.5">
      <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const safeValues = Array.isArray(values) ? values : [];
  const commit = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (safeValues.includes(v)) {
      setText("");
      return;
    }
    onChange([...safeValues, v.slice(0, 60)]);
    setText("");
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(text);
            }
          }}
          placeholder={placeholder}
          className={cn(inputClass, "flex-1")}
        />
        <button
          type="button"
          onClick={() => commit(text)}
          disabled={!text.trim()}
          className="bg-luminous text-primary-foreground hover:bg-luminous/90 focus-visible:ring-luminous/40 inline-flex shrink-0 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {safeValues.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {safeValues.map((v) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => onChange(safeValues.filter((x) => x !== v))}
                className="bg-luminous/10 text-luminous border-luminous/30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                aria-label={`Remove ${v}`}
              >
                {v}
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ChipMultiSelect({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() =>
              onChange(active ? values.filter((x) => x !== o) : [...values, o])
            }
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-luminous bg-luminous/10 text-luminous"
                : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function ChipSingleSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(active ? "" : o)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-luminous bg-luminous/10 text-luminous"
                : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function ConfidencePicker({
  value,
  onChange,
}: {
  value: Confidence | "";
  onChange: (v: Confidence | "") => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {CONFIDENCE.map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(active ? "" : c)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs capitalize transition-colors",
              active
                ? "border-luminous bg-luminous/10 text-luminous"
                : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}

// Compat: `useMemo` import not needed elsewhere — silenced.
export const _unused_useMemo = useMemo;
