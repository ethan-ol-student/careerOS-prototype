import type { CarrieEmotion } from "./CarrieAvatar";

/**
 * Carrie's static intelligence — no live AI. Each route resolves to a
 * tree of predetermined multiple-choice questions; picking one renders a
 * predetermined, tone-prefixed response plus follow-up choices/links.
 * Content source: docs/carrie-page-inventory.md + carrie-decision-trees.md.
 */

/** Expression palette → avatar emotion. */
export type CarrieExpression =
  | "warm" // Warm/Reassuring
  | "direct" // Clear/Direct
  | "encouraging" // Encouraging/Optimistic
  | "analytical" // Analytically Precise
  | "strategic" // Strategically Focused
  | "alert"; // Alert/Warning

export const EXPRESSION_EMOTION: Record<CarrieExpression, CarrieEmotion> = {
  warm: "idle",
  direct: "idle",
  encouraging: "success",
  analytical: "processing",
  strategic: "listening",
  alert: "confused",
};

export interface CarrieNode {
  /** The choice label the user taps. */
  q: string;
  exp: CarrieExpression;
  /** Carrie's canned response. */
  a: string;
  links?: { label: string; href: string }[];
  children?: CarrieNode[];
}

export interface CarrieTree {
  title: string;
  intro: string;
  nodes: CarrieNode[];
}

// ── Dashboard variants ─────────────────────────────────────────────

const cockpitTree: CarrieTree = {
  title: "Cockpit Dashboard",
  intro: "You're on your four-question cockpit. What can I clarify?",
  nodes: [
    {
      q: "What does the “Who are you?” card tell me?",
      exp: "warm",
      a: "This card is your Living Portfolio summary — your avatar, name, active industry, and target career goal. Think of it as your digital handshake!",
      links: [{ label: "Open Living Portfolio", href: "/candidate/portfolio" }],
      children: [
        {
          q: "How do I change my target goal?",
          exp: "direct",
          a: "Head to Settings → Edit onboarding answers, and change your goal inline — no need to redo the wizard.",
          links: [{ label: "Edit answers", href: "/candidate/onboarding?edit=1" }],
        },
        {
          q: "Why does it show my career phase?",
          exp: "warm",
          a: "Career OS uses your phase (student, young adult, or early career) to shape your dashboard layout and recommend steps that fit your stage.",
        },
      ],
    },
    {
      q: "What does the “Where are you?” radar show?",
      exp: "analytical",
      a: "That's your Skill Radar in focus-gaps mode: the polygon is built ONLY from the required skills you're still short on for your best-matching role. Fewer sides = fewer gaps. The dashed ring is the requirement bar; the blue shape is your validated strength.",
      children: [
        {
          q: "What is the Suitability percentage?",
          exp: "analytical",
          a: "It's the trust-weighted score of how well your validated skills clear the baseline requirements of your best-matching role. Self-claimed skills count ×0.5, evidence-backed ×0.8, endorsed ×1.0 — validation moves it, volume doesn't.",
        },
        {
          q: "How can I filter this radar?",
          exp: "direct",
          a: "Use the ‹ All / Soft / Hard › pager under the chart to cycle skill categories. Hover any label to enlarge the full skill name.",
        },
      ],
    },
    {
      q: "How do I read the “What's possible?” orbit?",
      exp: "encouraging",
      a: "Those are your top 5 matched roles orbiting your icon! Bigger and brighter = stronger match. Hover any bubble to pause the orbit and see the role; click it to open the job page.",
      links: [{ label: "Browse all jobs", href: "/jobs" }],
    },
    {
      q: "What is the “How do I get there?” card for?",
      exp: "direct",
      a: "The left side shows today's hourly timeline; the right shows the AI recommendation — your highest-impact next step — plus skill chips. Clicking a chip pre-fills a planning event in your Life Chapter Designer.",
      links: [{ label: "Open the Designer", href: "/candidate/chapters" }],
    },
  ],
};

