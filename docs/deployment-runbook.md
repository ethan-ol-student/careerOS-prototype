# Deployment runbook

How Career OS deploys, step by step. Assumes Vercel (GitHub integration,
auto-deploy on push to `main`) + Neon Postgres. CI (`.github/workflows/ci.yml`)
gates every push with lint + engine checks + build and needs no secrets;
migrations are applied **out-of-band by hand** (below), never by CI/Vercel.

## 1. Environment variables

Set in **Vercel → Project → Settings → Environment Variables** (Production
scope). `NEXT_PUBLIC_*` values bake in at **build time** — changing one
requires a redeploy.

| Variable | Required | Value / notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon **pooled** connection string |
| `DIRECT_URL` | ✅ | Neon **direct** connection string (migrations) |
| `AUTH_SECRET` | ✅ | Long random value. The app **fails closed** without it in production |
| `SEED_DEMO` | recommended | `true` to seed the demo catalog (labelled `isDemo`); `false` to skip |
| `NEXT_PUBLIC_ENABLE_JUDGE_DEMO` | for judging | `true` — safe in prod: exposes ONLY the Judge Demo button, `/judge`, and demo-login for the 2 seeded demo accounts |
| `NEXT_PUBLIC_ENABLE_TEST_MODE` | ❌ **never in prod** | Unlocks the full dev harness + weak `admin123` account. Local dev only |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for SSO | From Google Cloud Console; SSO routes 404 without both |
| `GOOGLE_REDIRECT_URI` | optional | Only if the visible host differs (proxy/tunnel); defaults to `<origin>/api/auth/google/callback` |
| `NEXT_PUBLIC_ENABLE_GOOGLE_SSO` | for SSO | `true` shows the "Continue with Google" button |
| `NEXT_PUBLIC_ENABLE_DEMO_CHAT` | ❌ | Keep `false` in production |
| `NEXT_PUBLIC_API_BASE_URL` | optional | Leave blank (same-origin) |

No billing env vars exist — the freemium upgrade is a mock local flow by
design (real payments are post-deploy scope).

## 2. Database migrate + seed

Run locally against the production Neon branch (set the two URLs in your
shell or `.env`):

```bash
npx prisma migrate deploy   # applies pending migrations, additive-only
npm run db:seed             # idempotent; SEED_DEMO=false skips demo catalog
```

Notes:
- All migrations in this repo are additive (`CREATE TABLE` / `ADD COLUMN`
  with defaults) — no destructive statements. Verify with a glance at the
  new files under `prisma/migrations/` before deploying.
- The seed always provisions the two demo accounts (`judge`,
  `demo-midcareer`) — needed for the Judge Demo — regardless of `SEED_DEMO`.
- Neon cold-starts can fail the first connection; just re-run.

## 3. Deploy

Push to `main` (or merge a PR). CI must be green; Vercel auto-builds and
deploys. To change only env vars: Deployments → ⋯ → **Redeploy**.

## 4. Smoke test (production URL)

Run top to bottom; each item is ~30 seconds.

- [ ] Homepage renders: 3 CTAs + Judge Demo button, 35+ section with the
      live engine widget, trust band, pricing link works.
- [ ] Sign up (email) → onboarding → dashboard. Sign out → log in again.
- [ ] Google SSO (if enabled): fresh Google account → role select →
      onboarding; existing account → straight to dashboard. Password login
      still works.
- [ ] Jobs → open one → Easy apply → My Applications shows the timeline.
- [ ] Employer: marketplace renders, candidate detail shows Employer
      intelligence, Applicants status change lands on candidate timeline.
- [ ] Judge Demo → all four hub buttons land signed-in (tour, candidate,
      employer, **mid-career Career Health**).
- [ ] Mid-career journey as the demo user: every card populated; "Why this
      recommendation?" opens; salary stays private.
- [ ] Freemium: as a fresh (non-judge) user on the mid-career phase, the
      Fair Pay + Skill Bridge cards show locked teasers and the resume PDF
      button says Pro; `/pricing` mock-upgrade unlocks them.
- [ ] Adaptive UI: Settings → Dashboard style — flip Calm/Vibrant/Auto,
      reload, preference persists.
- [ ] PWA (Android/Chrome): install prompt or menu → Install app; launches
      standalone; Lighthouse PWA audit passes installability.
- [ ] `/dev/test-mode` returns **404** and `admin123` login does nothing
      special (test mode off).

## 5. Rotate secrets (deploy day)

- Generate a fresh `AUTH_SECRET` for production (never reuse dev). Rotating
  it invalidates all sessions — do it BEFORE announcing the URL.
- If Google OAuth credentials were ever pasted anywhere outside
  `.env.local`/Vercel, rotate them in Google Cloud Console → Credentials.

## 6. Rollback

Vercel dashboard → **Deployments** → pick the last good deployment → ⋯ →
**Promote to Production**. Instant, no rebuild. Database: migrations are
additive, so old code runs fine against the new schema — no down-migrations
needed for rollback.
