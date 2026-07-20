---
name: career-os-design
description: Career OS design system. MUST be applied whenever building, restyling, or reviewing ANY UI in this repo — new features, pages, components, cards, forms, charts, empty states. Defines the tokens, typography voices, component recipes, and role accents that keep every surface consistent. Source of truth is the "Career-OS Design System" claude.ai/design project.
---

# Career OS Design System

Dark-only product UI. Editorial in tone, built from a small set of reusable
primitives. Two accents, one language: **Luminous** (candidate) and **Clover**
(employer) on the same neutral chassis.

Canonical reference: claude.ai/design project `afc8b34c-6e5b-4f6d-95b1-4555cf97bf16`
("Career OS Design System.dc.html"). Tokens live in `src/app/globals.css`.

## Hard rules

1. **Semantic tokens only** — never raw hexes in components. `text-luminous`,
   `text-luminous-soft`, `text-clover`, `text-clover-soft`, `bg-brand`
   (marketing only), `text-destructive`, `yellow-400` (warning),
   `text-foreground`, `text-muted-foreground`, `border-border/*`.
2. **Two type voices.** Inter (`font-sans`, default) for display/headings/body.
   IBM Plex Mono (`font-mono`) for every small uppercase label: eyebrows,
   field labels, stat-tile captions, meta rows, score denominators. If it's
   uppercase + letter-spaced, it's mono — no exceptions.
3. **Reuse primitives before writing markup**: `Button`, `LinkButton`, `Badge`,
   `Chip`, `ScoreBar`, `ProgressRing`, `Select`, `Modal`, `ConfirmDialog`,
   `PageHeader`, `Grid12`/`Col` (12-col layout), `cn()` from `@/lib/utils`.
4. **Hand-rolled SVG for charts** (radar, rings, funnels) — no chart libraries.
5. **Role accent is structural, not per-button.** Employer shells set
   `data-role-accent="employer"` on their root; the shared Button `default`
   variant recolors itself (clover gradient, dark `#06210a` text) via the
   `--btn-*` CSS vars. Never hardcode a green button.
6. **Decorative glows carry `data-glow`** (hidden in calm density) and all
   animation must respect `html.reduce-motion` (see globals.css).
7. UI density is a binary user choice set on the candidate AppShell:
   Detailed (`data-ui-density="calm"` — full prose, glows hidden) or Vibrant
   (explanations collapse to ⓘ InfoHints, glows on). Never rely on a glow or
   animation to convey meaning.

## Recipes (copy these, don't invent)

- **Eyebrow**: `font-mono text-xs font-semibold uppercase tracking-[0.18em]`
  + `text-luminous` (candidate), `text-clover` (employer), or
  `text-muted-foreground` (neutral group label).
- **Card**: `glass-3 rounded-2xl p-6`; tighter cards `rounded-xl p-4`.
  Accent-tinted feature card: `border border-luminous/25
  bg-linear-to-b from-luminous/10 to-luminous/2`.
- **Page header**: use `PageHeader` (mono eyebrow, `font-bold tracking-tight`
  title, radial `data-glow`). Don't hand-roll page tops.
- **Display type**: greeting/hero numbers are Inter `font-extrabold`/`font-bold`
  `tracking-tight`; accent the key word with `text-luminous`/`text-clover`.
- **Buttons**: `<Button>` default = accent gradient bevel (role-aware);
  `outline` = transparent + `border-border/20`; `glow` = glass; `ghost` for
  low-emphasis. Sizes: `sm` 32px, default 36px, `lg` 44px `rounded-lg`.
- **Chips**: `<Chip tone="neutral|luminous|clover|warning">` — toned chips use
  the *soft* accent text on a 10% wash. Skill tags = neutral.
- **Score signals**: `<ScoreBar>` (mono label, accent number, `/ 100`,
  4–5px track `bg-foreground/8`, fill sweeps in at
  `1.1s cubic-bezier(0.22,1,0.36,1)`) and `<ProgressRing>` (same curve).
  Match = luminous, Readiness = clover — on BOTH sides of the marketplace.
- **Sidebar item (active)**: `rounded-lg border border-luminous/25
  bg-luminous/12 text-foreground [&_svg]:text-luminous` (clover on employer).
  Idle: `border-transparent text-muted-foreground hover:bg-foreground/4`.
- **Inputs**: h-10/11, `rounded-lg border-border/15 bg-foreground/2`,
  focus `border-luminous/60`; label above = mono uppercase
  `text-[0.625rem] tracking-[0.1em] text-muted-foreground`. Dropdowns use the
  `Select` primitive — never a raw `<select>` (native widget faces ignore
  dark tokens on some platforms).
- **Avatar/initials**: `rounded-full bg-luminous/15 ring-2 ring-luminous/30
  text-luminous`.
- **Empty state / demo data**: neutral `Badge` "Demo data"; never fake real
  users.
- **Radius scale**: 6 / 10 (`rounded-lg`) / 14 / 16 (`rounded-2xl`) / full —
  nothing else.
- **Micro-text is rem, never px**: the app renders at a 90% root scale
  (`html { font-size: 90% }`), so arbitrary sizes MUST be rem to scale with
  everything else — `text-[0.5625rem]` (9), `text-[0.625rem]` (10),
  `text-[0.6875rem]` (11). A `text-[10px]` literal breaks the global scale.
  Same for inline styles: heights/widths in rem strings, not px numbers.
- **Explanatory prose is density-aware**: any "how to read this / what this
  means" sentence on a candidate surface goes inside `<InfoHint>` (from
  `ui/InfoHint`) — full prose under Detailed, ⓘ popover under Vibrant. Keep
  empty states, errors, and data values OUTSIDE InfoHint.

## When adding a new feature

Before writing UI: (1) find the nearest existing surface and match it,
(2) pick the accent from the owning side (candidate = luminous,
employer = clover), (3) use recipes above, (4) verify in dark mode at
1280px + mobile, and confirm labels are mono, buttons gradient, scores
animated. If a needed pattern is missing here, extend a primitive in
`src/components/ui` — don't fork styles inline.