const studentTree: CarrieTree = {
  title: "Discovery Radar",
  intro: "You're on your Discovery Radar. What can I clarify?",
  nodes: [
    {
      q: "What is the Discovery Radar?",
      exp: "warm",
      a: "It's your topographic skill horizon — a map of skill areas you can grow into. Most of it starts under fog; the terrain you've unlocked is drawn bright and clear. It's built for exploration, not pressure.",
      children: [
        {
          q: "What do the glowing landmarks mean?",
          exp: "direct",
          a: "Glowing ringed landmarks are skills sitting right on your horizon — discoverable now. Solid coloured peaks are skills you've already learned. Anything still in the fog is waiting to be revealed.",
        },
      ],
    },
    {
      q: "How do I reveal more of the map?",
      exp: "encouraging",
      a: "Press any glowing landmark to see what the skill is, then hit “Learn this skill”. The fog opens organically around it — and skills that were hidden nearby appear on the new horizon. Focus one area for a peninsula, or spread out for a whole continent.",
    },
    {
      q: "What's my Micro-Quest?",
      exp: "direct",
      a: "The card on the right gives you ONE small, concrete next step — chosen from your real progress (log your first skill, grow to five, then turn one into proof). It links straight into your Skill Radar.",
      links: [{ label: "Open Skill Radar", href: "/candidate/skills" }],
    },
    {
      q: "What is the “Who are you?” card?",
      exp: "warm",
      a: "A gentle nudge to discover your working style — a 2-minute quiz reveals your work-animal archetype. It shapes your self-understanding, never your score.",
      links: [{ label: "Take the quiz", href: "/candidate/personality" }],
    },
    {
      q: "Why can't I see the job section?",
      exp: "warm",
      a: "In the student phase you're exploration-first — the goal is discovering skills and directions, not applying yet. The job section unlocks as you move into later phases. Nothing's missing; it's just not your step right now.",
    },
  ],
};

const youngAdultTree: CarrieTree = {
  title: "Young Adult Dashboard",
  intro: "Your readiness-and-pipeline dashboard. What can I clarify?",
  nodes: [
    {
      q: "What is my Portfolio Readiness score?",
      exp: "analytical",
      a: "The big gauge is how aligned your validated portfolio is with the market bar for your target role — a trust-weighted match of your skills against what the role actually asks for. The three bars under it (role match, skills validated, portfolio depth) show what's driving it.",
      children: [
        {
          q: "How do I raise it?",
          exp: "direct",
          a: "Validate a skill with evidence (self-claimed counts half; evidence-backed and endorsed count far more), or add a project to your portfolio. The High-Impact Action card always points at whichever moves the needle most right now.",
          links: [{ label: "Open Skill Radar", href: "/candidate/skills" }],
        },
      ],
    },
    {
      q: "What is the High-Impact Action?",
      exp: "strategic",
      a: "Exactly ONE task — the single highest-leverage move for your hiring potential right now (apply to your top match, close your biggest skill gap, or add a project). It filters out the noise so you always know the next thing to do.",
      children: [
        {
          q: "Why only one task?",
          exp: "warm",
          a: "Because a wall of to-dos causes fatigue, not progress. One clear, high-leverage step — chosen by impact — is how momentum actually builds. The rest can wait.",
        },
      ],
    },
    {
      q: "How do I read the Pipeline Funnel?",
      exp: "direct",
      a: "It's your live application pipeline, left to right: Leads → Applied → Screening → Final rounds → Offers. Each number is real — pulled from your application timeline — so you can see your pipeline's health in one glance.",
      children: [
        {
          q: "What counts as a “Lead”?",
          exp: "direct",
          a: "A strong match (55%+) you haven't applied to yet — your ready-to-act backlog. Tap it to jump to the roles and start an application.",
          links: [{ label: "Browse roles", href: "/jobs" }],
        },
      ],
    },
    {
      q: "What is the Curated Matches feed?",
      exp: "encouraging",
      a: "The bottom row is a live, personalized feed of entry-level roles and internships matched to your exact skill mix — highest match first, and roles you've already applied to drop off. Tap any card for the full breakdown and easy apply.",
      links: [{ label: "See all roles", href: "/jobs" }],
    },
    {
      q: "Where did my match % come from?",
      exp: "analytical",
      a: "It compares your validated Skill Radar against each role's required skills — trust-weighted, so endorsed skills count more than self-claimed ones. Every score is explainable; open a role to see the exact reasons.",
    },
  ],
};

