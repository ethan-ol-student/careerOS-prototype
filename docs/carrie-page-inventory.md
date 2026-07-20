# Carrie — Candidate-Side Page Inventory

> Contextual knowledge map for **Carrie**, the candidate-side AI page guide.
> One entry per page, sub-page, modal, and career-phase variant. Compiled from
> LOG.md, ARCHITECTURE.md, and the live source (`src/app/*`, `src/components/*`)
> — the source wins where they differ. Current as of 2026-07-18.
>
> Global conventions Carrie should know before any page:
> - **Phases** (stored on `CandidatesAI.careerStage`, hyphenated): `student`,
>   `young-adult`, `early-career`, `mid-career`, `senior-career`, `executive`.
>   "Mid-career+" = the last three.
> - **Trust tiers** on every skill: 1 self-claimed (×0.5), 2 evidence-backed
>   (×0.8), 3 endorsed (×1.0). Derived server-side, never client-set.
> - **UI density**: Detailed (default — full explanatory prose) or Vibrant
>   (explanations collapse to ⓘ InfoHint popovers). Set in Settings; applied by
>   the AppShell on every candidate page.
> - **Accents**: luminous (blue) = candidate, clover (green) = readiness/
>   positive, yellow-400 = warning/gold, destructive = red.
> - **Demo data** badge = curated/synthetic numbers, never real users.
> - Every page below (unless noted) renders inside **AppShell**: header
>   (logo · Candidate, StreakChip, NotificationBell, TopMenu) + left
>   CandidateSidebar (desktop) + internally-scrolling content. AppShell
>   redirects: signed-out → `/auth`, employer → `/employers/dashboard`,
>   un-onboarded → `/candidate/onboarding`.

---

## Part 1 — The Dashboard by Career Phase (`/candidate/dashboard`)

One route, four experiences. `CockpitDashboard` branches on the normalized
phase: Student / Young Adult / Early Career share the **four-question cockpit**;
Mid-Career, Senior, and Executive each get a dedicated layout. All variants are
fed by the same data pipeline: skill claims (`/api/me/skills`), jobs + matches
(`/api/jobs`), chapter events (`/api/me/chapters`), the deterministic
`scoreSkillTruth` and `marketValue` engines, and the onboarding row.

### 1.1 Cockpit Dashboard (phases: Student, Young Adult, Early Career)

| Field | Detail |
|---|---|
| **Why** | Answer the four questions — *Who are you? Where are you? What's possible? How do I get there?* — on ONE zero-scroll screen, so an early-phase candidate gets orientation and a next action in seconds. |
| **Core function** | Read status at a glance; every card deep-links into the owning module. No editing happens here. |

**Component breakdown**
- Greeting: mono eyebrow `Candidate · {Phase} phase` + "Good day, {firstName}."
- **Card 1 — Who are you?** (→ Living Portfolio): initial avatar, industry chip, name, "Target: {goal}" pill, Skills count tile (links to Skill Radar), Phase chip tile.
- **Card 2 — Where are you?** (→ Skill Radar): `CategoryRadar` in **focus-gaps mode** — polygon sides = number of required skills still below the bar for the top-match job, ‹ All/Soft/Hard › pager; big Suitability % ; "vs {job} — your best match · market signal {label}" (InfoHint); "Minimum requirements" bars (skill, progress bar clover=met/luminous=short, score).
- **Card 3 — What's possible?** (→ Jobs): `OrbitField` — top-5 matched jobs orbit the user's initial; icon size/glow scales with match %; hover pauses + tooltip; click opens the job.
- **Card 4 — How do I get there?** (→ Life Chapter Designer): left = today's `DayTimeline` (hourly); right = **AI recommendation** box (engine `nextStep` sentence) + "Learn new skills" / "Strengthen existing" `RecoGroup`s whose skill chips deep-link into the Designer with `?add=`.

**Content & text**: live counts (skills, match %, requirement scores), engine-generated recommendation sentences, phase label. **States**: per-card `Loading…` spinners; empty variants ("No matching roles yet — add skills…", "set your goal"); radar "On track" clover state when no gaps; Vibrant density collapses the explanatory captions to ⓘ.

