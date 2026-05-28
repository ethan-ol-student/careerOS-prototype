@AGENTS.md

# Career OS — Claude operating manual

Career OS is a Next.js 16 + Tailwind v4 candidate-intelligence app. This
file is the FIRST thing Claude should read. Stay in it; don't re-read
files you've already seen this session.

## 1. Stack & golden rules

- Next.js 16 (Turbopack), React 19, Tailwind v4, TypeScript strict, dark mode forced.
- This is NOT the Next.js you know. Read `node_modules/next/dist/docs/` if unsure about an API.
- Run `./node_modules/.bin/tsc --noEmit --pretty false` before declaring any task done. 0 errors required.
- The Write tool sometimes leaves trailing null bytes when shortening a file. After any batch of writes, run the null-scrub snippet in §8.

## 2. Context-discovery protocol

Use the cheapest source that answers your question.

1. This file → answers most "where / how" questions.
2. `Grep` for a symbol or string — never grep over `node_modules`.
3. `Glob` for files by pattern.
4. Only `Read` whole files when you need to *edit* them; otherwise read the smallest range.
5. Don't open every file in a folder. Open the index / page / context file.

## 3. Architecture map (file refs only)

- App routes: `src/app/<route>/page.tsx` — landing, `onboarding`, `candidate/dashboard|portfolio|chapters`, `candidates/[candidateId]`, `employers/{onboarding,marketplace,saved,notifications,contact/[candidateId],chat/[candidateId]}`.
- Shared shell (candidate): `src/components/app/{AppShell,TopMenu,PageHeader,Grid,NotificationBell}.tsx`.
- Employer shell: `src/components/employer/{EmployerAppShell,EmployerTopMenu,EmployerNotificationsBell}.tsx`. Built as a parallel shell — DO NOT fork `AppShell` to add employer logic.
- Domain UI: `src/components/{dashboard,portfolio,chapters,intent-form,employer-onboarding,marketplace,employer,ui}/`.
- Contexts (all mounted in `src/app/layout.tsx`): `IntentContext`, `NotificationsContext`, `PortfolioContext` (`src/lib/hooks/usePortfolio.tsx`), `ChaptersContext`, `EmployerContext`, `SavedCandidatesContext`.
- Mock candidate pool: `src/lib/candidates/{data.ts,types.ts}`.
- Hidden state machine: `src/components/dashboard/useGrowthLoop.ts`.
- Job graph: `src/lib/jobs/destinations.ts`.
- Tokens & utilities: `src/app/globals.css` (oklch vars + glass + line utilities). The semantic color contract lives in §4 below.

## 4. Design-system contract (memorize, don't drift)

- `brand` (orange) → public marketing surface **only**.
- `luminous` (blue) → primary in-product action, current/active state, focus rings.
- `clover` (green) → growth, readiness, success, completed steps.
- `bg-linear-to-r from-luminous to-clover` → task-in-progress bars only.
- Surfaces: `glass-3` default cards, `glass-4` for the one primary-action card per row.
- Layout: `Grid12` + `Col span lg md` for every internal page.
- Type rhythm: section eyebrow `text-luminous text-xs font-semibold uppercase tracking-[0.18em]`. Sub-panels use muted-foreground.

## 5. Implementation protocol

1. Plan: list the files you will read, edit, or add. If > 5 files, share the plan first.
2. Reuse: prefer extending `useGrowthLoop`, `usePortfolio`, `useNotifications`, `AppShell`, `PageHeader`, `Grid12/Col` over inventing new abstractions.
3. Tokens-not-hex: use Tailwind classes referencing the tokens above. Never re-introduce `bg-gray-XXX` in product UI.
4. New context → mount in `src/app/layout.tsx` providers stack.
5. New page → wrap in `AppShell` + `PageHeader` + `Grid12`. Onboarding pages skip the shell.
6. Animations live in `globals.css` (`@keyframes appear`, `appear-zoom`). Don't add JS animation libs.

## 6. Refactoring protocol

- Before renaming a symbol, `Grep` it across `src/`. Update every usage in one pass.
- Don't remove exports from `lib/chapters/data.ts` or `lib/hooks/usePortfolio.tsx` without scanning for legacy callers. If something is replaced, keep a thin stub or shim so older imports compile (precedent: `PortfolioPreview` re-exports `CVPreview`).
- Token edits in `globals.css` → re-check contrast for `--muted-foreground` (must stay ≥ 4.5:1 over `--background`).
- Don't change public hook return shapes (`useGrowthLoop`, `usePortfolio`, `useNotifications`, `useIntent`, `useChapters`) without an explicit task to do so.

## 7. Testing protocol

- Type-check is the only automated gate today: `./node_modules/.bin/tsc --noEmit --pretty false`.
- `npx next build` will fail offline (SWC binary fetch). Don't try it in the sandbox.
- After a multi-file batch, run §8 scrub + tsc.
- For visual changes, inspect the affected page file end-to-end (head + tail).

## 8. Heredoc writer (when Write/Edit corrupts files)

Symptoms: trailing null bytes, mid-line truncation. Always re-run after big edits:

```bash
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) | while read f; do
  c=$(tr -d -c '\0' < "$f" | wc -c)
  if [ "$c" -gt 0 ]; then tr -d '\000' < "$f" > "$f.tmp" && cat "$f.tmp" > "$f"; fi
done
```

When the Write tool produced a broken file, rewrite via `cat > path << 'EOF' … EOF` in bash. That always lands cleanly.

## 9. Safety rules

- Never call setState from inside another component's setState updater (React 19 will warn). Defer via `useEffect`.
- Notifications: dedupe via `useRef<Set<string>>`. Don't re-fire on every render.
- LocalStorage hydration must run inside `useEffect` and gate writes on `isHydrated`.
- Never disable the redirect guard in `AppShell` unless the page is part of onboarding (pass `requireIntent={false}`).
- Don't add network calls. Everything is in-memory + localStorage.

## 10. Asking-questions protocol

Ask the user (via `AskUserQuestion`) when:
- A task touches 3+ files AND the requirement is genuinely ambiguous.
- You're about to delete or rename something user-facing.
- A new color / token / library is proposed.

Otherwise: state assumptions briefly in the response, proceed, and offer to adjust.

## 11. Maintenance — keep this file alive

When you do any of the following, edit this CLAUDE.md in the same commit:
- Add a new top-level route under `src/app/`.
- Add a new context / provider.
- Add or rename a token in `globals.css` or `lib/themes.ts`.
- Change a public hook return shape.
- Move a folder.

Keep the file under 200 lines. If it grows, compress §3 first by collapsing related entries.

## 12. End goal

Career OS is a candidate-centered career intelligence platform: hidden
growth loop, real-time portfolio CV, target-job readiness, job-match
alerts, life-chapter timetable. Optimize every change for the loop:
**signals in → profile evolves → trajectory updates → opportunities
surface → visibility rises → AI recommends → progress advances →
loop.** If a change doesn't strengthen that loop, ask whether it
belongs.
