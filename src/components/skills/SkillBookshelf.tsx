"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarCheck,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  TIER_LABEL,
  TIER_WEIGHT,
  type TrustTier,
} from "@/lib/intelligence/skillTruthEngine";
import { normalizeSkill, type TargetJob } from "@/lib/jobs/data";
import { learningFor } from "@/lib/skills/learning";
import { SKILL_TAXONOMY } from "@/lib/skills/taxonomy";
import { cn } from "@/lib/utils";

export interface BookshelfClaim {
  name: string;
  level: number;
  tier: TrustTier;
  evidence: string;
  endorsedBy: string;
  endorserNote: string;
}

export interface BookshelfJob extends TargetJob {
  match: number;
}

export type ValidationFeedback = {
  tone: "clover" | "muted" | "destructive";
  text: string;
};

const FEEDBACK_TONE: Record<ValidationFeedback["tone"], string> = {
  clover: "text-clover",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
};

/** Book-spine tint by trust tier — tier 1 carries NO color (unvalidated),
 *  tier 2 = yellow (evidence-backed), tier 3 = green (endorsed). */
const SPINE_TONE: Record<TrustTier, string> = {
  3: "bg-clover/20 border-clover/40 hover:border-clover/70",
  2: "bg-yellow-400/15 border-yellow-400/40 hover:border-yellow-400/70",
  1: "bg-card/60 border-border/20 hover:border-muted-foreground/50",
};
const TIER_CHIP_TONE: Record<TrustTier, "clover" | "warning" | "neutral"> = {
  3: "clover",
  2: "warning",
  1: "neutral",
};

export interface SkillBookshelfProps {
  claims: BookshelfClaim[];
  jobs: BookshelfJob[];
  busy: boolean;
  /** Add a skill; resolves true on success. */
  onAdd: (name: string, level: number) => Promise<boolean>;
  /** PATCH level/evidence/endorsement; resolves assessment feedback (null = request failed). */
  onValidate: (
    name: string,
    patch: { level: number; evidence: string; endorsedBy: string; endorserNote: string },
  ) => Promise<ValidationFeedback[] | null>;
  /** Delete a claim; resolves true on success. */
  onDelete: (name: string) => Promise<boolean>;
  /** Skill to focus on mount (deep link): opens its detail, or prefills Add. */
  initialFocus?: string | null;
}

/**
 * The skill bookshelf — every claim is a translucent "book spine" standing
 * on a shelf line: tier sets the tint, claimed level sets the height, and
 * the strip scrolls horizontally when it outgrows its row. Clicking a spine
 * opens the full detail: level/validation management, the roles the skill
 * unlocks, and how to improve it. The "+" spine hosts add + resume import.
 */
