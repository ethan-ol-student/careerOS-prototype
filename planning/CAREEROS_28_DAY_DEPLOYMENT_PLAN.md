# CAREEROS_28_DAY_DEPLOYMENT_PLAN.md

A realistic 28-day push to a **live, judge-ready deployment**. Build window: **Mon Jun 29 → Sun Jul 26, 2026** (matches the events on your Google Calendar). Each day: **Objective · Tasks · Output · Acceptance · Risk · Backup plan.** Daily blocks: **9–12 deep build · 2–5 implementation · 8–9 review/test.**

**Scope reality:** this plan ships **all P0 + the highest-value P1** (resume, feedback loop, jobs/company, judge demo, intelligence, personality, gamification MVP, SSO, age-adaptive MVP, freemium gates, PWA, seeded leaderboards). It **defers** native Android, live Stripe, real LLM, and full university analytics to post-deploy.

> **This revision** folds in the **CareerOS 35+** concept (uploaded idea doc) as a dedicated **Mid-Career (30–55+) Dashboard Adaptation track** — see the section directly below. The age-adaptive work (Day 22) and the candidate dashboard modules (Day 13) are re-scoped so that for users aged ~30–55+ the dashboard fully reshapes around mid-career reinvention needs rather than just reordering generic widgets.

---

## ⭐ Mid-Career (30–55+) Dashboard Adaptation track (from the CareerOS 35+ idea)

**Who it serves:** the existing `mid-career` (31–40), `senior-career` (41–55), and `executive` phases — the doc's "Stuck Professional," "Career Changer," and "Better-Fit Seeker." Core belief: *"Your second career does not start from zero."*

**Design principles for this group (override the younger-phase defaults):**
- **Calm, editorial, credibility-first** UI — not gamified, not loud. (Refines Feature 14.)
- **Monthly/weekly "Career Check-Up" cadence, never daily nagging.** Gamification is dialed *down* to a quiet progress/readiness signal for this group. (Refines Feature 4.)
- **Privacy-first:** salary and sensitive inputs are optional; user controls what's shared.
- **Every recommendation explainable** via a **"Why this recommendation?"** button — maps directly onto the engine's existing `reasons[]` contract (see `CAREEROS_AI_LOGIC_PROTOTYPE_PLAN.md`).
- **Reframe experience as value:** ask *"What problems did people trust you to solve?"* not just *"What was your job title?"*

**The 8 dashboard sections → CareerOS modules (and what ships in 28 days):**

| # | Idea-doc section | CareerOS module | 28-day scope |
|---|---|---|---|
| 1 | Career Story Map | Career timeline + "hidden strength" / career-pattern detection | **MVP** (reuses portfolio/experience data) |
| 2 | Next Move Navigator | **Next Move Simulator** — Stay / Move company / Change role-industry, each with difficulty, salary impact, skill gap, time, confidence | **MVP (lite)** — 3 pathway cards w/ rule-based scores |
| 3 | Transferable Skills Matcher | **Transferable Skill Map** + "Same Skill, Different Door" | **MVP** (engine-driven) |
| 4 | Skill Bridge Plan | **"Minimum Skill Upgrade"** — only the 3 missing skills for the target role | **MVP** (engine-driven) |
| 5 | Fair Pay & Move Calculator | **Fair Pay + Life Impact** (salary vs market by role/location/company-size; non-salary factors) | **MVP (lite)** — needs curated salary seed; show "demo data" |
| 6 | Trusted Career Co-Pilot | "Why this recommendation?" explainability everywhere | **MVP** (engine `reasons[]`) |
| 7 | Career Health Score | **Dashboard home**: Career Health, Skill Relevance, Salary Fairness, Best Next Move, Top-3 Skill Gaps, monthly action | **MVP** — the centerpiece |
| 8 | Career Second Act Lab | Second-career / advisory / freelance / lower-stress explorer + "Never Too Late Map" | **Stretch (P2)** — ship as static explorer if time |

