"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  reflection: string;
  mood: string;
  skillsTouched: string[];
  pivot: boolean;
  createdAt: string;
}

// Legal moods mirror the API's enum (server owns the truth).
const MOODS: { value: string; label: string }[] = [
  { value: "", label: "No mood" },
  { value: "energized", label: "Energized" },
  { value: "proud", label: "Proud" },
  { value: "steady", label: "Steady" },
  { value: "uncertain", label: "Uncertain" },
  { value: "drained", label: "Drained" },
];
const MOOD_TONE: Record<string, ChipTone> = {
  energized: "clover",
  proud: "clover",
  steady: "neutral",
  uncertain: "warning",
  drained: "warning",
};

type Draft = Omit<JournalEntry, "id" | "createdAt"> & { id: string | null };

const todayISO = () => new Date().toISOString().slice(0, 10);
const blankDraft = (): Draft => ({
  id: null,
  date: todayISO(),
  title: "",
  reflection: "",
  mood: "",
  skillsTouched: [],
  pivot: false,
});
const toDraft = (e: JournalEntry): Draft => ({
  id: e.id,
  date: e.date,
  title: e.title,
  reflection: e.reflection,
  mood: e.mood,
  skillsTouched: e.skillsTouched,
  pivot: e.pivot,
});
const sortEntries = (list: JournalEntry[]) =>
  [...list].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
