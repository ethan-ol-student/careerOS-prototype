"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Loader2, X } from "lucide-react";
import { fetchRoleCatalog, type CatalogRole } from "@/lib/roles/catalog";
import { cn } from "@/lib/utils";

/** One picked role. `id === null` marks a free-text entry (not in the catalog). */
export interface RolePick {
  id: string | null;
  title: string;
  category?: string;
}

/**
 * Reusable searchable role dropdown over the role-catalog taxonomy.
 * Options display as `[INDUSTRY] - [JOB ROLE]`; typing filters by BOTH
 * industry and role name in real time. Keyboard navigable (↑ ↓ Enter Esc),
 * with loading + empty states. Single mode (Current Role) or multi mode
 * (Desired Roles, capped); optional free-text entries keep the list
 * inclusive of roles the taxonomy doesn't know yet.
 */
export function RoleSelect({
  values,
  onChange,
  multiple = false,
  max = 5,
  allowFreeText = true,
  placeholder = "Search industries or roles…",
  id,
}: {
  values: RolePick[];
  onChange: (next: RolePick[]) => void;
  multiple?: boolean;
  max?: number;
  allowFreeText?: boolean;
  placeholder?: string;
  id?: string;
}) {
  const [roles, setRoles] = useState<CatalogRole[] | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchRoleCatalog().then((r) => {
      if (!cancelled) setRoles(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pickedIds = useMemo(
    () => new Set(values.map((v) => v.id).filter(Boolean) as string[]),
    [values],
  );
  const pickedTitles = useMemo(
    () => new Set(values.map((v) => v.title.toLowerCase())),
    [values],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (roles ?? [])
      .filter((r) => !pickedIds.has(r.id))
      .filter(
        (r) =>
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [roles, query, pickedIds]);

  const full = multiple && values.length >= max;

  const pick = (p: RolePick) => {
    if (pickedTitles.has(p.title.toLowerCase())) return;
    onChange(multiple ? (full ? values : [...values, p]) : [p]);
    setQuery("");
    setOpen(false);
    setHighlight(0);
  };

  const addFreeText = () => {
    const t = query.trim().slice(0, 80);
    if (!t || !allowFreeText) return;
    pick({ id: null, title: t });
  };

  const remove = (idx: number) => onChange(values.filter((_, i) => i !== idx));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && ["ArrowDown", "ArrowUp"].includes(e.key)) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = filtered[highlight];
      if (hit) pick({ id: hit.id, title: hit.title, category: hit.category });
      else addFreeText();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const listboxId = `${id ?? "role-select"}-listbox`;

  return (
    <div className="flex flex-col gap-2">
      {/* Selected picks (multi renders removable chips; single a filled pill) */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={`${v.id ?? v.title}`}
              className="border-luminous/40 bg-luminous/12 text-luminous-soft inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
            >
              <Briefcase className="size-3 shrink-0" aria-hidden />
              <span className="max-w-64 truncate">
                {v.category ? `${v.category} - ${v.title}` : v.title}
              </span>
              <button
                type="button"
                aria-label={`Remove ${v.title}`}
                onClick={() => remove(i)}
                className="hover:text-foreground shrink-0 transition-colors"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          disabled={full}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={full ? `Maximum ${max} selected` : placeholder}
          className="bg-foreground/2 border-border/15 focus-visible:border-luminous/60 min-h-11 w-full rounded-lg border px-3 py-2 text-sm outline-none disabled:opacity-50"
        />

        <div
          className={cn(
            "bg-popover border-border/20 absolute inset-x-0 top-full z-30 mt-1 origin-top rounded-xl border shadow-xl transition-all duration-200",
            open && !full
              ? "translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-[0.99] opacity-0",
          )}
        >
          <ul
            id={listboxId}
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto p-1.5"
          >
            {roles === null ? (
              <li className="text-muted-foreground flex items-center gap-2 px-3 py-2.5 text-xs">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Loading roles…
              </li>
            ) : (
              <>
                {filtered.map((r, i) => (
                  <li key={r.id} role="option" aria-selected={i === highlight} data-idx={i}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick({ id: r.id, title: r.title, category: r.category });
                      }}
                      onMouseEnter={() => setHighlight(i)}
                      className={cn(
                        "flex w-full items-baseline gap-1.5 rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                        i === highlight ? "bg-accent" : "hover:bg-accent",
                      )}
                    >
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {r.category} -
                      </span>
                      <span className="min-w-0 truncate">{r.title}</span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="text-muted-foreground px-3 py-2.5 text-xs">
                    {allowFreeText
                      ? "No catalog match — press Enter to add it as free text."
                      : "No roles match that search."}
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
