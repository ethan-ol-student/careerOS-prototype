"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  FileCheck2,
  CalendarDays,
  Loader2,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { LinkButton } from "@/components/ui/LinkButton";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  createdAt: string;
}
interface AppRow {
  id: string;
  status: string;
  createdAt: string;
  job: { id: string; title: string; company: string; location: string };
  events: EventRow[];
  noResponseYet: boolean;
}

/* The four pipeline stages of the reference stepper. Terminal statuses
   (rejected / withdrawn / expired) freeze the stepper at the stage the
   application actually reached. */
const STAGES = [
  { key: "submitted", label: "Applied" },
  { key: "reviewing", label: "Screening" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
] as const;

const TERMINAL = new Set(["rejected", "withdrawn", "expired"]);

function stageIndex(app: AppRow): number {
  const direct = STAGES.findIndex((s) => s.key === app.status);
  if (direct >= 0) return direct;
  // Terminal: furthest stage recorded in the event trail.
  let max = 0;
  for (const e of app.events) {
    const i = STAGES.findIndex((s) => s.key === (e.toStatus ?? ""));
    if (i > max) max = i;
  }
  return max;
}

/* Status pill (top-right of each card). */
const PILLS: Record<
  string,
  { label: string; cls: string; dot?: string; check?: boolean }
> = {
  submitted: {
    label: "Applied",
    cls: "border-border/15 bg-foreground/3 text-muted-foreground",
    dot: "bg-luminous",
  },
  reviewing: {
    label: "Screening",
    cls: "border-luminous/30 bg-luminous/10 text-luminous-soft",
    dot: "bg-luminous",
  },
  interview: {
    label: "Interview",
    cls: "border-yellow-400/40 bg-yellow-400/12 text-yellow-400",
    dot: "bg-yellow-400 shadow-[0_0_8px] shadow-yellow-400/70",
  },
  offer: {
    label: "Offer",
    cls: "border-clover/40 bg-clover/14 text-clover-soft",
    check: true,
  },
  rejected: {
    label: "Rejected",
    cls: "border-destructive/35 bg-destructive/10 text-destructive",
  },
  withdrawn: {
    label: "Withdrawn",
    cls: "border-border/15 bg-foreground/3 text-muted-foreground",
  },
  expired: {
    label: "Expired",
    cls: "border-border/15 bg-foreground/3 text-muted-foreground",
  },
};

/* Stage explanation callout, toned to the current stage. */
const CALLOUTS: Record<
  string,
  { cls: string; icon: typeof Clock; iconCls: string; lead: string }
> = {
  submitted: {
    cls: "border-border/15 bg-foreground/2",
    icon: Clock,
    iconCls: "text-luminous-soft",
    lead: "Application received",
  },
  reviewing: {
    cls: "border-luminous/20 bg-luminous/6",
    icon: Search,
    iconCls: "text-luminous",
    lead: "In screening",
  },
  interview: {
    cls: "border-yellow-400/20 bg-yellow-400/6",
    icon: CalendarDays,
    iconCls: "text-yellow-400",
    lead: "Interview stage",
  },
  offer: {
    cls: "border-clover/20 bg-clover/7",
    icon: FileCheck2,
    iconCls: "text-clover",
    lead: "Offer received",
  },
  rejected: {
    cls: "border-destructive/20 bg-destructive/6",
    icon: XCircle,
    iconCls: "text-destructive",
    lead: "Not moving forward this time",
  },
  withdrawn: {
    cls: "border-border/15 bg-foreground/2",
    icon: XCircle,
    iconCls: "text-muted-foreground",
    lead: "You withdrew this application",
  },
  expired: {
    cls: "border-border/15 bg-foreground/2",
    icon: Clock,
    iconCls: "text-muted-foreground",
    lead: "Expired — no decision in time",
  },
};

/* Connector-line fill per current stage (progress over 3 gaps). */
const LINE_WIDTH = ["0%", "29%", "58%", "87%"];
const LINE_COLOR = [
  "bg-luminous",
  "bg-luminous",
  "bg-linear-to-r from-luminous to-yellow-400",
  "bg-linear-to-r from-luminous to-clover",
];

function eventLabel(e: EventRow): string {
  if (e.type === "submitted") return "Application submitted";
  if (e.type === "expired") return "Expired — no decision in time";
  return `Status: ${e.fromStatus ?? "?"} → ${e.toStatus ?? "?"}`;
}

function daysAgo(iso: string): number {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000),
  );
}

