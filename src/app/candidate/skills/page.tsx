"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Radar, Search } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { Chip } from "@/components/ui/Chip";
import { InfoHint } from "@/components/ui/InfoHint";
import { CategoryRadar } from "@/components/skills/CategoryRadar";
import { MarketValuePanel } from "@/components/market/MarketValuePanel";
import {
  SkillBookshelf,
  type BookshelfClaim,
  type BookshelfJob,
  type ValidationFeedback,
} from "@/components/skills/SkillBookshelf";
import {
  scoreSkillTruth,
  marketValue,
  TIER_LABEL,
  type SkillClaimInput,
  type TrustTier,
} from "@/lib/intelligence/skillTruthEngine";
import { getFutureSelf } from "@/lib/futureSelf";
import {
  fetchRoleCatalog,
  roleToTargetJob,
  savedRoleIdFor,
} from "@/lib/roles/catalog";
import { jobReadiness } from "@/lib/jobs/data";
import { useCandidatesAI } from "@/lib/hooks/useCandidatesAI";
import { cn } from "@/lib/utils";

// Tier colors: 1 = no color, 2 = yellow, 3 = green (matches the shelf).
const TIER_TONE: Record<TrustTier, "clover" | "warning" | "neutral"> = {
  3: "clover",
  2: "warning",
  1: "neutral",
};

/**
 * Skills Truth cockpit (flagship) — ONE viewport, no page scrolling:
 * top-left the trust-weighted radar vs the target role, top-right the
 * role search (dropdown appears on focus, animated) + per-skill breakdown
 * + market value, bottom the skill bookshelf. Scoring runs client-side
 * via the pure skillTruthEngine — same math CI checks.
 */
