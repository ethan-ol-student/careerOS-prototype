"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  Plus,
  Rocket,
  Shuffle,
  Sparkles,
  TriangleAlert,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import StepShell from "@/components/onboarding/StepShell";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { UploadZone } from "@/components/onboarding/UploadZone";
import {
  ChipGroup,
  FieldShell,
  SelectCard,
  Slider,
  TagInput,
  TextField,
  Toggle,
} from "@/components/onboarding/inputs";
import { useAuth } from "@/lib/context/AuthContext";
import type { ParsedCv } from "@/lib/cv-parser/heuristics";
import { cn } from "@/lib/utils";

/**
 * Candidate onboarding v2 — three sections (Personal details, Work
 * experience, Preferences) with CV auto-fill from our own parser.
 * Draft autosaves to localStorage per keystroke; Finish maps the draft
 * onto the existing stores: /api/me/onboarding (CandidatesAI + profile
 * fields), /api/me/skills (tier-1 claims), portfolio collections
 * (experiences / education-as-certificates), /api/me/discovery.
 */

// ── Option lists ────────────────────────────────────────────────

const STAGES = [
  { id: "student", label: "Student", hint: "13–17 · discover paths & first skills", icon: GraduationCap },
  { id: "young-adult", label: "Young Adult", hint: "18–22 · portfolio, internships, first roles", icon: Rocket },
  { id: "early-career", label: "Early Career", hint: "23–34 · right job, market value, growth", icon: Briefcase },
  { id: "mid-career", label: "Mid-Career", hint: "35–44 · next moves, close gaps early", icon: Shuffle },
  { id: "senior-career", label: "Senior Career", hint: "45–54 · leadership, advisory, mentoring", icon: Users },
  { id: "executive", label: "Executive & Beyond", hint: "55+ · boards, consulting, legacy", icon: Building2 },
] as const;

const GOAL_CHIPS = [
  "Land my first real job",
  "Switch fields",
  "Grow where I am",
  "Go independent",
  "Still figuring it out",
];

const EMPLOYMENT_TYPES = [
  "Full-time", "Part-time", "Contract", "Internship",
  "Freelance", "Volunteer", "Personal project",
];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];
const WORK_ARRANGEMENT = ["remote", "hybrid", "onsite"] as const;
const VALUES = [
  "Good pay", "Learning & growth", "Work-life balance", "Job security",
  "Impact & meaning", "Flexibility", "Autonomy", "A great team", "Prestige",
];
const AVAILABILITY = ["Actively looking", "Open to offers", "Just exploring"];
const SCHEDULE_FLEX = ["Standard hours", "Early / late shifts OK", "Weekends OK", "Needs fixed hours", "Fully flexible"];
const TRAVEL = ["none", "occasional", "frequent"];
const ENVIRONMENTS = [
  { id: "structured", label: "Structured & predictable", icon: Building2 },
  { id: "fast_moving", label: "Fast-moving & changing", icon: Zap },
  { id: "independent", label: "Independent & heads-down", icon: User },
  { id: "collaborative", label: "Collaborative & social", icon: Users },
];

// ── Draft model (maps 1:1 onto existing stores on Finish) ───────

interface DraftExperience {
  id: string;
  title: string;
  company: string;
  employmentType: string;
  startDate: string; // YYYY-MM
  endDate: string;
  current: boolean;
  description: string;
  proudOf: string;
}
interface DraftEducation {
  id: string;
  school: string;
  degree: string;
  endYear: string;
}

interface Draft {
  // Section 1
  fullName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  careerStage: string;
  careerStageMeaning: string;
  fieldOfStudy: string;
  expectedGraduation: string;
  goal: string; // → desiredNextMove
  // Section 2
  resumeFileName: string;
  experiences: DraftExperience[];
  education: DraftEducation[];
  skills: string[];
  certifications: string[];
  languages: string[];
  links: string[];
  // Section 3
  targetRoles: string[];
  desiredLocations: string[];
  openToRelocate: boolean;
  workArrangement: string[];
  jobTypes: string[];
  minSalaryAmount: string;
  minSalaryPeriod: string;
  availability: string;
  visibility: "all_recruiters" | "hidden_from_current";
  workEnvironment: string;
  topValues: string[];
  learningHoursPerWeek: number;
  scheduleFlexibility: string[];
  maxCommuteMinutes: number;
  travelWillingness: string;
  // CV-autofill markers (never persisted)
  autoFilled: Record<string, boolean>;
  cvSummary: string;
}

const DRAFT_KEY = "career-os-candidate-onboarding-draft";

const emptyDraft: Draft = {
  fullName: "", email: "", phone: "", location: "", currentTitle: "",
  careerStage: "", careerStageMeaning: "", fieldOfStudy: "",
  expectedGraduation: "", goal: "",
  resumeFileName: "", experiences: [], education: [], skills: [],
  certifications: [], languages: [], links: [],
  targetRoles: [], desiredLocations: [], openToRelocate: false,
  workArrangement: [], jobTypes: [], minSalaryAmount: "",
  minSalaryPeriod: "yearly", availability: "",
  visibility: "hidden_from_current", workEnvironment: "", topValues: [],
  learningHoursPerWeek: 4, scheduleFlexibility: [], maxCommuteMinutes: 45,
  travelWillingness: "", autoFilled: {}, cvSummary: "",
};

/** Tolerant hydration: accepts the new shape, the old 5-step draft, or the
 *  server GET payload — anything unknown falls back to safe defaults. */