### 1.2 Mid-Career Dashboard (phase: `mid-career`)

| Field | Detail |
|---|---|
| **Why** | Action-oriented daily check-in: reassure ("where do I stand?") then push ONE clear improvement loop. Emotional goal: momentum, not overwhelm. |
| **Core function** | Scan health, see the top gap, follow numbered priority actions, browse the job carousel, quick-log evidence via the FAB. |

**Component breakdown**
- **Hero card**: avatar + name + headline; **trust-tier badge strip** (top-3 skills as Gold/Silver/Bronze chips = tier 3/2/1); **career-stage progress bar** (6 segments, current pulses, "Next zone: Senior Career"); **three traffic lights** — Skill Freshness (share of validated skills), Network Strength (endorsement count), Learning Velocity (weekly learning time) — green/amber/red dots, each links to Career Health.
- **Goal card**: flag eyebrow, "Target: {goal}", `ProgressRing` = suitability score.
- **Top-gap callout** (amber container): "Missing: {skill} (−N points)" + **See how →** (deep-links `skills?focus={skill}`); clover "no open gaps" state when clear.
- **Priority actions** (numbered 1-2-3): validate top gap → strengthen second gap → apply to matched roles ("{n} suggested"); each row links out with a status token.
- **Job Match carousel** (horizontal scroll): company initial, big match %, title, "Your {skill} matches their top need" explainer per card.
- **FAB**: fixed ＋ button (bottom-right) → Living Portfolio (quick-log evidence).

**States**: loading spinner until claims+jobs resolve; empty-claims hero shows "Add your first skill →"; no-jobs carousel note. Traffic-light thresholds: ≥60 green, ≥30 amber, else red.

### 1.3 Senior Career Dashboard (phase: `senior-career`)

| Field | Detail |
|---|---|
| **Why** | Authoritative, roadmap-driven: a senior professional wants influence signals and a credible path to the next summit, not task nagging. Gold (yellow) accents signal seniority. |
| **Core function** | Review standing (cloud, health, trajectory), read the readiness gauge, follow the 3-node roadmap, open explainable matched roles. |

**Component breakdown**
- **Left panel (40%)**: identity block (gold-ringed avatar, name, headline, "{n} roles · {n} projects · {n} skills on record"); **trust-tier skill cloud** (endorsed = large gold glow text, evidence = medium, self-claimed = small muted); **Scope-of-influence meter** (Team/Budget/Geography segmented bars — ⚠ *Demo data badge, no data source yet*); **Executive health** ScoreBars — Influence (endorsed share), Presence (evidence share), Market demand (marketValue score); **2×2 trajectory matrix** SVG (Performance = suitability × Potential = validated share; gold "You" dot; "Exec ready" label in the top-right quadrant).
- **Right panel (60%)**: **Aspiration card** — "Goal: {longTermGoal}", flame chip "{Elite/Strong/Solid/Emerging} market signal" + engine reason, **semicircular readiness gauge** (red/amber/green zones, needle = suitability); **Path forward** vertical timeline (0–6m close top gap / 6–12m evidence+endorse next / 12–18m targeted applications — each node links out); **Explainable marketplace** — two job cards: match %, "Matched because you hold {skill}".

**States**: loading until data resolves; empty cloud → "Add skills to grow the cloud →"; gauge/matrix render 0 gracefully.

### 1.4 Executive Dashboard (phase: `executive`)

| Field | Detail |
|---|---|
| **Why** | A board-level cockpit: compressed, prestige, at-a-glance KPIs. The user audits their portfolio, reputation, and pipeline — then activates discreetly. |
| **Core function** | Scan identity bar + three columns; open portfolio/applications/jobs; plan brand actions into the Life Chapter Designer; express interest in the top match. |