const midCareerTree: CarrieTree = {
  title: "Mid-Career Dashboard",
  intro: "Your action-oriented daily check-in. What can I clarify?",
  nodes: [
    {
      q: "What do the Gold, Silver, and Bronze badges mean?",
      exp: "warm",
      a: "Those are your trust-tier badges — your top 3 skills. Gold = tier 3 (endorsed), Silver = tier 2 (evidence-backed), Bronze = tier 1 (self-claimed). The segmented bar below tracks your progress toward the Senior zone.",
      links: [{ label: "Validate skills", href: "/candidate/skills" }],
    },
    {
      q: "What are the three colored traffic lights?",
      exp: "analytical",
      a: "Your health signals: Skill Freshness (share of validated skills), Network Strength (endorsements gathered), and Learning Velocity (weekly learning time). Green means ≥60, amber ≥30, red below — click any light to open Career Health.",
      children: [
        {
          q: "How do I fix a red or amber light?",
          exp: "encouraging",
          a: "Click the light! It routes you to Career Health, where validating skills, requesting endorsements, or committing learning hours moves the score back toward green.",
          links: [{ label: "Open Career Health", href: "/candidate/career-health" }],
        },
      ],
    },
    {
      q: "How do I close the Top Gap?",
      exp: "alert",
      a: "The amber panel names your single biggest missing skill versus your target, with the exact points short. Hit “See how” — it deep-links that skill in your Skill Radar so you can add evidence or plan learning.",
    },
    {
      q: "How should I use the priority actions and job carousel?",
      exp: "warm",
      a: "The 1-2-3 list is today's loop: validate the top gap, strengthen the second, then apply to matched roles. The carousel below shows live matches with the exact skill of yours that fits. The floating ＋ button quick-logs new evidence to your Living Portfolio.",
      links: [{ label: "Open jobs", href: "/jobs" }],
    },
  ],
};

const seniorTree: CarrieTree = {
  title: "Senior Career Dashboard",
  intro: "Your strategic standing at a glance. What can I clarify?",
  nodes: [
    {
      q: "How does the skill cloud work?",
      exp: "strategic",
      a: "Every skill floats at a size set by its trust tier — endorsed skills render large with a gold glow, evidence-backed medium, self-claimed small. It's your influence profile in one look.",
      links: [{ label: "Grow the cloud", href: "/candidate/skills" }],
    },
    {
      q: "What do the Executive Health bars measure?",
      exp: "analytical",
      a: "Influence = the share of your skills that are endorsed. Presence = the share that are at least evidence-backed. Market demand = your trust-weighted market-value index. The Scope-of-influence meter above them is demo data until a data source lands — hence the badge.",
    },
    {
      q: "How do I read the 2×2 trajectory matrix?",
      exp: "strategic",
      a: "Performance (role suitability) runs across, Potential (validated skill depth) runs up. The gold dot is you — the goal is the top-right “Exec ready” quadrant.",
    },
    {
      q: "What does the readiness gauge tell me?",
      exp: "warm",
      a: "The semicircular gauge translates your suitability against your goal into red, amber, and green zones. To move the needle, follow the Path Forward timeline underneath — it turns your actual gaps into a 0–18 month plan.",
      children: [
        {
          q: "What is the flame chip next to my goal?",
          exp: "analytical",
          a: "Your live market signal — Emerging, Solid, Strong, or Elite — computed by the market-value engine from how many of your skills are validated. Validation, not volume, drives it.",
        },
      ],
    },
  ],
};

const execTree: CarrieTree = {
  title: "Executive Dashboard",
  intro: "Your board-level cockpit. What can I clarify?",
  nodes: [
    {
      q: "What's in the identity bar?",
      exp: "strategic",
      a: "Your monogram and headline, your platinum skill chips (top endorsed capabilities, gem-marked), the live market signal with its trend arrow, and your endorsement count — instant identity for a board-level glance.",
    },
    {
      q: "What does the Portfolio column audit?",
      exp: "analytical",
      a: "It counts your roles, projects, and credentials, and the Depth ring scores how much evidence your record holds. Below 60 it turns amber — a signal to log deeper proof points in your Living Portfolio.",
      links: [{ label: "Open Living Portfolio", href: "/candidate/portfolio" }],
    },
    {
      q: "How does the opportunity feed and pipeline work?",
      exp: "direct",
      a: "The feed lists your live matched opportunities with urgency dots by match strength. The pipeline funnel tracks your real applications through Submitted → In review → Interview → Offer.",
      links: [{ label: "Open applications", href: "/candidate/applications" }],
    },
    {
      q: "What is the Personal-Brand Accelerator?",
      exp: "strategic",
      a: "Reputation compounds at this level. The three action cards — speak, publish, mentor — each drop a pre-filled preparation block into your Life Chapter Designer. And the platinum-bordered card at the bottom is your explainable top match: “Express interest” opens it.",
      links: [{ label: "Open the Designer", href: "/candidate/chapters" }],
    },
  ],
};