export default function SkillsPage() {
  const { syncSkills } = usePortfolio();
  const { data: ai } = useCandidatesAI();
  // Early phases compare against their chosen Future Self path; the "vs"
  // line links back into the module for them.
  const earlyPhase = ["student", "young-adult", "early-career"].includes(
    ai?.careerStage ?? "",
  );
  const [claims, setClaims] = useState<BookshelfClaim[] | null>(null);
  const [jobs, setJobs] = useState<BookshelfJob[]>([]);
  const [jobId, setJobId] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [rolesOpen, setRolesOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    const res = await fetch("/api/me/skills", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (json?.ok) {
      const next = json.data.claims as BookshelfClaim[];
      setClaims(next);
      // Keep the (long-lived, root-level) Living Portfolio context in sync so
      // a skill added/removed on the radar reflects there without a reload.
      syncSkills(next.map((c) => c.name));
    } else setError(json?.error?.message ?? "Could not load your skills.");
  }, [syncSkills]);

  useEffect(() => {
    // Deep link (?focus=skill from the dashboard) — read post-mount, same
    // pattern as onboarding's ?edit=1.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    setFocus(new URLSearchParams(window.location.search).get("focus"));
    void loadClaims();
    void (async () => {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (json?.ok) {
        setJobs(json.data.jobs);
        // Default comparison role: the chosen Future Self path when set,
        // otherwise the strongest match.
        const fs = getFutureSelf();
        const preferred =
          (fs && json.data.jobs.find((j: BookshelfJob) => j.id === fs.jobId)) ||
          json.data.jobs[0];
        if (preferred) setJobId(preferred.id);
      }
    })();
  }, [loadClaims]);

  // The candidate's saved role (Current Role for senior/exec, first Desired
  // Role otherwise) joins the rail as a synthetic target and becomes the
  // default comparison — cross-module integration with the role catalog.
  const [roleTarget, setRoleTarget] = useState<BookshelfJob | null>(null);
  useEffect(() => {
    const savedId = ai ? savedRoleIdFor(ai) : null;
    if (!savedId || !claims) return;
    let cancelled = false;
    void fetchRoleCatalog().then((catalog) => {
      if (cancelled) return;
      const role = catalog.find((r) => r.id === savedId);
      if (!role) return;
      const t = roleToTargetJob(role);
      const target: BookshelfJob = {
        ...t,
        match: jobReadiness(t, claims.map((c) => c.name)).pct,
      };
      setRoleTarget(target);
      setJobId((cur) => (cur && cur !== jobs[0]?.id ? cur : target.id));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the saved-role inputs only
  }, [ai?.currentRoleId, ai?.desiredRoleIds?.[0], ai?.careerStage, claims]);

  const railJobs = useMemo(
    () => (roleTarget ? [roleTarget, ...jobs] : jobs),
    [roleTarget, jobs],
  );
  const job = railJobs.find((j) => j.id === jobId) ?? null;
  const truth = useMemo(
    () =>
      job && claims ? scoreSkillTruth(claims as SkillClaimInput[], job) : null,
    [claims, job],
  );
  const mv = useMemo(
    () => (claims ? marketValue(claims as SkillClaimInput[]) : null),
    [claims],
  );

  // Top-3 point deficits vs the selected role (spec 5.3 gap analysis).
  // Pure derivation from the engine's axes — adjust weighting here if a
  // future urgency factor lands.
  const topDeficits = useMemo(
    () =>
      (truth?.axes ?? [])
        .map((a) => ({ skill: a.skill, deficit: a.required - a.you }))
        .filter((g) => g.deficit > 0)
        .sort((a, b) => b.deficit - a.deficit || a.skill.localeCompare(b.skill))
        .slice(0, 3),
    [truth],
  );

  const filteredJobs = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return railJobs;
    return railJobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q),
    );
  }, [railJobs, roleQuery]);

  // ── Bookshelf data handlers (the page owns all fetching) ──

  async function call(method: string, body: object): Promise<boolean> {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me/skills", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!json?.ok) {
      setError(json?.error?.message ?? "Something went wrong.");
      return false;
    }
    await loadClaims();
    return true;
  }

  const onAdd = (name: string, level: number) => call("POST", { name, level });
  const onDelete = (name: string) => call("DELETE", { name });

  async function onValidate(
    name: string,
    patch: { level: number; evidence: string; endorsedBy: string; endorserNote: string },
  ): Promise<ValidationFeedback[] | null> {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/me/skills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...patch }),
    });
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (!json?.ok) {
      setError(json?.error?.message ?? "Something went wrong.");
      return null;
    }
    const ev = json.data.evidenceAssessment;
    const en = json.data.endorsementAssessment;
    const msgs: ValidationFeedback[] = [];
    if (ev)
      msgs.push({
        tone: ev.status === "accepted" ? "clover" : "destructive",
        text: ev.notes,
      });
    if (en)
      msgs.push({
        tone:
          en.status === "active"
            ? "clover"
            : en.status === "flagged"
              ? "muted"
              : "destructive",
        text: en.notes,
      });
    await loadClaims();
    return msgs;
  }

  return (
    <AppShell>
      <main className="max-w-container mx-auto flex h-full w-full flex-col gap-3 px-4 pb-3 pt-3 lg:min-h-0">
        {/* Compact header keeps the whole cockpit in one view */}
        <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Radar className="text-luminous size-5" />
            Your skill radar - compiled
          </h1>
          <InfoHint className="text-muted-foreground hidden text-xs md:block">
            Self-claimed counts half, evidence-backed 80%, endorsed 100% — the
            radar shows your <em>validated</em> strength against a real role.
          </InfoHint>
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>

        {!claims ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-12">
              {/* ── Left: the radar readout ── */}
              <section className="glass-3 flex min-h-0 flex-col overflow-hidden rounded-2xl p-5 lg:col-span-5">
                {claims.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Complete your skill validations to see your radar — add
                    your first skill with the + spine on the shelf below.
                  </p>
                ) : truth && job ? (
                  <>
                    <div className="flex shrink-0 items-baseline justify-between">
                      <h2 className="text-sm font-semibold">Validated strength</h2>
                      <p>
                        <span className="text-luminous text-2xl font-semibold">
                          {truth.score}
                        </span>
                        <span className="text-muted-foreground text-sm">/100</span>
                      </p>
                    </div>
                    <p className="text-muted-foreground shrink-0 text-xs">
                      {earlyPhase ? (
                        <Link
                          href="/candidate/future-self"
                          className="text-luminous-soft hover:text-luminous font-medium transition-colors"
                          title="Change your Future Self path"
                        >
                          vs {job.title} at {job.company} →
                        </Link>
                      ) : (
                        <>vs {job.title} at {job.company}</>
                      )}
                      {mv && (
                        <span title={mv.reason}>
                          {" "}
                          · market signal{" "}
                          <span className="text-clover font-medium">{mv.label}</span>
                        </span>
                      )}
                    </p>
                    <InfoHint className="text-muted-foreground/70 shrink-0 text-[0.6875rem]">
                      The polygon adapts to your skills — flip categories with
                      the arrows below.
                    </InfoHint>
                    {/* The radar owns the rest of the card — centered and
                        viewport-capped so it can never render out of frame.
                        CategoryRadar pages All / Soft / Hard skill matrices
                        (wireframe arrows); scoring stays whole-job. */}
                    <div className="flex min-h-0 flex-1 items-center justify-center px-2">
                      <div className="w-full max-w-[min(80%,52dvh)]">
                        <CategoryRadar claims={claims as SkillClaimInput[]} job={job} />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Pick a target role to see your validated radar.
                  </p>
                )}
              </section>

              {/* ── Right: role search (focus dropdown) + breakdown + market ── */}
              <section className="glass-3 flex min-h-0 flex-col overflow-hidden rounded-2xl p-5 lg:col-span-7">
                {/* Search — the target-roles dropdown only exists while the
                    field has focus; entry/exit are animated. Selection uses
                    onMouseDown so it wins the race against blur. */}
                <div className="relative shrink-0">
                  <input
                    type="search"
                    value={roleQuery}
                    onChange={(e) => {
                      setRoleQuery(e.target.value);
                      setRolesOpen(true);
                    }}
                    onFocus={() => setRolesOpen(true)}
                    onBlur={() => setRolesOpen(false)}
                    placeholder={
                      job
                        ? `Target: ${job.title} · ${job.company} — search to switch…`
                        : "Search target roles or companies…"
                    }
                    role="combobox"
                    aria-label="Search target roles"
                    aria-expanded={rolesOpen}
                    aria-controls="target-roles-listbox"
                    className="bg-foreground/2 border-border/15 focus:border-luminous min-h-10 w-full rounded-lg border py-2 pl-3 pr-9 text-sm outline-none"
                  />
                  <Search
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
                  />
                  <div
                    className={cn(
                      "bg-popover border-border/20 absolute inset-x-0 top-full z-30 mt-1 origin-top rounded-xl border shadow-xl transition-all duration-200",
                      rolesOpen
                        ? "translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none -translate-y-1 scale-[0.99] opacity-0",
                    )}
                  >
                    <ul id="target-roles-listbox" className="max-h-56 overflow-y-auto p-1.5">
                      {filteredJobs.map((j) => (
                        <li key={j.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setJobId(j.id);
                              setRolesOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                              j.id === jobId
                                ? "bg-luminous/10 text-luminous-soft"
                                : "hover:bg-accent",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {j.title}{" "}
                              <span className="text-muted-foreground">
                                · {j.company}
                              </span>
                            </span>
                            <span className="text-clover shrink-0 text-xs font-semibold tabular-nums">
                              {j.match}%
                            </span>
                          </button>
                        </li>
                      ))}
                      {filteredJobs.length === 0 && (
                        <li className="text-muted-foreground px-3 py-2 text-xs">
                          No role matches “{roleQuery}”.
                        </li>
                      )}
                    </ul>
                    <p className="border-border/15 text-muted-foreground border-t px-3 py-1.5 text-[0.6875rem]">
                      {jobs.length} open role{jobs.length === 1 ? "" : "s"} ·{" "}
                      <Link href="/jobs" className="text-luminous hover:underline">
                        Browse all jobs
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Per-required-skill breakdown vs the selected role */}
                {truth && job && (
                  <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
                    <div>
                      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider">
                        Skill breakdown — {job.title}
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {truth.axes
                          .filter((a) => a.required > 0)
                          .map((a) => (
                            <li key={a.skill} className="flex items-center gap-3">
                              <span className="w-28 shrink-0 truncate text-xs font-medium capitalize">
                                {a.skill}
                              </span>
                              <span className="bg-foreground/8 h-1.5 min-w-0 flex-1 overflow-hidden rounded-full">
                                <span
                                  className="bg-luminous block h-full rounded-full transition-[width] duration-700"
                                  style={{ width: `${a.you}%` }}
                                />
                              </span>
                              <span className="text-muted-foreground w-7 shrink-0 text-right text-[0.6875rem]">
                                {a.you}
                              </span>
                              <Chip
                                tone={a.tier ? TIER_TONE[a.tier] : "neutral"}
                                className="w-28 shrink-0 justify-center"
                              >
                                {a.tier ? TIER_LABEL[a.tier] : "Not claimed"}
                              </Chip>
                            </li>
                          ))}
                      </ul>
                    </div>

                    {topDeficits.length > 0 && (
                      <p className="text-sm">
                        <span className="text-muted-foreground text-xs font-mono font-semibold uppercase tracking-wider">
                          Top gaps:{" "}
                        </span>
                        {topDeficits.map((g, i) => (
                          <span key={g.skill}>
                            {i > 0 && <span className="text-muted-foreground"> · </span>}
                            <span className="font-medium capitalize">{g.skill}</span>
                            <span className="text-luminous font-semibold">
                              {" "}
                              −{g.deficit}
                            </span>
                          </span>
                        ))}
                      </p>
                    )}

                    {/* Market value for the selected role (Feature 5.7) */}
                    <div className="border-border/15 min-h-0 border-t pt-8">
                      <MarketValuePanel
                        key={job.field}
                        field={job.field}
                        roleTitle={job.title}
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* ── The bookshelf: every skill is a book ── */}
            <section className="glass-3 shrink-0 rounded-2xl p-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">
                  Your skill shelf
                </h2>
                <p className="text-muted-foreground text-xs">
                  {mv && claims.length > 0 && (
                    <span className="hidden sm:inline" title={mv.reason}>
                      Market signal:{" "}
                      <span className="text-clover font-medium">{mv.label}</span>{" "}
                      · {mv.score}/100 ·{" "}
                    </span>
                  )}
                  <span className="font-mono font-semibold uppercase tracking-wider">
                    Total skills:{" "}
                    <span className="text-luminous text-base">{claims.length}</span>
                    <span className="text-muted-foreground/70"> / 100</span>
                  </span>
                </p>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Height is your claimed level; colour is the trust tier — none =
                self-claimed, yellow = evidence-backed, green = endorsed.
              </p>
              <div className="mt-2">
                <SkillBookshelf
                  claims={claims}
                  jobs={jobs}
                  busy={busy}
                  onAdd={onAdd}
                  onValidate={onValidate}
                  onDelete={onDelete}
                  initialFocus={focus}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}
