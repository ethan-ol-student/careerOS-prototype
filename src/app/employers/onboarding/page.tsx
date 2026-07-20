"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

// ── Option lists ─────────────────────────────────────────────────

const COMPANY_TYPES = [
  "Startup",
  "SME",
  "Corporate",
  "Agency",
  "Nonprofit",
  "Government",
  "Education",
  "Other",
];
const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Education",
  "Healthcare",
  "Engineering",
  "Manufacturing",
  "Marketing",
  "Design",
  "Retail",
  "Media",
  "Consulting",
  "Other",
];
const TEAM_FOCUS_OPTIONS = [
  "Building a new product",
  "Improving internal systems",
  "Growing sales/marketing",
  "Research and development",
  "Scaling operations",
  "Hiring future talent",
  "Digital transformation",
  "Client delivery",
  "Other",
];
const HIRING_REASONS = [
  "Fill an immediate role",
  "Build a future talent pipeline",
  "Find interns/trainees",
  "Discover high-potential fresh graduates",
  "Explore candidates for future openings",
  "Replace or expand an existing team",
  "Other",
];
const HIRING_TIMELINES = [
  "Immediately",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "No urgent timeline, scouting only",
];
const TARGET_ROLE_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "UI/UX Designer",
  "Product Designer",
  "Marketing Executive",
  "Sales Executive",
  "Mechanical Engineer",
  "Software Engineer",
  "Project Coordinator",
  "Business Analyst",
  "Other",
];
const FUTURE_DIRECTION_OPTIONS = [
  "Technical depth",
  "Leadership potential",
  "Creative problem solving",
  "Client communication",
  "Business growth",
  "Product thinking",
  "Research ability",
  "Operational execution",
  "Long-term adaptability",
  "Other",
];
const GREEN_FLAGS = [
  "Current skill proficiency",
  "Portfolio/projects",
  "Communication ability",
  "Leadership potential",
  "Learning momentum",
  "Academic background",
  "Internship experience",
  "Problem-solving ability",
  "Industry interest",
  "Reliability/consistency",
  "Other",
];
const REQUIRED_SKILL_OPTIONS = [
  "JavaScript",
  "React",
  "Python",
  "Excel",
  "Figma",
  "CAD",
  "Communication",
  "Sales",
  "Data analysis",
  "Writing",
  "Presentation",
  "Project management",
];
const STRONG_FIT_OPTIONS = [
  "Ready to work immediately",
  "High potential but needs training",
  "Strong portfolio",
  "Strong academic background",
  "Fast learner",
  "Internship-ready student",
  "Junior professional",
  "Strong communicator",
  "Leadership potential",
  "Specialist skill fit",
  "Other",
];
const WORK_ARRANGEMENTS = ["On-site", "Hybrid", "Remote", "Flexible"];

// ── Draft state ──────────────────────────────────────────────────

interface Draft {
  companyType: string;
  industries: string[];
  teamFocus: string[];
  hiringReasons: string[];
  hiringTimeline: string;
  targetRoles: string[];
  futureRoleDirections: string[];
  candidateGreenFlags: string[];
  requiredSkills: string[];
  trainableSkills: string[];
  strongFitTypes: string[];
  workArrangement: string;
  hiringLocation: string;
}

const emptyDraft: Draft = {
  companyType: "",
  industries: [],
  teamFocus: [],
  hiringReasons: [],
  hiringTimeline: "",
  targetRoles: [],
  futureRoleDirections: [],
  candidateGreenFlags: [],
  requiredSkills: [],
  trainableSkills: [],
  strongFitTypes: [],
  workArrangement: "",
  hiringLocation: "",
};

const DRAFT_KEY = "career-os-employer-onboarding-draft";