const careerHealthTree: CarrieTree = {
  title: "Career Health",
  intro: "The mid-career+ deep suite. What can I clarify?",
  nodes: [
    {
      q: "What is the Career Health Score?",
      exp: "analytical",
      a: "A non-vanity rating of your professional standing built from your validated skills, market demand, and pay position. Every card carries a “Why this recommendation?” expander — the reasons are always shown, never a black box.",
      children: [
        {
          q: "Can early-career users access this page?",
          exp: "direct",
          a: "No — Career Health is exclusive to Mid-Career, Senior, and Executive phases. Earlier phases are redirected to their cockpit to focus on building the record first.",
        },
      ],
    },
    {
      q: "How does the Next Move Navigator work?",
      exp: "warm",
      a: "It simulates realistic next moves — each card scores difficulty and expected salary impact so you can weigh trade-offs before committing to a pivot.",
    },
    {
      q: "What is the Skill Bridge?",
      exp: "alert",
      a: "For each top role it counts the skills between you and the bar. The coarse view — score, matched count, gap count — is free; the itemized missing-skill detail is one of the three Pro gates.",
    },
    {
      q: "Why is part of Fair Pay locked?",
      exp: "alert",
      a: "Your own salary is always yours to see and edit. The peer benchmark comparison is Pro-gated — hit “Unlock with Pro” to run the mock upgrade. The Career Health Score itself is always free.",
      links: [{ label: "See pricing", href: "/pricing" }],
    },
  ],
};

// ── Growth modules ─────────────────────────────────────────────────

const skillsTree: CarrieTree = {
  title: "Skill Radar",
  intro: "Your skills-truth cockpit. What can I clarify?",
  nodes: [
    {
      q: "What does the radar chart represent?",
      exp: "analytical",
      a: "Your validated strength (blue polygon) versus a selected role's requirements (dashed ring), across 3–12 adaptive spokes. Self-claimed counts half, evidence-backed 80%, endorsed 100% — so validation, not listing, shapes the polygon.",
      children: [
        {
          q: "Why do labels change on hover?",
          exp: "direct",
          a: "Hovering any axis label enlarges it to the full skill name with a halo, so long names stay readable even on compact screens.",
        },
      ],
    },
    {
      q: "How do I use the role and market panels?",
      exp: "direct",
      a: "The searchable role box recalculates your match live. Below it, Market Value shows the field's salary split across Entry (0–2 yrs), Mid (3–5), and Senior (5+) tiers, plus a Check-an-offer box.",
      children: [
        {
          q: "How does Check an offer work?",
          exp: "analytical",
          a: "Type any salary figure and it's compared against the indicative market range entirely on your device — verdict: Below market, Fair, or Above market. Nothing is sent to a server.",
        },
      ],
    },
    {
      q: "What is the Skill Bookshelf?",
      exp: "warm",
      a: "Every skill is a book spine standing on the shelf — height is your claimed level, color is the trust tier: green endorsed, yellow evidence-backed, neutral self-claimed. Click a spine to open its detail.",
      children: [
        {
          q: "How do I raise a skill to tier 2 or 3?",
          exp: "direct",
          a: "Open the spine's detail modal: add concrete evidence (a link or what/when/result) for tier 2, or name an endorser with a note about how they saw the skill in action for tier 3. The server derives the tier — it can't be self-set.",
        },
        {
          q: "How do I add a new skill?",
          exp: "direct",
          a: "Click the dashed ＋ spine at the end of the shelf. Search the taxonomy or type anything — free text still counts. New skills start self-claimed.",
        },
        {
          q: "What are the learning-material buttons?",
          exp: "encouraging",
          a: "Inside a skill's detail, each suggestion row has a ＋ to add it to your roadmap (instant green ✓) and a 📅 to schedule it with the inline date picker. No page hops, no friction.",
        },
      ],
    },
  ],
};