**New/extended schema for this track** (additive, follows existing conventions):
- `MidCareerProfile` (or extend `CandidatesAI`): `problemsSolved String[]`, `careerPattern String`, `currentSalary Int?` (optional/private), `salaryVisibility Boolean`, `desiredMoveType String`, `lifeFactors Json` (flexibility, stability, family, location).
- `SalaryBenchmark` (curated, `isDemo=true`, `sourceUrl`): `{ role, industry, companySize, location, p25, p50, p75 }` — powers Fair Pay.
- Reuses `Job`, `Company`, portfolio collections, and the intelligence engine.

**New engine functions** (in `src/lib/intelligence/`, deterministic + explainable):
- `careerHealthEngine.ts` — Career Health Score, Skill Relevance Score, Salary Fairness indicator.
- `transferableSkillEngine.ts` — maps current skills → adjacent roles/industries ("Same Skill, Different Door").
- `nextMoveSimulator.ts` — scores Stay / Move / Change pathways (difficulty, salary delta, skill gap, time, confidence).
- `skillBridgeEngine.ts` — minimum-skill-gap for a target role (reuses `candidateMatchEngine`).
- All output the shared `ScoreResult { score, confidence, reasons[], suggestions[], basis[] }` so the **"Why this recommendation?"** button is free.

---

## Week 1 — Stabilize Foundation + Data Spine (Jun 29 – Jul 5)

### Day 1 (Mon Jun 29) — Codebase audit + deployment risk report Done
- **Tasks:** verify `npm run lint` + `npm run build` in CI; set up `vercel.json`; fill `next.config.ts` (headers, images, `poweredByHeader:false`); confirm env vars on host; create Neon prod branch.
- **Output:** `vercel.json`, updated `next.config.ts`, green CI.
- **Acceptance:** clean build deploys to a staging URL.
- **Risk:** build fails despite clean tsc. **Backup:** fix RSC/serialization issues; pin Next version.

### Day 2 (Tue Jun 30) — Data spine: Company + Job models Done
- **Tasks:** add `Company`, `Job` (+ `isDemo`/`source`); migration; `jobs.service.ts`; migrate static `TARGET_JOBS` into seedable rows.
- **Output:** migration, `src/lib/services/jobs.service.ts`, `prisma/seed.ts` updates.
- **Acceptance:** `migrate deploy` clean; jobs queryable from DB.
- **Risk:** schema churn. **Backup:** additive-only; keep static array as fallback source.

### Day 3 (Wed Jul 1) — Data spine: Application + ApplicationEvent Done
- **Tasks:** add `Application`, `ApplicationEvent`; `applications.service.ts` (apply, transition, expire-on-read, response-score calc); `POST /api/jobs/[id]/apply`.
- **Output:** migration, applications service + apply route.
- **Acceptance:** apply creates Application + submitted event (unit-checked).
- **Risk:** unique-constraint conflicts. **Backup:** upsert + friendly error.

### Day 4 (Thu Jul 2) — Demo isolation + seed strategy **(+ mid-career data)** Done
- **Tasks:** `isDemo` on all seedable models; `SEED_DEMO` guard; reset touches only demo rows; seed 20 companies / 20 jobs (curated CSV) with `sourceUrl`. **Add:** `SalaryBenchmark` model + curated salary CSV (role/industry/companySize/location/percentiles) for the Fair Pay Calculator; add `MidCareerProfile` fields (problemsSolved, careerPattern, optional private salary, lifeFactors).
- **Output:** `prisma/data/*.csv` (incl. `salary_benchmarks.csv`), idempotent seed, reset endpoint update, mid-career migration.
- **Acceptance:** seed idempotent; salary benchmarks queryable and demo-labelled; reset deletes only demo rows.
- **Risk:** salary data legality. **Backup:** curated/cited ranges only, clearly "demo data"; salary input optional.

### Day 5 (Fri Jul 3) — Judge demo access (Feature 12) Done
- **Tasks:** homepage "Judge Demo" button; demo-login endpoint (flag-gated); role switchers; guided checklist page; safe reset button. (Tour already exists.) **Add:** a **35+ demo candidate** with rich history so the mid-career dashboard demos fully.
- **Output:** homepage CTA, `/judge` enhancements, demo accounts (incl. mid-career) in seed.
- **Acceptance:** judge reaches pre-filled tour + switches roles in ≤3 clicks; mid-career demo account shows a populated Career Health dashboard.
- **Risk:** demo-login security. **Backup:** server re-checks flag; demo users only.

