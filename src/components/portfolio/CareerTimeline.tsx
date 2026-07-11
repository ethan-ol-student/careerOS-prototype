"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Briefcase,
  Check,
  ChevronDown,
  FolderGit2,
  Link2,
  Pencil,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { TIER_LABEL, type TrustTier } from "@/lib/intelligence/skillTruthEngine";
import { cn } from "@/lib/utils";

/**
 * Timeline / Living Portfolio (Phase 2) — a scrollable, chronological
 * career timeline derived entirely from data the candidate already owns:
 * experiences → roles, certificates → certifications, projects → projects,
 * validated skill claims → skill level-ups. Nothing is stored twice; the
 * only persisted state is the heading prefix + per-entry display flags
 * (major / AI-assisted / evidence reference) via /api/me/timeline.
 * Self-contained and reusable — drop it on any candidate page.
 */

type EntryType = "role" | "certification" | "project" | "skill";

interface EntryMeta {
  major?: boolean;
  ai?: boolean;
  evidence?: string;
}

interface TimelineEntry {
  key: string;
  type: EntryType;
  title: string;
  subtitle: string;
  /** Human date/date-range label (may be empty for undated projects). */
  dateLabel: string;
  /** Sort year — null sorts to the end (treated as "recent"). */
  year: number | null;
  /** Longer text revealed on expand (role detail, project description…). */
  detail: string;
  /** Evidence that already lives on the source row (project link, tier-2
   *  skill evidence) — shown alongside the timeline's own reference. */
  builtInEvidence: string;
}

const TYPE_META: Record<
  EntryType,
  { icon: typeof Briefcase; label: string }
> = {
  role: { icon: Briefcase, label: "Role" },
  certification: { icon: Award, label: "Certification" },
  project: { icon: FolderGit2, label: "Project" },
  skill: { icon: TrendingUp, label: "Skill level-up" },
};

interface SkillClaimRow {
  id: string;
  name: string;
  level: number;
  tier: TrustTier;
  evidence: string;
  updatedAt: string;
}

const yearOf = (s: string): number | null => {
  const m = s.match(/\d{4}/);
  return m ? Number(m[0]) : null;
};

const isUrl = (s: string) => /^https?:\/\//i.test(s.trim());

function EvidenceValue({ value }: { value: string }) {
  return isUrl(value) ? (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="text-luminous break-all underline underline-offset-2"
    >
      {value}
    </a>
  ) : (
    <span className="break-words">{value}</span>
  );
}