const portfolioTree: CarrieTree = {
  title: "Living Portfolio",
  intro: "Your evidence record. What can I clarify?",
  nodes: [
    {
      q: "What does the Edit / Preview toggle do?",
      exp: "direct",
      a: "Edit CV is where you manage experiences, projects, education, and awards; Preview CV renders the polished document exactly as it exports.",
    },
    {
      q: "Why does completeness matter?",
      exp: "warm",
      a: "The ring tracks your profile completeness, and the checklist under it is clickable — each item jumps you to the exact section that completes it. Finish all of them to unlock the PDF export.",
      children: [
        {
          q: "Why is Export PDF disabled?",
          exp: "alert",
          a: "PDF export needs a 100% complete profile AND the Pro plan (one of exactly three Pro gates). On free, clicking it opens the mock upgrade flow.",
          links: [{ label: "See pricing", href: "/pricing" }],
        },
      ],
    },
    {
      q: "How do entries feed my Skill Radar?",
      exp: "analytical",
      a: "Skills you tag on an experience are automatically added to your radar as self-claimed tier-1 claims — one entry, no duplicate work. Validate them on the Skill Radar to raise their weight.",
      links: [{ label: "Open Skill Radar", href: "/candidate/skills" }],
    },
    {
      q: "What are Versions and the Timeline?",
      exp: "direct",
      a: "Versions saves named snapshots of your portfolio — take one before big edits. The Timeline overlay renders your whole record as a career timeline.",
    },
  ],
};

const insightsTree: CarrieTree = {
  title: "Career Intelligence",
  intro: "Your cross-module read-across. What can I clarify?",
  nodes: [
    {
      q: "What does the Analysis tab show?",
      exp: "analytical",
      a: "Three reads on your chosen role: Undervalued strengths (skills your portfolio proves but your radar underrates), your deterministic Career Profile summary, and narrative themes parsed from your Timeline Journal — plus your work-animal archetype.",
      children: [
        {
          q: "Can employers see my work animal?",
          exp: "warm",
          a: "It's descriptive only — never a match input, never a filter, and every employer surface that mentions style carries a bias-check note. It exists for your self-reflection.",
        },
      ],
    },
    {
      q: "How do I use the Actions tab?",
      exp: "direct",
      a: "The Market Gaps card ranks in-demand skills you haven't validated by real posting volume. Each row links straight to the skill or matching jobs — it's your shortest path to a higher match.",
    },
    {
      q: "Where does this data come from?",
      exp: "analytical",
      a: "Entirely from your own modules — Skill Radar, Living Portfolio, Working Style, Timeline Journal — plus curated market data. Generated deterministically from your data: no black box.",
    },
  ],
};

const personalityTree: CarrieTree = {
  title: "Working Style Quiz",
  intro: "Your working-style profile. What can I clarify?",
  nodes: [
    {
      q: "How does the quiz work?",
      exp: "warm",
      a: "Single-choice cards that auto-advance as you pick. The header tracks your progress, and there are no wrong answers — pick what fits how you actually work.",
    },
    {
      q: "What happens when I finish?",
      exp: "encouraging",
      a: "A little celebration, then your result: a working-style archetype with its work animal, trait breakdown, and a bias-check note. You can retake it anytime.",
    },
    {
      q: "Does my archetype affect my match scores?",
      exp: "direct",
      a: "Never. It's descriptive only — it appears as a marketplace tag but is excluded from every match and score engine by design.",
    },
  ],
};

const chaptersTree: CarrieTree = {
  title: "Life Chapter Designer",
  intro: "Your time-planning studio. What can I clarify?",
  nodes: [
    {
      q: "How do I navigate the timetable?",
      exp: "direct",
      a: "Switch Day / Week / Month / Year views with the top bar, or hit Today to snap back. Sub-tasks check off inline right on the grid.",
    },
    {
      q: "How do I schedule a new event?",
      exp: "direct",
      a: "Open the add-event modal, name it, set priority, date and time, and stack sub-tasks. Dashboard recommendation chips arrive here pre-filled via ?add= links.",
    },
    {
      q: "What is the Reflection panel?",
      exp: "warm",
      a: "Select any event and rate it 👍 or 👎 on whether it moves you toward your ideal self. The bar tracks how much of your planned time is meaningful — with honest advice when it isn't.",
    },
  ],
};