### Day 6 (Sat Jul 4) — Intelligence engine core **(+ mid-career engines)** Done
- **Tasks:** `scoringConfig.ts`, `careerScoreEngine.ts`, `candidateMatchEngine.ts` (consolidate existing match logic); assertion checks. **Add scaffolding for:** `careerHealthEngine.ts`, `transferableSkillEngine.ts`, `skillBridgeEngine.ts` — all returning the shared explainable `ScoreResult` (powers "Why this recommendation?").
- **Output:** `src/lib/intelligence/*` + `__checks__`.
- **Acceptance:** deterministic scores with `reasons[]`; mid-career engines return Career Health + transferable-skill + skill-bridge outputs for the demo profile; checks pass in CI.
- **Risk:** scope creep. **Backup:** ship Career Health + match first; Next-Move Simulator on Day 13/17.

### Day 7 (Sun Jul 5) — Week-1 hardening + Google SSO planning Done
- **Tasks:** add per-route `loading.tsx` for data pages; mobile pass start; finalize SSO design (callback mints existing `jose` cookie) + `OAuthAccount` model migration (no UI yet); buffer/catch-up. Add session loss, make inactive user auto log off (let them know).
- **Output:** loading states, `OAuthAccount` migration, SSO design note, session inactive.
- **Acceptance:** staging stable; spine + judge demo + engine (incl. mid-career) live.
- **Risk:** slippage. **Backup:** absorb into Day 7 buffer; push SSO UI to Week 4.

---

## Week 2 — Core Product Loops (Jul 6 – Jul 12)

### Day 8 (Mon Jul 6) — Jobs page (Feature 16)
- **Tasks:** `/jobs` list + filters + search; `/jobs/[id]` detail; match badge via engine.
- **Output:** jobs pages + `/api/jobs` reads.
- **Acceptance:** jobs render from DB with match scores.
- **Risk:** filter perf. **Backup:** paginate + index.

### Day 9 (Tue Jul 7) — Easy apply + candidate application tracker (Feature 3)
- **Tasks:** apply button → Application; `/candidate/applications` status timeline; notify employer.
- **Output:** apply UI + tracker page.
- **Acceptance:** applying shows a live "submitted" timeline item.
- **Risk:** state sync. **Backup:** cache-first context + refetch.

### Day 10 (Wed Jul 8) — Company list + responsiveness (Feature 16/3)
- **Tasks:** `/companies` list + sort by responsiveness/candidate-friendly; company detail; "Demo data" labels; response-score calc wired. **Add:** surface company **size/type/location** so the mid-career "better-fit" comparison (local vs MNC vs smaller-company-more-leadership) has data.
- **Output:** companies pages + leaderboard sort.
- **Acceptance:** companies ranked from real metrics; labelled demo; size/type/location visible.
- **Risk:** thin metrics early. **Backup:** seed plausible demo timings.

### Day 11 (Thu Jul 9) — Employer applicant flow (Feature 3)
- **Tasks:** employer applicant list per job; status dropdown → `ApplicationEvent`; "must set status before closing job"; auto "No response yet".
- **Output:** employer applicants UI + `PATCH /api/employer/applications/[id]`.
- **Acceptance:** employer status change appears on candidate timeline.
- **Risk:** ghosting-penalty overreach. **Backup:** show response score only; defer penalties.

### Day 12 (Fri Jul 10) — Resume PDF MVP / Living Portfolio (Feature 1)
- **Tasks:** install `@react-pdf/renderer`; `/api/me/resume/pdf` route; one clean template from real data; `/candidate/resume` with editable summary; `ResumeVersion` save; completeness meter. **Mid-career angle:** the "Living Portfolio" reframes old experience as *proof of capability* — pull `problemsSolved` + achievements, not just job titles.
- **Output:** resume page + PDF route + model.
- **Acceptance:** candidate downloads a PDF of their real data <3s; mid-career resume highlights achievements/problems-solved.
- **Risk:** PDF styling. **Backup:** print-to-PDF route fallback.

