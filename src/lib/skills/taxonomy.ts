/**
 * Skill taxonomy — deliberately wider than corporate ("beatbox can be a
 * skill"): technical, trade, care, creative, and soft skills are all
 * first-class. Powers the add-skill auto-suggest and the resume-paste
 * extractor on /candidate/skills.
 *
 * ponytail: a flat curated list, not a graph/ontology — add categories or
 * ESCO codes when matching needs them. Resume extraction is word-boundary
 * matching against this list; upgrade to an LLM parse when an API key and
 * PDF upload land (see docs — deferred, not forgotten).
 */
export const SKILL_TAXONOMY: string[] = [
  // Software & data
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "Java",
  "C++", "Go", "Rust", "HTML", "CSS", "Git", "Docker", "Kubernetes", "AWS",
  "Linux", "Excel", "Power BI", "Tableau", "Data Analysis", "Machine Learning",
  "Statistics", "API Design", "System Design", "Cybersecurity", "QA Testing",
  // Engineering & trades
  "AutoCAD", "SolidWorks", "Electrical Wiring", "Welding", "Carpentry",
  "Plumbing", "HVAC", "Forklift Operation", "CNC Machining", "Automotive Repair",
  "Machine Maintenance", "Quality Control", "Blueprint Reading", "Soldering",
  // Operations, logistics & service
  "Inventory Management", "Warehouse Operations", "Supply Chain", "Logistics",
  "Procurement", "Food Safety", "Barista Skills", "Cooking", "Housekeeping",
  "Security Operations", "Driving (Commercial)", "First Aid", "Caregiving",
  "Customer Service", "Retail Operations", "Point of Sale",
  // Business & professional
  "Project Management", "Accounting", "Bookkeeping", "Financial Analysis",
  "Auditing", "Budgeting", "Sales", "Digital Marketing", "SEO", "Copywriting",
  "Recruiting", "Training & Coaching", "Data Entry", "Microsoft Office",
  "Business Analysis", "Legal Research", "Entrepreneurship",
  // Creative
  "Graphic Design", "UI/UX Design", "Photography", "Video Editing",
  "Illustration", "Animation", "Music Production", "Beatboxing", "Singing",
  "Creative Writing", "Content Creation", "Public Speaking", "Event Planning",
  // Soft / transferable
  "Communication", "Leadership", "Teamwork", "Problem Solving",
  "Time Management", "Negotiation", "Critical Thinking", "Adaptability",
  "Mentoring", "Conflict Resolution", "Multilingual",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Deterministic skill extraction: taxonomy terms found in pasted text. */
export function extractSkillsFromText(text: string): string[] {
  if (!text.trim()) return [];
  return SKILL_TAXONOMY.filter((skill) =>
    new RegExp(`(^|[^a-z0-9])${escape(skill.toLowerCase())}($|[^a-z0-9])`).test(
      text.toLowerCase(),
    ),
  );
}
