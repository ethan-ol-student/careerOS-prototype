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
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import StepShell from "@/components/onboarding/StepShell";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { FeedbackModal } from "@/components/ui/FeedbackModal";
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
  { id: "student", label: "Student", hint: "Still discovering paths & developing first skills", icon: GraduationCap },
  { id: "young-adult", label: "Young Adult", hint: "Building a portfolio, finding internships & first roles", icon: Rocket },
  { id: "early-career", label: "Early Career", hint: "Landing the right job, building market value & growth", icon: Briefcase },
  { id: "mid-career", label: "Mid-Career", hint: "Deciding the next step, closing skill gaps early", icon: Shuffle },
  { id: "senior-career", label: "Senior Career", hint: "Leadership, mentorship & advisory roles", icon: Users },
  { id: "executive", label: "Executive & Beyond", hint: "Boards, consulting & legacy decisions", icon: Building2 },
] as const;

const FAMILY_STATUS = ["Single", "Married"];
const GENDER = ["Male", "Female", "Prefer not to say"];
const FOCUS = [
  { id: "improve", label: "Improve", hint: "Get better at specific skills, grow my portfolio", icon: TrendingUp },
  { id: "discovering", label: "Discovering", hint: "Find which jobs or industries fit me best", icon: Compass },
];
// Optional self-ID (shown only after the review). Malaysia-oriented seed
// lists with a free-text "Other" — never shared with employers, never a
// match/score input.
const RELIGION = ["Buddhism", "Christianity", "Hinduism", "Islam", "None"];
const RACE = ["Malay", "Chinese", "Indian", "Bumiputera"];

const GOAL_CHIPS = [
  "Land my first real job",
  "Switch fields",
  "Grow where I am",
  "Go independent",
  "Still figuring it out",
];

// Curated industry list for the multi-select (max 3). "Other" stays open
// via ChipGroup's allowOther so nothing is off-limits.
const INDUSTRIES = [
  "Technology & Software",
  "Finance & Banking",
  "Healthcare & Medical",
  "Education & Training",
  "Engineering & Manufacturing",
  "Retail & E-commerce",
  "Hospitality & Tourism",
  "Construction & Property",
  "Media & Creative",
  "Marketing & Advertising",
  "Legal & Consulting",
  "Government & Public Sector",
  "Energy & Utilities",
  "Transportation & Logistics",
  "Telecommunications",
  "Food & Beverage",
  "Agriculture",
  "Automotive",
  "Non-profit & NGO",
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
  nickname: string; // dashboard greeting
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  familyStatus: string; // optional, private
  gender: string; // optional, private
  careerStage: string;
  careerStageMeaning: string;
  focus: string; // "" | "improve" | "discovering"
  industries: string[]; // → interestedIndustries
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
  // Phase-conditional preference answers (mid-career / senior / executive)
  // keyed by question id — free text, choice arrays, or slider numbers.
  phaseAnswers: Record<string, string | string[] | number>;
  // Optional self-ID — collected only after the review, never shared with
  // employers, never a match/score input.
  religion: string[];
  race: string[];
  age: string; // string in the draft; parsed to Int on save
  // CV-autofill markers (never persisted)
  autoFilled: Record<string, boolean>;
  cvSummary: string;
}

const DRAFT_KEY = "career-os-candidate-onboarding-draft";