### Day 13 (Sat Jul 11) — **Mid-Career Dashboard modules (the centerpiece)**
- **Tasks:** build the **Career Health Score** home (Career Health, Skill Relevance, Salary Fairness, Best Next Move, Top-3 Skill Gaps, "recommended action this month"); **Career Story Map** (timeline + hidden-strength/career-pattern detection); **Transferable Skill Map** ("Same Skill, Different Door"); **Skill Bridge Plan** ("Minimum Skill Upgrade — these 3 skills"). Wire each card to its engine + a "Why this recommendation?" expander. Register these in the `mid-career`/`senior-career`/`executive` phase dashboards via the existing registry. (Younger phases keep Skill Gap Radar + Job Fit Radar.)
- **Output:** mid-career dashboard components + phase-registry entries.
- **Acceptance:** opening the dashboard as the 35+ demo user shows a populated, calm Career Health home with explainable cards; data is real + deterministic.
- **Risk:** trying to ship all 8 sections. **Backup:** Career Health Score + Transferable Skill Map + Skill Bridge first; Story Map and Fair Pay can slip to Day 17/22.

### Day 14 (Sun Jul 12) — Week-2 integration test + mobile pass
- **Tasks:** end-to-end: signup→onboard→apply→status; employer status loop; resume export; **mid-career dashboard render**; fix bugs; responsive fixes on jobs/marketplace/dashboard.
- **Output:** bug fixes, mobile fixes.
- **Acceptance:** full candidate↔employer loop + mid-career dashboard work on desktop + mobile.
- **Risk:** integration bugs. **Backup:** dedicate the review block.

WEEK 2 DONE!
---

## Week 3 — Intelligence + Gamification + Personality (Jul 13 – Jul 19)

### Day 15 (Mon Jul 13) — Personality archetypes (Feature 2)
- **Tasks:** `scoringConfig` archetypes; quiz scoring fn; `PersonalityResult` model + API; `/candidate/personality` quiz; dashboard badge. **Mid-career framing:** present archetype as working-style/strength context, not a "fun" gamified quiz, for 35+.
- **Output:** personality feature.
- **Acceptance:** quiz → deterministic archetype, persisted, badge shown.
- **Risk:** misuse as filter. **Backup:** descriptive-only copy; no exclusion.

### Day 16 (Tue Jul 14) — Personality on employer card + match weighting
- **Tasks:** archetype tag on marketplace candidate card; optional soft match context (never a hard filter).
- **Output:** employer card update.
- **Acceptance:** employer sees archetype tag with interpretation tooltip.
- **Risk:** bias. **Backup:** Bias Check note.

### Day 17 (Wed Jul 15) — Employer intelligence **+ Next Move Simulator**
- **Tasks:** `employerCandidateInsightEngine.ts`; candidate signal map card; hiring confidence; interview-kit generator. **Add (mid-career):** `nextMoveSimulator.ts` + the **Next Move Navigator** UI — three pathway cards (Stay & grow / Move company / Change role-industry), each showing difficulty, salary impact, skill gap, time, confidence; compare "safe / growth / bold" move.
- **Output:** employer scorecards + Next Move Navigator.
- **Acceptance:** scorecard shows strengths/risks/confidence + "Why"; Next Move Navigator renders 3 explainable pathways for the demo user.
- **Risk:** time. **Backup:** ship signal map + confidence + 3 static-but-scored pathways; defer simulator "what-if 2-years" projection.

### Day 18 (Thu Jul 16) — Gamification MVP (Feature 4) **+ age-tuned cadence**
- **Tasks:** `XpLedger`, `Streak`, `Badge` models; `gamification.service.ts`; `POST /api/me/checkin`; readiness ring; XP/streak widget. **Mid-career rule:** for `mid-career`+ phases, replace daily streak pressure with a quiet **Monthly Career Check-Up** signal; XP de-emphasized visually.
- **Output:** gamification core + cadence flag by phase.
- **Acceptance:** check-in grants XP once/day for younger phases; 35+ phases show a monthly check-up instead of daily nudges.
- **Risk:** dark patterns. **Backup:** reward real actions only; forgivable streaks.

