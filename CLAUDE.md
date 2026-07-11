# CLAUDE.md — Career OS

Career OS is a **Next.js 16 (App Router) / React 19 / Tailwind v4** SPA-style prototype
for a two-sided "career intelligence" product (Candidates + Employers), backed by
**Prisma + Neon Postgres**. It ships in **dark mode**.

## Commands

```bash
npm run dev          # local dev (Turbopack)
npm run build        # production build (also runs TS typecheck)
npm run lint         # eslint (next core-web-vitals + ts)
npx tsc --noEmit     # typecheck only
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed marketplace Candidate pool (tsx prisma/seed.ts)
npm run db:studio    # prisma studio
npm run check:intelligence  # deterministic engine assertions (runs in CI)
```

No unit/E2E test runner is configured (no jest/vitest/playwright). Validate changes with
`npm run lint` + `npm run build`, plus the deterministic `check:*` scripts (tsx-run
assertion suites): `check:intelligence` (in CI), `check:cv`, `check:skills`, `check:market`,
`check:applications`, `check:job-lifecycle`, `check:week2`, `check:demo`.

## Architecture

- **Auth/session**: JWT (`jose`) in an httpOnly cookie `career-os-session`, signed with
  `AUTH_SECRET`. Helpers in `src/lib/auth/session.ts` (`signSession`, `setSessionCookie`,
  `readSession`, `clearSessionCookie`) and `src/lib/auth/password.ts` (bcrypt). Routes:
  `/api/auth/{signup,login,logout,me}` + optional Google SSO
  (`/api/auth/google/{start,callback,role}`, flag-gated by `NEXT_PUBLIC_ENABLE_GOOGLE_SSO`
  and 404 without server creds — mints the SAME session cookie). `src/lib/api/currentUser.ts` resolves the caller
  (`getAuthUser`, `getCurrentCandidateProfile`, `getCurrentEmployerProfile`) from the session —
  **all `/api/me*` and `/api/employer*` routes are scoped to the session user; never trust a
  client-supplied user id.**
- **DB conventions** (`prisma/schema.prisma`): one `User` (role `CANDIDATE|EMPLOYER`) with
  optional `candidateProfile`+`candidatesAI` and/or `employerProfile`+`employersAI`. Enum-like
  values (severity, kind, careerStage, …) are stored as **`String`**, not Postgres enums — the
  **TS layer is the source of truth** for legal values. Don't add Postgres enums.