function normalizeDraft(input: unknown): Draft {
  const i = (input ?? {}) as Record<string, unknown>;
  const s = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
  const a = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const n = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  const b = (v: unknown): boolean => v === true;
  const exps = Array.isArray(i.experiences)
    ? (i.experiences as Record<string, unknown>[])
        .filter((e) => typeof e?.title === "string")
        .map((e, idx) => ({
          id: s(e.id, `exp_${idx}`), title: s(e.title), company: s(e.company),
          employmentType: s(e.employmentType, "Full-time"),
          startDate: s(e.startDate), endDate: s(e.endDate),
          current: b(e.current), description: s(e.description), proudOf: s(e.proudOf),
        }))
    : [];
  const edus = Array.isArray(i.education)
    ? (i.education as Record<string, unknown>[])
        .filter((e) => typeof e?.school === "string")
        .map((e, idx) => ({
          id: s(e.id, `edu_${idx}`), school: s(e.school),
          degree: s(e.degree), endYear: s(e.endYear),
        }))
    : [];
  return {
    ...emptyDraft,
    fullName: s(i.fullName), email: s(i.email), phone: s(i.phone),
    location: s(i.location), currentTitle: s(i.currentTitle),
    careerStage: s(i.careerStage), careerStageMeaning: s(i.careerStageMeaning),
    fieldOfStudy: s(i.fieldOfStudy), expectedGraduation: s(i.expectedGraduation),
    goal: s(i.goal, s(i.desiredNextMove)),
    resumeFileName: s(i.resumeFileName),
    experiences: exps, education: edus,
    skills: a(i.skills).length ? a(i.skills) : a(i.currentSkills),
    certifications: a(i.certifications), languages: a(i.languages), links: a(i.links),
    targetRoles: a(i.targetRoles), desiredLocations: a(i.desiredLocations),
    openToRelocate: b(i.openToRelocate), workArrangement: a(i.workArrangement),
    jobTypes: a(i.jobTypes).length ? a(i.jobTypes) : a(i.opportunityTypes),
    minSalaryAmount:
      typeof i.minSalaryAmount === "number" ? String(i.minSalaryAmount) : s(i.minSalaryAmount),
    minSalaryPeriod: s(i.minSalaryPeriod, "yearly") || "yearly",
    availability: s(i.availability),
    visibility: i.visibility === "all_recruiters" ? "all_recruiters" : "hidden_from_current",
    workEnvironment: s(i.workEnvironment), topValues: a(i.topValues),
    learningHoursPerWeek: n(i.learningHoursPerWeek, 4),
    scheduleFlexibility: a(i.scheduleFlexibility),
    maxCommuteMinutes: n(i.maxCommuteMinutes, 45),
    travelWillingness: s(i.travelWillingness),
    autoFilled:
      i.autoFilled && typeof i.autoFilled === "object"
        ? (i.autoFilled as Record<string, boolean>)
        : {},
    cvSummary: s(i.cvSummary),
  };
}

// ── Validation (spec Step 5) ────────────────────────────────────

const REQUIRED: { field: string; section: number; message: string; label: string }[] = [
  { field: "fullName", section: 0, label: "Full name", message: "Add your name so your profile isn't anonymous." },
  { field: "email", section: 0, label: "Email", message: "We couldn't find an email in your CV — add one so employers can reach you." },
  { field: "location", section: 0, label: "Location", message: "Add your location so we can match you to nearby and remote roles." },
  { field: "careerStage", section: 0, label: "Career stage", message: "Tell us where you are right now — it shapes everything we suggest." },
  { field: "targetRoles", section: 2, label: "Desired roles", message: "Add at least one role you're aiming for so we can find matches." },
];

function fieldValid(draft: Draft, field: string): boolean {
  if (field === "targetRoles") return draft.targetRoles.length > 0;
  const v = draft[field as "fullName" | "email" | "location" | "careerStage"];
  if (field === "email") return /\S+@\S+\.\S+/.test(v);
  return v.trim().length > 0;
}

function validate(draft: Draft): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const r of REQUIRED) if (!fieldValid(draft, r.field)) errors[r.field] = r.message;
  return errors;
}

// ── Finish mapping → existing APIs ──────────────────────────────

function hoursLabel(h: number): string {
  return h < 2 ? "<2 hours" : h <= 5 ? "2–5 hours" : h <= 10 ? "5–10 hours" : "10+ hours";
}

function toOnboardingPayload(draft: Draft, completed: boolean) {
  const salary = Number(draft.minSalaryAmount);
  return {
    fullName: draft.fullName.trim(),
    currentTitle: draft.currentTitle.trim(),
    phone: draft.phone.trim(),
    location: draft.location.trim(),
    careerStage: draft.careerStage,
    careerStageMeaning: draft.careerStageMeaning,
    fieldOfStudy: draft.fieldOfStudy.trim(),
    expectedGraduation: draft.expectedGraduation.trim(),
    desiredNextMove: draft.goal.trim(),
    targetRoles: draft.targetRoles,
    desiredLocations: draft.desiredLocations,
    // Mirror for engines that read the legacy single string (fair pay).
    locationPreference: draft.desiredLocations[0] ?? draft.location.trim(),
    openToRelocate: draft.openToRelocate,
    workArrangement: draft.workArrangement as ("remote" | "hybrid" | "onsite")[],
    opportunityTypes: draft.jobTypes,
    availability: draft.availability,
    workEnvironment: draft.workEnvironment as
      | "" | "structured" | "fast_moving" | "independent" | "collaborative",
    topValues: draft.topValues,
    // Slider (hours) maps to the existing weeklyLearningTime bucket string.
    weeklyLearningTime: hoursLabel(draft.learningHoursPerWeek),
    scheduleFlexibility: draft.scheduleFlexibility,
    maxCommuteMinutes: draft.maxCommuteMinutes,
    travelWillingness: draft.travelWillingness as "" | "none" | "occasional" | "frequent",
    minSalaryAmount: Number.isFinite(salary) && salary > 0 ? Math.round(salary) : null,
    minSalaryPeriod: (draft.minSalaryPeriod || "") as "" | "hourly" | "monthly" | "yearly",
    links: draft.links,
    languages: draft.languages,
    currentSkills: draft.skills,
    ...(completed
      ? {
          onboardingCompleted: true,
          dashboardPersonalizationSummary: buildSummary(draft),
        }
      : {}),
  };
}

function buildSummary(d: Draft): string {
  const stage = STAGES.find((s) => s.id === d.careerStage)?.label ?? "";
  const roles = d.targetRoles.slice(0, 3).join(", ");
  const skills = d.skills.slice(0, 3).join(", ");
  return `${stage} aiming for ${roles || "their next role"}. Strong in ${
    skills || "evolving skills"
  }. Wants to "${d.goal || "find their next move"}".`;
}

