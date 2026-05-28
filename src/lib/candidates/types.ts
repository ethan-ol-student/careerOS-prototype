/**
 * Employer-side prototype types. Shared by mock data, employer
 * context, marketplace UI, and chat/contact flows.
 */

export type CandidateCategory =
  | "Technology"
  | "Design"
  | "Marketing"
  | "Engineering"
  | "Business"
  | "Data"
  | "Creative"
  | "Operations";

export type GrowthSignal = "Accelerating" | "Steady" | "Emerging" | "Compounding";

export type Availability =
  | "Open to opportunities"
  | "Actively looking"
  | "Open to internships"
  | "Future-ready (graduating soon)"
  | "Not actively looking";

export interface Candidate {
  id: string;
  name: string;
  /** Where they're heading — e.g. "Frontend engineer with design fluency". */
  careerDirection: string;
  /** Specific target role label used for filters. */
  targetRole: string;
  industry: string;
  category: CandidateCategory;
  /** 0–100. */
  matchScore: number;
  /** 0–100. */
  readinessScore: number;
  growthSignal: GrowthSignal;
  topSkills: string[];
  portfolioProjects: string[];
  whyRecommended: string;
  location: string;
  availability: Availability;
  /** Short headline / one-line bio shown on cards. */
  headline: string;
  /** Stage label — Intern / Fresh grad / Junior / Mid-level / Future. */
  stage: string;
}

export type TalentType =
  | "interns"
  | "fresh-graduates"
  | "junior-professionals"
  | "mid-level"
  | "future-pipeline";

export type Priority =
  | "technical-skills"
  | "learning-momentum"
  | "communication"
  | "leadership"
  | "industry-interest"
  | "location"
  | "availability"
  | "portfolio-strength"
  | "growth-signal";

export interface EmployerGoal {
  /** Talent type the employer is sourcing for. */
  talentType: TalentType | "";
  /** The role being hired / scouted. */
  role: string;
  /** Things the employer cares most about (multi-select). */
  priorities: Priority[];
  /** Soft preference shown on the goal summary card. */
  locationPreference?: string;
}

export interface ChatMessage {
  id: string;
  sender: "employer" | "candidate";
  body: string;
  /** unix ms */
  createdAt: number;
}

export type EmployerNotificationKind =
  | "invite-accepted"
  | "invite-pending"
  | "system";

export interface EmployerNotification {
  id: string;
  kind: EmployerNotificationKind;
  title: string;
  body: string;
  /** ID of the candidate the notification refers to (when relevant). */
  candidateId?: string;
  createdAt: number;
  read: boolean;
}
