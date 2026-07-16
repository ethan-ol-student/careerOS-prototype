"use client";

import { useState } from "react";
import {
  Plus,
  X,
  User,
  FileText,
  Sparkles,
  Award as AwardIcon,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { cn } from "@/lib/utils";

/** Merged sections (mentor spec): Experience absorbs Projects + Problems
 *  solved; Recognition absorbs Certificates + Awards. */
export type Section = "identity" | "skills" | "experience" | "recognition";

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "identity", label: "Identity", icon: User },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "recognition", label: "Recognition", icon: AwardIcon },
];

export function PortfolioBuilder({
  section,
  onSectionChange,
  problemsSolved,
  onSaveProblems,
}: {
  /** Controlled by the page so the completeness checklist can deep-link. */
  section: Section;
  onSectionChange: (s: Section) => void;
  /** Problems-solved list (MidCareerProfile) — lives inside Experience now. */
  problemsSolved: string[];
  onSaveProblems: (next: string[]) => void;
}) {
  return (
    <div
      id="portfolio-builder"
      className="glass-4 ring-luminous/20 relative flex scroll-mt-24 flex-col overflow-hidden rounded-2xl p-6 ring-1"
    >
      <div
        aria-hidden
        className="from-luminous/15 pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-radial to-transparent"
      />

      <div className="relative mb-5">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Portfolio builder
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          Compose your CV in real time
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Edit any section — the preview updates instantly.
        </p>
      </div>

      {/* Tabs */}
      <nav
        aria-label="Portfolio sections"
        className="relative -mx-2 mb-5 flex gap-1 overflow-x-auto px-2"
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSectionChange(s.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                active
                  ? "border-luminous/40 bg-luminous/12 text-luminous-soft"
                  : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {s.label}
            </button>
          );
        })}
      </nav>

      <div className="relative">
        {section === "identity" && <IdentityForm />}
        {section === "skills" && <SkillsForm />}
        {section === "experience" && (
          <ExperienceForm
            problemsSolved={problemsSolved}
            onSaveProblems={onSaveProblems}
          />
        )}
        {section === "recognition" && <RecognitionForm />}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Section forms
// ───────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-muted-foreground mb-1.5 block text-[11px] font-mono font-medium uppercase tracking-wider">
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      {...props}
      className={cn(
        "bg-foreground/2 border-border/15 focus:border-luminous/60 focus:ring-luminous/30 min-h-11 w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2",
        props.className,
      )}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "bg-foreground/2 border-border/15 focus:border-luminous/60 focus:ring-luminous/30 w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2",
        props.className,
      )}
    />
  );
}

function ItemList({
  items,
  empty,
}: {
  items: React.ReactNode[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground border-border/15 rounded-lg border border-dashed p-3 text-center text-xs">
        {empty}
      </p>
    );
  }
  return <ul className="flex flex-col gap-2">{items}</ul>;
}