### Day 19 (Fri Jul 17) — Leaderboards **+ Fair Pay & Life Impact Calculator** (Feature 9)
- **Tasks:** seed 10 universities (curated CSV); `leaderboard.service.ts`; `/leaderboard`; demo labels + citations. **Add (mid-career):** **Fair Pay + Life Impact Calculator** — compare current salary vs `SalaryBenchmark` by role/location/company-size; show take-home delta + non-salary factors (flexibility, stability, family, travel, long-term value); flag move as "smart / risky".
- **Output:** leaderboard pages + Fair Pay calculator + `/api/me/fair-pay`.
- **Acceptance:** calculator returns an explainable salary-fairness + life-impact readout from seeded benchmarks; salary input optional/private.
- **Risk:** salary legality/sensitivity. **Backup:** curated/cited demo ranges; never expose other users' real salary.

### Day 20 (Sat Jul 18) — Google SSO (Feature 7)
- **Tasks:** `/api/auth/google/{start,callback}` minting existing session; role-select on first login; account linking; "Continue with Google" button.
- **Output:** SSO flow.
- **Acceptance:** Google login lands on correct dashboard; password still works.
- **Risk:** OAuth config. **Backup:** keep behind a flag if redirect issues persist.

### Day 21 (Sun Jul 19) — Week-3 integration + intelligence demo-safety
- **Tasks:** snapshot canonical engine inputs (incl. Career Health, Next Move, Fair Pay) so judges always see stable numbers; verify all scorecards stable; fix bugs; perf pass.
- **Output:** stable scores, fixes.
- **Acceptance:** judges always see sensible, stable mid-career numbers.
- **Risk:** nondeterminism. **Backup:** lock seed + snapshots.

Week 3 Done

<!-- Google OAuth credentials removed — they live ONLY in .env.local /
     the Vercel dashboard. Never paste secrets into docs. -->

## Week 4 — Commercialization + Adaptive UI + Deploy (Jul 20 – Jul 26)

### Day 22 (Mon Jul 20) — **Age-adaptive UI — deliver the 30–55+ experience** (Feature 14)
- **Tasks:** `uiProfile` map in `phaseConfig.ts` keyed by phase. For `mid-career`/`senior-career`/`executive`: **calm/editorial theme, higher readability, reduced gamification, monthly cadence, Career-Health-first module order, "Why this recommendation?" prominent.** For younger phases: more visual/gamified. User can **override** in settings (never locked to age). Ensure accessibility (contrast/font-size) is constant across all profiles. **Stretch:** wire the **Career Second Act Lab** + "Never Too Late Map" as a static explorer for senior phases.
- **Output:** adaptive dashboard; 35+ experience fully reshaped, not just reordered.
- **Acceptance:** the 35+ demo user gets the calm, Career-Health-centric, explainable dashboard; a 20–30 user gets the gamified one; override persists; a11y unchanged.
- **Risk:** stereotyping. **Backup:** frame as preferences; ship core adaptation, Second Act Lab optional.

### Day 23 (Tue Jul 21) — Freemium gates (Feature 15)
- **Tasks:** `Subscription` model; `plans.ts` + `entitlements.ts`; gate 2–3 features; `/pricing`; judge bypass; server enforcement. **Mid-career monetization (from doc):** premium **Career Report**, premium **Fair Pay/Salary Benchmark report**, premium **Skill Bridge plan** as natural Pro gates.
- **Output:** billing module + pricing page.
- **Acceptance:** Free hits gate → upgrade modal; Pro/judge unlock; server rejects non-entitled calls.
- **Risk:** over-gating. **Backup:** gate fewer features; keep free tier strong (Career Health Score stays free).

