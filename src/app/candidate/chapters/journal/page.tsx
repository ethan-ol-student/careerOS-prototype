"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { emitCarrie } from "@/components/carrie/carrieBus";
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
  "text-muted-foreground font-mono text-[0.625rem] font-semibold uppercase tracking-[0.1em]";

export default function JournalPage() {
  return (
    <AppShell>
      <JournalContent />
    </AppShell>
  );
}

const TEMP_ID = "__new__"; // rail sentinel for the unsaved draft row

function JournalContent() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedId, setSelectedId] = useState<string | null>(null); // null = empty state
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState<Draft | null>(null); // non-null only while editing
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
        // No auto-select — the right panel starts empty until the user acts.
        setEntries((json.data.entries ?? []) as JournalEntry[]);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isCreating = selectedId === TEMP_ID;
  const selected = entries.find((e) => e.id === selectedId) ?? null;
  // The temp draft appears as a live rail row while creating — entries is
  // never mutated with it.
  const railRows: JournalEntry[] =
    isCreating && draft
      ? [
          {
            id: TEMP_ID,
            date: draft.date,
            title: draft.title,
            reflection: draft.reflection,
            mood: draft.mood,
            skillsTouched: draft.skillsTouched,
            pivot: draft.pivot,
            createdAt: "",
          },
          ...entries,
        ]
      : entries;

  function selectEntry(e: JournalEntry) {
    if (e.id === TEMP_ID) return; // already the active draft
    setSelectedId(e.id);
    setMode("view");
    setDraft(null);
    setSkillInput("");
  }
  function startCreate() {
    setDraft(blankDraft());
    setSelectedId(TEMP_ID);
    setMode("edit");
    setSkillInput("");
  }
  function startEdit() {
    if (!selected) return;
    setDraft(toDraft(selected));
    setMode("edit");
    setSkillInput("");
  }
  function cancel() {
    setMode("view");
    setDraft(null);
    setSkillInput("");
    // A cancelled brand-new entry disappears (nothing was saved).
    if (isCreating) setSelectedId(null);
  }
  function addSkill() {
    const s = skillInput.trim();
    setSkillInput("");
    if (!draft || !s || draft.skillsTouched.length >= 12) return;
    if (draft.skillsTouched.some((x) => x.toLowerCase() === s.toLowerCase()))
      return;
    setDraft({ ...draft, skillsTouched: [...draft.skillsTouched, s] });
  }
  function removeSkill(s: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      skillsTouched: draft.skillsTouched.filter((x) => x !== s),
    });
  }

  async function save() {
    if (!draft || !draft.title.trim() || saving) return;
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
    emitCarrie(
      "success",
      draft.id ? "Reflection updated." : "Reflection captured — your story grows!",
    );
    if (draft.id) {
      const id = draft.id;
      setEntries((prev) =>
        sortEntries(prev.map((e) => (e.id === id ? { ...e, ...body } : e))),
      );
      setSelectedId(id);
    } else {
      const created = json.data.entry as JournalEntry;
      setEntries((prev) => sortEntries([created, ...prev]));
      setSelectedId(created.id);
    }
    setMode("view");
    setDraft(null);
  }

  async function del() {
    setConfirmDelete(false);
    if (!selected) return;
    const id = selected.id;
    const res = await fetch("/api/me/journal", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    if (!json?.ok) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSelectedId(null);
    setMode("view");
    setDraft(null);
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
          <LinkButton href="/candidate/insights" variant="outline" size="sm">
            <Sparkles className="size-3.5" /> What this reveals
          </LinkButton>
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
            {/* Entry rail — the timeline itself, with Add at the top */}
            <aside className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={startCreate}
                disabled={isCreating}
                className="justify-center"
              >
                <Plus className="size-3.5" /> Add entry
              </Button>
              <p className={cn(labelCls, "px-1 pt-1")}>
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
              {railRows.length === 0 ? (
                <div className="glass-3 text-muted-foreground rounded-2xl p-4 text-xs">
                  No entries yet. Press <span className="text-foreground">Add entry</span> to
                  write your first reflection — they line up here as a timeline.
                </div>
              ) : (
                <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto pr-1">
                  {railRows.map((e) => {
                    const active = e.id === selectedId;
                    const isTemp = e.id === TEMP_ID;
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
                          isTemp && "border-dashed",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground font-mono text-[0.625rem] uppercase tracking-wider">
                            {isTemp ? "Draft" : fmtDate(e.date)}
                          </span>
                          {e.pivot && (
                            <Star
                              className="text-luminous fill-luminous/40 size-3.5"
                              aria-label="Turning point"
                            />
                          )}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm font-medium">
                          {e.title || (isTemp ? "Untitled entry" : "Untitled")}
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

            {/* Right panel — empty / read-only detail / editable form */}
            <div className="glass-3 rounded-2xl p-5 sm:p-6">
              {mode === "edit" && draft ? (
                <JournalForm
                  draft={draft}
                  setDraft={setDraft}
                  skillInput={skillInput}
                  setSkillInput={setSkillInput}
                  addSkill={addSkill}
                  removeSkill={removeSkill}
                  saving={saving}
                  onSave={save}
                  onCancel={cancel}
                  isCreating={isCreating}
                />
              ) : selected ? (
                <JournalDetail
                  entry={selected}
                  onEdit={startEdit}
                  onDelete={() => setConfirmDelete(true)}
                />
              ) : (
                <div className="text-muted-foreground flex h-full min-h-64 flex-col items-center justify-center gap-2 text-center">
                  <Sparkles className="text-luminous/60 size-6" aria-hidden />
                  <p className="text-sm font-medium">Nothing selected</p>
                  <p className="text-xs">
                    Pick an entry to read it, or press{" "}
                    <span className="text-foreground">Add entry</span> to write a new one.
                  </p>
                </div>
              )}
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

/** Read-only detail — the default when an entry is selected. */
function JournalDetail({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground font-mono text-[0.6875rem] uppercase tracking-wider">
          {fmtDate(entry.date)}
        </span>
        {entry.pivot && (
          <Chip tone="luminous">
            <Star className="size-3 fill-current" aria-hidden /> Turning point
          </Chip>
        )}
      </div>
      <h2 className="text-xl font-semibold tracking-tight">
        {entry.title || "Untitled"}
      </h2>
      {(entry.mood || entry.skillsTouched.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.mood && (
            <Chip tone={MOOD_TONE[entry.mood] ?? "neutral"} className="capitalize">
              {entry.mood}
            </Chip>
          )}
          {entry.skillsTouched.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      )}
      {entry.reflection.trim() ? (
        <p className="text-foreground/85 whitespace-pre-wrap text-sm leading-relaxed">
          {entry.reflection}
        </p>
      ) : (
        <p className="text-muted-foreground/70 text-sm italic">
          No reflection written for this entry.
        </p>
      )}

      <div className="border-border/10 mt-2 flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="size-4" /> Delete
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="size-4" /> Edit
        </Button>
      </div>
    </div>
  );
}

/** Editable form — only shown after "Add entry" or "Edit". */
function JournalForm({
  draft,
  setDraft,
  skillInput,
  setSkillInput,
  addSkill,
  removeSkill,
  saving,
  onSave,
  onCancel,
  isCreating,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  skillInput: string;
  setSkillInput: (v: string) => void;
  addSkill: () => void;
  removeSkill: (s: string) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  isCreating: boolean;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Date</span>
          <span className="relative inline-flex items-center">
            <CalendarDays className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
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
          <Star className={cn("size-4", draft.pivot && "fill-luminous/40")} />
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
          autoFocus
          className={inputCls}
        />
      </label>

      <label className="mt-4 flex flex-col gap-1">
        <span className={labelCls}>Reflection</span>
        <textarea
          value={draft.reflection}
          onChange={(e) => setDraft({ ...draft, reflection: e.target.value })}
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
              className="bg-luminous/10 text-luminous-soft border-luminous/30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium"
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
            placeholder={draft.skillsTouched.length ? "Add another…" : "Add a skill…"}
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
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving || !draft.title.trim()}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {isCreating ? "Add entry" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