function Pill({
  children,
  onRemove,
  ariaLabel,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  ariaLabel?: string;
}) {
  return (
    <span className="bg-luminous/10 text-luminous-soft border-luminous/30 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={ariaLabel || "Remove"}
        className="hover:text-foreground -mr-1 ml-1 rounded-full p-0.5 transition-colors"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function IdentityForm() {
  const { portfolio, setHeadline, setSummary } = usePortfolio();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>
          <FileText className="mr-1 inline size-3" /> Headline
        </FieldLabel>
        <TextInput
          value={portfolio.headline}
          maxLength={120}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Mechanical engineer compounding into robotics"
        />
        <p className="text-muted-foreground mt-1 text-[10px]">
          {portfolio.headline.length} / 120
        </p>
      </div>
      <div>
        <FieldLabel>Professional summary</FieldLabel>
        <TextArea
          value={portfolio.summary}
          rows={5}
          maxLength={600}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="2–4 sentences. What do you do, what are you good at, where are you headed?"
        />
        <p className="text-muted-foreground mt-1 text-[10px]">
          {portfolio.summary.length} / 600
        </p>
      </div>
    </div>
  );
}

function SkillsForm() {
  const { portfolio, addSkill, removeSkill } = usePortfolio();
  const [value, setValue] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    addSkill(value.trim());
    setValue("");
  };
  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a skill — e.g. CAD, Storytelling, FEA"
          aria-label="Skill"
        />
        <Button type="submit" disabled={!value.trim()} size="lg">
          <Plus />
          Add
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">
        Skills added here start as self-claimed.{" "}
        <a href="/candidate/skills" className="text-luminous hover:underline">
          Validate them on the Skill Radar
        </a>{" "}
        — evidence and endorsements raise their weight.
      </p>
      <div>
        <FieldLabel>{portfolio.skills.length} skills on your CV</FieldLabel>
        {portfolio.skills.length === 0 ? (
          <p className="text-muted-foreground border-border/15 rounded-lg border border-dashed p-3 text-center text-xs">
            No skills yet — add your first one above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.map((s) => (
              <Pill
                key={s}
                ariaLabel={`Remove ${s}`}
                onRemove={() => removeSkill(s)}
              >
                {s}
              </Pill>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** ONE merged section (mentor spec): a role OR a project/problem, told as a
 *  story — what needed solving, your part, how, the outcome, and the skills
 *  it grew (those auto-land on the Skill Radar as self-claimed). */
function ExperienceForm({
  problemsSolved,
  onSaveProblems,
}: {
  problemsSolved: string[];
  onSaveProblems: (next: string[]) => void;
}) {
  const { portfolio, addExperience, removeExperience, removeProject } =
    usePortfolio();
  const [kind, setKind] = useState<"role" | "project">("role");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState("");
  const [contribution, setContribution] = useState<
    "" | "lead" | "assistant" | "participant"
  >("");
  const [approach, setApproach] = useState("");
  const [impact, setImpact] = useState("");
  const [skillsUsed, setSkillsUsed] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [link, setLink] = useState("");
  const [problemInput, setProblemInput] = useState("");

  const isProject = kind === "project";
  const canSave = role.trim() && (isProject || company.trim());

  const addSkillChip = () => {
    const v = skillInput.trim().slice(0, 40);
    if (v && !skillsUsed.includes(v)) setSkillsUsed((s) => [...s, v]);
    setSkillInput("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    addExperience({
      role,
      company,
      period,
      kind,
      contribution,
      approach,
      impact,
      skillsUsed,
      link: link || undefined,
    });
    setRole(""); setCompany(""); setPeriod(""); setContribution("");
    setApproach(""); setImpact(""); setSkillsUsed([]); setSkillInput("");
    setLink("");
  };

  // Legacy Project rows display merged; deleting one still hits its own API.
  const entries = [
    ...portfolio.experiences.map((e) => ({
      id: e.id,
      icon: e.kind === "project" ? FolderGit2 : Briefcase,
      title: e.kind === "project" ? e.role : `${e.role} · ${e.company}`,
      meta: [
        e.period,
        e.contribution && `as ${e.contribution}`,
      ].filter(Boolean).join(" · "),
      body: [e.detail, e.approach, e.impact].filter(Boolean).join(" — "),
      skills: e.skillsUsed ?? [],
      remove: () => removeExperience(e.id),
    })),
    ...portfolio.projects.map((p) => ({
      id: p.id,
      icon: FolderGit2,
      title: p.title,
      meta: "",
      body: p.description,
      skills: [] as string[],
      remove: () => removeProject(p.id),
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="grid grid-cols-12 gap-3">
        {/* i) role or project/problem? */}
        <div className="col-span-12 flex gap-2">
          {(["role", "project"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs transition-colors",
                kind === k
                  ? "border-luminous/40 bg-luminous/12 text-luminous-soft"
                  : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground",
              )}
            >
              {k === "role" ? <Briefcase className="size-3.5" /> : <FolderGit2 className="size-3.5" />}
              {k === "role" ? "A role I held" : "A project / problem I solved"}
            </button>
          ))}
        </div>
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>
            {isProject ? "What problem needed solving?" : "Role"}
          </FieldLabel>
          <TextInput
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={
              isProject
                ? "e.g. Reduced kitchen waste by 30%"
                : "e.g. Mechanical Intern"
            }
          />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>{isProject ? "Context (optional)" : "Company"}</FieldLabel>
          <TextInput
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={isProject ? "e.g. Family business · Hackathon" : "e.g. Tesla"}
          />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>Period</FieldLabel>
          <TextInput
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="e.g. Jun 2024 – Aug 2024"
          />
        </div>
        {/* ii) lead, assistant or participant? */}
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>Your part</FieldLabel>
          <Select
            aria-label="Your part"
            value={contribution}
            onChange={(e) =>
              setContribution(e.target.value as typeof contribution)
            }
          >
            <option value="">Not specified</option>
            <option value="lead">Lead — I drove it</option>
            <option value="assistant">Assistant — I supported it</option>
            <option value="participant">Participant — I took part</option>
          </Select>
        </div>
        {/* iii) how did you solve it? */}
        <div className="col-span-12">
          <FieldLabel>How did you solve it?</FieldLabel>
          <TextArea
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            rows={2}
            maxLength={600}
            placeholder="The approach in one or two lines."
          />
        </div>
        {/* iv) impact / outcome */}
        <div className="col-span-12">
          <FieldLabel>Impact / outcome</FieldLabel>
          <TextArea
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
            rows={2}
            maxLength={600}
            placeholder="What changed because of your work?"
          />
        </div>
        {/* v) skills strengthened or learned → auto-added to the Skill Radar */}
        <div className="col-span-12">
          <FieldLabel>Skills strengthened or learned</FieldLabel>
          <div className="flex gap-2">
            <TextInput
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkillChip();
                }
              }}
              placeholder="Type a skill and press Enter"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addSkillChip}
              disabled={!skillInput.trim()}
            >
              <Plus />
            </Button>
          </div>
          {skillsUsed.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skillsUsed.map((s) => (
                <Pill
                  key={s}
                  ariaLabel={`Remove ${s}`}
                  onRemove={() => setSkillsUsed((arr) => arr.filter((x) => x !== s))}
                >
                  {s}
                </Pill>
              ))}
            </div>
          )}
          <p className="text-muted-foreground mt-1 text-[10px]">
            These are auto-added to your Skill Radar as self-claimed — validate
            them there to raise their weight.
          </p>
        </div>
        {isProject && (
          <div className="col-span-12">
            <FieldLabel>Link (optional)</FieldLabel>
            <TextInput
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
            />
          </div>
        )}
        <div className="col-span-12 flex justify-end">
          <Button type="submit" size="default" disabled={!canSave}>
            <Plus />
            Add {isProject ? "project" : "experience"}
          </Button>
        </div>
      </form>

      <div>
        <FieldLabel>{entries.length} entries</FieldLabel>
        <ItemList
          empty="No experience entries yet."
          items={entries.map((e) => (
            <li
              key={e.id}
              className="border-border/15 bg-foreground/2 flex items-start gap-3 rounded-lg border p-3"
            >
              <e.icon className="text-luminous mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{e.title}</p>
                {e.meta && (
                  <p className="text-muted-foreground text-[11px]">{e.meta}</p>
                )}
                {e.body && (
                  <p className="text-foreground/80 mt-1 text-xs leading-snug">
                    {e.body}
                  </p>
                )}
                {e.skills.length > 0 && (
                  <p className="text-luminous-soft mt-1 text-[11px]">
                    {e.skills.join(" · ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Remove ${e.title}`}
                onClick={e.remove}
                className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        />
      </div>

      {/* Problems solved (proof of capability) — one-liners, mid-career gold */}
      <div className="border-border/15 border-t pt-4" id="problems-editor">
        <FieldLabel>
          <Lightbulb className="mr-1 inline size-3" /> Problems solved — quick one-liners
        </FieldLabel>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = problemInput.trim().slice(0, 200);
            if (!v || problemsSolved.includes(v)) return;
            onSaveProblems([...problemsSolved, v]);
            setProblemInput("");
          }}
        >
          <TextInput
            value={problemInput}
            onChange={(e) => setProblemInput(e.target.value)}
            placeholder="e.g. Cut onboarding time from 3 weeks to 4 days"
          />
          <Button type="submit" variant="outline" disabled={!problemInput.trim()}>
            <Plus />
          </Button>
        </form>
        {problemsSolved.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {problemsSolved.map((p) => (
              <li
                key={p}
                className="border-border/15 bg-foreground/2 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
              >
                <span className="min-w-0 flex-1">{p}</span>
                <button
                  type="button"
                  aria-label={`Remove "${p}"`}
                  onClick={() => onSaveProblems(problemsSolved.filter((x) => x !== p))}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Certificates + Awards merged (mentor spec): one form, one list. The
 *  "professional accreditation" toggle decides which model the entry
 *  becomes — Certificate (issuer required) when it's a formal accreditation,
 *  Award otherwise. */
function RecognitionForm() {
  const {
    portfolio,
    addCertificate,
    removeCertificate,
    addAward,
    removeAward,
  } = usePortfolio();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [accredited, setAccredited] = useState(false);
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");

  const canSave = title.trim() && (!accredited || issuer.trim());
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    if (accredited) addCertificate({ title, issuer, year });
    else addAward({ title, year, description: description || undefined });
    setTitle(""); setYear(""); setIssuer(""); setDescription("");
  };

  const entries = [
    ...portfolio.certificates.map((c) => ({
      id: c.id,
      icon: GraduationCap,
      title: c.title,
      meta: `${c.issuer}${c.year ? ` · ${c.year}` : ""}`,
      body: "",
      badge: "Accreditation",
      remove: () => removeCertificate(c.id),
    })),
    ...portfolio.awards.map((a) => ({
      id: a.id,
      icon: AwardIcon,
      title: `${a.title}${a.year ? ` · ${a.year}` : ""}`,
      meta: "",
      body: a.description ?? "",
      badge: "",
      remove: () => removeAward(a.id),
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-8">
          <FieldLabel>Title</FieldLabel>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. SolidWorks Professional · Hackathon Winner"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <FieldLabel>Year</FieldLabel>
          <TextInput
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2025"
          />
        </div>
        <div className="col-span-12">
          <label
            htmlFor="recognition-accredited"
            className="flex min-h-11 cursor-pointer items-center justify-between gap-3"
          >
            <span className="text-sm">
              Accreditation from a professional body?
              <span className="text-muted-foreground block text-[11px]">
                On = a formal certificate with an issuer; off = an award or honor.
              </span>
            </span>
            <button
              id="recognition-accredited"
              type="button"
              role="switch"
              aria-checked={accredited}
              onClick={() => setAccredited((v) => !v)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                accredited ? "bg-luminous" : "bg-border",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white transition-all",
                  accredited ? "left-5.5" : "left-0.5",
                )}
              />
            </button>
          </label>
        </div>
        {accredited ? (
          <div className="col-span-12">
            <FieldLabel>Issuing body</FieldLabel>
            <TextInput
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g. Dassault Systèmes"
            />
          </div>
        ) : (
          <div className="col-span-12">
            <FieldLabel>Description (optional)</FieldLabel>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What it was for, in one short line."
            />
          </div>
        )}
        <div className="col-span-12 flex justify-end">
          <Button type="submit" size="default" disabled={!canSave}>
            <Plus />
            Add {accredited ? "certificate" : "award"}
          </Button>
        </div>
      </form>
      <div>
        <FieldLabel>{entries.length} entries</FieldLabel>
        <ItemList
          empty="No certificates or awards yet."
          items={entries.map((e) => (
            <li
              key={e.id}
              className="border-border/15 bg-foreground/2 flex items-start gap-3 rounded-lg border p-3"
            >
              <e.icon className="text-luminous mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {e.title}
                  {e.badge && (
                    <span className="border-luminous/30 bg-luminous/10 text-luminous-soft rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider">
                      {e.badge}
                    </span>
                  )}
                </p>
                {e.meta && (
                  <p className="text-muted-foreground text-[11px]">{e.meta}</p>
                )}
                {e.body && (
                  <p className="text-foreground/80 text-xs leading-snug">{e.body}</p>
                )}
              </div>
              <button
                type="button"
                aria-label={`Remove ${e.title}`}
                onClick={e.remove}
                className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        />
      </div>
    </div>
  );
}