### Day 24 (Wed Jul 22) — PWA / Android MVP (Feature 11)
- **Tasks:** `manifest.json`, icons, service worker, install prompt; mobile-optimize login/jobs/apply/status **and the mid-career dashboard**.
- **Output:** installable PWA.
- **Acceptance:** installs + launches standalone on a real Android phone; apply + mid-career dashboard work.
- **Risk:** SW caching bugs. **Backup:** ship manifest + install only; minimal SW.

### Day 25 (Thu Jul 23) — Homepage polish + wildcard pick (Feature 16/5)
- **Tasks:** finalize homepage (loop explainer, trust metrics, mock cards, 3 CTAs + judge button); **add a "for experienced professionals 35+" positioning block** using the doc's tagline ("Your second career does not start from zero"); ship 1–2 wildcard modules.
- **Output:** polished homepage + a wildcard.
- **Acceptance:** homepage tells the story incl. the mid-career value prop; judge button prominent.
- **Risk:** time. **Backup:** skip wildcard; prioritize homepage.

### Day 26 (Fri Jul 24) — Full QA + demo data + accessibility
- **Tasks:** end-to-end test every loop **incl. the full 35+ dashboard journey** (Career Health → Transferable Skills → Skill Bridge → Next Move → Fair Pay → "Why this recommendation?"); verify demo isolation + salary privacy; a11y pass; empty/error/loading states everywhere.
- **Output:** QA fixes.
- **Acceptance:** no broken flow; demo/salary data never leaks; states present.
- **Risk:** late bugs. **Backup:** freeze new features; fix only.

### Day 27 (Sat Jul 25) — Documentation + demo script
- **Tasks:** update README (deploy + env); write judge demo script **with a dedicated mid-career walkthrough**; per-feature "functional/prototype/planned" notes; deployment runbook.
- **Output:** docs + demo script.
- **Acceptance:** a stranger can deploy + demo (incl. the 35+ story) from docs.
- **Risk:** stale docs. **Backup:** generate from this plan.

### Day 28 (Sun Jul 26) — Production deploy + smoke test 🚀
- **Tasks:** run deployment checklist; `migrate deploy`; seed demo (demo env only); smoke-test all loops on prod incl. mid-career dashboard; final mobile/PWA check; rotate secrets.
- **Output:** **live deployment.**
- **Acceptance:** prod URL passes the full smoke test + judge tour + mid-career journey.
- **Risk:** prod-only failures. **Backup:** keep staging as fallback demo URL; rollback plan via previous deploy.

--- Week 4 done

## Deferred to post-deployment (explicitly out of scope)
Native Android (Kotlin/Expo), live Stripe charging, real LLM coaching, full university analytics suite, employer auto-penalty/visibility demotion, remaining wildcard modules, multi-template resume editor with drag-reorder. **Mid-career stretch deferrals:** full Career Decision Simulator "what-if in 2 years" projections, deep Career Second Act Lab, real (non-seeded) salary benchmarking, automated career-pattern ML.

## Weekly acceptance gates
- **End W1 (Jul 5):** spine (Job/Company/Application) + judge demo + engine (incl. mid-career engines + salary seed) + staging deploy.
- **End W2 (Jul 12):** full apply↔status loop + resume/Living Portfolio + jobs/company pages + **mid-career Career Health dashboard**, mobile-OK.
- **End W3 (Jul 19):** personality + gamification (age-tuned) + leaderboards + **Next Move Navigator** + **Fair Pay calculator** + employer intelligence + SSO.
- **End W4 (Jul 26):** **age-adaptive 30–55+ experience** + freemium gates + PWA + polished homepage + **live prod**.

## Mid-career build order (the critical thread, P-priority)
1. Salary + mid-career schema & seed (Day 4) → 2. Career Health / Transferable / Skill Bridge engines (Day 6) → 3. Career Health dashboard home + Story Map + Transferable + Skill Bridge cards (Day 13) → 4. Next Move Navigator (Day 17) → 5. Fair Pay & Life Impact calculator (Day 19) → 6. Age-adaptive 30–55+ UI shell wiring it together (Day 22) → 7. QA the full journey (Day 26).
