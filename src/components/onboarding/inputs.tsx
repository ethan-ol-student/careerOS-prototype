"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Onboarding input primitives (spec Step 2). All controlled, all
 * brand-styled: selected = luminous (#3061e3 token) — progress fills are
 * clover. Text fields carry `autoFilled` ("from your CV") and `error`
 * states so the CV parser and the finish-validation can mark them.
 */

// ── Field wrapper ───────────────────────────────────────────────

export function FieldShell({
  id,
  label,
  optional,
  autoFilled,
  error,
  children,
}: {
  id?: string;
  label: string;
  optional?: boolean;
  autoFilled?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-muted-foreground flex items-center gap-2 text-[0.6875rem] font-mono font-medium uppercase tracking-wider"
      >
        {label}
        {optional && <span className="normal-case opacity-70">(optional)</span>}
        {autoFilled && !error && (
          <span className="text-luminous inline-flex items-center gap-0.5 normal-case tracking-normal">
            <Sparkles className="size-3" aria-hidden /> from your CV
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase =
  "bg-foreground/2 border-border/15 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-luminous/40 focus-visible:border-luminous/60";

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional,
  autoFilled,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  optional?: boolean;
  autoFilled?: boolean;
  error?: string;
}) {
  return (
    <FieldShell id={id} label={label} optional={optional} autoFilled={autoFilled} error={error}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={cn(
          inputBase,
          error ? "border-destructive" : "border-transparent",
          autoFilled && !error && "border-luminous/30",
        )}
      />
    </FieldShell>
  );
}

// ── ChipGroup ───────────────────────────────────────────────────

export function ChipGroup({
  options,
  values,
  onChange,
  max,
  single,
  numbered,
  allowOther,
}: {
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
  /** Cap on selections (e.g. top values = 3). */
  max?: number;
  single?: boolean;
  /** Show 1/2/3 order badges on selected chips (ranked values). */
  numbered?: boolean;
  /** Append an "Other…" chip revealing a free-text input — keeps every
   *  list inclusive of paths we didn't think of. */
  allowOther?: boolean;
}) {
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherText, setOtherText] = useState("");
  const custom = values.filter((v) => !options.includes(v));

  const toggle = (opt: string) => {
    if (values.includes(opt)) {
      onChange(values.filter((v) => v !== opt));
      return;
    }
    if (single) {
      onChange([opt]);
      return;
    }
    if (max && values.length >= max) return; // full — deselect first
    onChange([...values, opt]);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {[...options, ...custom].map((opt) => {
        const idx = values.indexOf(opt);
        const active = idx >= 0;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(opt)}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-luminous/40 bg-luminous/12 text-luminous-soft"
                : "border-border/15 bg-foreground/2 text-muted-foreground hover:text-foreground hover:border-luminous/40",
            )}
          >
            {numbered && active && (
              <span className="bg-luminous/25 flex size-4 items-center justify-center rounded-full text-[0.625rem] font-semibold">
                {idx + 1}
              </span>
            )}
            {opt}
          </button>
        );
      })}
      {allowOther &&
        (otherOpen ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const v = otherText.trim().slice(0, 60);
              if (v && !values.includes(v) && (!max || values.length < max)) {
                onChange(single ? [v] : [...values, v]);
              }
              setOtherText("");
              setOtherOpen(false);
            }}
          >
            <input
              autoFocus
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              onBlur={() => !otherText.trim() && setOtherOpen(false)}
              placeholder="Write your own…"
              aria-label="Write your own option"
              className={cn(inputBase, "min-h-9 w-40 rounded-full border-border/20 px-3 py-1 text-xs")}
            />
            <button type="submit" className="text-luminous text-xs font-medium">
              Add
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setOtherOpen(true)}
            className="border-border/20 text-muted-foreground hover:text-foreground min-h-9 rounded-full border border-dashed px-3 py-1 text-xs"
          >
            Other / write your own
          </button>
        ))}
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────

export function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-luminous" : "bg-border",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}

// ── Slider (native range — no picker lib) ───────────────────────

export function Slider({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
}) {
  return (
    <FieldShell id={id} label={label}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Math.round(Number(e.target.value)))}
          className="accent-luminous h-2 flex-1"
        />
        <span className="text-luminous w-20 shrink-0 text-right text-sm font-medium tabular-nums">
          {Math.round(value)} {unit}
        </span>
      </div>
    </FieldShell>
  );
}

// ── SelectCard ──────────────────────────────────────────────────

export interface SelectCardOption {
  id: string;
  label: string;
  hint?: string;
  icon?: LucideIcon;
}

export function SelectCard({
  options,
  value,
  onChange,
  error,
}: {
  options: SelectCardOption[];
  value: string;
  onChange: (id: string) => void;
  error?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]",
        error && "rounded-xl ring-1 ring-destructive",
      )}
    >
      {options.map((o) => {
        const active = value === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? "" : o.id)}
            className={cn(
              "flex min-h-11 items-start gap-3 rounded-xl border p-3 text-left transition-colors",
              active
                ? "border-luminous/40 bg-linear-to-b from-luminous/10 to-luminous/3"
                : "border-border/15 bg-foreground/2 hover:border-luminous/40",
            )}
          >
            {/* Reference §09: explicit radio circle with inner dot */}
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                active ? "border-luminous" : "border-border/25",
              )}
              aria-hidden
            >
              {active && <span className="bg-luminous size-2.25 rounded-full" />}
            </span>
            <span className="flex min-w-0 flex-col gap-1">
              {Icon && <Icon className={cn("size-4", active ? "text-luminous" : "text-muted-foreground")} aria-hidden />}
              <span className="text-sm font-medium">{o.label}</span>
              {o.hint && <span className="text-muted-foreground text-[0.6875rem] leading-snug">{o.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── TagInput (multi-add free text) ──────────────────────────────

export function TagInput({
  id,
  values,
  onChange,
  placeholder,
  autoFilled,
  error,
}: {
  id: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  autoFilled?: boolean;
  error?: string;
}) {
  const [text, setText] = useState("");
  const commit = (raw: string) => {
    const v = raw.trim().slice(0, 80);
    if (!v || values.includes(v)) return setText("");
    onChange([...values, v]);
    setText("");
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(text);
            }
          }}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn(
            inputBase,
            "flex-1",
            error ? "border-destructive" : "border-transparent",
            autoFilled && !error && "border-luminous/30",
          )}
        />
        <button
          type="button"
          onClick={() => commit(text)}
          disabled={!text.trim()}
          className="bg-luminous hover:bg-luminous/90 inline-flex shrink-0 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li key={v}>
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                aria-label={`Remove ${v}`}
                className="bg-luminous text-white inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.6875rem]"
              >
                {v} <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
