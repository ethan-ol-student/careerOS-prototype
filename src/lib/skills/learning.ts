/**
 * Learning materials — curated, deterministic suggestions per skill for the
 * bookshelf detail view ("how do I improve this?"). Keys are lower-case
 * canonical skill names; job-catalogue requiredSkills are covered first
 * since those are the gaps the dashboard deep-links into.
 *
 * ponytail: a flat curated map with a generic fallback, not a content API —
 * swap for real course/resource data when a provider integration lands.
 */

const LEARNING_RESOURCES: Record<string, string[]> = {
  // Job-catalogue required skills
  python: [
    "Work through the official Python tutorial, then automate one real task you do weekly.",
    "Ship a small CLI or script to GitHub and attach it as evidence.",
  ],
  "machine learning": [
    "Take a foundations course (e.g. Andrew Ng's ML) and reproduce one classic model from scratch.",
    "Enter one Kaggle starter competition — the leaderboard entry is strong evidence.",
  ],
  "control systems": [
    "Study PID control basics, then simulate a controller in Python or MATLAB.",
    "Document one tuning exercise (before/after plots) as evidence.",
  ],
  robotics: [
    "Build one ROS or microcontroller project end-to-end, however small.",
    "Film the robot working — a 30-second clip is better evidence than any certificate.",
  ],
  "cad design": [
    "Model three everyday objects in Fusion 360 or SolidWorks, increasing complexity each time.",
    "Publish the models to a portfolio (GrabCAD) and link them as evidence.",
  ],
  fea: [
    "Run a static stress study on one of your own CAD parts and write up the result.",
    "Compare simulation vs hand calculation for a simple beam — that write-up is tier-2 gold.",
  ],
  "materials science": [
    "Study material selection basics (Ashby charts), then justify the material choice in one of your designs.",
  ],
  "project management": [
    "Run one real project — any size — with a written plan, timeline, and retro.",
    "Get a teammate who saw you run it to endorse this skill.",
  ],
  "systems design": [
    "Sketch the architecture of a product you use daily, then compare with public write-ups.",
    "Do one system-design mock interview and note what you missed.",
  ],
  "product analytics": [
    "Define and track 3 metrics for anything you've built or run — even a school event.",
    "Learn funnel analysis basics in a free analytics tool and document one insight.",
  ],
  storytelling: [
    "Rewrite one project description as problem → action → measurable result.",
    "Present it to someone and ask them to endorse what they heard.",
  ],
  thermodynamics: [
    "Revisit the core cycles (Rankine, refrigeration) and solve worked examples weekly.",
  ],
  // Common taxonomy skills
  javascript: [
    "Build one interactive page without a framework first — then rebuild it in React.",
    "Publish it and attach the link as evidence.",
  ],
  typescript: [
    "Convert one of your JS projects to strict TypeScript and fix every `any`.",
  ],
  react: [
    "Build a small app with real state (forms, fetch, routing) and deploy it.",
  ],
  sql: [
    "Practice joins and aggregations on a public dataset until you can answer questions cold.",
    "Save your best analysis queries as a portfolio snippet.",
  ],
  "data analysis": [
    "Take one messy public dataset from raw to a 5-chart summary and publish the notebook.",
  ],
  excel: [
    "Master lookups, pivot tables, and one dashboard — rebuild a report you use at work.",
  ],
  communication: [
    "Write one clear one-page summary per week; ask a peer to endorse the improvement.",
  ],
  leadership: [
    "Lead one initiative end-to-end and collect a written endorsement from someone you led.",
  ],
  "public speaking": [
    "Present at one meetup or class; the recording is your evidence.",
  ],
  "ui/ux design": [
    "Redesign one screen of an app you use, document the reasoning, and post the case study.",
  ],
};

/**
 * Deterministic learning suggestions for any skill — curated when known,
 * honest generic fallback otherwise (the fallback still pushes toward the
 * evidence → endorsement ladder the trust tiers reward).
 */
export function learningFor(skill: string): string[] {
  const curated = LEARNING_RESOURCES[skill.trim().toLowerCase()];
  if (curated) return curated;
  return [
    `Build a small real project using ${skill} and attach it as evidence (that lifts it to tier 2).`,
    `Get someone who saw you use ${skill} to endorse it with specifics (tier 3 — full weight).`,
  ];
}