const journalTree: CarrieTree = {
  title: "Timeline Journal",
  intro: "Your reflection space. What can I clarify?",
  nodes: [
    {
      q: "How do I write a new entry?",
      exp: "direct",
      a: "Hit “+ Add entry” on the rail — a draft row appears and the form opens: title, date, mood, a career-pivot flag, linked skills, and your reflection. Save adds it to the timeline.",
    },
    {
      q: "How does this feed my profile?",
      exp: "warm",
      a: "Career Intelligence parses your entries for narrative themes — turning points, dominant moods, recurring skills — and shows what they reveal on the Analysis tab.",
      links: [{ label: "See what it reveals", href: "/candidate/insights" }],
    },
    {
      q: "What does the star on an entry mean?",
      exp: "direct",
      a: "That entry is flagged as a career pivot — a turning point. Pivots are weighted in your narrative analysis.",
    },
  ],
};

const pathTree: CarrieTree = {
  title: "Career Path Navigator",
  intro: "Your journey map. What can I clarify?",
  nodes: [
    {
      q: "What is the 3D terrain map?",
      exp: "warm",
      a: "A living landscape of your journey — navy valleys rising to luminous ridges. The pulsing green pin is you at your current phase; the pins ahead are your upcoming phases along the dashed path.",
    },
    {
      q: "Why is the terrain not moving?",
      exp: "direct",
      a: "If Reduce Motion is on (Settings → Motion & performance, or your OS), the terrain renders a single calm frame instead of animating. Everything else works identically.",
    },
    {
      q: "What can I do here right now?",
      exp: "direct",
      a: "This surface is a preview — full turn-by-turn milestones are on the roadmap. For now, plan your next concrete steps in the Life Chapter Designer.",
      links: [{ label: "Open the Designer", href: "/candidate/chapters" }],
    },
  ],
};

// ── Jobs & market ──────────────────────────────────────────────────

const jobsTree: CarrieTree = {
  title: "Jobs Catalogue",
  intro: "The open-roles catalogue. What can I clarify?",
  nodes: [
    {
      q: "How are match percentages calculated?",
      exp: "analytical",
      a: "Your validated Skill Radar is compared against each role's required skills — trust-weighted, so endorsed skills count more than self-claimed ones. The Scoring tile tells you whether you're seeing personalized or curated-baseline numbers.",
      children: [
        {
          q: "Why does it say “Curated baseline”?",
          exp: "direct",
          a: "You haven't added validated skills yet, so scores use the public baseline. Add and validate skills on the Skill Radar to personalize every match.",
          links: [{ label: "Add skills", href: "/candidate/skills" }],
        },
      ],
    },
    {
      q: "What is the industry trend panel?",
      exp: "analytical",
      a: "Pick a field chip and the panel reads that market: Hot right now / Steady / Cooling, the indicative salary range, yearly growth, and live posting counts where available — demo-labelled where curated.",
    },
    {
      q: "How do I search and filter?",
      exp: "direct",
      a: "Type titles or companies in the search box (it filters as you type) and toggle field chips beside it. The search box keeps its size — chips wrap in their own space.",
    },
  ],
};

const jobDetailTree: CarrieTree = {
  title: "Job Detail",
  intro: "Evaluating this role. What can I clarify?",
  nodes: [
    {
      q: "How do I read the required skills?",
      exp: "direct",
      a: "Green ✓ chips are skills you already hold; the rest are open. The right rail explains the exact reasons behind your score — no black box.",
    },
    {
      q: "What is “Bridge to close”?",
      exp: "warm",
      a: "The missing skills between you and this role. Add and validate them on your Skill Radar and this match climbs.",
      links: [{ label: "Open Skill Radar", href: "/candidate/skills" }],
    },
    {
      q: "How does Easy apply work?",
      exp: "encouraging",
      a: "One click submits your validated record. The page locks into an applied state, celebrates properly, and the application appears in your tracker with a live stage timeline.",
      links: [{ label: "My applications", href: "/candidate/applications" }],
    },
  ],
};