export function CareerTimeline({ className }: { className?: string }) {
  const { portfolio } = usePortfolio();
  const [claims, setClaims] = useState<SkillClaimRow[]>([]);
  const [prefix, setPrefix] = useState("My Journey");
  const [meta, setMeta] = useState<Record<string, EntryMeta>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [editingPrefix, setEditingPrefix] = useState(false);
  const [prefixDraft, setPrefixDraft] = useState("");
  const [evidenceDraft, setEvidenceDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [t, s] = await Promise.all([
        fetch("/api/me/timeline", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/me/skills", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);
      if (cancelled) return;
      if (t?.ok) {
        setPrefix(t.data.prefix);
        setMeta(t.data.meta);
      }
      if (s?.ok) setClaims(s.data.claims);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo<TimelineEntry[]>(() => {
    const list: TimelineEntry[] = [
      ...portfolio.experiences.map((e) => ({
        key: `exp:${e.id}`,
        type: "role" as const,
        title: e.role,
        subtitle: e.company,
        dateLabel: e.period,
        year: yearOf(e.period),
        detail: e.detail ?? "",
        builtInEvidence: "",
      })),
      ...portfolio.certificates.map((c) => ({
        key: `cert:${c.id}`,
        type: "certification" as const,
        title: c.title,
        subtitle: c.issuer,
        dateLabel: c.year,
        year: yearOf(c.year),
        detail: "",
        builtInEvidence: "",
      })),
      ...portfolio.projects.map((p) => ({
        key: `proj:${p.id}`,
        type: "project" as const,
        title: p.title,
        subtitle: "",
        dateLabel: "",
        year: null,
        detail: p.description,
        builtInEvidence: p.link ?? "",
      })),
      // Skill level-ups = claims that EARNED a higher trust tier (2/3) —
      // tier-1 self-claims stay on the shelf, not the timeline.
      ...claims
        .filter((c) => c.tier >= 2)
        .map((c) => ({
          key: `skill:${c.id}`,
          type: "skill" as const,
          title: c.name,
          subtitle: `${TIER_LABEL[c.tier]} · level ${c.level}/5`,
          dateLabel: String(new Date(c.updatedAt).getFullYear()),
          year: new Date(c.updatedAt).getFullYear(),
          detail: "",
          builtInEvidence: c.evidence,
        })),
    ];
    // Oldest → newest; undated entries read as "recent" and sort last.
    return list.sort(
      (a, b) =>
        (a.year ?? Infinity) - (b.year ?? Infinity) ||
        a.title.localeCompare(b.title),
    );
  }, [portfolio, claims]);

  // Writes are serialized: the PATCH stores the whole meta JSON, so two
  // in-flight requests would be last-write-wins and drop a flag.
  const writeQueue = useRef(Promise.resolve());

  function patchTimeline(body: object) {
    writeQueue.current = writeQueue.current.then(async () => {
      setError(null);
      const res = await fetch("/api/me/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!json?.ok) {
        setError(json?.error?.message ?? "Could not save.");
        return;
      }
      setPrefix(json.data.prefix);
      setMeta(json.data.meta);
    });
    return writeQueue.current;
  }

  const toggleFlag = (key: string, flag: "major" | "ai") => {
    const next = !meta[key]?.[flag];
    // Optimistic — the queued PATCH response reconciles authoritatively.
    setMeta((m) => ({ ...m, [key]: { ...m[key], [flag]: next } }));
    void patchTimeline({ entry: { key, [flag]: next } });
  };

  function toggleOpen(entry: TimelineEntry) {
    const next = openKey === entry.key ? null : entry.key;
    setOpenKey(next);
    setEvidenceDraft(next ? (meta[entry.key]?.evidence ?? "") : "");
  }

  return (
    <section className={cn("glass-3 rounded-2xl p-6", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {editingPrefix ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (prefixDraft.trim()) void patchTimeline({ prefix: prefixDraft });
              setEditingPrefix(false);
            }}
          >
            <input
              autoFocus
              value={prefixDraft}
              onChange={(e) => setPrefixDraft(e.target.value)}
              maxLength={40}
              aria-label="Timeline heading"
              className="bg-foreground/2 border-border/15 focus:border-luminous/60 min-h-9 rounded-lg border px-2.5 py-1 text-sm font-semibold outline-none"
            />
            <Button type="submit" size="sm" variant="outline">
              <Check className="size-3.5" />
            </Button>
          </form>
        ) : (
          <h2 className="flex items-center gap-2 font-semibold">
            {prefix}
            <button
              type="button"
              aria-label="Rename timeline heading"
              onClick={() => {
                setPrefixDraft(prefix);
                setEditingPrefix(true);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
          </h2>
        )}
        <p className="text-muted-foreground text-xs">
          {entries.length} milestone{entries.length === 1 ? "" : "s"} · oldest
          first
        </p>
      </div>
      {error && <p className="text-destructive mt-2 text-xs">{error}</p>}

      {entries.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Your timeline builds itself from the portfolio — add an experience,
          certificate, or project above and it appears here.
        </p>
      ) : (
        <ol className="border-border/15 relative ml-2 mt-5 space-y-3 border-l pl-6">
          {entries.map((entry) => {
            const m = meta[entry.key] ?? {};
            const Icon = TYPE_META[entry.type].icon;
            const open = openKey === entry.key;
            const evidence = m.evidence?.trim() || entry.builtInEvidence;
            return (
              <li key={entry.key} className="relative">
                {/* Marker — major events get the bigger luminous dot */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3 rounded-full",
                    m.major
                      ? "bg-luminous ring-luminous/30 -left-[31px] size-2.5 ring-4"
                      : "bg-muted-foreground/60 -left-[28.5px] size-1.5",
                  )}
                />
                <div
                  className={cn(
                    "rounded-xl border transition-colors",
                    m.major
                      ? "border-luminous/40 bg-luminous/5"
                      : "border-border/15 bg-foreground/2",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleOpen(entry)}
                    aria-expanded={open}
                    className="flex min-h-11 w-full items-center gap-2.5 px-3 py-2 text-left"
                  >
                    <Icon
                      className="text-muted-foreground size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-medium capitalize">{entry.title}</span>
                      {entry.subtitle && (
                        <span className="text-muted-foreground"> · {entry.subtitle}</span>
                      )}
                    </span>
                    {m.major && (
                      <Chip tone="luminous" icon={<Star className="size-3" />}>
                        Major
                      </Chip>
                    )}
                    {m.ai && (
                      <Chip tone="neutral" icon={<Sparkles className="size-3" />}>
                        AI used
                      </Chip>
                    )}
                    {evidence && (
                      <Chip tone="warning" icon={<Link2 className="size-3" />}>
                        Evidence
                      </Chip>
                    )}
                    <span className="text-muted-foreground w-20 shrink-0 text-right text-xs tabular-nums">
                      {entry.dateLabel || "Recent"}
                    </span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "text-muted-foreground size-4 shrink-0 transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>

                  {open && (
                    <div className="border-border/15 space-y-3 border-t px-3 py-3">
                      <p className="text-muted-foreground text-xs">
                        {TYPE_META[entry.type].label}
                        {entry.detail && <> — {entry.detail}</>}
                      </p>

                      {evidence && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">Evidence: </span>
                          <EvidenceValue value={evidence} />
                        </p>
                      )}

                      {/* Owner controls — flags + the evidence reference
                          that feeds the Level-2 trust framing. */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          aria-pressed={!!m.major}
                          onClick={() => toggleFlag(entry.key, "major")}
                          className={cn(
                            "inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
                            m.major
                              ? "border-luminous/50 bg-luminous/10 text-luminous-soft"
                              : "border-border/20 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Star className="size-3" />
                          Major event
                        </button>
                        <button
                          type="button"
                          aria-pressed={!!m.ai}
                          onClick={() => toggleFlag(entry.key, "ai")}
                          className={cn(
                            "inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
                            m.ai
                              ? "border-border bg-card/70 text-foreground"
                              : "border-border/20 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <Sparkles className="size-3" />
                          AI assisted
                        </button>
                        <form
                          className="flex min-w-40 flex-1 items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void patchTimeline({
                              entry: { key: entry.key, evidence: evidenceDraft },
                            });
                          }}
                        >
                          <input
                            type="text"
                            value={evidenceDraft}
                            onChange={(e) => setEvidenceDraft(e.target.value)}
                            maxLength={500}
                            placeholder="Evidence link or note…"
                            aria-label="Evidence reference"
                            className="bg-foreground/2 border-border/15 focus:border-luminous/60 min-h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-xs outline-none"
                          />
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