**Component breakdown**
- **Top identity bar**: monogram tile (initials), name + headline; **platinum skill chips** (gem icon, top-3 endorsed skills); right—market signal ("{label}" + trend arrow) and **endorsement count** (stand-in for network nodes).
- **Column 1 — Portfolio**: thin-font impact numbers (Roles / Projects / Credentials), "Open Living Portfolio →", **Depth ring** (`totalAdditions`-driven; amber note under 60).
- **Column 2 — Aspiration**: goal statement in quotes; Readiness number + ScoreBar vs top-match role; **Opportunity feed** — "{n} matched opportunities live" + top-3 mini-list (urgency dots by match %, each → job detail).
- **Column 3 — Activation**: **application pipeline funnel** (Submitted → In review → Interview → Offer, real counts from `/api/me/applications`); **Personal-brand accelerator** — 3 action cards (speak / publish / mentor) that plan into `chapters?add=`; **platinum-bordered explainable top match** ("Matched: endorsed {skill} + your validated record", "Express interest →").
- Footer line: "Every number derives from your validated record — trust-weighted, no vanity metrics."

**States**: loading until data resolves; funnel shows zeros for a fresh account; platinum strip explains itself when no endorsed skills exist.

### 1.5 Career Health (`/candidate/career-health`) — mid-career+ ONLY

| Field | Detail |
|---|---|
| **Why** | The deep "How do I get there?" suite for experienced candidates: honest health score, pay fairness, and simulated next moves. Emotional goal: control and clarity in a plateau. |
| **Core function** | Read Career Health Score + reasons; run the Next Move Navigator; check Fair Pay against a benchmark; expand "Why this recommendation?" on every card; upgrade to Pro where gated. |

**Components**: `CareerHealthHome` — health score hero, Next Move simulator cards (difficulty/salary-impact bullets), Skill Bridge (gap list — detail is Pro-gated: free sees score/matched/gap-count), Fair Pay calculator (benchmark comparison Pro-gated, own salary always visible), life-impact notes (InfoHint), `WhyExpander` reasons on every card, Pro lock panels with "Unlock with Pro" buttons (mock billing → `UpgradeModal`/`/pricing`).
**Access**: sidebar link exists only for mid-career+; the page redirects confirmed early phases to the dashboard (never redirects while the phase is still loading). **States**: loading spinner; free-vs-Pro variants; judge accounts bypass gates.

---

## Part 2 — Growth Modules (all phases)

### 2.1 Skill Radar (`/candidate/skills`) — flagship

| Field | Detail |
|---|---|
| **Why** | "Where are you — *really*?" The Skills Truth cockpit: honest, trust-weighted skill standing vs a real role. Emotional goal: earned confidence — validation, not vanity. |
| **Core function** | Add skills; validate them (level, evidence, endorsement); pick a comparison role; read the radar + breakdown + market value; check an offer. |

**Component breakdown**
- Header: "Where are you — really?" + tier explainer (InfoHint).
- **Left — radar panel**: "Validated strength {score}/100"; "vs {job} at {company} · market signal"; `CategoryRadar` (full mode: required skills + strongest context claims, 3–12 adaptive spokes, ‹ All/Soft/Hard ›); radar labels **enlarge on hover** to the full name; caption legend (Validated you / Role requires).
- **Right — role panel**: searchable role combobox (type-to-filter, {match}% per row, "Browse all jobs" footer); **Skill breakdown** per required skill (bar, score, tier chip); **Top gaps** line; **Market Value panel** — sector badge (Tech/Engineering), Demo-data badge, 3 experience-tier salary cards (Entry 0–2 / Mid 3–5 / Senior 5+ yrs), trend line ("Trending up · +5% YoY"), **Check an offer** number input → Below market / Fair / Above market verdict, source caption.
- **Skill Bookshelf** (bottom): each claim is a book spine — height = level, tint = tier (green endorsed / yellow evidence / neutral self-claimed); ＋ spine opens Add.
- **Modal — Skill detail** (click a spine): validation form (level select, evidence textarea → tier 2, endorser name + required note → tier 3, Save validation + feedback lines); "Applies to roles" list with match chips; **Learning materials** — interactive rows with ＋ add-to-roadmap (→ green ✓ + "Added to roadmap!" toast) and 📅 schedule (inline date-picker → "Scheduled for {date}"); Remove skill.
- **Modal — Add a skill**: searchable taxonomy combobox (free text allowed — "No taxonomy match — free text still counts."), level select, ＋ submit; "New skills start self-claimed…" hint.

