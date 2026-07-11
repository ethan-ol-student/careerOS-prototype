# Judge demo script

A step-by-step walkthrough for evaluating Career OS. Total time: ~10 minutes.
Every button below signs you into a pre-seeded demo account — no signup, no
setup, and nothing you do touches real users.

**Prerequisite:** the deployment has `NEXT_PUBLIC_ENABLE_JUDGE_DEMO=true`
(safe for production — it exposes only the demo experience, never the dev
harness) and the database has been seeded (`npm run db:seed`).

## 1. Entry (30 seconds)

1. Open the homepage. Note the three hero CTAs — the **Judge Demo** button
   is the outlined one.
2. Click **Judge Demo** → you land on `/judge`, a numbered hub with four
   one-click views.

## 2. Guided tour (2 minutes)

Click **Start tour** (step 1). You're signed in as the `judge` candidate
and walked through the product's core loop with an overlay. Exit any time —
the other hub buttons re-sign you in as needed.

## 3. The candidate ↔ employer loop (3 minutes)

1. From `/judge`, click **Candidate view** → the four-question cockpit
   dashboard (What are you / Where are you / What's possible / How do I
   get there), with a persistent left sidebar for every candidate surface.
   - Menu → **Jobs**: every job carries a personal, explainable match score.
   - Open any job → **Easy apply** → menu → **My Applications**: your
     application appears with a live status timeline.
2. Back to `/judge` (or homepage → Judge Demo), click **Employer view** →
   the marketplace. Open any candidate card:
   - The **working-style tag** carries a bias-check tooltip (context, never
     a filter).
   - The detail view shows **Employer intelligence**: hiring confidence with
     named factor weights, strengths, risks to probe, and an interview kit
     targeted at those risks.
   - **Applicants** (menu) → set a status on an application → it appears on
     the candidate's timeline instantly.

## 4. The mid-career walkthrough — the centerpiece (4 minutes)

From `/judge`, click **Open Career Health** (lands directly on
`/candidate/career-health`; also reachable from the cockpit's "How do I
get there?" card). You're now "Jordan Reyes," a 35+ staff engineer with 12
years of seeded history. This view is the CareerOS 35+ thesis: *your
second career does not start from zero.*

Walk the cards top to bottom:

1. **Career Health Score** — one number, decomposed into skill maintenance,
   specialization, and direction meters. Click **"Why this
   recommendation?"** — every score in the product carries this expander.
2. **Skill relevance** — maintained vs. at-risk skills, with decay exposure.
3. **Fair Pay & Life Impact** — Jordan's (private) salary vs. a curated,
   cited benchmark: percentile band, take-home delta, life-factor notes
   (remote-only, caregiver), and a smart/balanced/risky verdict. Note the
   "Demo data" label — honesty is a feature.
4. **Best next move + Top skill gaps** — the highest-coverage role and the
   exact gap, plus one recommended action this month.
5. **Career Story Map** — the timeline read as *proof of capability*:
   pattern detection ("specialist") and hidden strengths pulled from
   problems Jordan solved, not job titles.
6. **Transferable Skill Map** — "Same skill, different door": coverage
   meters against nearby roles.
7. **Next Move Navigator** — three explainable pathways (Stay & grow /
   Move company / Change role), each with confidence, difficulty, salary
   impact, time, and its own "Why?".
8. **Skill Bridge Plan** — the minimum upgrade: what's already in place vs.
   the exact skills to close.

Also notice the **calm, editorial presentation** (larger type, no glow
effects, a quiet *Monthly* Career Check-Up instead of daily streaks) — the
age-adaptive UI. In Settings → **Dashboard style** you can flip it to the
vibrant mode younger phases get; it's a preference, never locked to age.

As a judge account, everything is unlocked. Real free-tier users see three
Pro teasers here (Fair Pay report, Skill Bridge detail, PDF export) — see
`/pricing` for the freemium framing (Career Health Score always stays free).

## 5. Wrap-up checks (1 minute)

- Homepage → the **"Try the real engine"** widget in the 35+ section: toggle
  skills, watch the deterministic skill-bridge engine re-score live.
- On Android/Chrome: the app is installable (PWA) — install and relaunch
  standalone.
- `/leaderboard`, `/companies`: curated, cited, demo-labelled data
  everywhere; salary inputs are private and never shown to employers.

## Demo accounts (reference)

| Account | Purpose |
|---|---|
| `judge` | Guided tour + candidate/employer role switching |
| `demo-midcareer` | The 35+ Career Health walkthrough (password `demo`, but use the hub buttons) |

Local development only: `admin123`/`admin` + `/dev/test-mode` exist behind
`NEXT_PUBLIC_ENABLE_TEST_MODE=true`, which stays OFF in production.
