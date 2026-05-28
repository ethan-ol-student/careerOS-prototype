"use client";

import {
  Bell,
  Eye,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoopState } from "./LoopPanels";

interface MonthlyProgressCardProps {
  state: LoopState;
  className?: string;
}

export function MonthlyProgressCard({ state, className }: MonthlyProgressCardProps) {
  const completedTasks = Math.min(state.skills.length + state.loops, 8);
  const totalTasks = 8;
  const progressPct = Math.round((completedTasks / totalTasks) * 100);
  const notifications = buildNotifications(state);

  return (
    <div
      className={cn(
        "glass-3 relative overflow-hidden rounded-2xl p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="from-luminous/15 pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-radial to-transparent"
      />

      {/* Monthly progress */}
      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
              Monthly tasks
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">
              {completedTasks} of {totalTasks} complete
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Keep building — every task compounds your readiness.
            </p>
          </div>
          <span className="bg-clover/15 text-clover hidden items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex">
            <TrendingUp className="size-3" />
            {progressPct}%
          </span>
        </div>

        <div className="bg-muted/40 h-2.5 w-full overflow-hidden rounded-full">
          <div
            className="from-luminous to-clover h-full rounded-full bg-linear-to-r transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <ul
          className="text-muted-foreground mt-3 grid grid-cols-4 gap-1.5 text-[11px]"
          aria-label={`${completedTasks} of ${totalTasks} weekly tasks complete`}
        >
          {Array.from({ length: totalTasks }, (_, i) => {
            const done = i < completedTasks;
            return (
              <li
                key={i}
                className={cn(
                  "flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 transition-colors",
                  done
                    ? "bg-clover/15 text-clover"
                    : "bg-card/40 border-border/30 border",
                )}
              >
                {done ? (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                ) : (
                  <span aria-hidden className="size-1 rounded-full bg-current opacity-40" />
                )}
                W{i + 1}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Notifications */}
      <div className="border-border/40 relative mt-5 border-t pt-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bell className="text-muted-foreground/80 size-3.5" aria-hidden />
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.12em]">
              Notifications
            </p>
          </div>
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
            {notifications.length} new
          </span>
        </div>
        <ul
          className="flex flex-col gap-2"
          aria-label={`${notifications.length} new notifications`}
        >
          {notifications.map((n) => (
            <li
              key={n.id}
              className="border-border/40 bg-card/40 flex items-start gap-3 rounded-lg border p-3"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                  n.tone === "watch"
                    ? "bg-luminous/15 text-luminous"
                    : "bg-clover/15 text-clover",
                )}
              >
                {n.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{n.title}</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  {n.timeAgo}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface Notification {
  id: string;
  title: React.ReactNode;
  timeAgo: string;
  icon: React.ReactNode;
  tone: "watch" | "growth";
}

function buildNotifications(state: LoopState): Notification[] {
  const employerCount = 3 + state.loops * 2;
  const latest = state.skills.at(-1);

  const base: Notification[] = [
    {
      id: "monitoring",
      title: (
        <>
          Your profile has been monitored by{" "}
          <span className="text-luminous font-medium">
            {employerCount} employers
          </span>{" "}
          with your skill trajectory.
        </>
      ),
      timeAgo: "Just now",
      icon: <Eye className="size-3.5" />,
      tone: "watch",
    },
    {
      id: "growth",
      title: (
        <>
          AI compiled{" "}
          <span className="text-clover font-medium">
            {2 + state.loops} new recommendations
          </span>{" "}
          based on your readiness.
        </>
      ),
      timeAgo: "5 min ago",
      icon: <Sparkles className="size-3.5" />,
      tone: "growth",
    },
  ];

  if (latest) {
    base.unshift({
      id: "skill-added",
      title: (
        <>
          <span className="text-luminous font-medium">
            &ldquo;{latest}&rdquo;
          </span>{" "}
          unlocked new trajectory branches.
        </>
      ),
      timeAgo: "Just now",
      icon: <TrendingUp className="size-3.5" />,
      tone: "growth",
    });
  }

  return base.slice(0, 3);
}