**States**: empty (no claims → prompt to use ＋ spine); deep-link `?focus={skill}` opens that skill's detail or prefills Add; 100-skill cap enforced server-side; Vibrant collapses captions.

### 2.2 Living Portfolio (`/candidate/portfolio`)

| Field | Detail |
|---|---|
| **Why** | The evidence record — everything you've done, merged into one living CV. Emotional goal: pride + completeness ("my story adds up"). |
| **Core function** | Edit structured entries (experiences with contribution/approach/impact/skills-used, projects, education-as-certificates, awards, problems solved for mid-career+); preview the CV; save named versions; export PDF (gated). |

**Components**: Edit CV | Preview CV segmented toggle; completeness ring + **clickable checklist** (each item deep-links to the section that completes it; "finish all to unlock the PDF export" InfoHint); `PortfolioBuilder` sections (add/edit forms; skills entered here auto-become tier-1 claims — hint links to Skill Radar); `CVPreview` (document render); **Timeline** overlay (career timeline of entries); **Versions** overlay (named JSON snapshots; "No versions yet — save one before big edits."); auto-skill summary ("Auto-summarized from your experience entries — each lands on your Skill Radar", InfoHint); **Export PDF** button — requires 100% completeness AND Pro (402 → UpgradeModal).
**States**: edit vs preview; incomplete (checklist visible) vs complete (export unlocked); Pro vs free; mid-career+ resumes lead with Problems Solved.

### 2.3 Career Intelligence (`/candidate/insights`)

| Field | Detail |
|---|---|
| **Why** | The cross-module "so what": reads Skill Radar × Portfolio × Working Style × market together and explains what they reveal. Emotional goal: insight — "I see the pattern now." |
| **Core function** | Switch Analysis | Actions tabs; pick a role to analyse; read undervalued strengths, narrative themes, work-animal identity, deterministic career summary; act on market gaps. |