const emptyDraft: Draft = {
  fullName: "", nickname: "", email: "", phone: "", location: "", currentTitle: "",
  familyStatus: "", gender: "",
  careerStage: "", careerStageMeaning: "", focus: "", industries: [],
  fieldOfStudy: "", expectedGraduation: "", goal: "",
  resumeFileName: "", experiences: [], education: [], skills: [],
  certifications: [], languages: [], links: [],
  targetRoles: [], desiredLocations: [], openToRelocate: false,
  workArrangement: [], jobTypes: [], minSalaryAmount: "",
  minSalaryPeriod: "yearly", availability: "",
  visibility: "hidden_from_current", workEnvironment: "", topValues: [],
  learningHoursPerWeek: 4, scheduleFlexibility: [], maxCommuteMinutes: 45,
  travelWillingness: "", phaseAnswers: {}, religion: [], race: [], age: "",
  autoFilled: {}, cvSummary: "",
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
    fullName: s(i.fullName), nickname: s(i.nickname), email: s(i.email), phone: s(i.phone),
    location: s(i.location), currentTitle: s(i.currentTitle),
    familyStatus: s(i.familyStatus), gender: s(i.gender),
    careerStage: s(i.careerStage), careerStageMeaning: s(i.careerStageMeaning),
    focus: s(i.focus),
    industries: a(i.industries).length ? a(i.industries) : a(i.interestedIndustries),
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
    phaseAnswers:
      i.phaseAnswers && typeof i.phaseAnswers === "object" && !Array.isArray(i.phaseAnswers)
        ? Object.fromEntries(
            Object.entries(i.phaseAnswers as Record<string, unknown>).filter(
              ([, v]) =>
                typeof v === "string" ||
                typeof v === "number" ||
                (Array.isArray(v) && v.every((x) => typeof x === "string")),
            ),
          ) as Record<string, string | string[] | number>
        : {},
    religion: a(i.religion), race: a(i.race),
    age: typeof i.age === "number" ? String(i.age) : s(i.age),
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
  const ageNum = Number(draft.age);
  return {
    fullName: draft.fullName.trim(),
    nickname: draft.nickname.trim(),
    currentTitle: draft.currentTitle.trim(),
    phone: draft.phone.trim(),
    location: draft.location.trim(),
    familyStatus: draft.familyStatus,
    gender: draft.gender,
    careerStage: draft.careerStage,
    careerStageMeaning: draft.careerStageMeaning,
    focus: draft.focus as "" | "improve" | "discovering",
    interestedIndustries: draft.industries,
    religion: draft.religion,
    race: draft.race,
    age: draft.age && Number.isFinite(ageNum) ? Math.round(ageNum) : null,
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
    phaseAnswers: draft.phaseAnswers,
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
  // Conversational wizard (mentor wireframe): ONE question at a time across
  // all three sections; `step === questions.length` is the final review.
  const [step, setStep] = useState(0);
  const [cvOpen, setCvOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Edit mode (?edit=1 from Settings) — an inline overview table instead
  // of the sequential wizard: every answer visible, edited in place.
  const [editMode, setEditMode] = useState(false);
  const [editChecked, setEditChecked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [exitPrompt, setExitPrompt] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
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
      setDirty(true); // only read by edit mode's unsaved-changes guard
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

  /** Jump straight to the question that owns a field (used by the missing-
   *  fields banner and per-row Edit on the review). */
  const jumpToField = useCallback((field: string) => {
    const list = WIZARD_QUESTIONS.filter((q) => !q.showIf || q.showIf(draft));
    const idx = list.findIndex((q) => q.id === field);
    if (idx >= 0) setStep(idx);
  }, [draft]);

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
      jumpToField(REQUIRED.find((r) => errs[r.field])!.field);
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
      setSubmitting(false);
      setCelebrate(true); // redirect happens when they dismiss the celebration
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save onboarding.");
      setSubmitting(false);
    }
  }

  /** Edit-mode save: one PATCH (+ idempotent skill upserts + discovery).
   *  Deliberately skips the experience/education/cert POST fan-out — those
   *  create rows and would duplicate on every edit save. */
  async function handleEditSave(): Promise<boolean> {
    const errs = validate(draft);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setEditingId(REQUIRED.find((r) => errs[r.field])!.field);
      setSubmitError("Some required answers are missing — fix the highlighted rows.");
      return false;
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
        setSubmitError(body?.error?.message ?? "Failed to save your changes.");
        return false;
      }
      for (const name of draft.skills.slice(0, 40)) {
        await fetch("/api/me/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.slice(0, 40), level: 3 }),
        }).catch(() => null);
      }
      await fetch("/api/me/discovery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverable: draft.visibility === "all_recruiters" }),
      }).catch(() => null);
      try {
        localStorage.removeItem(DRAFT_KEY); // server is the truth again
      } catch {
        /* ignore */
      }
      setDirty(false);
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2500);
      return true;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save your changes.");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  const exitToDashboard = () => router.push("/candidate/dashboard");
  const handleExit = () => {
    if (dirty) setExitPrompt(true);
    else exitToDashboard();
  };
  const discardAndExit = () => {
    try {
      localStorage.removeItem(DRAFT_KEY); // drop the unsaved local draft
    } catch {
      /* ignore */
    }
    exitToDashboard();
  };
  const saveAndExit = async () => {
    if (await handleEditSave()) exitToDashboard();
    else setExitPrompt(false); // surface the error inline
  };

  // Active question list (student-only questions filter out for others).
  const questions = useMemo(
    () => WIZARD_QUESTIONS.filter((q) => !q.showIf || q.showIf(draft)),
    [draft],
  );
  const nQ = questions.length;
  const clampedStep = Math.min(step, nQ);
  const atReview = clampedStep >= nQ;
  const current = atReview ? null : questions[clampedStep];
  const blocked = !!current?.required && !current.answered(draft);
  const activeSection = current?.section ?? 2;
  const answeredCount = questions.filter((q) => q.answered(draft)).length;

  const advance = () => setStep(() => Math.min(nQ, clampedStep + 1));
  const goNext = async () => {
    // Persist when we cross into a new section (cheap partial save).
    const next = questions[clampedStep + 1];
    if (!next || next.section !== activeSection) await persistPartial();
    advance();
    window.scrollTo({ top: 0 });
  };
  const goBack = () => setStep(() => Math.max(0, clampedStep - 1));
  const jumpToSection = (s: number) => {
    const idx = questions.findIndex((q) => q.section === s);
    if (idx >= 0) setStep(idx);
  };

  return (
    <StepShell
      {...(editMode ? {} : { stepNumber: clampedStep + 1, totalSteps: nQ + 1 })}
      eyebrow={editMode ? "Profile settings" : "Candidate setup"}
      title={
        editMode
          ? "Your onboarding answers"
          : atReview
            ? "Review your details"
            : SECTIONS[activeSection]
      }
      subtitle={
        editMode
          ? "Everything in one place — tap Edit on any line to change it inline, then Save."
          : atReview
            ? "Check everything at a glance. Tap Edit on any line to fix it, then Finish."
            : "One question at a time — your answers autosave as you go."
      }
      footer={
        editMode ? (
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={handleExit} disabled={submitting}>
              <ArrowLeft className="size-4" />
              Exit to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              {savedNote && (
                <span className="text-clover inline-flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="size-3.5" /> Saved
                </span>
              )}
              <Button type="button" onClick={() => void handleEditSave()} disabled={submitting || !dirty}>
                <Sparkles className="size-4" />
                {submitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={clampedStep === 0 || submitting}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {!atReview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCvOpen(true)}
                  disabled={submitting || parsing}
                >
                  <Sparkles className="size-4" />
                  Quick upload CV
                </Button>
              )}
              {!atReview ? (
                <Button type="button" onClick={goNext} disabled={blocked || submitting || parsing}>
                  {clampedStep === nQ - 1 ? "Review" : "Next"}
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleFinish} disabled={submitting || parsing}>
                  <Sparkles className="size-4" />
                  {submitting ? "Saving…" : "Finish"}
                </Button>
              )}
            </div>
          </div>
        )
      }
    >
      {editMode ? (
        /* ── Edit mode: inline overview table (no wizard) ── */
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
          {submitError && (
            <p role="alert" className="text-destructive text-sm">
              {submitError}
            </p>
          )}
          <section className="glass-4 ring-luminous/20 flex flex-col gap-5 rounded-2xl p-6 ring-1 sm:p-8">
            <EditOverview
              draft={draft}
              update={update}
              errors={errors}
              editingId={editingId}
              onToggleEdit={setEditingId}
            />
            <SelfIdSection draft={draft} update={update} />
          </section>
          <p className="text-muted-foreground text-center text-[0.6875rem]">
            Changes apply once you press Save. Personal details are optional,
            kept private, and never used to match you.
          </p>
        </div>
      ) : (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        {/* Phase rail (wireframe): Personal details · Work experience · Preferences */}
        <nav aria-label="Onboarding sections" className="flex items-center justify-between gap-2">
          {SECTIONS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => jumpToSection(i)}
              aria-current={activeSection === i && !atReview ? "step" : undefined}
              className="group flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "size-3 rounded-full transition-colors",
                  i <= activeSection || atReview ? "bg-clover" : "bg-border group-hover:bg-luminous/50",
                )}
              />
              <span
                className={cn(
                  "text-[0.625rem] font-mono font-semibold uppercase tracking-wider",
                  activeSection === i && !atReview ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </nav>

        {submitError && (
          <p role="alert" ref={bannerRef} className="text-destructive text-sm">
            {submitError}
          </p>
        )}

        <section className="glass-4 ring-luminous/20 flex flex-col gap-5 rounded-2xl p-6 ring-1 sm:p-8">
          {atReview ? (
            <WizardReview draft={draft} update={update} onEditField={jumpToField} />
          ) : current ? (
            <div className="flex flex-col gap-4">
              {/* Progress — "Q i / N" + a bar (wireframe counter). */}
              <div>
                <div className="text-muted-foreground flex items-center justify-between font-mono text-[0.6875rem] font-medium uppercase tracking-wider">
                  <span>
                    {clampedStep + 1} / {nQ}
                  </span>
                  <span>{answeredCount} answered</span>
                </div>
                <div className="bg-foreground/8 mt-1.5 h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-clover h-full rounded-full transition-all"
                    style={{ width: `${((clampedStep + 1) / nQ) * 100}%` }}
                  />
                </div>
              </div>

              <div key={current.id} className="animate-appear flex flex-col gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{current.title}</h2>
                  {current.subtitle && (
                    <p className="text-muted-foreground mt-0.5 text-sm">{current.subtitle}</p>
                  )}
                </div>
                {current.render(draft, update, advance)}
                {errors[current.id] && (
                  <p className="text-destructive text-xs">{errors[current.id]}</p>
                )}
              </div>

              <p className="text-muted-foreground text-[0.6875rem]">
                {current.required
                  ? "This one's needed so we can match you."
                  : "Optional — press Next to skip."}
              </p>
            </div>
          ) : null}
        </section>

        <p className="text-muted-foreground text-center text-[0.6875rem]">
          Autosaved as you go — refresh anytime, nothing is lost. Personal
          details are optional, kept private, and never used to match you.
        </p>
      </div>
      )}

      {/* Unsaved-changes guard (edit mode): save, discard, or stay. */}
      <Modal
        isOpen={exitPrompt}
        onClose={() => setExitPrompt(false)}
        title="Unsaved changes"
        description="You've edited answers that aren't saved yet."
        size="sm"
      >
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={() => void saveAndExit()} disabled={submitting}>
            <CheckCircle2 className="size-4" />
            {submitting ? "Saving…" : "Save & exit"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={discardAndExit}
            disabled={submitting}
          >
            Discard changes
          </Button>
          <Button type="button" variant="outline" onClick={() => setExitPrompt(false)}>
            Keep editing
          </Button>
        </div>
      </Modal>

      {/* Quick upload CV — opens the parser in a modal (wireframe footer button) */}
      <Modal
        isOpen={cvOpen}
        onClose={() => setCvOpen(false)}
        title="Quick upload your CV"
        description="We'll fill in what we can — you review the rest one question at a time."
        size="md"
      >
        <UploadZone
          onParsed={(cv, fileName) => {
            const msg = applyParsed(cv, fileName);
            setCvOpen(false);
            return msg;
          }}
          onBusyChange={setParsing}
          summary={draft.cvSummary || null}
        />
      </Modal>

      <FeedbackModal
        isOpen={celebrate}
        onClose={() => router.replace(editMode ? "/candidate/settings" : "/candidate/dashboard")}
        variant="celebrate"
        title="You're all set! 🎉"
        description="Your profile is ready — let's open your dashboard."
        okLabel="Done"
      />
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

interface WizardQuestion {
  id: string;
  /** 0 Personal · 1 Work · 2 Preferences — drives the phase rail. */
  section: 0 | 1 | 2;
  title: string;
  subtitle?: string;
  required?: boolean;
  /** Only show when this predicate holds (e.g. student-only questions). */
  showIf?: (d: Draft) => boolean;
  /** Has this question been answered? (drives the "N answered" count.) */
  answered: (d: Draft) => boolean;
  render: (d: Draft, update: UpdateFn, advance: () => void) => ReactNode;
}
/** The preferences questions are authored without a section, then tagged 2. */
type PrefQuestion = Omit<WizardQuestion, "section">;

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
    showIf: (d) => !isPhasedStage(d),
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
    showIf: (d) => !isPhasedStage(d),
    answered: (d) => d.topValues.length > 0,
    render: (d, u) => (
      <ChipGroup options={VALUES} values={d.topValues} onChange={(v) => u("topValues", v)} max={3} numbered allowOther />
    ),
  },
  {
    id: "learningHoursPerWeek",
    title: "How much time can you give to learning each week?",
    showIf: (d) => !isPhasedStage(d),
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
    showIf: (d) => !isPhasedStage(d),
    answered: (d) => d.scheduleFlexibility.length > 0,
    render: (d, u) => (
      <ChipGroup options={SCHEDULE_FLEX} values={d.scheduleFlexibility} onChange={(v) => u("scheduleFlexibility", v)} allowOther />
    ),
  },
  {
    id: "maxCommuteMinutes",
    title: "Longest commute you'd take?",
    showIf: (d) => !isPhasedStage(d),
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
    showIf: (d) => !isPhasedStage(d),
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

// ── Phase-conditional preference questions (Task 2) ─────────────
// Mid-career / senior-career / executive stages swap the generic
// preference tail (environment, values, learning time, schedule,
// commute, travel) for a reflective, phase-specific question set.
// Answers live in `draft.phaseAnswers` (→ CandidatesAI.phaseAnswers JSON).

const PHASED_STAGES = ["mid-career", "senior-career", "executive"];
const isPhasedStage = (d: Draft) => PHASED_STAGES.includes(d.careerStage);

const paStr = (d: Draft, id: string): string => {
  const v = d.phaseAnswers[id];
  return typeof v === "string" ? v : "";
};
const paArr = (d: Draft, id: string): string[] => {
  const v = d.phaseAnswers[id];
  return Array.isArray(v) ? v : [];
};
const paNum = (d: Draft, id: string, fallback: number): number => {
  const v = d.phaseAnswers[id];
  return typeof v === "number" ? v : fallback;
};
const setPa =
  (u: UpdateFn, d: Draft, id: string) =>
  (v: string | string[] | number) =>
    u("phaseAnswers", { ...d.phaseAnswers, [id]: v });

/** Free-text phase answer input (same styling as the goal free-text). */
function PhaseTextInput({
  id,
  draft,
  update,
  placeholder,
}: {
  id: string;
  draft: Draft;
  update: UpdateFn;
  placeholder: string;
}) {
  return (
    <input
      id={`f-${id}`}
      type="text"
      value={paStr(draft, id)}
      onChange={(e) => setPa(update, draft, id)(e.target.value)}
      placeholder={placeholder}
      className="bg-foreground/2 border-border/15 focus-visible:border-luminous/60 focus-visible:ring-luminous/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
    />
  );
}

const MID_CAREER_QUESTIONS: PrefQuestion[] = [
  {
    id: "mc_challenge",
    title: "What's the single biggest challenge in your career right now?",
    showIf: (d) => d.careerStage === "mid-career",
    answered: (d) => !!paStr(d, "mc_challenge"),
    render: (d, u, adv) => (
      <ChipGroup
        options={[
          "Feeling stuck or plateaued",
          "Skills falling behind the market",
          "Underpaid for my scope",
          "Burnout & workload",
          "No clear next step",
        ]}
        single
        allowOther
        values={paStr(d, "mc_challenge") ? [paStr(d, "mc_challenge")] : []}
        onChange={(v) => {
          setPa(u, d, "mc_challenge")(v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
  {
    id: "mc_change_one",
    title: "If you could change one thing about your current role, what would it be?",
    answered: (d) => !!paStr(d, "mc_change_one"),
    showIf: (d) => d.careerStage === "mid-career",
    render: (d, u) => (
      <PhaseTextInput id="mc_change_one" draft={d} update={u} placeholder="e.g. More ownership over product decisions" />
    ),
  },
  {
    id: "mc_primary_goal",
    title: "What is your primary goal right now?",
    subtitle: "Climbing the ladder, or mastering new ground?",
    showIf: (d) => d.careerStage === "mid-career",
    answered: (d) => !!paStr(d, "mc_primary_goal"),
    render: (d, u, adv) => (
      <ChipGroup
        options={["Climbing the leadership ladder", "Mastering new areas of expertise"]}
        single
        allowOther
        values={paStr(d, "mc_primary_goal") ? [paStr(d, "mc_primary_goal")] : []}
        onChange={(v) => {
          setPa(u, d, "mc_primary_goal")(v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
  {
    id: "mc_flow_work",
    title: "What kind of work makes you lose track of time?",
    subtitle: "Pick any that fit.",
    showIf: (d) => d.careerStage === "mid-career",
    answered: (d) => paArr(d, "mc_flow_work").length > 0,
    render: (d, u) => (
      <ChipGroup
        options={[
          "Building & making things",
          "Solving hard problems",
          "Coaching & developing people",
          "Organizing & planning",
          "Persuading & selling",
          "Creating & designing",
        ]}
        values={paArr(d, "mc_flow_work")}
        onChange={setPa(u, d, "mc_flow_work")}
      />
    ),
  },
  {
    id: "mc_flexibility",
    title: "How important is flexibility (remote, hours) to your next move?",
    showIf: (d) => d.careerStage === "mid-career",
    answered: (d) => !!paStr(d, "mc_flexibility"),
    render: (d, u, adv) => (
      <ChipGroup
        options={["Essential — non-negotiable", "Important", "Nice to have", "Not a factor"]}
        single
        values={paStr(d, "mc_flexibility") ? [paStr(d, "mc_flexibility")] : []}
        onChange={(v) => {
          setPa(u, d, "mc_flexibility")(v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
];

const SENIOR_QUESTIONS: PrefQuestion[] = [
  {
    id: "sc_driver",
    title: "What's driving you more right now — influence or income?",
    showIf: (d) => d.careerStage === "senior-career",
    answered: (d) => !!paStr(d, "sc_driver"),
    render: (d, u, adv) => (
      <ChipGroup
        options={["Influence", "Income", "Both equally"]}
        single
        allowOther
        values={paStr(d, "sc_driver") ? [paStr(d, "sc_driver")] : []}
        onChange={(v) => {
          setPa(u, d, "sc_driver")(v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
  {
    id: "sc_identity",
    title: "Do you see yourself as a builder, a fixer, or a strategist?",
    showIf: (d) => d.careerStage === "senior-career",
    answered: (d) => !!paStr(d, "sc_identity"),
    render: (d, u, adv) => (
      <ChipGroup
        options={["Builder", "Fixer", "Strategist"]}
        single
        values={paStr(d, "sc_identity") ? [paStr(d, "sc_identity")] : []}
        onChange={(v) => {
          setPa(u, d, "sc_identity")(v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
  {
    id: "sc_legacy_skills",
    title: "What's the one skill you wish the next generation would learn from you?",
    subtitle: "Stack as many as feel true.",
    showIf: (d) => d.careerStage === "senior-career",
    answered: (d) => paArr(d, "sc_legacy_skills").length > 0,
    render: (d, u) => (
      <ChipGroup
        options={[
          "Leadership under pressure",
          "Deep technical craft",
          "Communication & storytelling",
          "Judgment & decision-making",
          "Mentoring & coaching",
          "Resilience & patience",
        ]}
        allowOther
        values={paArr(d, "sc_legacy_skills")}
        onChange={setPa(u, d, "sc_legacy_skills")}
      />
    ),
  },
  {
    id: "sc_fulfilling",
    title: "What does a fulfilling career look like to you today?",
    subtitle: "Pick any that resonate.",
    showIf: (d) => d.careerStage === "senior-career",
    answered: (d) => paArr(d, "sc_fulfilling").length > 0,
    render: (d, u) => (
      <ChipGroup
        options={[
          "💰 Financial Maximization — compensation, equity, wealth building",
          "🧭 Strategic Influence — driving high-level decisions, business scale",
          "🤝 Mentorship & Legacy — developing teams, helping others grow",
          "🧠 Intellectual Challenge — solving complex problems, innovation",
          "🏡 Autonomy & Balance — flexibility, remote work, protecting personal time",
        ]}
        values={paArr(d, "sc_fulfilling")}
        onChange={setPa(u, d, "sc_fulfilling")}
      />
    ),
  },
  {
    id: "sc_scope",
    title: "Are you looking to deepen your domain or broaden your leadership scope?",
    showIf: (d) => d.careerStage === "senior-career",
    answered: (d) => !!paStr(d, "sc_scope"),
    render: (d, u, adv) => (
      <ChipGroup
        options={["Deepen my domain", "Broaden my leadership scope", "Both"]}
        single
        allowOther
        values={paStr(d, "sc_scope") ? [paStr(d, "sc_scope")] : []}
        onChange={(v) => {
          setPa(u, d, "sc_scope")(v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
];

const EXECUTIVE_QUESTIONS: PrefQuestion[] = [
  {
    id: "ex_energy",
    title: "What drives your professional energy today?",
    subtitle: "Pick any that fit.",
    showIf: (d) => d.careerStage === "executive",
    answered: (d) => paArr(d, "ex_energy").length > 0,
    render: (d, u) => (
      <ChipGroup
        options={[
          "🚀 Vision & Macro Strategy — setting long-term direction, charting the future",
          "🌱 Leadership & Culture — developing the next tier of executives, mentoring",
          "📈 Hyper-Scale & Growth — M&A, geographic expansion, unlocking massive revenue",
          "🔧 Turnarounds & Crisis — fixing broken operations, navigating structural change",
          "💡 Product Innovation — staying connected to the core craft, inventing new tech",
        ]}
        allowOther
        values={paArr(d, "ex_energy")}
        onChange={setPa(u, d, "ex_energy")}
      />
    ),
  },
  {
    id: "ex_industry_change",
    title: "What is the primary long-term change you are trying to drive in your industry?",
    showIf: (d) => d.careerStage === "executive",
    answered: (d) => !!paStr(d, "ex_industry_change"),
    render: (d, u) => (
      <PhaseTextInput id="ex_industry_change" draft={d} update={u} placeholder="e.g. Making sustainable logistics the industry default" />
    ),
  },
  {
    id: "ex_hands_on",
    title: "How hands-on do you still want to be in day-to-day decisions?",
    subtitle: "1 = advise from the sidelines · 10 = act in the trenches.",
    showIf: (d) => d.careerStage === "executive",
    answered: () => true,
    render: (d, u) => (
      <Slider
        id="f-ex_hands_on"
        label="Hands-on level"
        value={paNum(d, "ex_hands_on", 5)}
        onChange={setPa(u, d, "ex_hands_on")}
        min={1}
        max={10}
        unit=""
      />
    ),
  },
  {
    id: "ex_non_negotiable",
    title: "Beyond financial rewards, what's your ultimate non-negotiable for an opportunity?",
    showIf: (d) => d.careerStage === "executive",
    answered: (d) => !!paStr(d, "ex_non_negotiable"),
    render: (d, u, adv) => (
      <ChipGroup
        options={[
          "⚖️ Absolute Strategic Autonomy — full decision-making ownership, explicit board backing",
          "🎯 Clear Corporate Mandate — a specific, high-leverage mission: turnaround, hyper-scale, IPO",
          "🤝 High-Alignment Governance — strong chemistry with the board, founders, or CEO",
          "⚡ Low-Bureaucracy Executive Culture — elite, high-caliber peers, rapid execution",
          "🌍 Systemic Industry Impact — massive resource availability, industry-shifting market scale",
        ]}
        single
        values={paStr(d, "ex_non_negotiable") ? [paStr(d, "ex_non_negotiable")] : []}
        onChange={(v) => {
          setPa(u, d, "ex_non_negotiable")(v[0] ?? "");
          if (v[0]) auto(adv);
        }}
      />
    ),
  },
];

const PHASE_PREF_QUESTIONS: PrefQuestion[] = [
  ...MID_CAREER_QUESTIONS,
  ...SENIOR_QUESTIONS,
  ...EXECUTIVE_QUESTIONS,
];

// ── Personal details questions (section 0) ─────────────────────
const PERSONAL_QUESTIONS: WizardQuestion[] = [
  {
    id: "fullName", section: 0, title: "What's your full name?",
    subtitle: "Employers see this on your profile.", required: true,
    answered: (d) => d.fullName.trim().length > 0,
    render: (d, u) => (
      <TextField id="f-fullName" label="Full name" value={d.fullName} onChange={(v) => u("fullName", v)} placeholder="Your name" autoFilled={d.autoFilled.fullName} />
    ),
  },
  {
    id: "nickname", section: 0, title: "What should we call you?",
    subtitle: "Your dashboard greeting — optional.",
    answered: (d) => d.nickname.trim().length > 0,
    render: (d, u) => (
      <TextField id="f-nickname" label="Nickname" optional value={d.nickname} onChange={(v) => u("nickname", v)} placeholder="e.g. Alex" />
    ),
  },
  {
    id: "email", section: 0, title: "What's your email?",
    subtitle: "So employers can reach you.", required: true,
    answered: (d) => /\S+@\S+\.\S+/.test(d.email),
    render: (d, u) => (
      <TextField id="f-email" label="Email" type="email" value={d.email} onChange={(v) => u("email", v)} placeholder="you@example.com" autoFilled={d.autoFilled.email} />
    ),
  },
  {
    id: "phone", section: 0, title: "A phone number?", subtitle: "Optional.",
    answered: (d) => d.phone.trim().length > 0,
    render: (d, u) => (
      <TextField id="f-phone" label="Phone" type="tel" optional value={d.phone} onChange={(v) => u("phone", v)} placeholder="+60 12 345 6789" autoFilled={d.autoFilled.phone} />
    ),
  },
  {
    id: "location", section: 0, title: "Where are you based?",
    subtitle: "For nearby and remote matches.", required: true,
    answered: (d) => d.location.trim().length > 0,
    render: (d, u) => (
      <TextField id="f-location" label="Location" value={d.location} onChange={(v) => u("location", v)} placeholder="City, Country" autoFilled={d.autoFilled.location} />
    ),
  },
  {
    id: "currentTitle", section: 0, title: "Your current title?", subtitle: "Optional.",
    answered: (d) => d.currentTitle.trim().length > 0,
    render: (d, u) => (
      <TextField id="f-currentTitle" label="Current title" optional value={d.currentTitle} onChange={(v) => u("currentTitle", v)} placeholder="e.g. Line cook · Junior developer" />
    ),
  },
  {
    id: "careerStage", section: 0, title: "Where are you right now?",
    subtitle: "It shapes everything we suggest.", required: true,
    answered: (d) => d.careerStage.length > 0,
    render: (d, u, adv) => (
      <SelectCard
        options={STAGES.map((s) => ({ id: s.id, label: s.label, hint: s.hint, icon: s.icon }))}
        value={d.careerStage}
        onChange={(id) => {
          u("careerStage", id);
          u("careerStageMeaning", STAGES.find((s) => s.id === id)?.hint ?? "");
          if (id) auto(adv);
        }}
      />
    ),
  },
  {
    id: "fieldOfStudy", section: 0, title: "What are you studying?", subtitle: "Optional.",
    showIf: (d) => d.careerStage === "student",
    answered: (d) => d.fieldOfStudy.trim().length > 0,
    render: (d, u) => (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="f-fieldOfStudy" label="Field of study" optional value={d.fieldOfStudy} onChange={(v) => u("fieldOfStudy", v)} placeholder="e.g. Computer Science" />
        <TextField id="f-expectedGraduation" label="Expected finish" optional value={d.expectedGraduation} onChange={(v) => u("expectedGraduation", v)} placeholder="e.g. 2027" />
      </div>
    ),
  },
  {
    id: "focus", section: 0, title: "What's your current focus?", subtitle: "Optional.",
    answered: (d) => !!d.focus,
    render: (d, u, adv) => (
      <SelectCard options={FOCUS} value={d.focus} onChange={(id) => { u("focus", id); if (id) auto(adv); }} />
    ),
  },
  {
    id: "industries", section: 0, title: "Which industries interest you?",
    subtitle: "Optional — pick up to 3.",
    answered: (d) => d.industries.length > 0,
    render: (d, u) => (
      <ChipGroup
        options={INDUSTRIES}
        values={d.industries}
        onChange={(v) => u("industries", v)}
        max={3}
        allowOther
      />
    ),
  },
  {
    id: "familyStatus", section: 0, title: "Family status?",
    subtitle: "Optional & private — never used to match you.",
    answered: (d) => !!d.familyStatus,
    render: (d, u, adv) => (
      <ChipGroup options={FAMILY_STATUS} single allowOther values={d.familyStatus ? [d.familyStatus] : []} onChange={(v) => { u("familyStatus", v[0] ?? ""); if (v[0]) auto(adv); }} />
    ),
  },
  {
    id: "gender", section: 0, title: "Gender?",
    subtitle: "Optional & private — never used to match you.",
    answered: (d) => !!d.gender,
    render: (d, u, adv) => (
      <ChipGroup options={GENDER} single values={d.gender ? [d.gender] : []} onChange={(v) => { u("gender", v[0] ?? ""); if (v[0]) auto(adv); }} />
    ),
  },
  {
    id: "goal", section: 0, title: "What's the goal?", subtitle: "Optional.",
    answered: (d) => d.goal.trim().length > 0,
    render: (d, u) => (
      <>
        <ChipGroup options={GOAL_CHIPS} values={d.goal && GOAL_CHIPS.includes(d.goal) ? [d.goal] : []} onChange={(v) => u("goal", v[0] ?? "")} single />
        <input
          id="f-goal"
          type="text"
          value={GOAL_CHIPS.includes(d.goal) ? "" : d.goal}
          onChange={(e) => u("goal", e.target.value)}
          placeholder="…or say it in your own words"
          className="bg-foreground/2 border-border/15 focus-visible:border-luminous/60 focus-visible:ring-luminous/40 mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
        />
      </>
    ),
  },
];

// ── Work experience questions (section 1) — repeaters are one question ──
const WORK_QUESTIONS: WizardQuestion[] = [
  {
    id: "experiences", section: 1, title: "Any experience to add?",
    subtitle: "Part-time, freelance, internships, volunteering, side hustles, projects — everything counts.",
    answered: (d) => d.experiences.length > 0,
    render: (d, u) => <ExperienceRepeater draft={d} update={u} />,
  },
  {
    id: "education", section: 1, title: "Your education?", subtitle: "Optional.",
    answered: (d) => d.education.length > 0,
    render: (d, u) => <EducationRepeater draft={d} update={u} />,
  },
  {
    id: "skills", section: 1, title: "What skills do you have?",
    subtitle: "Any skill counts — welding, React, beatboxing.",
    answered: (d) => d.skills.length > 0,
    render: (d, u) => (
      <TagInput id="f-skills" values={d.skills} onChange={(v) => u("skills", v)} placeholder="Add a skill and press Enter" autoFilled={d.autoFilled.skills} />
    ),
  },
  {
    id: "certifications", section: 1, title: "Any certifications?", subtitle: "Optional.",
    answered: (d) => d.certifications.length > 0,
    render: (d, u) => (
      <TagInput id="f-certifications" values={d.certifications} onChange={(v) => u("certifications", v)} placeholder="e.g. Food Handler License" />
    ),
  },
  {
    id: "languages", section: 1, title: "Languages you speak?", subtitle: "Optional.",
    answered: (d) => d.languages.length > 0,
    render: (d, u) => (
      <TagInput id="f-languages" values={d.languages} onChange={(v) => u("languages", v)} placeholder="e.g. English, Malay" />
    ),
  },
];

/** The whole onboarding as one ordered question list (mentor wireframe).
 *  Phase-specific sets come after the generic preferences; showIf gates
 *  mean a mid-career+ user sees their set INSTEAD of the generic tail. */
const WIZARD_QUESTIONS: WizardQuestion[] = [
  ...PERSONAL_QUESTIONS,
  ...WORK_QUESTIONS,
  ...PREF_QUESTIONS.map((q): WizardQuestion => ({ ...q, section: 2 })),
  ...PHASE_PREF_QUESTIONS.map((q): WizardQuestion => ({ ...q, section: 2 })),
];

const QUESTION_BY_ID = new Map(WIZARD_QUESTIONS.map((q) => [q.id, q]));

/** Edit-mode overview (Task 1): the whole profile as a table; Edit expands
 *  the owning question's input INLINE under the row — never back into the
 *  sequential wizard. Single-select chips auto-collapse the row on pick. */
function EditOverview({
  draft,
  update,
  errors,
  editingId,
  onToggleEdit,
}: {
  draft: Draft;
  update: UpdateFn;
  errors: Record<string, string>;
  editingId: string | null;
  onToggleEdit: (id: string | null) => void;
}) {
  const d = draft;
  return (
    <div className="flex flex-col gap-5">
      {REVIEW_GROUPS.map((g) => {
        const rows = g.rows.filter((r) => !r.showIf || r.showIf(d));
        if (rows.length === 0) return null;
        return (
          <div key={g.title}>
            <p className="text-luminous text-[0.6875rem] font-mono font-semibold uppercase tracking-[0.18em]">
              {g.title}
            </p>
            <div className="border-border/15 divide-border/30 mt-2 divide-y rounded-xl border">
              {rows.map((r) => {
                const q = QUESTION_BY_ID.get(r.id);
                const isEditing = editingId === r.id;
                const value = r.value(d);
                const filled = value.trim().length > 0;
                return (
                  <div key={r.id}>
                    <div className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="text-muted-foreground w-32 shrink-0 text-xs">{r.label}</span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          !filled && "text-muted-foreground/60 italic",
                        )}
                      >
                        {filled ? value : "Not set"}
                      </span>
                      {q && (
                        <button
                          type="button"
                          onClick={() => onToggleEdit(isEditing ? null : r.id)}
                          className="text-luminous shrink-0 text-xs font-medium hover:underline"
                        >
                          {isEditing ? "Close" : "Edit"}
                        </button>
                      )}
                    </div>
                    {errors[r.id] && (
                      <p className="text-destructive px-3 pb-2 text-xs">{errors[r.id]}</p>
                    )}
                    {isEditing && q && (
                      <div className="bg-foreground/2 border-border/15 border-t px-3 py-3">
                        <p className="text-sm font-medium">{q.title}</p>
                        {q.subtitle && (
                          <p className="text-muted-foreground mt-0.5 text-xs">{q.subtitle}</p>
                        )}
                        <div className="mt-2">
                          {q.render(d, update, () => onToggleEdit(null))}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button size="xs" variant="outline" onClick={() => onToggleEdit(null)}>
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Repeater question bodies — reuse the existing add-forms. */
function ExperienceRepeater({ draft, update }: { draft: Draft; update: UpdateFn }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      {draft.experiences.map((e) => (
        <div key={e.id} className="border-border/15 bg-foreground/2 rounded-xl border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {e.title}
                {e.company && <span className="text-muted-foreground"> · {e.company}</span>}
              </p>
              <p className="text-muted-foreground text-xs">{periodString(e)}</p>
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
          {draft.experiences.length ? "Add another" : "Add experience"}
        </Button>
      )}
    </div>
  );
}

function EducationRepeater({ draft, update }: { draft: Draft; update: UpdateFn }) {
  return (
    <div className="flex flex-col gap-2">
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
      <EducationForm onSave={(ed) => update("education", [...draft.education, ed])} />
    </div>
  );
}

// ── Review rows (shared by the wizard review AND the edit overview) ──

interface ReviewRowDef {
  /** Matches the owning question's id (drives jump-to / inline edit). */
  id: string;
  label: string;
  value: (d: Draft) => string;
  showIf?: (d: Draft) => boolean;
}

/** "💰 Financial Maximization — …" → "💰 Financial Maximization". */
const shortOpt = (s: string) => s.split(" — ")[0];
const fmtPa = (v: string | string[] | number | undefined): string =>
  Array.isArray(v) ? v.map(shortOpt).join(" · ") : v === undefined ? "" : shortOpt(String(v));

const PHASE_ROW_LABELS: Record<string, string> = {
  mc_challenge: "Biggest challenge",
  mc_change_one: "Change one thing",
  mc_primary_goal: "Primary goal",
  mc_flow_work: "Flow work",
  mc_flexibility: "Flexibility",
  sc_driver: "Driver",
  sc_identity: "Identity",
  sc_legacy_skills: "Legacy skills",
  sc_fulfilling: "Fulfilling career",
  sc_scope: "Deepen vs broaden",
  ex_energy: "Energy source",
  ex_industry_change: "Industry change",
  ex_hands_on: "Hands-on (1–10)",
  ex_non_negotiable: "Non-negotiable",
};

const REVIEW_GROUPS: { title: string; rows: ReviewRowDef[] }[] = [
  {
    title: "Personal details",
    rows: [
      { id: "fullName", label: "Name", value: (d) => d.fullName },
      { id: "nickname", label: "Nickname", value: (d) => d.nickname },
      { id: "email", label: "Email", value: (d) => d.email },
      { id: "phone", label: "Phone", value: (d) => d.phone },
      { id: "location", label: "Location", value: (d) => d.location },
      { id: "currentTitle", label: "Current title", value: (d) => d.currentTitle },
      { id: "familyStatus", label: "Family status", value: (d) => d.familyStatus },
      { id: "gender", label: "Gender", value: (d) => d.gender },
      { id: "careerStage", label: "Stage", value: (d) => STAGES.find((s) => s.id === d.careerStage)?.label ?? "" },
      { id: "focus", label: "Focus", value: (d) => FOCUS.find((f) => f.id === d.focus)?.label ?? "" },
      { id: "industries", label: "Industries", value: (d) => d.industries.join(", ") },
      { id: "fieldOfStudy", label: "Field of study", value: (d) => d.fieldOfStudy, showIf: (d) => d.careerStage === "student" },
      { id: "goal", label: "Goal", value: (d) => d.goal },
    ],
  },
  {
    title: "Work & skills",
    rows: [
      { id: "experiences", label: "Experience", value: (d) => (d.experiences.length ? `${d.experiences.length} entr${d.experiences.length === 1 ? "y" : "ies"}` : "") },
      { id: "education", label: "Education", value: (d) => (d.education.length ? `${d.education.length} entr${d.education.length === 1 ? "y" : "ies"}` : "") },
      { id: "skills", label: "Skills", value: (d) => d.skills.join(", ") },
      { id: "certifications", label: "Certifications", value: (d) => d.certifications.join(", ") },
      { id: "languages", label: "Languages", value: (d) => d.languages.join(", ") },
    ],
  },
  {
    title: "Preferences",
    rows: [
      { id: "targetRoles", label: "Desired roles", value: (d) => d.targetRoles.join(", ") },
      { id: "desiredLocations", label: "Desired locations", value: (d) => d.desiredLocations.join(", ") },
      { id: "openToRelocate", label: "Open to relocate", value: (d) => (d.openToRelocate ? "Yes" : "No") },
      { id: "workArrangement", label: "Work arrangement", value: (d) => d.workArrangement.join(", ") },
      { id: "jobTypes", label: "Job type", value: (d) => d.jobTypes.join(", ") },
      { id: "minSalary", label: "Min salary", value: (d) => (d.minSalaryAmount ? `${d.minSalaryAmount} / ${d.minSalaryPeriod || "yearly"}` : "") },
      { id: "availability", label: "Availability", value: (d) => d.availability },
      { id: "visibility", label: "Profile visibility", value: (d) => (d.visibility === "all_recruiters" ? "All recruiters" : "Hidden until opt-in") },
      { id: "workEnvironment", label: "Best environment", value: (d) => ENVIRONMENTS.find((e) => e.id === d.workEnvironment)?.label ?? "", showIf: (d) => !isPhasedStage(d) },
      { id: "topValues", label: "Top values", value: (d) => d.topValues.join(" · "), showIf: (d) => !isPhasedStage(d) },
      { id: "learningHoursPerWeek", label: "Learning / week", value: (d) => `${d.learningHoursPerWeek} hrs`, showIf: (d) => !isPhasedStage(d) },
      { id: "scheduleFlexibility", label: "Schedule flexibility", value: (d) => d.scheduleFlexibility.join(", "), showIf: (d) => !isPhasedStage(d) },
      { id: "maxCommuteMinutes", label: "Max commute", value: (d) => `${d.maxCommuteMinutes} min`, showIf: (d) => !isPhasedStage(d) },
      { id: "travelWillingness", label: "Travel", value: (d) => d.travelWillingness, showIf: (d) => !isPhasedStage(d) },
    ],
  },
  {
    title: "Your phase",
    rows: PHASE_PREF_QUESTIONS.map((q) => ({
      id: q.id,
      label: PHASE_ROW_LABELS[q.id] ?? q.id,
      value: (d: Draft) => fmtPa(d.phaseAnswers[q.id]),
      showIf: q.showIf,
    })),
  },
];

/** Final review (mentor wireframe): every answer in a neat table with an
 *  Edit next to each line that jumps back to that exact question. */
function WizardReview({
  draft,
  update,
  onEditField,
}: {
  draft: Draft;
  update: UpdateFn;
  onEditField: (id: string) => void;
}) {
  const d = draft;
  const edit = (id: string) => () => onEditField(id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="text-clover size-5" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">That&apos;s everything — here&apos;s your profile</h2>
          <p className="text-muted-foreground text-sm">
            Check it over. Tap Edit on any line to fix it, then Finish.
          </p>
        </div>
      </div>

      {REVIEW_GROUPS.map((g) => {
        const rows = g.rows.filter((r) => !r.showIf || r.showIf(d));
        if (rows.length === 0) return null;
        return (
          <ReviewGroup key={g.title} title={g.title}>
            {rows.map((r) => (
              <ReviewRow key={r.id} label={r.label} value={r.value(d)} onEdit={edit(r.id)} />
            ))}
          </ReviewGroup>
        );
      })}

      <SelfIdSection draft={d} update={update} />

      <p className="text-muted-foreground flex items-center gap-1.5 text-[0.6875rem]">
        <Compass className="size-3.5 shrink-0" aria-hidden />
        Everything autosaves. Press Finish when you&apos;re ready.
      </p>
    </div>
  );
}

/** Optional self-identification — shown ONLY on the review screen (spec:
 *  "after the user is met with the review"). Private by construction: never
 *  projected to employers, never an input to any match/score engine. */
function SelfIdSection({ draft, update }: { draft: Draft; update: UpdateFn }) {
  const [open, setOpen] = useState(
    draft.religion.length > 0 || draft.race.length > 0 || !!draft.age,
  );
  return (
    <div className="border-border/15 rounded-xl border p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="text-sm font-medium">A few optional questions</span>
          <span className="text-muted-foreground block text-[0.6875rem]">
            Helps us understand our community. Skip any — private, never shared with
            employers, never used for matching.
          </span>
        </span>
        <span className="text-luminous shrink-0 text-xs font-medium">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-4">
          <FieldShell id="f-religion" label="Religion" optional>
            <ChipGroup
              options={RELIGION}
              allowOther
              values={draft.religion}
              onChange={(v) => update("religion", v)}
            />
          </FieldShell>
          <FieldShell id="f-race" label="Race" optional>
            <ChipGroup
              options={RACE}
              allowOther
              values={draft.race}
              onChange={(v) => update("race", v)}
            />
          </FieldShell>
          <FieldShell id="f-age" label="Age" optional>
            <input
              id="f-age"
              type="number"
              min={0}
              max={120}
              value={draft.age}
              onChange={(e) => update("age", e.target.value)}
              placeholder="e.g. 28"
              className="bg-foreground/2 border-border/15 w-32 rounded-lg border px-3 py-2 text-sm outline-none"
            />
          </FieldShell>
        </div>
      )}
    </div>
  );
}

function ReviewGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-luminous text-[0.6875rem] font-mono font-semibold uppercase tracking-[0.18em]">{title}</p>
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