const fmtDate = (d: string) =>
  new Date(`${d}T00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const inputCls =
  "border-border/15 bg-foreground/2 focus:border-luminous/60 h-10 w-full rounded-lg border px-3 text-sm outline-none";
const labelCls =
  "text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-[0.1em]";

export default function JournalPage() {
  return (
    <AppShell>
      <JournalContent />
    </AppShell>
  );
}

function JournalContent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/me/journal", { cache: "no-store" }).catch(
        () => null,
      );
      const json = await res?.json().catch(() => null);
      if (cancelled) return;
      if (json?.ok) {
        const list = (json.data.entries ?? []) as JournalEntry[];
        setEntries(list);
        if (list.length) setDraft(toDraft(list[0]));
        setStatus("ready");
      } else {
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectEntry(e: JournalEntry) {
    setDraft(toDraft(e));
    setSkillInput("");
  }
  function newEntry() {
    setDraft(blankDraft());
    setSkillInput("");
  }
  function addSkill() {
    const s = skillInput.trim();
    setSkillInput("");
    if (!s || draft.skillsTouched.length >= 12) return;
    if (draft.skillsTouched.some((x) => x.toLowerCase() === s.toLowerCase()))
      return;
    setDraft({ ...draft, skillsTouched: [...draft.skillsTouched, s] });
  }
  function removeSkill(s: string) {
    setDraft({
      ...draft,
      skillsTouched: draft.skillsTouched.filter((x) => x !== s),
    });
  }

  async function save() {
    if (!draft.title.trim() || saving) return;
    setSaving(true);
    const body = {
      date: draft.date,
      title: draft.title.trim(),
      reflection: draft.reflection,
      mood: draft.mood,
      skillsTouched: draft.skillsTouched,
      pivot: draft.pivot,
    };
    const res = await fetch("/api/me/journal", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft.id ? { id: draft.id, ...body } : body),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setSaving(false);
    if (!json?.ok) return;
    if (draft.id) {
      const id = draft.id;
      setEntries((prev) =>
        sortEntries(prev.map((e) => (e.id === id ? { ...e, ...body } : e))),
      );
    } else {
      const created = json.data.entry as JournalEntry;
      setEntries((prev) => sortEntries([created, ...prev]));
      setDraft(toDraft(created));
    }
  }

  async function del() {
    setConfirmDelete(false);
    if (!draft.id) {
      newEntry();
      return;
    }
    const id = draft.id;
    const res = await fetch("/api/me/journal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!json?.ok) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    setDraft(next.length ? toDraft(next[0]) : blankDraft());
  }

  return (
    <>
      <PageHeader
        eyebrow="Timeline Journal"
        title={
          <>
            Your <span className="text-luminous">story</span>, entry by entry
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <LinkButton href="/candidate/insights" variant="outline" size="sm">
              <Sparkles className="size-3.5" /> What this reveals
            </LinkButton>
            <Button size="sm" onClick={newEntry}>
              <Plus /> New entry
            </Button>
          </div>
        }
      />

      <section className="max-w-container mx-auto w-full px-4 py-6 sm:py-8">
        {status === "loading" ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Opening your journal…
          </div>
        ) : status === "error" ? (
          <div className="glass-3 rounded-2xl p-8 text-center text-sm font-medium">
            Couldn&apos;t load your journal. Please try again.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Entry rail — the timeline itself */}
            <aside className="flex flex-col gap-2">
              <p className={cn(labelCls, "px-1")}>
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
              {entries.length === 0 ? (
                <div className="glass-3 text-muted-foreground rounded-2xl p-4 text-xs">
                  No entries yet. Your reflections will line up here as a
                  timeline — start writing on the right.
                </div>
              ) : (
                <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto pr-1">
                  {entries.map((e) => {
                    const active = e.id === draft.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => selectEntry(e)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-luminous/25 bg-luminous/10"
                            : "border-border/15 bg-foreground/2 hover:border-border/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
                            {fmtDate(e.date)}
                          </span>
                          {e.pivot && (
                            <Star
                              className="text-luminous fill-luminous/40 size-3.5"
                              aria-label="Turning point"
                            />
                          )}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm font-medium">
                          {e.title || "Untitled"}
                        </p>
                        {(e.mood || e.skillsTouched.length > 0) && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {e.mood && (
                              <Chip
                                tone={MOOD_TONE[e.mood] ?? "neutral"}
                                className="capitalize"
                              >
                                {e.mood}
                              </Chip>
                            )}
                            {e.skillsTouched.slice(0, 2).map((s) => (
                              <Chip key={s}>{s}</Chip>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>

            {/* Editor */}
            <div className="glass-3 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Date</span>
                  <span className="relative inline-flex items-center">
                    <CalendarDays className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(e) =>
                        setDraft({ ...draft, date: e.target.value })
                      }
                      className={cn(inputCls, "scheme-dark pl-9")}
                    />
                  </span>
                </label>
                <button
                  type="button"
                  aria-pressed={draft.pivot}
                  onClick={() => setDraft({ ...draft, pivot: !draft.pivot })}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
                    draft.pivot
                      ? "border-luminous/40 bg-luminous/10 text-luminous"
                      : "border-border/15 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Star
                    className={cn("size-4", draft.pivot && "fill-luminous/40")}
                  />
                  Turning point
                </button>
              </div>

              <label className="mt-4 flex flex-col gap-1">
                <span className={labelCls}>Title</span>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="What happened?"
                  maxLength={120}
                  className={inputCls}
                />
              </label>

              <label className="mt-4 flex flex-col gap-1">
                <span className={labelCls}>Reflection</span>
                <textarea
                  value={draft.reflection}
                  onChange={(e) =>
                    setDraft({ ...draft, reflection: e.target.value })
                  }
                  rows={6}
                  maxLength={2000}
                  placeholder="What did it mean? What did you learn, and what changed?"
                  className="border-border/15 bg-foreground/2 focus:border-luminous/60 w-full resize-y rounded-lg border p-3 text-sm outline-none"
                />
              </label>

              <div className="mt-4 flex flex-col gap-1.5">
                <span className={labelCls}>Skills touched</span>
                <div className="border-border/15 bg-foreground/2 flex flex-wrap items-center gap-1.5 rounded-lg border p-2">
                  {draft.skillsTouched.map((s) => (
                    <span
                      key={s}
                      className="bg-luminous/10 text-luminous-soft border-luminous/30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        aria-label={`Remove ${s}`}
                        className="hover:text-luminous"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    onBlur={addSkill}
                    placeholder={
                      draft.skillsTouched.length ? "Add another…" : "Add a skill…"
                    }
                    className="min-w-28 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="border-border/10 mt-5 flex flex-wrap items-end justify-between gap-3 border-t pt-4">
                <label className="flex flex-col gap-1">
                  <span className={labelCls}>Mood</span>
                  <Select
                    value={draft.mood}
                    onChange={(e) => setDraft({ ...draft, mood: e.target.value })}
                  >
                    {MOODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </label>
                <div className="flex items-center gap-2">
                  {draft.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="size-4" /> Delete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={save}
                    disabled={saving || !draft.title.trim()}
                  >
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    {draft.id ? "Save changes" : "Add entry"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete this entry?"
        description="This reflection will be permanently removed from your timeline. This cannot be undone."
        confirmLabel="Delete entry"
        cancelLabel="Keep it"
        onConfirm={del}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
