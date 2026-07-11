// ─────────────────────────────────────────────────────────────
// Event timetable types
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
