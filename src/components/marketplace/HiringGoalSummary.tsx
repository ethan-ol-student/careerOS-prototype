"use client";

import { Briefcase, MapPin, Sparkles, Target } from "lucide-react";
import { useEmployer } from "@/lib/context/EmployerContext";
import type { Priority, TalentType } from "@/lib/candidates/types";

const TALENT_LABEL: Record<TalentType, string> = {
  interns: "Interns",
  "fresh-graduates": "Fresh Graduates",
  "junior-professionals": "Junior Professionals",
  "mid-level": "Mid-level Professionals",
  "future-pipeline": "Future Talent Pipeline",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  "technical-skills": "Technical Skills",
  "learning-momentum": "Learning Momentum",
  communication: "Communication",
  leadership: "Leadership Potential",
  "industry-interest": "Industry Interest",
  location: "Location",
  availability: "Availability",
  "portfolio-strength": "Portfolio Strength",
  "growth-signal": "Growth Signal",
};

/**
 * Top section of the marketplace — shows the employer's hiring goal in a
 * scannable card. Falls back to sensible mock values if the employer
 * hasn't completed onboarding.
 */
export function HiringGoalSummary() {
  const { goal } = useEmployer();

  const role = goal.role || "Frontend Developer";
  const talent = goal.talentType
    ? TALENT_LABEL[goal.talentType]
    : "Junior Professionals";
  const priorities =
    goal.priorities.length > 0
      ? goal.priorities.map((p) => PRIORITY_LABEL[p])
      : ["Technical Skills", "Portfolio Strength", "Growth Signal"];
  const locationPref = goal.locationPreference || "Remote · Southeast Asia";

  return (
    <section className="glass-4 ring-clover/20 relative overflow-hidden rounded-2xl p-6 ring-1 sm:p-8">
      <div
        aria-hidden
        className="from-clover/15 pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-radial to-transparent blur-2xl"
      />
      <div className="relative grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7">
          <p className="text-clover text-xs font-mono font-semibold uppercase tracking-[0.18em]">
            Your hiring goal
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Hiring a <span className="text-clover">{role}</span> · {talent}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed sm:text-base">
            We&apos;ve translated this into a marketplace view weighted toward
            the signals that matter most to you.
          </p>
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-3 md:col-span-5 sm:grid-cols-2 md:grid-cols-1">
          <Stat
            icon={<Briefcase className="size-4" />}
            label="Role"
            value={role}
          />
          <Stat
            icon={<MapPin className="size-4" />}
            label="Location"
            value={locationPref}
          />
          <Stat
            icon={<Target className="size-4" />}
            label="Talent type"
            value={talent}
          />
        </div>

        <div className="col-span-12">
          <p className="text-muted-foreground mb-2 font-mono text-xs uppercase tracking-wider">
            Priority signals
          </p>
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <span
                key={p}
                className="bg-clover/10 text-clover-soft border-clover/30 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              >
                <Sparkles className="size-3" />
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-3 flex items-start gap-3 rounded-xl p-3">
      <span className="bg-clover/15 text-clover-soft mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
          {label}
        </p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