export function SkillBookshelf({
  claims,
  jobs,
  busy,
  onAdd,
  onValidate,
  onDelete,
  initialFocus,
}: SkillBookshelfProps) {
  const [open, setOpen] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Detail-modal drafts (seeded from the claim when opened).
  const [level, setLevel] = useState(3);
  const [evidence, setEvidence] = useState("");
  const [endorsedBy, setEndorsedBy] = useState("");
  const [endorserNote, setEndorserNote] = useState("");
  const [feedback, setFeedback] = useState<ValidationFeedback[] | null>(null);

  // Add-modal drafts.
  const [newSkill, setNewSkill] = useState("");
  const [newLevel, setNewLevel] = useState(3);
  const [skillsOpen, setSkillsOpen] = useState(false);

  // Learning-material quick-actions (per open skill, keyed by list index).
  // Client-only simulation — no roadmap/calendar backend exists yet.
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [scheduled, setScheduled] = useState<Map<number, string>>(new Map());
  const [scheduleOpen, setScheduleOpen] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fireToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

  const openSkill = (claim: BookshelfClaim) => {
    setOpen(claim.name);
    setLevel(claim.level);
    setEvidence(claim.evidence);
    setEndorsedBy(claim.endorsedBy);
    setEndorserNote(claim.endorserNote);
    setFeedback(null);
    setAdded(new Set());
    setScheduled(new Map());
    setScheduleOpen(null);
  };

  // Deep-link focus (?focus=skill): open its detail, or prefill Add.
  useEffect(() => {
    if (!initialFocus?.trim()) return;
    const hit = claims.find(
      (c) => c.name.toLowerCase() === initialFocus.trim().toLowerCase(),
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep-link focus on mount
    if (hit) openSkill(hit);
    else {
      setNewSkill(initialFocus.trim());
      setAddOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const active = open ? claims.find((c) => c.name === open) ?? null : null;
  const claimedNames = new Set(claims.map((c) => c.name.toLowerCase()));
  const rolesFor = (name: string) => {
    const canonical = normalizeSkill(name);
    return jobs.filter((j) => j.requiredSkills.includes(canonical));
  };

  async function saveValidation() {
    if (!active) return;
    const msgs = await onValidate(active.name, {
      level,
      evidence,
      endorsedBy,
      endorserNote,
    });
    setFeedback(msgs);
  }

  async function addSkill(name: string, lvl: number) {
    if (!name.trim()) return;
    if (await onAdd(name.trim(), lvl)) setNewSkill("");
  }

  return (
    <>
      {/* ── The shelf — never scrolls: spines compress to fit the row ── */}
      <div className="border-border/20 flex items-end gap-1.5 overflow-hidden border-b-2 px-1 pb-0 pt-2">
        {claims.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => openSkill(c)}
            aria-label={`${c.name} — ${TIER_LABEL[c.tier]}, level ${c.level}/5. Open details`}
            title={`${c.name} · ${TIER_LABEL[c.tier]} · level ${c.level}/5`}
            className={cn(
              "min-w-0 max-w-11 flex-1 rounded-t-md border border-b-0 backdrop-blur-sm",
              "flex items-end justify-center pb-2 transition-all hover:-translate-y-1",
              SPINE_TONE[c.tier],
            )}
            // Level sets the book height — a taller spine = a stronger claim.
            style={{ height: 72 + c.level * 10 }}
          >
            <span className="max-h-full truncate text-[11px] font-medium [writing-mode:vertical-rl] rotate-180">
              {c.name}
            </span>
          </button>
        ))}

        {/* + Add spine */}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Add a skill"
          className="border-border/20 text-muted-foreground hover:border-luminous/60 hover:text-luminous flex w-9 shrink-0 items-center justify-center rounded-t-md border border-b-0 border-dashed transition-all hover:-translate-y-1"
          style={{ height: 92 }}
        >
          <Plus className="size-4" />
        </button>

        {claims.length === 0 && (
          <p className="text-muted-foreground self-center pb-3 pl-2 text-sm">
            No skills yet — add your first with the + spine.
          </p>
        )}
      </div>

      {/* ── Detail modal ── */}
      {active && (
        <Modal
          isOpen
          onClose={() => setOpen(null)}
          title={active.name}
          description={`Level ${active.level}/5 · weight ×${TIER_WEIGHT[active.tier].toFixed(1)}`}
          leading={<Chip tone={TIER_CHIP_TONE[active.tier]}>{TIER_LABEL[active.tier]}</Chip>}
        >
          <div className="space-y-5">
            {/* Validate / manage */}
            <section>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider">
                Validation
              </h3>
              {active.tier === 3 ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  Endorsed by <span className="text-foreground font-medium">{active.endorsedBy}</span>
                  {active.endorserNote ? ` — “${active.endorserNote}”` : ""}. Counts at full weight.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <label className="text-muted-foreground flex items-center gap-2 text-xs">
                    Claimed level
                    <Select
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      className="min-h-8 py-1 text-xs"
                    >
                      {[1, 2, 3, 4, 5].map((l) => (
                        <option key={l} value={l}>
                          Lv {l}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <textarea
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                    maxLength={400}
                    rows={2}
                    placeholder="Evidence (→ tier 2): a link, or what you did, when, with a result. Checked for plausibility."
                    className="bg-foreground/2 border-border/15 focus:border-luminous w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={endorsedBy}
                    onChange={(e) => setEndorsedBy(e.target.value)}
                    maxLength={80}
                    placeholder="Endorser name — someone who saw you use it (tier 3)"
                    className="bg-foreground/2 border-border/15 focus:border-luminous min-h-9 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                  />
                  {endorsedBy.trim() && (
                    <textarea
                      value={endorserNote}
                      onChange={(e) => setEndorserNote(e.target.value)}
                      maxLength={160}
                      rows={2}
                      placeholder="Required: how & when they saw this skill in action (this is what earns tier 3)."
                      className="bg-foreground/2 border-border/15 focus:border-luminous w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                    />
                  )}
                  <Button size="xs" disabled={busy} onClick={() => void saveValidation()}>
                    <BadgeCheck className="size-3" />
                    Save validation
                  </Button>
                  {feedback?.map((f, i) => (
                    <p key={i} className={cn("text-[11px]", FEEDBACK_TONE[f.tone])}>
                      {f.text}
                    </p>
                  ))}
                </div>
              )}
            </section>

            {/* Roles this skill unlocks */}
            <section>
              <h3 className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider">
                <Briefcase className="text-luminous size-3.5" aria-hidden />
                Applies to roles
              </h3>
              {rolesFor(active.name).length ? (
                <ul className="mt-2 space-y-1.5">
                  {rolesFor(active.name).map((j) => (
                    <li key={j.id}>
                      <Link
                        href={`/jobs/${j.id}`}
                        className="border-border/15 bg-foreground/2 hover:border-luminous/40 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {j.title}{" "}
                          <span className="text-muted-foreground text-xs">· {j.company}</span>
                        </span>
                        <Chip tone={j.match >= 70 ? "clover" : "luminous"}>{j.match}%</Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2 text-xs">
                  No open role in the catalogue requires this yet — it still counts toward your market signal.
                </p>
              )}
            </section>

            {/* How to improve */}
            <section>
              <h3 className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider">
                <BookOpen className="text-clover size-3.5" aria-hidden />
                Learning materials
              </h3>
              <ul className="mt-2 space-y-1.5">
                {learningFor(active.name).map((tip, i) => {
                  const isAdded = added.has(i);
                  const sched = scheduled.get(i);
                  return (
                    <li
                      key={tip}
                      className="border-border/15 bg-foreground/2 rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <BookOpen
                          className="text-muted-foreground/40 mt-0.5 size-3.5 shrink-0"
                          aria-hidden
                        />
                        <p className="text-muted-foreground min-w-0 flex-1 text-xs">
                          {tip}
                        </p>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            disabled={isAdded}
                            aria-label={isAdded ? "Added to roadmap" : "Add to roadmap"}
                            title={isAdded ? "Added to roadmap" : "Add to roadmap"}
                            onClick={() => {
                              setAdded((prev) => new Set(prev).add(i));
                              fireToast("Added to roadmap!");
                            }}
                            className={cn(
                              "flex size-7 items-center justify-center rounded-md border transition-colors",
                              isAdded
                                ? "border-clover/40 text-clover"
                                : "border-border/15 text-muted-foreground hover:border-luminous/50 hover:text-luminous",
                            )}
                          >
                            {isAdded ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                          </button>
                          <button
                            type="button"
                            aria-label={sched ? `Scheduled for ${sched}` : "Schedule"}
                            title={sched ? `Scheduled for ${sched}` : "Schedule"}
                            onClick={() =>
                              setScheduleOpen((cur) => (cur === i ? null : i))
                            }
                            className={cn(
                              "flex size-7 items-center justify-center rounded-md border transition-colors",
                              sched
                                ? "border-clover/40 text-clover"
                                : "border-border/15 text-muted-foreground hover:border-luminous/50 hover:text-luminous",
                            )}
                          >
                            {sched ? (
                              <CalendarCheck className="size-3.5" />
                            ) : (
                              <Calendar className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {scheduleOpen === i && (
                        <input
                          type="date"
                          autoFocus
                          onChange={(e) => {
                            if (!e.target.value) return;
                            setScheduled((prev) =>
                              new Map(prev).set(i, e.target.value),
                            );
                            setScheduleOpen(null);
                            fireToast("Scheduled!");
                          }}
                          className="bg-foreground/2 border-border/15 focus:border-luminous mt-2 ml-6 rounded-lg border px-2 py-1 text-xs outline-none"
                        />
                      )}
                      {sched && scheduleOpen !== i && (
                        <p className="text-clover mt-1 ml-6 text-[11px]">
                          Scheduled for {sched}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <div className="border-border/15 mt-5 flex justify-end border-t pt-4">
            <Button
              size="xs"
              variant="ghost"
              disabled={busy}
              className="text-destructive hover:text-destructive"
              onClick={() => {
                void onDelete(active.name).then((done) => {
                  if (done) setOpen(null);
                });
              }}
            >
              <Trash2 className="size-3" />
              Remove skill
            </Button>
          </div>

          {/* Frictionless quick-action confirmation */}
          {toast && (
            <div className="pointer-events-none fixed inset-x-0 bottom-6 z-70 flex justify-center">
              <span className="bg-clover/15 border-clover/40 text-clover-soft inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur">
                <Check className="size-3.5" />
                {toast}
              </span>
            </div>
          )}
        </Modal>
      )}

      {/* ── Add modal — one sleek searchable dropdown, no resume paste ── */}
      <Modal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setSkillsOpen(false);
        }}
        title="Add a skill"
        description="Any skill counts — technical, trade, creative, or soft."
      >
        <form
          className="flex items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void addSkill(newSkill, newLevel);
          }}
        >
          {/* Combobox: type to filter the taxonomy, click to fill, free text still counts. */}
          <div className="relative w-full">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => {
                setNewSkill(e.target.value);
                setSkillsOpen(true);
              }}
              onFocus={() => setSkillsOpen(true)}
              onBlur={() => setSkillsOpen(false)}
              maxLength={40}
              placeholder="Search or type a skill…"
              role="combobox"
              aria-label="Add a skill"
              aria-expanded={skillsOpen}
              aria-controls="add-skill-listbox"
              autoComplete="off"
              className="bg-foreground/2 border-border/15 focus:border-luminous min-h-10 w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
            <div
              className={cn(
                "bg-popover border-border/20 absolute inset-x-0 top-full z-30 mt-1 origin-top rounded-xl border shadow-xl transition-all duration-200",
                skillsOpen
                  ? "translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-1 scale-[0.99] opacity-0",
              )}
            >
              <ul id="add-skill-listbox" className="max-h-40 overflow-y-auto p-1.5">
                {SKILL_TAXONOMY.filter(
                  (s) =>
                    s.toLowerCase().includes(newSkill.trim().toLowerCase()) &&
                    !claimedNames.has(s.toLowerCase()),
                )
                  .slice(0, 40)
                  .map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewSkill(s);
                          setSkillsOpen(false);
                        }}
                        className="hover:bg-accent flex w-full items-center rounded-lg px-3 py-1.5 text-left text-sm transition-colors"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                {SKILL_TAXONOMY.filter(
                  (s) =>
                    s.toLowerCase().includes(newSkill.trim().toLowerCase()) &&
                    !claimedNames.has(s.toLowerCase()),
                ).length === 0 && (
                  <li className="text-muted-foreground px-3 py-2 text-xs">
                    No taxonomy match — free text still counts.
                  </li>
                )}
              </ul>
            </div>
          </div>
          <Select
            aria-label="Claimed level"
            value={newLevel}
            onChange={(e) => setNewLevel(Number(e.target.value))}
            wrapperClassName="shrink-0"
            className="min-h-10"
          >
            {[1, 2, 3, 4, 5].map((l) => (
              <option key={l} value={l}>
                Lv {l}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" className="min-h-10 shrink-0" disabled={busy || !newSkill.trim()}>
            <Plus className="size-3.5" />
          </Button>
        </form>
        <p className="text-muted-foreground mt-2 text-[11px]">
          New skills start self-claimed — validate them with evidence to raise their weight.
        </p>
      </Modal>
    </>
  );
}
