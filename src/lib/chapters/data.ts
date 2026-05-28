import {
  Rocket, Sprout, Mountain, Sun, Anchor, Heart, Compass,
  Star, Sparkles, Snowflake, Briefcase, BookOpen,
  type LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// NEW: Event timetable types
// ─────────────────────────────────────────────────────────────

export type Priority = "high" | "medium" | "low";

export interface Subtask {
  id: string;
  label: string;
  done: boolean;
}

export interface ChapterEvent {
  id: string;
  name: string;
  priority: Priority;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM (24h)
  subtasks: Subtask[];
  createdAt: string;
}

export const PRIORITY_META: Record<Priority, { label: string; tone: string; dot: string }> = {
  high:   { label: "High",   tone: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40", dot: "bg-yellow-400" },
  medium: { label: "Medium", tone: "bg-luminous/15 text-luminous border-luminous/40",       dot: "bg-luminous"  },
  low:    { label: "Low",    tone: "bg-clover/15 text-clover border-clover/40",             dot: "bg-clover"    },
};

export type Timeframe = "week" | "month" | "year";

// ─────────────────────────────────────────────────────────────
// LEGACY types — kept so old ChapterCard/ChapterEditor/CompareView
// keep type-checking until they're removed.
// ─────────────────────────────────────────────────────────────

export type TimeHorizon = "1yr" | "3yr" | "5yr";

export interface Dimensions {
  career: string; location: string; lifestyle: string; learning: string; wellbeing: string;
}

export interface Chapter {
  id: string;
  title: string;
  icon: string;
  timeHorizon: TimeHorizon;
  dimensions: Dimensions;
  createdAt: string;
  updatedAt: string;
}

export const iconOptions: Record<string, LucideIcon> = {
  rocket: Rocket, sprout: Sprout, mountain: Mountain, sun: Sun, anchor: Anchor,
  heart: Heart, compass: Compass, star: Star, sparkles: Sparkles, snowflake: Snowflake,
};
export const iconList = Object.keys(iconOptions);

export interface DimensionMeta {
  key: keyof Dimensions; label: string; icon: LucideIcon; prompt: string; placeholder: string;
}
export const dimensionMeta: DimensionMeta[] = [
  { key: "career",    label: "Career",    icon: Briefcase, prompt: "What work fills your days?", placeholder: "" },
  { key: "location",  label: "Location",  icon: Compass,   prompt: "Where are you based?",       placeholder: "" },
  { key: "lifestyle", label: "Lifestyle", icon: Sun,       prompt: "Day-to-day rhythm?",         placeholder: "" },
  { key: "learning",  label: "Learning",  icon: BookOpen,  prompt: "What are you growing in?",   placeholder: "" },
  { key: "wellbeing", label: "Wellbeing", icon: Heart,     prompt: "Body and mind needs?",       placeholder: "" },
];

export const timeHorizonOptions: { value: TimeHorizon; label: string }[] = [
  { value: "1yr", label: "1 year" }, { value: "3yr", label: "3 years" }, { value: "5yr", label: "5 years" },
];

export const templates: Omit<Chapter, "id" | "createdAt" | "updatedAt">[] = [];
