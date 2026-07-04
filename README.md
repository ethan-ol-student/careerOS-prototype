<p align="center">
  <img
    src="https://github.com/user-attachments/assets/9a2526d7-153b-45a7-8ff3-773198a8489c"
    alt="CareerOS Logo"
    width="442"
  />
</p>

# CareerOS 🚀

CareerOS is a career intelligence prototype that helps **Candidates** build direction, evidence, and momentum. It then turns those signals into an **Employer-facing marketplace** for discovering talent by trajectory, readiness, and fit.

## Big Idea 💡

CareerOS connects career growth with hiring discovery:

1. 🎯 Candidates move through phase-based career growth.
2. 📁 CareerOS captures skills, projects, milestones, planning, and readiness.
3. 🔎 Employers discover talent by trajectory, evidence, readiness, and fit.
4. 💬 Candidates and Employers connect through marketplace actions and messaging.

## Product Surfaces 🧭

### Candidate Experience 👤

- 📊 Phase-driven dashboard: `/candidate/dashboard`
- Six career phases:
  - Student
  - Young Adult
  - Early Career
  - Mid-Career
  - Senior Career
  - Executive
- 💼 Jobs with explainable match scores: `/jobs` → Easy apply
- 📋 Application tracker with status timelines: `/candidate/applications`
- 🏢 Company responsiveness leaderboard: `/companies`
- 📄 Resume / Career Report with PDF export + versions: embedded in `/candidate/portfolio` (old `/candidate/resume` redirects)
- 🧠 Working-style profile (descriptive, never a filter): `/candidate/personality`
- 🏆 University employability leaderboard (curated, cited): `/leaderboard`
- 🧾 Living Portfolio: `/candidate/portfolio`
- 🗺️ Life Chapter Designer: `/candidate/chapters`
- 🌱 Career Second Act Lab (senior phases): `/candidate/second-act`
- 💬 Candidate messages: `/candidate/messages`
- ⚙️ Settings: account, privacy, discovery, and **Dashboard style** (age-adaptive UI override)

### 🌟 Mid-Career Career Health suite (the 35+ centerpiece)

For the `mid-career`/`senior-career`/`executive` phases the dashboard
reshapes into a calm, editorial **Career Health home** — *"your second
career does not start from zero"*:

- ❤️ Career Health Score (skill maintenance + specialization + direction)
- 🛡️ Skill relevance: maintained vs. at-risk, decay exposure
- ⚖️ Fair Pay & Life Impact calculator (private salary vs. cited benchmarks)
- 🧭 Best next move + Top-3 skill gaps + one recommended action per month
- 🗺️ Career Story Map (pattern detection + hidden strengths)
- 🚪 Transferable Skill Map ("Same skill, different door")
- 🛤️ Next Move Navigator (safe / growth / bold pathways)
- 🌉 Skill Bridge Plan (the minimum skill upgrade)
- ❓ Every card carries a **"Why this recommendation?"** expander — all
  scores come from deterministic, CI-checked engines (`src/lib/intelligence/*`)

### Employer Experience 🏢

- 🚪 Employer onboarding
- 🛒 Marketplace: `/employers/marketplace`
- 🧩 Candidate cards with working-style tags (bias-check note included)
- 🔬 Employer intelligence: hiring confidence, strengths/risks, interview kit
- 📥 Applicant review with status flow: `/employers/applicants`
- ⭐ Saved candidates
- ✉️ Invite/contact flow
- 💬 Employer messages
- 🔔 Employer notifications and settings

## Judge Demo 🧑‍⚖️

One click from the homepage: the **Judge Demo** button opens the `/judge`
hub — four one-click, pre-signed-in views (guided tour, candidate
dashboard, employer marketplace, and the **mid-career Career Health**
walkthrough as a seeded 35+ staff engineer). No credentials needed; the
hub's demo-login only works for the two seeded demo accounts, enforced
server-side via `User.isJudgeAccount`.

Enable it with `NEXT_PUBLIC_ENABLE_JUDGE_DEMO=true` — **safe for
production**: it exposes only the demo experience, never the dev harness
(which stays behind `NEXT_PUBLIC_ENABLE_TEST_MODE`, local-only).

👉 Full walkthrough script: [`docs/judge-demo-script.md`](docs/judge-demo-script.md)

## Current Functional Features ✅

- 🔐 First-party username/email + password authentication
- 🔑 Google SSO (PKCE + verified-email account linking, mints the same session)
- 🍪 Signed HTTP-only JWT session cookie
- 👥 Candidate and Employer account roles
- 💼 Full jobs → apply → application-timeline → employer-status loop
- 🧮 Eleven deterministic, explainable intelligence engines (CI-checked)
- 🎮 Age-tuned gamification: daily streaks/XP for younger phases, a quiet Monthly Career Check-Up for 35+
- 🎨 Age-adaptive UI (calm/editorial vs. vibrant) with a persisted Settings override
- 💎 Freemium gates (mock billing): Career Report PDF, Fair Pay report, Skill Bridge plan — Career Health Score always free
- 📱 Installable PWA (manifest + generated icons + minimal service worker)
- 🎯 Candidate onboarding and dashboard personalization storage
- 🏢 Employer onboarding and hiring preference storage
- 🗄️ Prisma-backed PostgreSQL persistence
- 📡 Candidate profile, portfolio, chapters, notifications, and settings APIs
- 📡 Employer profile, goal, saved candidates, invited candidates, notifications, and messages APIs
- 🛒 Marketplace candidate catalog with seeded demo candidates
- 👀 Candidate discovery opt-in for projecting real candidates into the marketplace
- 🚧 Role-based route gating in Candidate and Employer app shells
- 🧑‍⚖️ Judge-only route protection using `User.isJudgeAccount`
- 🧪 Judge demo seed data isolated from real user data
- 🛡️ CSRF/origin protection for mutating API routes
- 🧹 Local cache scoping by active user to reduce cross-account data leaks on shared browsers