const companiesTree: CarrieTree = {
  title: "Companies",
  intro: "The employer accountability index. What can I clarify?",
  nodes: [
    {
      q: "What is the responsiveness score?",
      exp: "analytical",
      a: "Companies are ranked by how reliably they respond to applicants — computed from real application outcomes. Companies with no applicants yet show a deterministic seeded score, clearly labelled Demo data.",
    },
    {
      q: "What's on a company profile?",
      exp: "direct",
      a: "The company's details, chips, and every open role they have in the catalogue — each with your live match percentage.",
    },
  ],
};

const leaderboardTree: CarrieTree = {
  title: "Leaderboards",
  intro: "Curated institutional signals. What can I clarify?",
  nodes: [
    {
      q: "What do the two tabs show?",
      exp: "direct",
      a: "University ranks Malaysian universities by graduate employability; Company is a curated global best-employers list. Every row cites its source — follow the link on any row.",
    },
    {
      q: "Am I ranked here?",
      exp: "warm",
      a: "Never. The leaderboard only ranks institutions with cited public data — real users are never ranked or exposed.",
    },
  ],
};

// ── Communication & progress ───────────────────────────────────────

const applicationsTree: CarrieTree = {
  title: "My Applications",
  intro: "Your application tracker. What can I clarify?",
  nodes: [
    {
      q: "How do I track an application's progress?",
      exp: "warm",
      a: "Every card has an explicit stage timeline — Submitted → Reviewing → Interview → Offer/Closed — built from an append-only event log, so nothing is ever rewritten behind your back.",
      children: [
        {
          q: "Why does a card say Expired?",
          exp: "alert",
          a: "If an employer takes no action within the response window, the application flips to expired automatically — so your attention stays on live pipelines.",
        },
      ],
    },
    {
      q: "What do the overview stats mean?",
      exp: "direct",
      a: "In-progress counts your live applications, Offers counts the wins, and Avg. response shows how quickly employers have been moving on your applications.",
    },
  ],
};

const messagesTree: CarrieTree = {
  title: "Messages",
  intro: "Your employer inbox. What can I clarify?",
  nodes: [
    {
      q: "How do conversations work?",
      exp: "direct",
      a: "The rail lists your conversations with employers; open one to read the thread and reply from the composer. It's real and two-sided — employer invites land here.",
    },
    {
      q: "Why is my inbox empty?",
      exp: "warm",
      a: "Employers can only reach you when Discovery is on. It's off by default — your choice. Flip it in Settings and your Living Portfolio becomes visible in the marketplace.",
      links: [{ label: "Open Settings", href: "/candidate/settings" }],
    },
  ],
};

// ── Account & entry ────────────────────────────────────────────────

const onboardingWizardTree: CarrieTree = {
  title: "Onboarding",
  intro: "Setting up your profile — one question at a time. Need help?",
  nodes: [
    {
      q: "How is the wizard structured?",
      exp: "warm",
      a: "One question at a time across three sections — Personal, Work, Preferences — with a progress bar and autosave on every keystroke. Refresh anytime; nothing is lost.",
    },
    {
      q: "How does Quick upload CV work?",
      exp: "direct",
      a: "Drop your CV in the modal and the parser fills what it can confidently read — it only fills blanks, marks what it auto-filled, and tells you exactly how many fields it completed. You review everything.",
    },
    {
      q: "Why am I seeing phase-specific questions?",
      exp: "analytical",
      a: "Choosing Mid-Career, Senior, or Executive swaps the generic preference tail for questions tuned to your stage — challenges, drivers, legacy, hands-on level. They personalize your dashboard.",
    },
    {
      q: "What happens on the review screen?",
      exp: "warm",
      a: "Every answer in one grouped table — tap Edit on any line to jump back to that exact question. There's also an optional, private self-ID section that's never shared with employers or used for matching. Then hit Finish!",
    },
  ],
};

const onboardingEditTree: CarrieTree = {
  title: "Edit Answers",
  intro: "Editing your onboarding answers inline. Need help?",
  nodes: [
    {
      q: "How do I edit an answer?",
      exp: "direct",
      a: "Tap Edit on any row — the input expands right underneath it. Single-choice answers collapse automatically when you pick; otherwise hit Done. No wizard re-run, ever.",
    },
    {
      q: "Why is Save changes disabled?",
      exp: "direct",
      a: "It enables the moment you actually change something. Until then there's nothing to save.",
    },
    {
      q: "What if I exit with unsaved changes?",
      exp: "alert",
      a: "A guard steps in with three choices: Save & exit, Discard changes, or Keep editing. Nothing is lost silently.",
    },
  ],
};

