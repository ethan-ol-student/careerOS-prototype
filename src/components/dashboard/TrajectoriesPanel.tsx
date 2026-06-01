"use client";

import { GitBranch, ArrowRight } from "lucide-react";
import { Col } from "@/components/app/Grid";
import {
  PhaseWidgetGrid,
  DashboardCard,
  WidgetHeader,
} from "@/components/dashboard/PhaseWidgetGrid";
import { getTrajectories } from "@/lib/dashboard/trajectories";
import type { CandidateDashboardData } from "@/lib/dashboard/types";

/**
 * "Possible paths from here" — the landscape view (principles #1 & #2).
 *
 * Instead of a single linear "next phase" arrow, this surfaces the
 * realistic RANGE of trajectories for the candidate's current phase,
 * each with explicit, honest trade-offs (what you gain vs. give up).
 * Phase-agnostic: mounted once in the persistent `DashboardShell`, so
 * every phase gets it. Pure presentation over static guidance from
 * `lib/dashboard/trajectories.ts` — no scores, no false precision.
 */
export function TrajectoriesPanel({ data }: { data: CandidateDashboardData }) {
  const options = getTrajectories(data.phase);
  if (options.length === 0) return null;

  return (
    <PhaseWidgetGrid topLine>
      <Col span={12}>
        <DashboardCard glow="luminous">
          <WidgetHeader
            icon={GitBranch}
            eyebrow="Possible paths from here"
            title="Several realistic directions — not one answer"
            accent="luminous"
            description="A career is a long arc with pivots and trade-offs. Here are honest options from where you are now; there's no single 'correct' next step."
          />
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {options.map((opt) => (
              <li
                key={opt.id}
                className="border-border/50 bg-card/40 flex flex-col gap-2 rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold leading-snug">
                    {opt.title}
                  </h4>
                  <span className="text-muted-foreground shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {opt.horizon}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {opt.summary}
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {opt.tradeoffs.map((t) => {
                    const isGain = t.toLowerCase().startsWith("gain");
                    return (
                      <li
                        key={t}
                        className="text-foreground/80 flex items-start gap-1.5 text-[11px] leading-snug"
                      >
                        <ArrowRight
                          className={
                            isGain
                              ? "text-clover mt-0.5 size-3 shrink-0"
                              : "text-muted-foreground mt-0.5 size-3 shrink-0"
                          }
                          aria-hidden
                        />
                        <span>{t}</span>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-4 text-[11px] leading-relaxed">
            These are general guidance for your phase, not personalized
            predictions — you know your context best.
          </p>
        </DashboardCard>
      </Col>
    </PhaseWidgetGrid>
  );
}