function periodString(e: DraftExperience): string {
  const end = e.current ? "Present" : e.endDate || "";
  const base = [e.startDate, end].filter(Boolean).join(" – ");
  const suffix = e.employmentType && e.employmentType !== "Full-time" ? ` · ${e.employmentType}` : "";
  return (base + suffix).slice(0, 60);
}

// ── Page ────────────────────────────────────────────────────────

const SECTIONS = ["Personal details", "Work experience", "Preferences"];

export default function CandidateOnboardingPage() {
  const router = useRouter();
  const { user, candidateOnboardingCompleted, status: authStatus, refresh } = useAuth();
  const [section, setSection] = useState(0);
  // Preferences is a one-question-at-a-time questionnaire; prefStep === the
  // question index, or PREF_QUESTIONS.length for the final review screen.
  const [prefStep, setPrefStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Edit mode (?edit=1 from Settings) — same contract as the old flow.
  const [editMode, setEditMode] = useState(false);
  const [editChecked, setEditChecked] = useState(false);
  useEffect(() => {
    setEditMode(new URLSearchParams(window.location.search).get("edit") === "1");
    setEditChecked(true);
  }, []);

  useEffect(() => {
    if (authStatus !== "ready" || !editChecked) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.role !== "candidate") {
      router.replace("/employers/dashboard");
      return;
    }
    if (candidateOnboardingCompleted && !editMode) {
      router.replace("/candidate/dashboard");
    }
  }, [authStatus, user, candidateOnboardingCompleted, editMode, editChecked, router]);

  // Hydrate: local draft first (paint cache), then server values over it.
  useEffect(() => {
    try {
      const cached = localStorage.getItem(DRAFT_KEY);
      if (cached) setDraft(normalizeDraft(JSON.parse(cached)));
    } catch {
      /* ignore */
    }
    void (async () => {
      try {
        const res = await fetch("/api/me/onboarding", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: Record<string, unknown> }
          | null;
        if (body?.ok && body.data) {
          setDraft((prev) => {
            // Server fills only what the local draft hasn't touched yet.
            const server = normalizeDraft(body.data);
            const merged: Draft = { ...server, ...stripDefaults(prev) } as Draft;
            return normalizeDraft(merged);
          });
        }
      } catch {
        /* offline — local draft still works */
      }
    })();
  }, []);

  // Autosave per change (spec Step 6).
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const update = useCallback(
    <K extends keyof Draft>(key: K, value: Draft[K]) => {
      setDraft((prev) => {
        const next = { ...prev, [key]: value };
        // Live revalidation: clear this field's error the moment it's valid.
        setErrors((errs) =>
          errs[key as string] && fieldValid(next, key as string)
            ? Object.fromEntries(Object.entries(errs).filter(([k]) => k !== key))
            : errs,
        );
        return next;
      });
    },
    [],
  );

  /** Merge a CV parse into the draft — only fills blanks, marks autoFilled. */
  const applyParsed = useCallback((cv: ParsedCv, fileName: string): string => {
    let filled = 0;
    setDraft((prev) => {
      const next = { ...prev, autoFilled: { ...prev.autoFilled } };
      const fill = (key: keyof Draft & string, value?: string) => {
        if (!value || (next[key] as string).trim()) return;
        (next[key] as string) = value;
        next.autoFilled[key] = true;
        filled++;
      };
      fill("fullName", cv.fullName);
      fill("email", cv.email);
      fill("phone", cv.phone);
      fill("location", cv.location);
      const have = new Set(next.skills.map((x) => x.toLowerCase()));
      const newSkills = cv.skills.filter((x) => !have.has(x.toLowerCase()));
      if (newSkills.length) {
        next.skills = [...next.skills, ...newSkills];
        next.autoFilled.skills = true;
        filled++;
      }
      const mergeList = (key: "certifications" | "languages" | "links", vals: string[]) => {
        const existing = new Set(next[key].map((x) => x.toLowerCase()));
        const add = vals.filter((x) => !existing.has(x.toLowerCase()));
        if (add.length) {
          next[key] = [...next[key], ...add];
          filled++;
        }
      };
      mergeList("certifications", cv.certifications);
      mergeList("languages", cv.languages);
      mergeList("links", cv.links);
      for (const e of cv.experiences) {
        next.experiences = [
          ...next.experiences,
          {
            id: `new_${Math.random().toString(36).slice(2, 8)}`,
            title: e.title, company: e.company, employmentType: "Full-time",
            startDate: e.startDate, endDate: e.endDate ?? "",
            current: e.current, description: e.description ?? "", proudOf: "",
          },
        ];
        filled++;
      }
      for (const ed of cv.education) {
        next.education = [
          ...next.education,
          {
            id: `new_${Math.random().toString(36).slice(2, 8)}`,
            school: ed.school, degree: ed.degree ?? "",
            endYear: ed.endDate?.slice(0, 4) ?? "",
          },
        ];
        filled++;
      }
      next.resumeFileName = fileName;
      const summary = `Filled ${filled} field${filled === 1 ? "" : "s"} from your CV — ${
        cv.experiences.length
      } experience${cv.experiences.length === 1 ? "" : "s"}, ${cv.education.length} education, ${
        newSkills.length
      } skills. The rest is blank for you to complete.`;
      next.cvSummary = filled ? summary : "We read your CV but couldn't confidently extract fields — add details manually below.";
      return next;
    });
    // setDraft is sync enough here; read the message via state on next render.
    return filled > 0
      ? `Filled ${filled} field${filled === 1 ? "" : "s"} from your CV — the rest is blank for you to complete.`
      : "We read your CV but couldn't confidently extract fields — add details manually below.";
  }, []);

  /** Jump to a section + focus a field (cross-section, spec Step 5). For a
   *  preferences field, also open its question in the questionnaire. */
  const jumpTo = useCallback((field: string) => {
    const target = REQUIRED.find((r) => r.field === field);
    if (target) setSection(target.section);
    const prefIdx = PREF_QUESTIONS.findIndex((q) => q.id === field);
    if (prefIdx >= 0) setPrefStep(prefIdx);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(`f-${field}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLElement | null)?.focus?.();
      }),
    );
  }, []);

  async function persistPartial() {
    try {
      await fetch("/api/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toOnboardingPayload(draft, false)),
      });
    } catch {
      /* local draft still has everything */
    }
  }

  async function handleFinish() {
    const errs = validate(draft);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      jumpTo(REQUIRED.find((r) => errs[r.field])!.field);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/me/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toOnboardingPayload(draft, true)),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;
      if (!body?.ok) {
        setSubmitError(body?.error?.message ?? "Failed to save onboarding.");
        setSubmitting(false);
        return;
      }
      // Skills → tier-1 claims (server derives trust tier; upsert = no dupes).
      for (const name of draft.skills.slice(0, 40)) {
        await fetch("/api/me/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.slice(0, 40), level: 3 }),
        }).catch(() => null);
      }
      // Experiences + education → portfolio collections.
      for (const e of draft.experiences) {
        const detail = [e.description, e.proudOf && `Proud of: ${e.proudOf}`]
          .filter(Boolean)
          .join("\n")
          .slice(0, 600);
        await fetch("/api/me/portfolio/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: e.title.slice(0, 120),
            company: e.company.slice(0, 120),
            period: periodString(e),
            ...(detail ? { detail } : {}),
          }),
        }).catch(() => null);
      }
      // ponytail: no Education model — degrees persist as certificate rows
      // (title=degree, issuer=school); add an Education model when the CV
      // page needs a dedicated section.
      for (const ed of draft.education) {
        await fetch("/api/me/portfolio/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: (ed.degree || "Studied").slice(0, 120),
            issuer: ed.school.slice(0, 120),
            year: ed.endYear.slice(0, 12),
          }),
        }).catch(() => null);
      }
      for (const c of draft.certifications) {
        await fetch("/api/me/portfolio/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: c.slice(0, 120), issuer: "", year: "" }),
        }).catch(() => null);
      }
      // Visibility → the existing discovery opt-in (candidate's choice).
      await fetch("/api/me/discovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverable: draft.visibility === "all_recruiters" }),
      }).catch(() => null);

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      await refresh();
      router.replace(editMode ? "/candidate/settings" : "/candidate/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save onboarding.");
      setSubmitting(false);
    }
  }

  const missing = useMemo(() => REQUIRED.filter((r) => errors[r.field]), [errors]);

  // Preferences questionnaire position.
  const nPref = PREF_QUESTIONS.length;
  const atReview = section === 2 && prefStep >= nPref;
  const currentPref = section === 2 && !atReview ? PREF_QUESTIONS[prefStep] : null;
  const prefBlocked = !!currentPref?.required && !currentPref.answered(draft);
  const advancePref = () => setPrefStep((s) => Math.min(nPref, s + 1));

  const goNext = async () => {
    await persistPartial();
    setSection((s) => Math.min(2, s + 1));
    setPrefStep(0); // entering Preferences starts at question 1
    window.scrollTo({ top: 0 });
  };

  const handleBack = () => {
    if (section === 2 && prefStep > 0) setPrefStep((s) => s - 1);
    else setSection((s) => Math.max(0, s - 1));
  };

  return (
    <StepShell
      stepNumber={section + 1}
      totalSteps={3}
      eyebrow="Candidate setup"
      title={SECTIONS[section]}
      subtitle={
        section === 0
          ? "The basics — most of this can come straight from your CV."
          : section === 1
            ? "Everything counts: part-time, freelance, internships, volunteering, side hustles, family business, competitions, personal projects."
            : "Tap what fits. Every answer is optional except one desired role."
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={(section === 0 && prefStep === 0) || submitting}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <p className="text-muted-foreground hidden text-[11px] sm:block">
            You can change all of this later in Settings.
          </p>
          <div className="flex items-center gap-2">
            {section < 2 && (
              <>
                <Button type="button" variant="ghost" onClick={goNext} disabled={submitting || parsing}>
                  Skip for now
                </Button>
                <Button type="button" onClick={goNext} disabled={submitting || parsing}>
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              </>
            )}
            {section === 2 && !atReview && (
              <Button type="button" onClick={advancePref} disabled={prefBlocked || submitting}>
                {prefStep === nPref - 1 ? "Review answers" : "Next"}
                <ArrowRight className="size-4" />
              </Button>
            )}
            {section === 2 && atReview && (
              <Button type="button" onClick={handleFinish} disabled={submitting || parsing}>
                <Sparkles className="size-4" />
                {submitting ? "Saving…" : "Finish & open dashboard"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        {/* Section dots (reference layout) — clickable, cross-section. */}
        <nav aria-label="Onboarding sections" className="flex items-center justify-between gap-2">
          {SECTIONS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setSection(i)}
              aria-current={section === i ? "step" : undefined}
              className="group flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "size-3 rounded-full transition-colors",
                  i <= section ? "bg-clover" : "bg-border group-hover:bg-luminous/50",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-mono font-semibold uppercase tracking-wider",
                  section === i ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </nav>

        {/* Missing-fields banner (spec Step 5) */}
        {missing.length > 0 && (
          <div
            ref={bannerRef}
            role="alert"
            className="border-destructive/40 bg-destructive/10 rounded-xl border px-4 py-3"
          >
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <TriangleAlert className="text-destructive size-4 shrink-0" />
              A few things still need you
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
              {missing.map((m) => (
                <li key={m.field}>
                  <button
                    type="button"
                    onClick={() => jumpTo(m.field)}
                    className="text-destructive text-xs underline underline-offset-2"
                  >
                    {m.label} → Section {m.section + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {submitError && (
          <p role="alert" className="text-destructive text-sm">
            {submitError}
          </p>
        )}

        <section className="glass-4 ring-luminous/20 flex flex-col gap-5 rounded-2xl p-6 ring-1 sm:p-8">
          {section === 0 && (
            <PersonalSection
              draft={draft}
              update={update}
              errors={errors}
              applyParsed={applyParsed}
              setParsing={setParsing}
            />
          )}
          {section === 1 && (
            <ExperienceSection
              draft={draft}
              update={update}
              applyParsed={applyParsed}
              setParsing={setParsing}
            />
          )}
          {section === 2 && (
            <PreferencesSection
              draft={draft}
              update={update}
              prefStep={prefStep}
              atReview={atReview}
              advancePref={advancePref}
              onEditQuestion={setPrefStep}
            />
          )}
        </section>

        <p className="text-muted-foreground text-center text-[11px]">
          Autosaved as you type — refresh anytime, nothing is lost. We never ask
          about family status, age, gender, race, or religion.
        </p>
      </div>
    </StepShell>
  );
}

/** Keys the user actually touched (≠ defaults) — server merge keeps these. */
function stripDefaults(d: Draft): Partial<Draft> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d)) {
    const def = (emptyDraft as unknown as Record<string, unknown>)[k];
    if (JSON.stringify(v) !== JSON.stringify(def)) out[k] = v;
  }
  return out as Partial<Draft>;
}

// ── Section 1 — Personal details ────────────────────────────────

function PersonalSection({
  draft,
  update,
  errors,
  applyParsed,
  setParsing,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  errors: Record<string, string>;
  applyParsed: (cv: ParsedCv, fileName: string) => string;
  setParsing: (b: boolean) => void;
}) {
  const isStudent = draft.careerStage === "student";
  return (
    <>
      <UploadZone onParsed={applyParsed} onBusyChange={setParsing} summary={draft.cvSummary || null} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="f-fullName"
          label="Full name"
          value={draft.fullName}
          onChange={(v) => update("fullName", v)}
          placeholder="Your name"
          autoFilled={draft.autoFilled.fullName}
          error={errors.fullName}
        />
        <TextField
          id="f-phone"
          label="Phone"
          type="tel"
          optional
          value={draft.phone}
          onChange={(v) => update("phone", v)}
          placeholder="+60 12 345 6789"
          autoFilled={draft.autoFilled.phone}
        />
        <TextField
          id="f-email"
          label="Email"
          type="email"
          value={draft.email}
          onChange={(v) => update("email", v)}
          placeholder="you@example.com"
          autoFilled={draft.autoFilled.email}
          error={errors.email}
        />
        <TextField
          id="f-currentTitle"
          label="Current title"
          optional
          value={draft.currentTitle}
          onChange={(v) => update("currentTitle", v)}
          placeholder="e.g. Line cook · Junior developer"
        />
        <TextField
          id="f-location"
          label="Location"
          value={draft.location}
          onChange={(v) => update("location", v)}
          placeholder="City, Country"
          autoFilled={draft.autoFilled.location}
          error={errors.location}
        />
      </div>

      <FieldShell id="f-careerStage" label="Where are you right now?" error={errors.careerStage}>
        <div id="f-careerStage" tabIndex={-1} className="outline-none">
          <SelectCard
            options={STAGES.map((s) => ({ id: s.id, label: s.label, hint: s.hint, icon: s.icon }))}
            value={draft.careerStage}
            onChange={(id) => {
              update("careerStage", id);
              update("careerStageMeaning", STAGES.find((s) => s.id === id)?.hint ?? "");
            }}
            error={!!errors.careerStage}
          />
        </div>
      </FieldShell>

      {isStudent && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="f-fieldOfStudy"
            label="Field of study"
            optional
            value={draft.fieldOfStudy}
            onChange={(v) => update("fieldOfStudy", v)}
            placeholder="e.g. Computer Science · Culinary arts"
          />
          <TextField
            id="f-expectedGraduation"
            label="Expected finish"
            optional
            value={draft.expectedGraduation}
            onChange={(v) => update("expectedGraduation", v)}
            placeholder="e.g. 2027"
          />
        </div>
      )}

      <FieldShell id="f-goal" label="What's the goal?" optional>
        <ChipGroup
          options={GOAL_CHIPS}
          values={draft.goal && GOAL_CHIPS.includes(draft.goal) ? [draft.goal] : []}
          onChange={(v) => update("goal", v[0] ?? "")}
          single
        />
        <input
          id="f-goal"
          type="text"
          value={GOAL_CHIPS.includes(draft.goal) ? "" : draft.goal}
          onChange={(e) => update("goal", e.target.value)}
          placeholder="…or say it in your own words"
          className="bg-foreground/2 border-border/15 focus-visible:border-luminous/60 focus-visible:ring-luminous/40 mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        />
      </FieldShell>
    </>
  );
}

// ── Section 2 — Work experience ─────────────────────────────────

function ExperienceSection({
  draft,
  update,
  applyParsed,
  setParsing,
}: {
  draft: Draft;
  update: <K extends keyof Draft>(k: K, v: Draft[K]) => void;
  applyParsed: (cv: ParsedCv, fileName: string) => string;
  setParsing: (b: boolean) => void;
}) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <UploadZone onParsed={applyParsed} onBusyChange={setParsing} summary={draft.cvSummary || null} />

      {/* Experiences */}
      <div id="experience-list" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          Experience ({draft.experiences.length})
        </h2>
        {draft.experiences.map((e) => (
          <div key={e.id} className="border-border/15 bg-foreground/2 rounded-xl border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {e.title}
                  {e.company && <span className="text-muted-foreground"> · {e.company}</span>}
                </p>
                <p className="text-muted-foreground text-xs">
                  {periodString(e)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${e.title}`}
                onClick={() => update("experiences", draft.experiences.filter((x) => x.id !== e.id))}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
            {e.description && (
              <p className="text-muted-foreground mt-1.5 line-clamp-2 whitespace-pre-line text-xs">{e.description}</p>
            )}
          </div>
        ))}
        {adding ? (
          <ExperienceForm
            onCancel={() => setAdding(false)}
            onSave={(exp) => {
              update("experiences", [...draft.experiences, exp]);
              setAdding(false);
            }}
          />
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" />
            {draft.experiences.length ? "Add another" : "No CV? Add manually"}
          </Button>
        )}
      </div>

      {/* Education */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Education ({draft.education.length})</h2>
        {draft.education.map((ed) => (
          <div key={ed.id} className="border-border/15 bg-foreground/2 flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
            <p className="min-w-0 truncate text-sm">
              {ed.degree || "Studied"}
              <span className="text-muted-foreground"> · {ed.school}{ed.endYear ? ` · ${ed.endYear}` : ""}</span>
            </p>
            <button
              type="button"
              aria-label={`Remove ${ed.school}`}
              onClick={() => update("education", draft.education.filter((x) => x.id !== ed.id))}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
        <EducationForm
          onSave={(ed) => update("education", [...draft.education, ed])}
        />
      </div>

      {/* Skills + extras */}
      <FieldShell id="f-skills" label="Skills" autoFilled={draft.autoFilled.skills}>
        <TagInput
          id="f-skills"
          values={draft.skills}
          onChange={(v) => update("skills", v)}
          placeholder="Any skill counts — welding, React, beatboxing…"
          autoFilled={draft.autoFilled.skills}
        />
      </FieldShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell id="f-certifications" label="Certifications" optional>
          <TagInput
            id="f-certifications"
            values={draft.certifications}
            onChange={(v) => update("certifications", v)}
            placeholder="e.g. Food Handler License"
          />
        </FieldShell>
        <FieldShell id="f-languages" label="Languages" optional>
          <TagInput
            id="f-languages"
            values={draft.languages}
            onChange={(v) => update("languages", v)}
            placeholder="e.g. English, Malay"
          />
        </FieldShell>
      </div>
    </>
  );
}

function ExperienceForm({
  onSave,
  onCancel,
}: {
  onSave: (e: DraftExperience) => void;
  onCancel: () => void;
}) {
  // ponytail: id assigned at save time (below) so render stays pure.
  const [e, setE] = useState<DraftExperience>({
    id: "", title: "", company: "", employmentType: "Full-time",
    startDate: "", endDate: "", current: false, description: "", proudOf: "",
  });
  const set = <K extends keyof DraftExperience>(k: K, v: DraftExperience[K]) =>
    setE((prev) => ({ ...prev, [k]: v }));
  return (
    <div className="border-luminous/30 bg-card/40 flex flex-col gap-3 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id="xp-title" label="Title / role" value={e.title} onChange={(v) => set("title", v)} placeholder="e.g. Barista · Volunteer coordinator" />
        <TextField id="xp-company" label="Company / context" optional value={e.company} onChange={(v) => set("company", v)} placeholder="e.g. Family business · Hackathon" />
      </div>
      <FieldShell label="Type">
        <ChipGroup
          options={EMPLOYMENT_TYPES}
          values={[e.employmentType]}
          onChange={(v) => set("employmentType", v[0] ?? "Full-time")}
          single
          allowOther
        />
      </FieldShell>
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <FieldShell id="xp-start" label="From">
          <input id="xp-start" type="month" value={e.startDate} onChange={(ev) => set("startDate", ev.target.value)} className="bg-foreground/2 border-border/15 w-full rounded-lg border px-3 py-2 text-sm outline-none" />
        </FieldShell>
        <FieldShell id="xp-end" label="To">
          <input id="xp-end" type="month" value={e.endDate} disabled={e.current} onChange={(ev) => set("endDate", ev.target.value)} className="bg-foreground/2 border-border/15 w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-40" />
        </FieldShell>
        <Toggle id="xp-current" label="I still do this" checked={e.current} onChange={(v) => set("current", v)} />
      </div>
      <TextField id="xp-desc" label="What did you do?" optional value={e.description} onChange={(v) => set("description", v)} placeholder="One or two lines is plenty" />
      <TextField id="xp-proud" label="Something you're proud of" optional value={e.proudOf} onChange={(v) => set("proudOf", v)} placeholder="e.g. Trained 4 new hires" />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!e.title.trim()}
          onClick={() => onSave({ ...e, id: crypto.randomUUID() })}
        >
          Add experience
        </Button>
      </div>
    </div>
  );
}

function EducationForm({ onSave }: { onSave: (e: DraftEducation) => void }) {
  const [open, setOpen] = useState(false);
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [endYear, setEndYear] = useState("");
  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Add education
      </Button>
    );
  }
  return (
    <div className="border-luminous/30 bg-card/40 flex flex-col gap-3 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField id="edu-school" label="School" value={school} onChange={setSchool} placeholder="e.g. SMK Damansara" />
        <TextField id="edu-degree" label="Qualification" optional value={degree} onChange={setDegree} placeholder="e.g. SPM · BSc CS" />
        <TextField id="edu-year" label="Finished (year)" optional value={endYear} onChange={setEndYear} placeholder="e.g. 2024" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!school.trim()}
          onClick={() => {
            onSave({
              id: `new_${Math.random().toString(36).slice(2, 8)}`,
              school: school.trim(), degree: degree.trim(), endYear: endYear.trim(),
            });
            setSchool("");
            setDegree("");
            setEndYear("");
            setOpen(false);
          }}
        >
          Add education
        </Button>
      </div>
    </div>
  );
}

