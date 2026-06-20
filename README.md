# CareerOS

CareerOS is a career intelligence prototype that helps Candidates build career direction, evidence, and momentum, then turns those signals into an Employer-facing marketplace experience.

The core product idea is simple:

1. Candidates progress through phase-based career growth.
2. CareerOS captures skills, projects, milestones, planning, and readiness.
3. Employers discover talent by trajectory, evidence, readiness, and fit.
4. Candidates and Employers connect through marketplace actions and messaging.

## Product Surfaces

### Candidate

- Phase-driven dashboard at `/candidate/dashboard`
- Six career phases:
  - Student
  - Young Adult
  - Early Career
  - Mid-Career
  - Senior Career
  - Executive
- Living Portfolio at `/candidate/portfolio`
- Life Chapter Designer at `/candidate/chapters`
- Candidate messages at `/candidate/messages`
- Candidate settings, account, privacy, and discovery controls

### Employer

- Employer onboarding
- Marketplace at `/employers/marketplace`
- Candidate recommendation cards and profile details
- Saved candidates
- Invite/contact flow
- Employer messages
- Employer notifications and settings

### Judge Evaluation Tour

A dedicated judge-only guided product tour is available at:

```text
/judge/tour
```

Seeded judge credentials:

```text
username: judge
password: judge123
```

The judge account is protected by a backend/database flag, not by client-side username checks. Normal Candidate, Employer, Admin/dev, and anonymous users cannot access the judge tour.

The judge tour demonstrates:

- Candidate dashboard architecture
- All six Candidate phases
- Gatekeeper milestones
- Living Portfolio
- Life Chapter Designer
- Candidate messaging bridge
- Employer marketplace matching
- Candidate profile evaluation
- Save/invite flows
- Employer messages
- Functional vs prototype vs planned implementation notes

## Current Functional Features

- First-party username/email + password authentication
- Signed HTTP-only JWT session cookie
- Candidate and Employer account roles
- Candidate onboarding and dashboard personalization storage
- Employer onboarding and hiring preference storage
- Prisma-backed PostgreSQL persistence
- Candidate profile, portfolio, chapters, notifications, and settings APIs
- Employer profile, goal, saved candidates, invited candidates, notifications, and messages APIs
- Marketplace candidate catalog with seeded demo candidates
- Candidate discovery opt-in for projecting real candidates into the marketplace
- Role-based route gating in Candidate and Employer app shells
- Judge-only route protection using `User.isJudgeAccount`
- Judge demo seed data isolated from real user data
- CSRF/origin protection for mutating API routes
- Local cache scoping by active user to reduce cross-account data leaks on shared browsers

## Prototype / Demo Features

These features are usable for demos, but are not production-complete:

- Match score and readiness score are explainable prototype signals, not a production AI model
- Candidate recommendation logic is early-stage and partly seeded/demo-driven
- Candidate phase simulation in the judge tour is scoped to judge demo state
- Some dashboard widgets show mock or derived values where backend signals are not complete yet
- Messaging demonstrates the Candidate-Employer bridge, but is not a full production messaging platform
- Dev/test mode exists behind `NEXT_PUBLIC_ENABLE_TEST_MODE=true` and should stay disabled in production

## Planned Later

- Real AI recommendation engine
- Stronger backend matching and scoring
- Portfolio evidence verification
- Cross-device milestone persistence
- Deeper Employer analytics dashboard
- Automated task generation for Candidate planning
- Richer production messaging features
- More advanced Candidate readiness and career trajectory modeling
- Stronger audit/admin tooling for demo data resets and judge evaluation workflows

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Prisma 6
- PostgreSQL / Neon
- bcryptjs for password hashing
- jose for signed sessions
- lucide-react icons

## Local Setup

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

Optional public flags:

```text
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_USE_LOCAL_ADAPTER=false
NEXT_PUBLIC_ENABLE_DEMO_CHAT=false
NEXT_PUBLIC_ENABLE_TEST_MODE=false
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

## Production Deployment Notes

Set production environment variables in the deployment provider, not in Git:

```text
DATABASE_URL=<Neon pooled connection string>
DIRECT_URL=<Neon direct connection string>
AUTH_SECRET=<strong random secret>
NEXT_PUBLIC_USE_LOCAL_ADAPTER=false
NEXT_PUBLIC_ENABLE_DEMO_CHAT=false
NEXT_PUBLIC_ENABLE_TEST_MODE=false
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

## Important Security Notes

- `.env` and `.env.local` are ignored and must never be committed
- `.env.example` is safe to commit because it contains placeholders only
- `AUTH_SECRET` is required in production
- Judge access is based on `User.isJudgeAccount`
- Judge routes are checked server-side before rendering
- The judge account should not be granted admin/dev powers
- Dev/test routes are gated by `NEXT_PUBLIC_ENABLE_TEST_MODE`; keep this disabled in production
- If a real connection string or secret is ever committed or shared, rotate it immediately

## Useful Commands

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\prisma.cmd validate
.\node_modules\.bin\prisma.cmd migrate deploy
npm.cmd run db:seed
```

## Repository Status

This is an active prototype. It includes real auth, persistence, route protection, and demo-ready flows, but several marketplace intelligence and messaging features are intentionally marked as prototype or planned while the product model evolves.
