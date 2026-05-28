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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { cn } from "@/lib/utils";

type Section =
  | "identity"
  | "skills"
  | "experience"
  | "projects"
  | "certificates"
  | "awards";

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "identity", label: "Identity", icon: User },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "certificates", label: "Certificates", icon: GraduationCap },
  { id: "awards", label: "Awards", icon: AwardIcon },
];

export function PortfolioBuilder() {
  const [section, setSection] = useState<Section>("identity");

  return (
    <div className="glass-4 ring-luminous/20 relative flex flex-col overflow-hidden rounded-2xl p-6 ring-1">
      <div
        aria-hidden
        className="from-luminous/15 pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-radial to-transparent"
      />

      <div className="relative mb-5">
        <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
          Portfolio builder
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">
          Compose your CV in real time
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Edit any section — the document on the right updates instantly.
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
              onClick={() => setSection(s.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                active
                  ? "border-luminous bg-luminous/15 text-luminous"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground",
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
        {section === "experience" && <ExperienceForm />}
        {section === "projects" && <ProjectsForm />}
        {section === "certificates" && <CertificatesForm />}
        {section === "awards" && <AwardsForm />}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Section forms
// ───────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-muted-foreground mb-1.5 block text-[11px] font-medium uppercase tracking-wider">
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
        "bg-background/60 border-border focus:border-luminous focus:ring-luminous/30 min-h-11 w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2",
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
        "bg-background/60 border-border focus:border-luminous focus:ring-luminous/30 w-full rounded-md border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2",
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
      <p className="text-muted-foreground border-border/40 rounded-md border border-dashed p-3 text-center text-xs">
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
    <span className="bg-luminous/15 text-luminous border-luminous/40 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">
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
      <div>
        <FieldLabel>{portfolio.skills.length} skills on your CV</FieldLabel>
        {portfolio.skills.length === 0 ? (
          <p className="text-muted-foreground border-border/40 rounded-md border border-dashed p-3 text-center text-xs">
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

function ExperienceForm() {
  const { portfolio, addExperience, removeExperience } = usePortfolio();
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState("");
  const [detail, setDetail] = useState("");
  const reset = () => {
    setRole("");
    setCompany("");
    setPeriod("");
    setDetail("");
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim() || !company.trim()) return;
    addExperience({ role, company, period, detail: detail || undefined });
    reset();
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>Role</FieldLabel>
          <TextInput
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Mechanical Intern"
          />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>Company</FieldLabel>
          <TextInput
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Tesla"
          />
        </div>
        <div className="col-span-12">
          <FieldLabel>Period</FieldLabel>
          <TextInput
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="e.g. Jun 2024 – Aug 2024"
          />
        </div>
        <div className="col-span-12">
          <FieldLabel>What you did</FieldLabel>
          <TextArea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            placeholder="One paragraph: scope, tech, impact."
          />
        </div>
        <div className="col-span-12 flex justify-end">
          <Button
            type="submit"
            size="default"
            disabled={!role.trim() || !company.trim()}
          >
            <Plus />
            Add experience
          </Button>
        </div>
      </form>
      <div>
        <FieldLabel>{portfolio.experiences.length} entries</FieldLabel>
        <ItemList
          empty="No experience entries yet."
          items={portfolio.experiences.map((e) => (
            <li
              key={e.id}
              className="border-border/40 bg-card/40 flex items-start gap-3 rounded-md border p-3"
            >
              <Briefcase className="text-luminous mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {e.role} · {e.company}
                </p>
                <p className="text-muted-foreground text-[11px]">{e.period}</p>
                {e.detail && (
                  <p className="text-foreground/80 mt-1 text-xs leading-snug">
                    {e.detail}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Remove experience"
                onClick={() => removeExperience(e.id)}
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

function ProjectsForm() {
  const { portfolio, addProject, removeProject } = usePortfolio();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addProject({ title, description, link: link || undefined });
    setTitle("");
    setDescription("");
    setLink("");
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>Title</FieldLabel>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hexapod balance controller"
          />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <FieldLabel>Link (optional)</FieldLabel>
          <TextInput
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="col-span-12">
          <FieldLabel>What it is</FieldLabel>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="One sentence on outcome and your role."
          />
        </div>
        <div className="col-span-12 flex justify-end">
          <Button type="submit" size="default" disabled={!title.trim()}>
            <Plus />
            Add project
          </Button>
        </div>
      </form>
      <div>
        <FieldLabel>{portfolio.projects.length} projects</FieldLabel>
        <ItemList
          empty="No projects yet."
          items={portfolio.projects.map((p) => (
            <li
              key={p.id}
              className="border-border/40 bg-card/40 flex items-start gap-3 rounded-md border p-3"
            >
              <FolderGit2 className="text-luminous mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.title}</p>
                {p.description && (
                  <p className="text-foreground/80 text-xs leading-snug">
                    {p.description}
                  </p>
                )}
                {p.link && (
                  <p className="text-luminous mt-0.5 truncate text-[11px]">
                    {p.link}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Remove project"
                onClick={() => removeProject(p.id)}
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

function CertificatesForm() {
  const { portfolio, addCertificate, removeCertificate } = usePortfolio();
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [year, setYear] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !issuer.trim()) return;
    addCertificate({ title, issuer, year });
    setTitle("");
    setIssuer("");
    setYear("");
  };
  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-7">
          <FieldLabel>Title</FieldLabel>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. SolidWorks Professional"
          />
        </div>
        <div className="col-span-12 sm:col-span-5">
          <FieldLabel>Year</FieldLabel>
          <TextInput
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2025"
          />
        </div>
        <div className="col-span-12">
          <FieldLabel>Issuer</FieldLabel>
          <TextInput
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="e.g. Dassault Systèmes"
          />
        </div>
        <div className="col-span-12 flex justify-end">
          <Button
            type="submit"
            size="default"
            disabled={!title.trim() || !issuer.trim()}
          >
            <Plus />
            Add certificate
          </Button>
        </div>
      </form>
      <div>
        <FieldLabel>{portfolio.certificates.length} certificates</FieldLabel>
        <ItemList
          empty="No certificates yet."
          items={portfolio.certificates.map((c) => (
            <li
              key={c.id}
              className="border-border/40 bg-card/40 flex items-start gap-3 rounded-md border p-3"
            >
              <GraduationCap className="text-luminous mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-muted-foreground text-[11px]">
                  {c.issuer}
                  {c.year ? ` · ${c.year}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove certificate"
                onClick={() => removeCertificate(c.id)}
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

function AwardsForm() {
  const { portfolio, addAward, removeAward } = usePortfolio();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addAward({ title, year, description: description || undefined });
    setTitle("");
    setYear("");
    setDescription("");
  };
  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-8">
          <FieldLabel>Title</FieldLabel>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Dean's List, Hackathon Winner"
          />
        </div>
        <div className="col-span-12 sm:col-span-4">
          <FieldLabel>Year</FieldLabel>
          <TextInput
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
          />
        </div>
        <div className="col-span-12">
          <FieldLabel>Description (optional)</FieldLabel>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What it was for, in one short line."
          />
        </div>
        <div className="col-span-12 flex justify-end">
          <Button type="submit" size="default" disabled={!title.trim()}>
            <Plus />
            Add award
          </Button>
        </div>
      </form>
      <div>
        <FieldLabel>{portfolio.awards.length} awards</FieldLabel>
        <ItemList
          empty="No awards yet."
          items={portfolio.awards.map((a) => (
            <li
              key={a.id}
              className="border-border/40 bg-card/40 flex items-start gap-3 rounded-md border p-3"
            >
              <AwardIcon className="text-luminous mt-0.5 size-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {a.title}
                  {a.year ? ` · ${a.year}` : ""}
                </p>
                {a.description && (
                  <p className="text-foreground/80 text-xs leading-snug">
                    {a.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Remove award"
                onClick={() => removeAward(a.id)}
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
