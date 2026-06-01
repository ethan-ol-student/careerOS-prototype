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
```

No test runner is configured. Validate changes with `npm run lint` + `npm run build`.

## Architecture

- **Auth/session**: JWT (`jose`) in an httpOnly cookie `career-os-session`, signed with
  `AUTH_SECRET`. Helpers in `src/lib/auth/session.ts` (`signSession`, `setSessionCookie`,
  `readSession`, `clearSessionCookie`) and `src/lib/auth/password.ts` (bcrypt). Routes:
  `/api/auth/{signup,login,logout,me}`. `src/lib/api/currentUser.ts` resolves the caller
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
- **Routing**: App Router under `src/app`. No middleware — route protection lives in client
  shells (`AppShell` for candidates, `EmployerAppShell` for employers) that gate on `useAuth`
  and redirect (no user→`/auth`, wrong role→the other side, un-onboarded→onboarding).
- **API response shape**: `{ ok: true, data }` / `{ ok: false, error }` via
  `src/lib/api/respond.ts` (`ok`, `failFromCode`, `failFromUnknown`).
- **Contexts/hooks** (`src/lib/context`, `src/lib/hooks`): `useAuth`, `useIntent`,
  `usePortfolio`, `useChapters`, `useNotifications`, `useCandidatesAI`. All hydrate
  **cache-first** from `localStorage` (`career-os-*` keys) then fetch the authoritative server
  value — local storage is only a paint cache, never the source of truth.
- **Dashboard**: ONE route `/candidate/dashboard` renders six phase layouts via a Registry
  Pattern. `MainDashboardWrapper` → `DashboardShell` → `PhaseDashboardRegistry` →
  `phases/*Dashboard`. Each phase includes a `GatekeeperChecklist`. See
  `src/components/dashboard/*` + `src/lib/dashboard/*`.
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
- **Messages ≠ notifications**: chat lives in `ChatConversation`/`ChatMessage`
  (`/employers/messages` + `GET /api/employer/messages`); notifications live in
  `EmployerNotification` (`/employers/notifications` + the bell). Marking notifications read
  never touches messages. The employer menu links both separately. The candidate menu's
  **Messages** item (`/candidate/messages`) is a clean placeholder (empty state) — the
  candidate↔employer chat bridge isn't backend-wired yet; it intentionally replaced the old
  non-functional "Engage with Employers" link.
- **Settings**: `/candidate/settings` + `/employers/settings` (mode-aware, shells gate them).
  Shared sections in `src/components/settings/*`. `PATCH/DELETE /api/account` edits safe user
  fields / deletes the account (password re-entry, cascades, clears session — real, not faked).
  `GET/PATCH /api/employer/profile` for `organizationName`. Both menus include a Settings item.

## Styling system

Semantic tokens only: `text-luminous` (#4d7aff, primary in-product accent), `text-clover`
(#4cbb55, success/growth), `bg-brand` (marketing only). Glass surfaces `glass-1`..`glass-5`,
separators `line-t`/`line-b`. Cards = `glass-3 rounded-2xl p-6`. Eyebrows =
`text-luminous text-xs font-semibold uppercase tracking-[0.18em]`. Layout via `Grid12`+`Col`
(12-col, `span`/`md`/`lg`). Primitives in `src/components/ui` (`Button`, `Badge`, `Chip`,
`ScoreBar`, `Modal`, `LinkButton`) and shared `ConfirmDialog`. Use `cn()` from `@/lib/utils`.
Path alias `@/* → src/*`.

## Conventions

- Interactive components are `"use client"`. One-time set-state-in-effect needs
  `// eslint-disable-next-line react-hooks/set-state-in-effect`.
- Prefer reusing existing UI primitives over new ones.
- Keep strict TS clean (no `any`; use `unknown` + guards).

## Security & environment

- `AUTH_SECRET` — **required in production.** `src/lib/auth/session.ts` resolves the key
  lazily and throws if it's missing in prod (fail closed); a clearly-marked insecure
  fallback is used only in dev (with a console warning). Never ships a usable prod secret.
- Data adapter: the HTTP/API backend is the **default** (`src/lib/api/adapter.ts`). The
  localStorage adapter is opt-in via `NEXT_PUBLIC_USE_LOCAL_ADAPTER=true` and is
  hard-blocked in production.
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