## Prototype / Demo Features 🧪

These features are usable for demos, but are not production-complete:

- 📈 Match score and readiness score are explainable prototype signals, not a production AI model
- 🌱 Candidate recommendation logic is early-stage and partly seeded/demo-driven
- 💳 "Upgrading to Pro" is a mock flow (instant, no payment processor) — real billing is post-deploy scope
- 💰 Salary benchmarks and university scores are curated, cited demo data, always labelled
- 🧑‍⚖️ Candidate phase simulation in the judge tour is scoped to judge demo state
- 📊 Some dashboard widgets show mock or derived values where backend signals are not complete yet
- 💬 Messaging demonstrates the Candidate-Employer bridge, but is not a full production messaging platform

## Planned Later 🛣️

- 🤖 Real AI recommendation engine
- 🎯 Stronger backend matching and scoring
- ✅ Portfolio evidence verification
- 🔁 Cross-device milestone persistence
- 📊 Deeper Employer analytics dashboard
- ✨ Automated task generation for Candidate planning
- 💬 Richer production messaging features
- 📈 More advanced Candidate readiness and career trajectory modeling
- 🛠️ Stronger audit/admin tooling for demo data resets and judge evaluation workflows

## Tech Stack 🧰

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6
- PostgreSQL / Neon
- bcryptjs for password hashing
- jose for signed sessions
- lucide-react icons

## Local Setup 🏗️

Install dependencies:

```powershell
npm install
```

Create local environment files from `.env.example`.

Required environment variables:

```text
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
```

Optional variables (see `.env.example` for full annotations):

```text
SEED_DEMO=true                      # seed the labelled demo catalog
NEXT_PUBLIC_API_BASE_URL=           # blank = same-origin
NEXT_PUBLIC_ENABLE_DEMO_CHAT=false
NEXT_PUBLIC_ENABLE_JUDGE_DEMO=false # judge demo (prod-safe)
NEXT_PUBLIC_ENABLE_TEST_MODE=false  # full dev harness (local ONLY)
GOOGLE_CLIENT_ID=                   # Google SSO (routes 404 without both)
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=                # optional host override
NEXT_PUBLIC_ENABLE_GOOGLE_SSO=false # shows the Google button
```

Generate a local `AUTH_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run migrations locally:

```powershell
.\node_modules\.bin\prisma.cmd migrate dev
```

Seed demo and judge data:

```powershell
npm.cmd run db:seed
```

Start the app:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Production Deployment Notes 🚢

👉 **Full step-by-step guide:** [`docs/deployment-runbook.md`](docs/deployment-runbook.md)
(env-var table, migrate/seed steps, smoke-test checklist, rollback plan).

Set production environment variables in the deployment provider, not in Git:

```text
DATABASE_URL=<Neon pooled connection string>
DIRECT_URL=<Neon direct connection string>
AUTH_SECRET=<strong random secret>
SEED_DEMO=true                       # or false to skip demo catalog
NEXT_PUBLIC_ENABLE_JUDGE_DEMO=true   # prod-safe judge demo
NEXT_PUBLIC_ENABLE_DEMO_CHAT=false
NEXT_PUBLIC_ENABLE_TEST_MODE=false   # NEVER true in production
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXT_PUBLIC_ENABLE_GOOGLE_SSO=true
```

For Neon + Prisma:

- `DATABASE_URL` should start with `postgresql://` or `postgres://`
- `DIRECT_URL` should start with `postgresql://` or `postgres://`
- Do not paste `DATABASE_URL=` into the value field on Vercel
- Do not commit `.env` or `.env.local`

Apply production migrations:

```powershell
.\node_modules\.bin\prisma.cmd migrate deploy
```

Seed production demo/judge data when appropriate:

```powershell
npm.cmd run db:seed
```

## Important Security Notes 🛡️

- `.env` and `.env.local` are ignored and must never be committed
- `.env.example` is safe to commit because it contains placeholders only
- `AUTH_SECRET` is required in production
- Judge access is based on `User.isJudgeAccount`
- Judge routes are checked server-side before rendering
- The judge account should not be granted admin/dev powers
- Dev/test routes are gated by `NEXT_PUBLIC_ENABLE_TEST_MODE`; keep this disabled in production
- If a real connection string or secret is ever committed or shared, rotate it immediately

## Useful Commands ⚡

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
npm.cmd run check:intelligence   # deterministic engine assertions (runs in CI)
npm.cmd run check:demo           # pins the judge-facing demo numbers (needs DB)
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\prisma.cmd validate
.\node_modules\.bin\prisma.cmd migrate deploy
npm.cmd run db:seed
```

CI (`.github/workflows/ci.yml`) gates every push with lint + engine checks +
build — no secrets required. Deploys go through Vercel's GitHub integration;
migrations are applied manually (see the runbook).
