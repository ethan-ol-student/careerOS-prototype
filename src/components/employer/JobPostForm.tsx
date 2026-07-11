"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  SkillMatrixInput,
  MATRIX_MIN,
  type MatrixSkill,
} from "./SkillMatrixInput";
import { cn } from "@/lib/utils";

/**
 * Job posting form, shared by the marketplace Quick Post modal
 * (variant "quick": title, description, requirements, skill matrix)
 * and the full /employers/post-job page (variant "full": adds budget,
 * start date, timeline, team size, location, field). Both submit to
 * POST /api/employer/jobs — the quick variant simply omits the
 * advanced fields.
 */

const inputCls =
  "bg-foreground/2 border-border/15 focus:border-clover min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export function JobPostForm({
  variant,
  onCreated,
}: {
  variant: "quick" | "full";
  onCreated?: () => void;
}) {
  const full = variant === "full";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirementsText, setRequirementsText] = useState("");
  const [skills, setSkills] = useState<MatrixSkill[]>([
    { name: "", weight: 5 },
    { name: "", weight: 5 },
    { name: "", weight: 5 },
  ]);
  // Advanced fields (full page only)
  const [location, setLocation] = useState("");
  const [field, setField] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [startDate, setStartDate] = useState("");
  const [timelineWeeks, setTimelineWeeks] = useState("");
  const [teamSize, setTeamSize] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  const namedSkills = skills.filter((s) => s.name.trim());
  const requirements = requirementsText
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);
  const canSubmit =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    requirements.length > 0 &&
    namedSkills.length >= MATRIX_MIN &&
    !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setPosted(false);
    const optNum = (v: string) => {
      const n = Number(v);
      return v.trim() !== "" && Number.isFinite(n) ? Math.round(n) : undefined;
    };
    const res = await fetch("/api/employer/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        requirements,
        skills: namedSkills,
        ...(full
          ? {
              ...(location.trim() ? { location: location.trim() } : {}),
              ...(field.trim() ? { field: field.trim() } : {}),
              budgetMin: optNum(budgetMin),
              budgetMax: optNum(budgetMax),
              ...(startDate ? { startDate } : {}),
              timelineWeeks: optNum(timelineWeeks),
              teamSize: optNum(teamSize),
            }
          : {}),
      }),
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!json?.ok) {
      setError(json?.error?.message ?? "Could not post the job. Try again.");
      return;
    }
    // Reset for the next post; parent refreshes lists / closes the modal.
    setTitle("");
    setDescription("");
    setRequirementsText("");
    setSkills([
      { name: "", weight: 5 },
      { name: "", weight: 5 },
      { name: "", weight: 5 },
    ]);
    setLocation("");
    setField("");
    setBudgetMin("");
    setBudgetMax("");
    setStartDate("");
    setTimelineWeeks("");
    setTeamSize("");
    setPosted(true);
    onCreated?.();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Job title" htmlFor={`jp-title-${variant}`}>
        <input
          id={`jp-title-${variant}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Robotics Engineer"
          maxLength={80}
          className={inputCls}
        />
      </Field>

      <Field label="Description" htmlFor={`jp-desc-${variant}`}>
        <textarea
          id={`jp-desc-${variant}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What the role is, what the team does, what success looks like…"
          rows={full ? 5 : 3}
          maxLength={4000}
          className={cn(inputCls, "resize-y")}
        />
      </Field>

      <Field
        label="Requirements — one per line"
        htmlFor={`jp-reqs-${variant}`}
      >
        <textarea
          id={`jp-reqs-${variant}`}
          value={requirementsText}
          onChange={(e) => setRequirementsText(e.target.value)}
          placeholder={"3+ years with industrial robots\nComfortable reading electrical schematics"}
          rows={3}
          className={cn(inputCls, "resize-y")}
        />
      </Field>

      <div>
        <p className="mb-2 text-xs font-medium">
          Skill matrix — what matters, and how much
        </p>
        <SkillMatrixInput value={skills} onChange={setSkills} />
      </div>

      {full && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" htmlFor="jp-location">
              <input
                id="jp-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote / Kuala Lumpur…"
                maxLength={80}
                className={inputCls}
              />
            </Field>
            <Field label="Field" htmlFor="jp-field">
              <input
                id="jp-field"
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="e.g. Technology and software"
                maxLength={60}
                className={inputCls}
              />
            </Field>
            <Field label="Budget minimum (RM / year)" htmlFor="jp-budget-min">
              <input
                id="jp-budget-min"
                type="number"
                min={0}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="60000"
                className={inputCls}
              />
            </Field>
            <Field label="Budget maximum (RM / year)" htmlFor="jp-budget-max">
              <input
                id="jp-budget-max"
                type="number"
                min={0}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="120000"
                className={inputCls}
              />
            </Field>
            <Field label="Project start date" htmlFor="jp-start">
              <input
                id="jp-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Estimated timeline (weeks)" htmlFor="jp-timeline">
              <input
                id="jp-timeline"
                type="number"
                min={1}
                max={520}
                value={timelineWeeks}
                onChange={(e) => setTimelineWeeks(e.target.value)}
                placeholder="12"
                className={inputCls}
              />
            </Field>
            <Field label="Team size" htmlFor="jp-team">
              <input
                id="jp-team"
                type="number"
                min={1}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                placeholder="6"
                className={inputCls}
              />
            </Field>
          </div>
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
      {posted && !error && (
        <p className="text-clover text-sm">
          Job posted — it&apos;s live in the candidate feed for 30 days.
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={!canSubmit}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {full ? "Post job" : "Quick post"}
        </Button>
      </div>
    </form>
  );
}