function normalizeDraft(input: unknown): Draft {
  const i: Record<string, unknown> = (input as Record<string, unknown>) ?? {};
  const safeString = (v: unknown): string => (typeof v === "string" ? v : "");
  const safeArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    companyType: safeString(i.companyType),
    industries: safeArray(i.industries),
    teamFocus: safeArray(i.teamFocus),
    hiringReasons: safeArray(i.hiringReasons),
    hiringTimeline: safeString(i.hiringTimeline),
    targetRoles: safeArray(i.targetRoles),
    futureRoleDirections: safeArray(i.futureRoleDirections),
    candidateGreenFlags: safeArray(i.candidateGreenFlags),
    requiredSkills: safeArray(i.requiredSkills),
    trainableSkills: safeArray(i.trainableSkills),
    strongFitTypes: safeArray(i.strongFitTypes),
    workArrangement: safeString(i.workArrangement),
    hiringLocation: safeString(i.hiringLocation),
  };
}

function buildSummaries(d: Draft) {
  const primaryRole = d.targetRoles[0] || "your next hire";
  const topDirection = d.futureRoleDirections.slice(0, 2).join(" and ");
  const topSignals = d.candidateGreenFlags.slice(0, 2).join(" and ");
  const topSkills = d.requiredSkills.slice(0, 2).join(" and ");
  const fit = d.strongFitTypes[0] ?? "well-rounded";
  return {
    hiringIntentSummary: `Hiring Intent: ${primaryRole}`,
    futurePathSummary: topDirection
      ? `Future Path: ${topDirection}`
      : `Future Path: discovering long-term direction`,
    bestCandidateTypeSummary: `Best Candidate Type: ${fit}${
      topSkills ? ` with strong ${topSkills}` : ""
    }${topSignals ? `; values ${topSignals}` : ""}.`,
  };
}