**Components** — fixed viewport, only panels scroll:
- Header: Sparkles + "Career Intelligence"; **Analysis | Actions** segmented pill.
- **Analysis tab**: Roles rail (ranked by match, "pick one to analyse" InfoHint); 3-column bundle — Undervalued strengths ("skills your portfolio proves but your radar underrates" + next-step callout), Career Profile (deterministic AI summary, "Generated from your own data — no black box"), narrative themes from the Timeline Journal (pivots count, dominant mood, next-step callout); **Work-animal card** (Beaver/Owl/Dolphin/Fox from quiz archetype, {fit}% fit, animal note, bias-check callout — descriptive only, never a match input); quiz chip → Working Style Quiz.
- **Actions tab**: **Market gaps card** (in-demand skills you haven't validated, ranked by live posting counts; each row links to skills/jobs; next-step callout) + Undervalued card + quiz chip.

**States**: locked/empty ("Add skills and portfolio entries to unlock insights"); per-card empties; callouts appear only when the engines produce a next step; all explanatory prose is InfoHint-collapsible.

### 2.4 Working Style Quiz (`/candidate/personality`)

| Field | Detail |
|---|---|
| **Why** | Self-knowledge without labels-as-gates: a deterministic working-style archetype. Emotional goal: recognition ("that's me"), explicitly NOT a score. |
| **Core function** | Answer the fixed question set (single-select cards, auto-advance); get the archetype + work animal; retake anytime. |

**Components**: progress ("{answered} of {total} answered" + "no wrong answers" InfoHint); question cards; result view — archetype name, work-animal emblem, animal note (InfoHint), trait chips/bars, bias-check note; retake button; celebrate `FeedbackModal` on completion.
**States**: unanswered → in-progress → result; result mirrors to the marketplace as a tag (descriptive only).

### 2.5 Life Chapter Designer (`/candidate/chapters`)

| Field | Detail |
|---|---|
| **Why** | Turn intentions into scheduled chapters of life — plan the *time* that closes gaps. Emotional goal: agency over the calendar. |
| **Core function** | Browse Day/Week/Month/Year timetable views; select a calendar day; add/edit events (name, priority, date/time, sub-tasks); rate events toward the "ideal self" (+/−); read meaningful-time stats. |

**Components**: view switcher + Today button; `TimetableViews` (day grid with events, done-checkbox sub-tasks, month/year overviews); **Add event modal** (`EventEditor`: fields + sub-task repeater; "Fill the fields, add sub-tasks, hit save — then go again." InfoHint); **ReflectionPanel** rail — selected event detail, 👍/👎 "moves me toward my ideal self" toggles, share-of-meaningful-time bar + advice line (InfoHint), stats; `?add={name}` pre-fills the add modal (used by dashboard/exec accelerator links).
**States**: empty ("No events yet — add one"); event selected vs none; meaningful-share thresholds change the advice line.

### 2.6 Timeline Journal (`/candidate/chapters/journal`)

| Field | Detail |
|---|---|
| **Why** | Reflective record of turning points — the narrative fuel for Career Intelligence. Emotional goal: sense-making. |
| **Core function** | Browse the entry rail (timeline); read an entry; add (temp draft row) / edit / delete with distinct view-vs-edit states. |

**Components**: rail with "+ Add entry" (creates a `__new__` temp row that live-updates its title) + dated entry rows (pivot star); right panel = empty hint ("Select an entry to read it…") / **read-only detail** (mono date, pivot star, title, mood chip, skill chips, reflection text, Edit + Delete-with-confirm) / **form** (title, date, mood select, pivot toggle, skills, reflection; Cancel / "Add entry" | "Save changes"); "What this reveals" link → insights.
**States**: empty / view / edit / create; delete confirmation dialog.

### 2.7 Career Path Navigator (`/candidate/path`)

| Field | Detail |
|---|---|
| **Why** | The zoomed-out map: where you stand on the whole journey. Emotional/practical goal: orientation + a peek at what's next. Currently a **preview** surface. |
| **Core function** | View the 3D terrain map with the "You are here" landmark and upcoming-phase pins; read the current track details; jump to the Life Chapter Designer to act. |

**Components**: **terrain map card** — animated low-poly "folded map" canvas (navy valleys → luminous ridges; honors reduce-motion with a static frame), dashed journey path SVG overlay, pulsing clover "You are here — {phase}" pin + upcoming pins (halo'd labels); details rail — phase label + purpose (InfoHint), upcoming-phase list (purpose sublines as InfoHints); "Preview" chip + roadmap note; link to the Designer.
**States**: reduce-motion static render; phase-dependent pin placement.

---

## Part 3 — Jobs & Market Loop

### 3.1 Jobs catalogue (`/jobs`)

| Field | Detail |
|---|---|
| **Why** | See every open role with an honest, explainable match — no black-box ranking. Practical goal: find where to apply next. |
| **Core function** | Search titles/companies (debounced); filter by field chips; read the industry-trend panel; open a role. |

**Components** — fixed viewport, card grid scrolls: header + "{n} in the catalogue · click any role for the full match breakdown" (InfoHint); 2 stat tiles — **Open roles** count, **Scoring** ("Personalized — from your validated skills" vs "Curated baseline — sign in + add skills to personalize"); search box (width-locked so chips can never squash it) + field chips; **IndustryTrendPanel** when a field is active (Hot right now / Steady / Cooling verdict, salary range, growth chip, live posting count when available, Demo badge + source InfoHint); job cards (title, company, location, duration, skills, "Your match/Base match" %).
**States**: loading; "No jobs match that search."; personalized vs baseline scoring; trend panel only with an active field.

### 3.2 Job detail (`/jobs/[id]`)

| Field | Detail |
|---|---|
| **Why** | Decide-and-act: full explainable match plus one-click apply. |
| **Core function** | Read requirements (✓ = you have it), match reasons, bridge-to-close gaps, market value for the field; **Easy apply**; jump to the company profile. |

**Components**: back link; opportunity header (title, company, location, duration, Demo badge); company chips + profile link; required skills chips (clover ✓ = matched); Easy apply button → applied state ("Applied — track it in My applications"); celebrate `FeedbackModal` on a fresh apply; right rail — ScoreBar match, **Why this score?** reason list, **Bridge to close** missing-skill chips (warning tone), MarketValuePanel.
**States**: loading / not-found error; already-applied (409-safe); fresh-apply celebration.

### 3.3 Companies (`/companies`, `/companies/[id]`)

| Field | Detail |
|---|---|
| **Why** | Accountability signal: which employers actually respond to applicants. |
| **Core function** | Browse responsiveness-ranked companies; open one for its profile + open roles. |

**Components**: list — rank, name, location, responsiveness ScoreBar, Demo badge on seeded scores, "Ranked by responsiveness…" InfoHint; detail — company header, chips, open-roles list with match %.
**States**: real metrics once applications flow; deterministic "Demo data" score for zero-applicant companies; "No open roles right now."

### 3.4 Leaderboard (`/leaderboard`)

| Field | Detail |
|---|---|
| **Why** | Context, not competition: curated institutional signals. Never ranks real users. |
| **Core function** | Toggle University (Malaysian employability) | Company (curated global "best employers"); follow source citations. |

**Components**: header + University|Company segmented pill; per-tab sub-line (InfoHint); ranked rows — number, name, country, Demo badge, source link, Employability/Employer-score ScoreBar (clover). Fixed viewport; only the list scrolls.
**States**: loading; tab switch swaps dataset + labels.

---

## Part 4 — Communication & Progress

### 4.1 My Applications (`/candidate/applications`)

| Field | Detail |
|---|---|
| **Why** | Kill application anxiety with an explicit, append-only timeline per application. |
| **Core function** | Track every application's stage; see employer responses; jump back to the job. |

**Components**: header + "One card per application, with an explicit stage timeline and next action." (InfoHint); stat tiles (in progress / offers / avg. response); application cards — job + company, status chips, **stage timeline** (submitted → reviewing → interview → offer/closed), latest-event line ("No response yet — employers typically screen within a week." when quiet), expiry note.
**States**: loading; empty ("Find a role on the jobs board"); expire-on-read flips stale rows to expired; per-status styling.

### 4.2 Messages (`/candidate/messages`)

| Field | Detail |
|---|---|
| **Why** | Real employer conversations (server-backed, two-sided) — invitations land here. |
| **Core function** | Browse conversation list; open a thread; send replies. |

**Components**: "Your conversations" header; conversation rail (employer/org name, snippet, unread markers); thread view (bubbles, timestamps); reply composer (rounded input + send).
**States**: loading / error+retry / empty ("No employer messages yet — turn on discovery so employers can find you." → Settings link); thread empty ("No messages yet — say hello!"); demo auto-replies only when the demo-chat flag is on.

### 4.3 Notifications (bell, in the AppShell header)

Dropdown panel (not a page): candidate notifications (application status changes, endorsements, system) with kind-tinted icons, mark-read on open, deep links. Separate from Messages by design.

### 4.4 Streak / Check-in (StreakChip, in the AppShell header)

Compact flame/calendar chip: one deliberate check-in per period — cadence is phase-tuned (daily-ish younger, **Monthly Career Check-Up** for mid-career+). One missed period is forgiven. XP only for real actions.

---

## Part 5 — Account & Entry

### 5.1 Onboarding — first run (`/candidate/onboarding`)

*Renders in `StepShell` (logo is deliberately NOT a link), not AppShell.*

| Field | Detail |
|---|---|
| **Why** | One question at a time — zero overwhelm — while building the entire profile the engines need. Autosaves every keystroke. |
| **Core function** | Answer the conversational wizard (Personal → Work → Preferences); optionally Quick-upload a CV to auto-fill; review everything; Finish. |

**Components**: phase rail (3 section dots); progress "Q i/N" + bar + answered count; one question card per step (text fields, chip groups with "Other…", select cards, sliders, tag inputs, experience/education repeaters); footer — Back / Quick upload CV / Next / (at review) Finish; **Quick Upload CV modal** (`UploadZone` — deterministic parser fills blanks, reports "Filled N fields…"); **Review screen** — grouped table of every answer with per-row Edit (jumps to that exact question) + optional private self-ID section; **celebrate FeedbackModal** ("You're all set! 🎉", Done → dashboard).
**Phase-conditional questions (Task-2 spec)**: choosing Mid-Career / Senior / Executive replaces the generic preference tail with 5/5/4 phase-specific questions (challenge, change-one-thing, goal, flow-work, flexibility / driver, builder-fixer-strategist, legacy skills, fulfilling-career, deepen-vs-broaden / energy, industry change, 1–10 hands-on slider, non-negotiable). Answers persist to `CandidatesAI.phaseAnswers` and appear in a "Your phase" review group.
**States**: required-field validation with jump-to-question; student-only questions (field of study) appear conditionally; autosave note.

### 5.2 Onboarding — edit mode (`/candidate/onboarding?edit=1`)

| Field | Detail |
|---|---|
| **Why** | Change answers WITHOUT re-running the wizard — a settings-grade overview table. |
| **Core function** | Inline-edit any answer; save once; exit safely. |

**Components**: "Your onboarding answers" overview — grouped rows (Personal / Work & skills / Preferences / Your phase) with Edit → the owning question's input expands **inline under the row** (single-selects auto-collapse on pick, Done button otherwise); footer — **Exit to Dashboard** + **Save changes** (disabled until dirty) + "Saved ✓" note; **Unsaved-changes modal** on exit: Save & exit / Discard changes / Keep editing.
**States**: pristine vs dirty; validation errors highlight rows; save skips row-creating side-effects so repeats never duplicate portfolio entries.

### 5.3 Settings (`/candidate/settings`)

| Field | Detail |
|---|---|
| **Why** | Control: identity, visibility, comfort, and the account itself. |
| **Core function** | Edit account fields; toggle discovery; pick dashboard style; toggle reduce-motion; edit onboarding answers; sign out / clear cache; delete account. |

**Sections** (each explainer is an InfoHint): Account (name/email/password via `/api/account`); **Discovery** toggle (project into the employer marketplace — off by default); **Dashboard style** — Detailed | Vibrant binary choice (stored "calm"/"vibrant", optimistic save + rollback); **Motion & performance** (reduce-motion device toggle); Privacy (sign out, clear local cache — data stays in the account); Edit onboarding answers (→ `?edit=1`); **Delete account** (password re-entry, full cascade — warning text always visible).
**States**: saved/error feedback per section; destructive actions confirm.

### 5.4 Auth (`/auth`) & Google role pick (`/auth/google/role`)

*Marketing shell, not AppShell.* Sign in / create account (role picker: candidate vs employer), optional Google SSO (flag-gated); candidate login lands on the dashboard (or onboarding if incomplete). `/auth/google/role` asks one question — "how will you use Career OS?" — for first-time SSO users. Demo/judge logins are flag-gated; `admin123` is dev-only.

### 5.5 Pricing (`/pricing`) & Upgrade modal

Mock freemium: free vs Pro comparison; exactly three Pro gates exist (resume PDF, Fair Pay report, Skill Bridge detail) — Career Health Score itself is always free. `UpgradeModal` appears wherever a 402 lands; upgrade is one mock POST (no real billing).

---

## Part 6 — Cross-page conditional layers (Carrie must always check these)

| Layer | Effect |
|---|---|
| **Career phase** | Dashboard variant (§1.1–1.4); Career Health link + access (mid-career+ only); onboarding preference questions; check-in cadence; resume ordering (problems-solved first for mid-career+). |
| **UI density** | Detailed = full prose everywhere; Vibrant = explanatory sentences collapse to ⓘ InfoHints (popover on hover/focus, always top-layer) and decorative glows return. |
| **Reduce motion** | `html.reduce-motion` freezes ALL decorative animation (orbit scatters statically, terrain renders one frame, rings snap). |
| **Plan (free/Pro/judge)** | Three Pro gates above; judges bypass all gates. |
| **Auth/onboarding state** | AppShell bounces signed-out → `/auth`, employers → employer side, un-onboarded → onboarding. |
| **Demo flags** | Demo chat replies, judge demo accounts, marketplace demo fallback — all flag-gated; "Demo data" badges mark every curated number. |