const settingsTree: CarrieTree = {
  title: "Settings",
  intro: "Your control center. What can I clarify?",
  nodes: [
    {
      q: "What is the Discovery toggle?",
      exp: "direct",
      a: "It controls whether employers can find you in the marketplace. Off by default — flipping it on projects your Living Portfolio so the right employers can reach out. You can turn it off anytime.",
    },
    {
      q: "Detailed vs Vibrant — what's the difference?",
      exp: "warm",
      a: "Detailed spells everything out in full sentences. Vibrant compresses the interface — explanations tuck behind small ⓘ icons (hover or tap them) and the decorative glows come back.",
    },
    {
      q: "What does Reduce motion do?",
      exp: "direct",
      a: "It freezes every decorative animation — the job orbit, the terrain, entrance effects — instantly, saved on this device. Handy for comfort or older hardware.",
    },
    {
      q: "How do I delete my account?",
      exp: "alert",
      a: "The Delete account section asks for your password and then permanently removes everything — profile, portfolio, chapters, messages. It's real and cannot be undone.",
    },
  ],
};

const fallbackTree: CarrieTree = {
  title: "Career OS",
  intro: "I know every corner of Career OS. What can I help with?",
  nodes: [
    {
      q: "What is Career OS in one minute?",
      exp: "warm",
      a: "A career intelligence platform: you build a validated skill record (Skill Radar), keep a Living Portfolio of evidence, and every job match, health score, and recommendation is computed transparently from it — reasons included, no black box.",
    },
    {
      q: "Where should I start?",
      exp: "encouraging",
      a: "Add your skills on the Skill Radar, then validate your top three with evidence. That single move personalizes your matches, your dashboard, and your market signal.",
      links: [{ label: "Open Skill Radar", href: "/candidate/skills" }],
    },
    {
      q: "How is my data used?",
      exp: "direct",
      a: "Your data powers only your own insights. Employers see you ONLY if you enable Discovery, private self-ID answers are never shared or matched on, and your working style is never a filter.",
    },
  ],
};

// ── Route resolution ───────────────────────────────────────────────

/** Resolve the tree for a route (+ phase / edit-mode context). */
export function treeForRoute(
  pathname: string,
  opts: { careerStage?: string; onboardingEdit?: boolean } = {},
): CarrieTree {
  const stage = opts.careerStage ?? "";
  if (pathname.startsWith("/candidate/dashboard")) {
    if (stage === "student") return studentTree;
    if (stage === "young-adult") return youngAdultTree;
    if (stage === "mid-career") return midCareerTree;
    if (stage === "senior-career") return seniorTree;
    if (stage === "executive") return execTree;
    return cockpitTree;
  }
  if (pathname.startsWith("/candidate/career-health")) return careerHealthTree;
  if (pathname.startsWith("/candidate/skills")) return skillsTree;
  if (pathname.startsWith("/candidate/portfolio")) return portfolioTree;
  if (pathname.startsWith("/candidate/insights")) return insightsTree;
  if (pathname.startsWith("/candidate/personality")) return personalityTree;
  if (pathname.startsWith("/candidate/chapters/journal")) return journalTree;
  if (pathname.startsWith("/candidate/chapters")) return chaptersTree;
  if (pathname.startsWith("/candidate/path")) return pathTree;
  if (pathname.startsWith("/candidate/applications")) return applicationsTree;
  if (pathname.startsWith("/candidate/messages")) return messagesTree;
  if (pathname.startsWith("/candidate/onboarding"))
    return opts.onboardingEdit ? onboardingEditTree : onboardingWizardTree;
  if (pathname.startsWith("/candidate/settings")) return settingsTree;
  if (pathname === "/jobs") return jobsTree;
  if (pathname.startsWith("/jobs/")) return jobDetailTree;
  if (pathname.startsWith("/companies")) return companiesTree;
  if (pathname.startsWith("/leaderboard")) return leaderboardTree;
  return fallbackTree;
}