// ── Component ────────────────────────────────────────────────────

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const {
    user,
    employerOnboardingCompleted,
    status: authStatus,
    refresh,
  } = useAuth();
  const totalSteps = 5;
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Explicit edit mode (?edit=1 from Settings) — read post-mount to keep
  // SSR/first render identical; the guard waits for `editChecked`.
  const [editMode, setEditMode] = useState(false);
  const [editChecked, setEditChecked] = useState(false);
  useEffect(() => {
    const isEdit =
      new URLSearchParams(window.location.search).get("edit") === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time URL flag read on mount.
    setEditMode(isEdit);
    setEditChecked(true);
  }, []);

  // Auth guard: wait for auth, send away if not employer. Completed
  // employers are bounced to the marketplace UNLESS editing.
  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!editChecked) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.role !== "employer") {
      router.replace("/candidate/dashboard");
      return;
    }
    if (employerOnboardingCompleted && !editMode) {
      router.replace("/employers/dashboard");
    }
  }, [authStatus, user, employerOnboardingCompleted, editMode, editChecked, router]);

  // Load draft from local cache + server.
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
        const res = await fetch("/api/employer/onboarding-data", {
          cache: "no-store",
        });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: Partial<Draft> }
          | null;
        if (body?.ok && body.data) {
          setDraft((prev) => normalizeDraft({ ...prev, ...body.data }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Auto-save draft locally.
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

  const validateStep = (i: number): string | null => {
    if (i === 0) {
      if (!draft.companyType) return "Pick a company type.";
      if (draft.industries.length === 0)
        return "Select at least one industry.";
    }
    if (i === 1) {
      if (draft.hiringReasons.length === 0)
        return "Tell us why you're hiring.";
      if (!draft.hiringTimeline) return "Pick a hiring timeline.";
    }
    if (i === 2) {
      if (draft.targetRoles.length === 0)
        return "Add at least one target role.";
    }
    if (i === 3) {
      if (
        draft.candidateGreenFlags.length === 0 &&
        draft.requiredSkills.length === 0
      ) {
        return "Add at least one green flag or required skill.";
      }
    }
    if (i === 4) {
      if (!draft.workArrangement) return "Pick a work arrangement.";
      if (!draft.hiringLocation.trim()) return "Add a hiring location.";
    }
    return null;
  };

  const persistPartial = async () => {
    try {
      await fetch("/api/employer/onboarding-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
    } catch {
      /* ignore */
    }
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
      const summaries = buildSummaries(draft);
      const res = await fetch("/api/employer/onboarding-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          ...summaries,
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
      // ⚠ Critical: refresh AuthContext so `employerOnboardingCompleted`
      // flips to true BEFORE we navigate to /employers/dashboard.
      // Without this the EmployerAppShell guard sees stale state and
      // bounces back here — the loop bug.
      await refresh();
      // Editing from Settings returns there; first-time completion opens
      // the marketplace.
      router.replace(editMode ? "/employers/settings" : "/employers/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save onboarding.");
      setSubmitting(false);
    }
  };

  const isLast = step === totalSteps - 1;

  return (
    <main
      data-role-accent="employer"
      className="bg-background text-foreground relative min-h-screen w-full px-4 py-8"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <span className="text-clover inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold">
            <Briefcase className="size-4" />
            Career OS · Employer setup
          </span>
          <span className="text-muted-foreground text-xs">
            Step {step + 1} of {totalSteps}
          </span>
        </header>

        <div className="bg-foreground/8 h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-clover h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <section className="glass-4 ring-clover/20 rounded-2xl p-6 ring-1 sm:p-8">
          {step === 0 && <CompanyContextStep draft={draft} update={update} />}
          {step === 1 && <HiringGoalStep draft={draft} update={update} />}
          {step === 2 && <RoleDirectionStep draft={draft} update={update} />}
          {step === 3 && <CandidateSignalsStep draft={draft} update={update} />}
          {step === 4 && <MatchingStep draft={draft} update={update} />}

          {error ? (
            <p
              role="alert"
              className="text-destructive mt-4 inline-flex items-center gap-1.5 text-xs"
            >
              {error}
            </p>
          ) : null}

          <div className="border-border/15 mt-6 flex items-center justify-between border-t pt-4">
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
                {submitting ? "Saving…" : "Finish & open marketplace"}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} disabled={submitting}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </section>

        <p className="text-muted-foreground text-center text-[0.6875rem]">
          Your answers are saved as you go. Refresh-safe.
        </p>
      </div>
    </main>
  );
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
      <p className="text-clover text-[0.6875rem] font-mono font-semibold uppercase tracking-[0.18em]">
        Step {step}
      </p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
    </div>
  );
}

function CompanyContextStep({
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
        title="Tell us about your company."
        subtitle="Where would a candidate be landing?"
      />
      <Field label="What best describes your company?">
        <SingleSelect
          options={COMPANY_TYPES}
          value={draft.companyType}
          onChange={(v) => update("companyType", v)}
        />
      </Field>
      <Field label="What industries are you hiring for?">
        <MultiSelect
          options={INDUSTRY_OPTIONS}
          values={draft.industries}
          onChange={(v) => update("industries", v)}
        />
      </Field>
      <Field label="What is your team currently focused on?">
        <MultiSelect
          options={TEAM_FOCUS_OPTIONS}
          values={draft.teamFocus}
          onChange={(v) => update("teamFocus", v)}
        />
      </Field>
    </>
  );
}

function HiringGoalStep({
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
        title="What's the actual goal of this hire?"
        subtitle="We use this to tune urgency + matching."
      />
      <Field label="Reason for hiring">
        <MultiSelect
          options={HIRING_REASONS}
          values={draft.hiringReasons}
          onChange={(v) => update("hiringReasons", v)}
        />
      </Field>
      <Field label="Hiring timeline">
        <SingleSelect
          options={HIRING_TIMELINES}
          value={draft.hiringTimeline}
          onChange={(v) => update("hiringTimeline", v)}
        />
      </Field>
    </>
  );
}

function RoleDirectionStep({
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
        title="Where is the role heading?"
        subtitle="Beyond the title — what does success look like in 12 months?"
      />
      <Field label="Target roles / talent profiles">
        <TagInput
          values={draft.targetRoles}
          onChange={(v) => update("targetRoles", v)}
          suggestions={TARGET_ROLE_OPTIONS}
          placeholder="e.g. Frontend Developer"
        />
      </Field>
      <Field label="Future direction that matters most">
        <MultiSelect
          options={FUTURE_DIRECTION_OPTIONS}
          values={draft.futureRoleDirections}
          onChange={(v) => update("futureRoleDirections", v)}
        />
      </Field>
    </>
  );
}

function CandidateSignalsStep({
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
        title="What proves a candidate is a fit?"
        subtitle="Mix structured signals + the skills we should screen for."
      />
      <Field label="Green flags when evaluating candidates">
        <MultiSelect
          options={GREEN_FLAGS}
          values={draft.candidateGreenFlags}
          onChange={(v) => update("candidateGreenFlags", v)}
        />
      </Field>
      <Field label="Skills required now">
        <TagInput
          values={draft.requiredSkills}
          onChange={(v) => update("requiredSkills", v)}
          suggestions={REQUIRED_SKILL_OPTIONS}
          placeholder="e.g. React"
        />
      </Field>
      <Field label="Trainable skills (we can develop these after hiring)">
        <TagInput
          values={draft.trainableSkills}
          onChange={(v) => update("trainableSkills", v)}
          placeholder="e.g. Client communication"
        />
      </Field>
    </>
  );
}

function MatchingStep({
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
        title="How should we rank matches?"
        subtitle="Tells the marketplace what to surface."
      />
      <Field label="What kind of candidate is a strong fit?">
        <MultiSelect
          options={STRONG_FIT_OPTIONS}
          values={draft.strongFitTypes}
          onChange={(v) => update("strongFitTypes", v)}
        />
      </Field>
      <Field label="Work arrangement">
        <SingleSelect
          options={WORK_ARRANGEMENTS}
          value={draft.workArrangement}
          onChange={(v) => update("workArrangement", v)}
        />
      </Field>
      <Field label="Hiring location">
        <input
          type="text"
          maxLength={120}
          value={draft.hiringLocation ?? ""}
          onChange={(e) => update("hiringLocation", e.target.value)}
          placeholder="e.g. Kuala Lumpur · Remote APAC"
          className={inputClass}
        />
      </Field>
    </>
  );
}

// ── Form atoms ──────────────────────────────────────────────────

const inputClass =
  "bg-foreground/2 border-border/15 focus-visible:border-clover/60 focus-visible:ring-clover/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 flex flex-col gap-1.5">
      <span className="text-muted-foreground font-mono text-[0.6875rem] uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}

function SingleSelect({
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
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-clover/40 bg-clover/12 text-clover-soft"
                : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? <Check className="mr-1 inline size-3" /> : null}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelect({
  options,
  values,
  onChange,
}: {
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const safeValues = Array.isArray(values) ? values : [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = safeValues.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() =>
              onChange(
                active ? safeValues.filter((x) => x !== o) : [...safeValues, o],
              )
            }
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              active
                ? "border-clover/40 bg-clover/12 text-clover-soft"
                : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? <Check className="mr-1 inline size-3" /> : null}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function TagInput({
  values,
  onChange,
  suggestions,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
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
    onChange([...safeValues, v.slice(0, 80)]);
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
          className="bg-clover text-white hover:bg-clover/90 focus-visible:ring-clover/40 inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {suggestions && suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              disabled={safeValues.includes(s)}
              className="text-muted-foreground hover:text-clover text-[0.6875rem] disabled:opacity-30"
            >
              + {s}
            </button>
          ))}
        </div>
      ) : null}
      {safeValues.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {safeValues.map((v) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => onChange(safeValues.filter((x) => x !== v))}
                className="bg-clover/10 text-clover-soft border-clover/30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem]"
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
