"use client";

import { useState } from "react";
import { Plus, X, Check, ListTodo, CalendarDays, Clock, Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useChapters } from "@/lib/context/ChaptersContext";
import { PRIORITY_META, type Priority } from "@/lib/chapters/data";
import { cn } from "@/lib/utils";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EventEditor({
  initialName = "",
  onSaved,
}: {
  initialName?: string;
  /** Called after a successful add — lets a modal host close itself. */
  onSaved?: () => void;
}) {
  const { addEvent } = useChapters();
  const [name, setName] = useState(initialName);
  const [priority, setPriority] = useState<Priority>("medium");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("09:00");
  const [subtasks, setSubtasks] = useState<{ label: string; done?: boolean }[]>([]);
  const [subInput, setSubInput] = useState("");

  const canSave = name.trim().length > 0;

  const reset = (keepDate = true) => {
    setName("");
    setPriority("medium");
    if (!keepDate) setDate(todayISO());
    setTime("09:00");
    setSubtasks([]);
    setSubInput("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    addEvent({ name, priority, date, time, subtasks });
    reset();
    onSaved?.();
  };

  const addSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subInput.trim()) return;
    setSubtasks((s) => [...s, { label: subInput.trim() }]);
    setSubInput("");
  };

  return (
    <form
      onSubmit={submit}
      className="glass-4 ring-luminous/20 relative overflow-hidden rounded-2xl p-6 ring-1"
    >
      <div className="from-luminous/15 pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-radial to-transparent" aria-hidden />

      <div className="relative mb-4">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          New event
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight">
          Add an activity to your timetable
        </h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Fill the fields, add sub-tasks, hit save — then go again.
        </p>
      </div>

      <Label icon={<ListTodo className="size-3" />}>Name</Label>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={80}
        autoFocus
        placeholder="e.g. Robotics study block"
      />

      <Label icon={<Flag className="size-3" />} className="mt-4">Priority</Label>
      <div className="flex gap-2">
        {(Object.keys(PRIORITY_META) as Priority[]).map((p) => {
          const meta = PRIORITY_META[p];
          const active = priority === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors",
                active ? meta.tone : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn("size-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label icon={<CalendarDays className="size-3" />}>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label icon={<Clock className="size-3" />}>Time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <Label className="mt-4">Sub-tasks ({subtasks.length})</Label>
      <div className="flex gap-2">
        <Input
          value={subInput}
          onChange={(e) => setSubInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSub(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Add a sub-task and press Enter"
        />
        <Button type="button" onClick={addSub} size="default" disabled={!subInput.trim()}>
          <Plus />
        </Button>
      </div>
      {subtasks.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {subtasks.map((s, i) => (
            <li key={i} className="border-border/15 bg-foreground/2 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
              <span className="border-luminous/40 size-3.5 rounded-sm border" aria-hidden />
              <span className="flex-1 truncate">{s.label}</span>
              <button
                type="button"
                aria-label="Remove sub-task"
                onClick={() => setSubtasks((arr) => arr.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-border/15 mt-5 flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="ghost" onClick={() => reset(false)}>
          Clear
        </Button>
        <Button type="submit" disabled={!canSave}>
          <Check />
          Save & add another
        </Button>
      </div>
    </form>
  );
}

function Label({ children, icon, className }: { children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-muted-foreground mb-1.5 flex items-center gap-1.5 text-[11px] font-mono font-medium uppercase tracking-wider", className)}>
      {icon}
      {children}
    </p>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "bg-foreground/2 border-border/15 focus:border-luminous/60 focus:ring-luminous/30 min-h-11 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2",
        props.className,
      )}
    />
  );
}