- **Career phase** = `CandidatesAI.careerStage` (the dashboard's "current_phase"). Stored
  hyphenated (`student`, `young-adult`, `early-career`, `mid-career`, `senior-career`,
  `executive`); normalize via `normalizeCareerPhase()` in `src/lib/dashboard/phaseConfig.ts`
  to the underscore `CareerPhase` union.
- **Routing**: App Router under `src/app`. `src/middleware.ts` exists but ONLY enforces CSRF
  (cross-origin checks on mutating `/api/*`) — it does not gate pages. Route protection lives
  in client shells (`AppShell` for candidates, `EmployerAppShell` for employers) that gate on
  `useAuth` and redirect (no user→`/auth`, wrong role→the other side, un-onboarded→onboarding).
- **API response shape**: `{ ok: true, data }` / `{ ok: false, error }` via
  `src/lib/api/respond.ts` (`ok`, `failFromCode`, `failFromUnknown`).
- **Contexts/hooks** (`src/lib/context`, `src/lib/hooks`): `useAuth`, `useIntent`,
  `usePortfolio`, `useChapters`, `useNotifications`, `useCandidatesAI`. All hydrate
  **cache-first** from `localStorage` (`career-os-*` keys) then fetch the authoritative server
  value — local storage is only a paint cache, never the source of truth. Hydration is
  **auth-keyed**: every provider's load effect depends on `[authStatus, userId, userRole]`
  (providers mount at the root layout, i.e. while still signed out on /auth), fetches only
  for its own role, and resets to a clean slate when signed out — so login/logout/account
  switch rehydrates WITHOUT a manual page reload. Keep that dependency array intact.
  Employer home is `/employers/dashboard` (login, onboarding completion, and role bounces
  all land there).
- **Dashboard (cockpit)**: `/candidate/dashboard` renders the four-question cockpit
  (`MainDashboardWrapper` → `CockpitDashboard`): What are you / Where are you / What's
  possible / How do I get there — one screen, each card deep-links into the owning module.
  Mid-career+ "How do I get there" links to `/candidate/career-health`, which hosts the full
  `CareerHealthHome` suite (Fair Pay + Skill Bridge freemium gates live THERE; the judge
  demo's mid-career button lands there directly). The old registry-pattern phase dashboards
  were DELETED (phaseConfig is display metadata only: label/purpose/accent/density); the
  judge tour renders the cockpit too. `AppShell` is a zero-scroll 100dvh frame: header
  (logo slot mirrors the sidebar width) + persistent `CandidateSidebar` (desktop; the
  TopMenu dropdown's nav groups are mobile-only, its Settings/account stay everywhere) +
  an internally-scrolling content region — this frame wraps every candidate page.
- **Onboarding completion is DB-backed** (the source of truth): candidate =
  `CandidatesAI.onboardingCompleted`, employer = `EmployerProfile.hasCompletedOnboarding`.
  Both are read by `GET /api/auth/me` and gated in `AppShell`/`EmployerAppShell` via `useAuth`
  — never from localStorage. `login()`/`signup()` in `AuthContext` MUST hydrate via
  `refresh()` (which fetches `/api/auth/me`), NOT a partial `setUser` — the login/signup API
  responses carry only `user`, so a partial update leaves the onboarding flags stale and the
  post-login redirect bounces already-onboarded users into onboarding until a manual reload.
  The employer onboarding-data PATCH flips BOTH `EmployersAI` and
  `EmployerProfile.hasCompletedOnboarding` in a transaction. Onboarding pages accept `?edit=1`
  (read post-mount; guard waits for `editChecked`) so Settings can edit answers without
  restarting; edit-submit returns to `/{role}/settings`.
- **Primary keys = `cuid()`** (opaque, non-sequential, collision-resistant — UUID-equivalent
  for security). One-profile/AI-per-user is enforced by `@unique userId`; FK ownership +
  query indexes already exist. Do NOT migrate PKs to native UUID (destructive rewrite of all
  keys/FKs over existing data); add fields additively only.
- **Messages ≠ notifications**: chat lives in `ChatConversation`/`ChatMessage`; notifications
  live in `EmployerNotification`/`CandidateNotification`. Marking notifications read never
  touches messages, and each side links the two separately. Chat is now fully two-sided and
  server-backed: employers use `/employers/messages` (+ `GET /api/employer/messages`) and
  candidates use `/candidate/messages` (+ `GET /api/me/conversations`, reply via
  `POST /api/me/conversations/[id]`). Conversations are keyed to the candidate's marketplace
  mirror (`Candidate.id = real-<userId>`), so an employer invite opens a thread that surfaces
  in the real candidate's inbox. (Simulated candidate auto-replies are demo-only, gated by
  `NEXT_PUBLIC_ENABLE_DEMO_CHAT`.)
- **Jobs/applications loop**: `Job`+`Company` catalogue (`/jobs`, `/companies`, seeded from
  `prisma/data/*.csv`) → candidate applies (`POST /api/jobs/[id]/apply`) → `Application` +
  append-only `ApplicationEvent` timeline (`/candidate/applications`) → employer sets status
  (`/employers/applicants`, `PATCH /api/employer/applications/[id]`). Company responsiveness
  metrics (`companies.service.ts`) become real from application statuses; zero-applicant
  companies show a deterministic seeded score labelled "Demo data". Employers also POST their
  own jobs (`/employers/post-job`, `JobPostForm` → `POST /api/employer/jobs`): 3–5 weighted
  skills (`skillWeights`) + requirements land in the public `/jobs` feed immediately (skill
  names normalized so the match engines still work). `jobs.service.ts` owns the post
  lifecycle — soft-delete only (`status` `active|expired|fulfilled`, 30-day TTL, expire-on-read
  sweep); a post auto-fulfills once an application on it hits `offer` AND a message has been
  exchanged between the two parties.
- **Intelligence engines** (`src/lib/intelligence/*`): every engine returns the shared
  explainable `ScoreResult` (`score` + `reasons[]` + optional `factors[]`/`uncertainty`) —
  match, readiness, career health, transferable skills, skill bridge, fair pay (+ life
  impact), career story, personality quiz, employer candidate insight, next-move simulator.
  Pure + deterministic; checks in `__checks__/engines.check.ts` run in CI
  (`npm run check:intelligence`). The mid-career/senior/executive dashboards render
  `CareerHealthHome` (Career Health home + Next Move Navigator + Fair Pay calculator)
  wired to these engines, fed by `GET /api/me/mid-career` + `GET /api/me/fair-pay`.
- **Skills Truth (flagship)**: `/candidate/skills` cockpit — 3-tier trust on every skill
  (`SkillClaim`: 1 self-claimed ×0.5, 2 evidence-backed ×0.8, 3 endorsed ×1.0; tier DERIVED
  server-side in `/api/me/skills` from evidence/endorsement, never client-set). Weights +
  radar axes + gaps + ONE next step from `skillTruthEngine` (`scoreSkillTruth`, CI-checked:
  endorsed expert must outrank identical self-claim). `SkillRadar` = hand-rolled SVG (no chart
  dep): luminous polygon vs dashed neutral requirement ring. `CandidateProfile.skills` stays
  the mirror of claim names (compatibility view for all existing engines/marketplace); GET
  self-heals plain skills into tier-1 claims. Taxonomy + resume-paste extractor (deterministic,
  no LLM) in `src/lib/skills/taxonomy.ts`.
- **Personality (Feature 2)**: `/candidate/personality` quiz scored DETERMINISTICALLY by
  `personalityEngine.ts` (`scoreQuiz`, `QUIZ_QUESTIONS`) into one working-style archetype
  (via `POST /api/me/personality`), archetype defs in `scoringConfig.ts` (`ARCHETYPES`),
  persisted to `PersonalityResult`. DESCRIPTIVE ONLY — never a match-score input, never a
  filter; employer surfaces carry a Bias Check note. The archetype mirrors onto
  `Candidate.archetype` (marketplace tag).
- **Gamification** (`gamification.service.ts`, `XpLedger`/`Streak`/`Badge`): one deliberate
  action (`POST /api/me/checkin`) per period; cadence is age-tuned — daily for younger
  phases, quiet **Monthly Career Check-Up** for mid-career+ (`cadenceForPhase`). Streaks
  bridge one missed period (forgivable); XP only for real actions. Surface = the compact
  `StreakChip` in the AppShell top nav (flame/calendar + check-in button).
- **Leaderboard**: `/leaderboard` + `GET /api/leaderboard` — curated, cited `University`
  rows (CSV-seeded, demo-labelled). Never ranks or exposes real users.
- **Age-adaptive UI (Feature 14)**: `PhaseDashboardConfig.density` ("calm" for
  mid-career+, "vibrant" for younger) + `CandidateProfile.uiDensity` override
  (Settings → Dashboard style, `GET/PATCH /api/me/ui-density`). Resolution in
  `src/lib/dashboard/uiDensity.ts` (`resolveUiDensity`, mirrors `cadenceForPhase`);
  `CockpitDashboard` sets `data-ui-density`; calm styles live in `globals.css`
  (readability UP, decorative glows OFF, contrast untouched). Never locked to age.
- **Freemium (Feature 15, MOCK billing)**: `Subscription` model (`plan` "free"|"pro",
  TS truth in `src/lib/billing/plans.ts`); `entitlements.ts` (`requireEntitlement` throws
  `PaymentRequiredError`→402, `checkEntitlement` for field redaction); judge bypass =
  `isJudgeAccount` inside `resolveIsPro`. Exactly 3 Pro gates: resume PDF
  (`/api/me/resume/pdf`), Fair Pay report (`/api/me/fair-pay` + `benchmark` redacted in
  `/api/me/mid-career`), Skill Bridge detail (`topJobs[].missing/reasons` redacted; coarse
  `score`/`matched`/`gapCount` stay free). Career Health Score is always free. Upgrade =
  `POST /api/me/subscription` (mock, no processor). UI: `UpgradeModal`, `/pricing`.
- **Judge demo flag (DECOUPLED)**: `isJudgeDemoEnabled()` in `testMode.ts` —
  `NEXT_PUBLIC_ENABLE_JUDGE_DEMO` (prod-safe: homepage button + `/judge` + demo-login for
  the 2 seeded demo accounts only) OR full test mode. The dev harness/admin123 stays
  behind `NEXT_PUBLIC_ENABLE_TEST_MODE` (never in prod).
- **PWA (Feature 11)**: `src/app/manifest.ts`, icons generated via `ImageResponse`
  (`src/lib/pwa/brandIcon.tsx` → `/icons/[size]` + `apple-icon.tsx`, no binary assets),
  minimal `public/sw.js` (shell cache-first, navigations network-first, `/api/*` NEVER
  cached), `PwaProvider` in the root layout (SW registration + install banner).
- **Resume (Living Portfolio)**: merged into `/candidate/portfolio` (old `/candidate/resume`
  redirects there) + `GET /api/me/resume{,/pdf,/versions}`. The page hosts the clickable
  completeness checklist (deep-links into `PortfolioBuilder` sections / the problems-solved
  editor via `CompletenessItem.key`), saved versions, and the PDF export (100%-complete +
  Pro gated). PDF via `@react-pdf/renderer` (Node runtime), template in
  `src/lib/resume/pdfTemplate.tsx`; `ResumeVersion` stores named JSON snapshots. Mid-career
  resumes lead with `MidCareerProfile.problemsSolved` (proof of capability — editable on the
  portfolio page, PATCHed via `/api/me/mid-career`).
- **Settings**: `/candidate/settings` + `/employers/settings` (mode-aware, shells gate them).
  Shared sections in `src/components/settings/*`. `PATCH/DELETE /api/account` edits safe user
  fields / deletes the account (password re-entry, cascades, clears session — real, not faked).
  `GET/PATCH /api/employer/profile` for `organizationName`. Both menus include a Settings item.

## Styling system

**The full design system lives in `.claude/skills/career-os-design/SKILL.md` — read it
before building or restyling ANY UI.** (Canonical visual reference: the "Career-OS Design
System" claude.ai/design project.) Short version: semantic tokens only — `text-luminous`
(#4d7aff, candidate accent) + `text-luminous-soft`, `text-clover` (#4cbb55, employer accent)
+ `text-clover-soft`, `bg-brand` (marketing only). Two type voices: Inter for display/body,
**IBM Plex Mono for every small uppercase label** — eyebrows are
`font-mono text-xs font-semibold uppercase tracking-[0.18em]`. Glass surfaces
`glass-1`..`glass-5`, separators `line-t`/`line-b`. Cards = `glass-3 rounded-2xl p-6`.
Primary buttons are accent-gradient bevels, **role-aware**: employer shells set
`data-role-accent="employer"` and the shared `Button` default recolors to the clover CTA
(dark text) via `--btn-*` vars — never hardcode a green button. Score signals
(`ScoreBar`/`ProgressRing`) animate in at `1.1s cubic-bezier(0.22,1,0.36,1)`; match =
luminous, readiness = clover on both sides. Layout via `Grid12`+`Col` (12-col,
`span`/`md`/`lg`). Primitives in `src/components/ui` (`Button`, `Badge`, `Chip`,
`ScoreBar`, `ProgressRing`, `Select`, `Modal`, `LinkButton`) and shared `ConfirmDialog`.
Use `cn()` from `@/lib/utils`. Path alias `@/* → src/*`.

## Conventions

- Interactive components are `"use client"`. One-time set-state-in-effect needs
  `// eslint-disable-next-line react-hooks/set-state-in-effect`.
- Prefer reusing existing UI primitives over new ones.
- Keep strict TS clean (no `any`; use `unknown` + guards).

## Security & environment

- `AUTH_SECRET` — **required in production.** `src/lib/auth/session.ts` resolves the key
  lazily and throws if it's missing in prod (fail closed); a clearly-marked insecure
  fallback is used only in dev (with a console warning). Never ships a usable prod secret.
- Data adapter: the app is **online-only** — the HTTP/API backend is always the source of
  truth. A typed `httpAdapter` (`src/lib/api/httpAdapter.ts`) wraps the core
  profile/intent/portfolio/marketplace/chat calls (imported directly — no interface or
  factory in front of it); newer surfaces (auth, skills, applications, conversations, …) call
  `fetch` directly with the same `{ ok, data }` envelope. Prefer extending the adapter for the
  flows it already owns; don't add a competing abstraction.
- Local caches are **user+role scoped** (`src/lib/storage/appCache.ts`: `scopedCacheKey`,
  `currentScopedKey`). `AuthContext` publishes the active scope, purges all caches on
  account switch (`reconcileActiveUser`), and clears everything on logout
  (`clearAllAppCache`). The server fetch (cookie-scoped) is always the source of truth.
- API errors: `failFromUnknown` (`src/lib/api/respond.ts`) maps thrown errors to correct
  status — `UnauthorizedError`→401, `ForbiddenError`→403, `NotFoundError`→404,
  `ZodError`→400, Prisma→mapped, else 500. Production responses are generic (no `cause`,
  no stack, no Prisma internals); full detail is logged server-side only. Semantic error
  classes live in `src/lib/api/errors.ts`.
- CSRF: `src/middleware.ts` rejects cross-origin mutating (`POST/PUT/PATCH/DELETE`)
  `/api/*` requests via Origin/Referer host checks (403). Auth endpoints are rate-limited
  (`src/lib/auth/rateLimit.ts`, in-memory per-instance).
- Demo affordances are flag-gated: simulated chat replies need
  `NEXT_PUBLIC_ENABLE_DEMO_CHAT=true`; the marketplace demo fallback only triggers under
  test mode. See `.env.example` for all flags.

## Developer / Test Mode (DEV ONLY)

A self-contained testing harness lives under `src/{app,components,lib}/dev/*` and
`src/app/api/dev/*`. It is **gated by `NEXT_PUBLIC_ENABLE_TEST_MODE=true`** (see
`isTestModeEnabled()` in `src/lib/dev/testMode.ts`) and is invisible/404 in production.

- Route: `/dev/test-mode` (server `src/app/dev/layout.tsx` calls `notFound()` when the flag is
  off). **No public entry button** — access is via admin login: signing in as `admin123` while
  the flag is on redirects to `/dev/test-mode` (handled in `src/app/auth/page.tsx`; the auth
  page also seeds the account via `/api/dev/seed` before that login). In production the flag is
  off, so `admin123` is just a normal account and `/dev/test-mode` 404s — no backdoor.
- Seeded dev account: **`admin123` / `admin`** — created (hashed) **only** by the flag-gated
  `/api/dev/seed` with BOTH candidate + employer profiles so one account can test either mode.
  Never seeded in production; never weakens real auth.
- All `/api/dev/*` routes re-check the flag and operate **only on the test account** (resolved
  by username server-side) — they can't touch real users. They cover: session/mode, phase,
  onboarding flags, mock data seed/clear, and resets.
- Do NOT scatter test-only logic into product code — keep it in the `dev/` modules.