// ── Section 3 — Preferences (one-question questionnaire) ────────

type UpdateFn = <K extends keyof Draft>(k: K, v: Draft[K]) => void;

interface PrefQuestion {
  id: string;
  title: string;
  subtitle?: string;
  required?: boolean;
  /** Has this question been answered? (drives the "N answered" count.) */
  answered: (d: Draft) => boolean;
  render: (d: Draft, update: UpdateFn, advance: () => void) => ReactNode;
}

// ponytail: `advance` auto-progresses after a single-select — same 250ms
// beat as the personality quiz so the highlight registers before the slide.
const auto = (advance: () => void) => setTimeout(advance, 250);

const PREF_QUESTIONS: PrefQuestion[] = [
  {
    id: "targetRoles",
    title: "What roles are you aiming for?",
    subtitle: "Add one or more — any field counts. (Required)",
    required: true,
    answered: (d) => d.targetRoles.length > 0,
    render: (d, u) => (
      <TagInput
        id="f-targetRoles"
        values={d.targetRoles}
        onChange={(v) => u("targetRoles", v)}
        placeholder="e.g. Electrician · Product designer · Chef"
      />
    ),
  },
  {
    id: "desiredLocations",
    title: "Where would you like to work?",
    subtitle: "Cities, regions, or “Remote”.",
    answered: (d) => d.desiredLocations.length > 0,
    render: (d, u) => (
      <TagInput
        id="f-desiredLocations"
        values={d.desiredLocations}
        onChange={(v) => u("desiredLocations", v)}
        placeholder="e.g. Kuala Lumpur · Remote"
      />
    ),
  },
  {
    id: "openToRelocate",
    title: "Open to relocating for the right role?",
    answered: () => true,
    render: (d, u, adv) => (
      <ChipGroup
        options={["Yes", "No"]}
        single
        values={[d.openToRelocate ? "Yes" : "No"]}
        onChange={(v) => {
          u("openToRelocate", v[0] === "Yes");
          auto(adv);
        }}
      />
    ),
  },
  {
    id: "workArrangement",
    title: "How do you want to work?",
    subtitle: "Pick any that fit.",
    answered: (d) => d.workArrangement.length > 0,
    render: (d, u) => (
      <ChipGroup
        options={[...WORK_ARRANGEMENT]}
        values={d.workArrangement}
        onChange={(v) => u("workArrangement", v)}
      />
    ),
  },
  {
    id: "jobTypes",
    title: "What kind of role are you after?",
    answered: (d) => d.jobTypes.length > 0,
    render: (d, u) => (
      <ChipGroup options={JOB_TYPES} values={d.jobTypes} onChange={(v) => u("jobTypes", v)} allowOther />
    ),
  },
  {
    id: "minSalary",
    title: "Any minimum salary?",
    subtitle: "Optional — leave blank to skip.",
    answered: (d) => !!d.minSalaryAmount,
    render: (d, u) => (
      <div className="flex max-w-xs gap-2">
        <input
          id="f-minSalary"
          type="number"
          min={0}
          value={d.minSalaryAmount}
          onChange={(e) => u("minSalaryAmount", e.target.value)}
          placeholder="e.g. 4000"
          className="bg-foreground/2 border-border/15 w-full rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <Select
          aria-label="Salary period"
          value={d.minSalaryPeriod}
          onChange={(e) => u("minSalaryPeriod", e.target.value)}
          wrapperClassName="shrink-0"
        >
          <option value="hourly">/ hour</option>
          <option value="monthly">/ month</option>
          <option value="yearly">/ year</option>
        </Select>
      </div>
    ),
  },
  {
    id: "availability",
    title: "How soon are you looking?",
    answered: (d) => !!d.availability,
    render: (d, u, adv) => (
      <ChipGroup
        options={AVAILABILITY}
        single
        values={d.availability ? [d.availability] : []}
        onChange={(v) => {
          u("availability", v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
  {
    id: "visibility",
    title: "Who can see your profile?",
    answered: () => true,
    render: (d, u, adv) => (
      <ChipGroup
        options={["Hidden until I opt in", "All recruiters"]}
        single
        values={[d.visibility === "all_recruiters" ? "All recruiters" : "Hidden until I opt in"]}
        onChange={(v) => {
          u("visibility", v[0] === "All recruiters" ? "all_recruiters" : "hidden_from_current");
          auto(adv);
        }}
      />
    ),
  },
  {
    id: "workEnvironment",
    title: "Where do you do your best work?",
    answered: (d) => !!d.workEnvironment,
    render: (d, u, adv) => (
      <SelectCard
        options={ENVIRONMENTS}
        value={d.workEnvironment}
        onChange={(v) => {
          u("workEnvironment", v);
          if (v) auto(adv);
        }}
      />
    ),
  },
  {
    id: "topValues",
    title: "What matters most? Pick up to 3, in order.",
    answered: (d) => d.topValues.length > 0,
    render: (d, u) => (
      <ChipGroup options={VALUES} values={d.topValues} onChange={(v) => u("topValues", v)} max={3} numbered allowOther />
    ),
  },
  {
    id: "learningHoursPerWeek",
    title: "How much time can you give to learning each week?",
    answered: () => true,
    render: (d, u) => (
      <Slider
        id="f-learning"
        label="Learning hours per week"
        value={d.learningHoursPerWeek}
        onChange={(v) => u("learningHoursPerWeek", v)}
        min={0}
        max={20}
        unit="hrs"
      />
    ),
  },
  {
    id: "scheduleFlexibility",
    title: "Any schedule needs?",
    subtitle: "Neutral logistics — never demographics.",
    answered: (d) => d.scheduleFlexibility.length > 0,
    render: (d, u) => (
      <ChipGroup options={SCHEDULE_FLEX} values={d.scheduleFlexibility} onChange={(v) => u("scheduleFlexibility", v)} allowOther />
    ),
  },
  {
    id: "maxCommuteMinutes",
    title: "Longest commute you'd take?",
    answered: () => true,
    render: (d, u) => (
      <Slider
        id="f-commute"
        label="Max commute"
        value={d.maxCommuteMinutes}
        onChange={(v) => u("maxCommuteMinutes", v)}
        min={0}
        max={120}
        step={5}
        unit="min"
      />
    ),
  },
  {
    id: "travelWillingness",
    title: "Willing to travel for work?",
    answered: () => true,
    render: (d, u, adv) => (
      <ChipGroup
        options={TRAVEL}
        single
        values={d.travelWillingness ? [d.travelWillingness] : []}
        onChange={(v) => {
          u("travelWillingness", v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
];

function PreferencesSection({
  draft,
  update,
  prefStep,
  atReview,
  advancePref,
  onEditQuestion,
}: {
  draft: Draft;
  update: UpdateFn;
  prefStep: number;
  atReview: boolean;
  advancePref: () => void;
  onEditQuestion: (i: number) => void;
}) {
  const n = PREF_QUESTIONS.length;

  if (atReview) return <PrefReview draft={draft} onEditQuestion={onEditQuestion} />;

  const q = PREF_QUESTIONS[prefStep];
  const answeredCount = PREF_QUESTIONS.filter((x) => x.answered(draft)).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress — how many questions, how far through. */}
      <div>
        <div className="text-muted-foreground flex items-center justify-between text-[11px] font-mono font-medium uppercase tracking-wider">
          <span>Question {prefStep + 1} of {n}</span>
          <span>{answeredCount}/{n} answered</span>
        </div>
        <div className="bg-foreground/8 mt-1.5 h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-clover h-full rounded-full transition-all"
            style={{ width: `${((prefStep + 1) / n) * 100}%` }}
          />
        </div>
      </div>

      {/* Current question */}
      <div key={q.id} className="animate-appear flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{q.title}</h2>
          {q.subtitle && <p className="text-muted-foreground mt-0.5 text-sm">{q.subtitle}</p>}
        </div>
        {q.render(draft, update, advancePref)}
      </div>

      <p className="text-muted-foreground text-[11px]">
        {q.required
          ? "This one's needed so we can match you."
          : "Optional — press Next to skip."}
      </p>
    </div>
  );
}

/** The "everything you filled in" review before Finish. Preference rows jump
 *  back to their question; Personal/Work are edited via the section dots. */
function PrefReview({
  draft,
  onEditQuestion,
}: {
  draft: Draft;
  onEditQuestion: (i: number) => void;
}) {
  const d = draft;
  const stageLabel = STAGES.find((s) => s.id === d.careerStage)?.label ?? "—";
  const envLabel = ENVIRONMENTS.find((e) => e.id === d.workEnvironment)?.label;
  const salary =
    d.minSalaryAmount && `${d.minSalaryAmount} / ${d.minSalaryPeriod || "yearly"}`;
  const qi = (id: string) => PREF_QUESTIONS.findIndex((x) => x.id === id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="text-clover size-5" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">That&apos;s everything — here&apos;s your profile</h2>
          <p className="text-muted-foreground text-sm">
            Review below, then finish. Tap any preference to change it.
          </p>
        </div>
      </div>

      <ReviewGroup title="Personal details">
        <ReviewRow label="Name" value={d.fullName} />
        <ReviewRow label="Email" value={d.email} />
        <ReviewRow label="Phone" value={d.phone} />
        <ReviewRow label="Location" value={d.location} />
        <ReviewRow label="Current title" value={d.currentTitle} />
        <ReviewRow label="Stage" value={stageLabel} />
        {d.careerStage === "student" && <ReviewRow label="Field of study" value={d.fieldOfStudy} />}
        <ReviewRow label="Goal" value={d.goal} />
      </ReviewGroup>

      <ReviewGroup title="Work & skills">
        <ReviewRow label="Experience" value={d.experiences.length ? `${d.experiences.length} entr${d.experiences.length === 1 ? "y" : "ies"}` : ""} />
        <ReviewRow label="Education" value={d.education.length ? `${d.education.length} entr${d.education.length === 1 ? "y" : "ies"}` : ""} />
        <ReviewRow label="Skills" value={d.skills.join(", ")} />
        <ReviewRow label="Certifications" value={d.certifications.join(", ")} />
        <ReviewRow label="Languages" value={d.languages.join(", ")} />
      </ReviewGroup>

      <ReviewGroup title="Preferences">
        <ReviewRow label="Desired roles" value={d.targetRoles.join(", ")} onEdit={() => onEditQuestion(qi("targetRoles"))} />
        <ReviewRow label="Desired locations" value={d.desiredLocations.join(", ")} onEdit={() => onEditQuestion(qi("desiredLocations"))} />
        <ReviewRow label="Open to relocate" value={d.openToRelocate ? "Yes" : "No"} onEdit={() => onEditQuestion(qi("openToRelocate"))} />
        <ReviewRow label="Work arrangement" value={d.workArrangement.join(", ")} onEdit={() => onEditQuestion(qi("workArrangement"))} />
        <ReviewRow label="Job type" value={d.jobTypes.join(", ")} onEdit={() => onEditQuestion(qi("jobTypes"))} />
        <ReviewRow label="Min salary" value={salary || ""} onEdit={() => onEditQuestion(qi("minSalary"))} />
        <ReviewRow label="Availability" value={d.availability} onEdit={() => onEditQuestion(qi("availability"))} />
        <ReviewRow label="Profile visibility" value={d.visibility === "all_recruiters" ? "All recruiters" : "Hidden until opt-in"} onEdit={() => onEditQuestion(qi("visibility"))} />
        <ReviewRow label="Best environment" value={envLabel ?? ""} onEdit={() => onEditQuestion(qi("workEnvironment"))} />
        <ReviewRow label="Top values" value={d.topValues.join(" · ")} onEdit={() => onEditQuestion(qi("topValues"))} />
        <ReviewRow label="Learning / week" value={`${d.learningHoursPerWeek} hrs`} onEdit={() => onEditQuestion(qi("learningHoursPerWeek"))} />
        <ReviewRow label="Schedule flexibility" value={d.scheduleFlexibility.join(", ")} onEdit={() => onEditQuestion(qi("scheduleFlexibility"))} />
        <ReviewRow label="Max commute" value={`${d.maxCommuteMinutes} min`} onEdit={() => onEditQuestion(qi("maxCommuteMinutes"))} />
        <ReviewRow label="Travel" value={d.travelWillingness} onEdit={() => onEditQuestion(qi("travelWillingness"))} />
      </ReviewGroup>

      <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
        <Compass className="size-3.5 shrink-0" aria-hidden />
        Edit Personal or Work via the section dots above. Press Finish when ready.
      </p>
    </div>
  );
}

function ReviewGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-luminous text-[11px] font-mono font-semibold uppercase tracking-[0.18em]">{title}</p>
      <dl className="border-border/15 mt-2 divide-y divide-border/30 rounded-xl border">
        {children}
      </dl>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  const filled = value.trim().length > 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm">
      <dt className="text-muted-foreground w-32 shrink-0 text-xs">{label}</dt>
      <dd className={cn("min-w-0 flex-1 truncate", !filled && "text-muted-foreground/60 italic")}>
        {filled ? value : "Not set"}
      </dd>
      {onEdit && (
        <button type="button" onClick={onEdit} className="text-luminous shrink-0 text-xs font-medium hover:underline">
          Edit
        </button>
      )}
    </div>
  );
}