/**
 * Candidate application tracker — one card per application with the
 * reference layout: logo square, status pill, four-stage stepper,
 * stage callout, and the full append-only event timeline.
 */
export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppRow[] | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me/applications", { cache: "no-store" });
      const json = await res.json();
      setApps(json.ok ? json.data.applications : []);
    })();
  }, []);

  // Summary strip numbers.
  const active = apps?.filter((a) => !TERMINAL.has(a.status)).length ?? 0;
  const interviews = apps?.filter((a) => a.status === "interview").length ?? 0;
  const offers = apps?.filter((a) => a.status === "offer").length ?? 0;
  const responseDays: number[] = (apps ?? [])
    .map((a) => {
      const first = a.events.find((e) => e.type !== "submitted");
      return first
        ? (new Date(first.createdAt).getTime() -
            new Date(a.createdAt).getTime()) /
            86_400_000
        : null;
    })
    .filter((d): d is number => d !== null && d >= 0);
  const avgResponse = responseDays.length
    ? `${Math.max(1, Math.round(responseDays.reduce((s, d) => s + d, 0) / responseDays.length))}d`
    : "—";

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous font-mono text-xs font-semibold uppercase tracking-[0.18em]">
          Your loop
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          My applications
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          One card per application, with an explicit stage timeline and next
          action.
        </p>

        {!apps ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : apps.length === 0 ? (
          <div className="glass-3 mt-8 rounded-2xl p-8 text-center">
            <p className="font-medium">No applications yet.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Find a role on the{" "}
              <Link href="/jobs" className="text-luminous underline">
                jobs page
              </Link>{" "}
              and hit Easy apply.
            </p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="border-luminous/25 bg-linear-to-b from-luminous/10 to-luminous/2 min-w-36 flex-1 rounded-xl border p-4">
                <p className="text-luminous-soft font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Active
                </p>
                <p className="mt-1.5 text-2xl font-extrabold leading-none">
                  {active}
                </p>
              </div>
              <div className="border-border/15 bg-foreground/2 min-w-36 flex-1 rounded-xl border p-4">
                <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Interviews
                </p>
                <p className="mt-1.5 text-2xl font-extrabold leading-none text-yellow-400">
                  {interviews}
                </p>
              </div>
              <div className="border-border/15 bg-foreground/2 min-w-36 flex-1 rounded-xl border p-4">
                <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Offers
                </p>
                <p className="text-clover mt-1.5 text-2xl font-extrabold leading-none">
                  {offers}
                </p>
              </div>
              <div className="border-border/15 bg-foreground/2 min-w-36 flex-1 rounded-xl border p-4">
                <p className="text-muted-foreground font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Avg. response
                </p>
                <p className="mt-1.5 text-2xl font-extrabold leading-none">
                  {avgResponse}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {apps.map((app) => {
                const idx = stageIndex(app);
                const terminal = TERMINAL.has(app.status);
                const pill = PILLS[app.status] ?? PILLS.submitted;
                const callout = CALLOUTS[app.status] ?? CALLOUTS.submitted;
                const CalloutIcon = callout.icon;
                const latest = app.events[app.events.length - 1];
                const isOffer = app.status === "offer";
                return (
                  <article
                    key={app.id}
                    className={cn(
                      "rounded-2xl border p-6",
                      isOffer
                        ? "border-clover/22 bg-linear-to-b from-clover/5 to-foreground/2"
                        : "border-border/15 bg-foreground/2",
                    )}
                  >
                    {/* head */}
                    <div className="flex flex-wrap items-start gap-4">
                      <span className="bg-linear-to-br from-luminous to-luminous/75 flex size-14 shrink-0 items-center justify-center rounded-xl text-xl font-extrabold tracking-tight text-white">
                        {app.job.company.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-48 flex-1">
                        <Link
                          href={`/jobs/${app.job.id}`}
                          className="text-lg font-bold tracking-tight hover:underline"
                        >
                          {app.job.title}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          {app.job.company}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <Chip
                            tone="luminous"
                            icon={<MapPin className="size-3" />}
                          >
                            {app.job.location}
                          </Chip>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold",
                          pill.cls,
                        )}
                      >
                        {pill.check ? (
                          <Check className="size-3.5" />
                        ) : pill.dot ? (
                          <span
                            className={cn(
                              "size-1.75 rounded-full",
                              pill.dot,
                            )}
                          />
                        ) : null}
                        {pill.label}
                      </span>
                    </div>

                    {/* stepper */}
                    <div className="relative mt-6 px-1.5">
                      <div className="bg-border/10 absolute left-[6.5%] right-[6.5%] top-2.75 h-0.5" />
                      <div
                        className={cn(
                          "absolute left-[6.5%] top-2.75 h-0.5",
                          LINE_COLOR[idx],
                        )}
                        style={{ width: LINE_WIDTH[idx] }}
                      />
                      <div className="relative z-10 flex justify-between">
                        {STAGES.map((stage, i) => {
                          const done = i < idx || (terminal && i <= idx);
                          const current = !terminal && i === idx;
                          return (
                            <div
                              key={stage.key}
                              className="flex w-1/4 flex-col items-center gap-2"
                            >
                              {done || (current && isOffer) ? (
                                <span
                                  className={cn(
                                    "flex size-6 items-center justify-center rounded-full",
                                    i === 3
                                      ? "bg-clover text-background shadow-[0_0_0_5px] shadow-clover/18"
                                      : "bg-luminous text-white",
                                  )}
                                >
                                  <Check className="size-3.5" strokeWidth={3} />
                                </span>
                              ) : current ? (
                                <span
                                  className={cn(
                                    "flex size-6 items-center justify-center rounded-full",
                                    i === 2
                                      ? "bg-yellow-400 shadow-[0_0_0_5px] shadow-yellow-400/18"
                                      : "bg-luminous shadow-[0_0_0_5px] shadow-luminous/18",
                                  )}
                                >
                                  <span className="bg-background size-2 rounded-full" />
                                </span>
                              ) : (
                                <span className="border-border/20 bg-background size-6 rounded-full border-2" />
                              )}
                              <span
                                className={cn(
                                  "font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em]",
                                  current
                                    ? i === 2
                                      ? "text-yellow-400"
                                      : i === 3
                                        ? "text-clover"
                                        : "text-luminous-soft"
                                    : done
                                      ? "text-foreground/85"
                                      : "text-muted-foreground/70",
                                )}
                              >
                                {stage.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* stage callout */}
                    <div
                      className={cn(
                        "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5",
                        callout.cls,
                      )}
                    >
                      <CalloutIcon
                        className={cn("mt-0.5 size-4 shrink-0", callout.iconCls)}
                      />
                      <p className="text-sm leading-relaxed">
                        <strong className="font-semibold">
                          {callout.lead}
                          {app.status === "submitted"
                            ? ` ${daysAgo(app.createdAt)} day${daysAgo(app.createdAt) === 1 ? "" : "s"} ago.`
                            : "."}
                        </strong>{" "}
                        <span className="text-muted-foreground">
                          {app.noResponseYet
                            ? "No response yet — employers typically screen within a week."
                            : latest
                              ? `${eventLabel(latest)} · ${new Date(latest.createdAt).toLocaleDateString()}`
                              : ""}
                        </span>
                      </p>
                    </div>

                    {/* full timeline (append-only trail, collapsed) */}
                    <details className="mt-4">
                      <summary className="text-muted-foreground hover:text-foreground cursor-pointer font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                        Full timeline
                      </summary>
                      <ol className="border-border/15 mt-3 space-y-3 border-l pl-4">
                        {app.events.map((e) => (
                          <li key={e.id} className="relative">
                            <span className="bg-luminous absolute -left-5.25 top-1.5 size-2 rounded-full" />
                            <p className="text-sm">{eventLabel(e)}</p>
                            <p className="text-muted-foreground text-xs">
                              {new Date(e.createdAt).toLocaleString()}
                            </p>
                          </li>
                        ))}
                        {app.noResponseYet && (
                          <li className="relative">
                            <span className="bg-border absolute -left-5.25 top-1.5 size-2 rounded-full" />
                            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
                              <Clock className="size-3.5" />
                              No response yet
                            </p>
                          </li>
                        )}
                      </ol>
                    </details>

                    {/* actions */}
                    <div className="mt-4 flex items-center gap-2.5">
                      <LinkButton
                        href={`/jobs/${app.job.id}`}
                        variant="outline"
                        size="sm"
                      >
                        View role
                      </LinkButton>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
