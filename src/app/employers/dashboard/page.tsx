"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Filter,
  Users,
} from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { Chip, type ChipTone } from "@/components/ui/Chip";
import { useAuth } from "@/lib/context/AuthContext";
import { cn } from "@/lib/utils";

/**
 * Employer dashboard — one viewport, no scrolling (mirrors the candidate
 * cockpit's zero-scroll approach): Who Are You + Interviews Today on top,
 * Your Open Roles + Hiring Funnel below. Every card renders real data
 * (own job posts, live applications) and deep-links into its module.
 */

interface OwnJob {
  id: string;
  title: string;
  status: string;
  location: string;
  createdAt: string;
  expiresAt: string | null;
  company: { name: string };
  _count: { applications: number };
}

interface EmployerApplication {
  id: string;
  status: string;
  createdAt: string;
  job: { id: string; title: string; company: string; status: string };
  candidate: { name: string; headline: string };
}

const JOB_STATUS_TONE: Record<string, ChipTone> = {
  active: "clover",
  fulfilled: "luminous",
  expired: "neutral",
};

// Funnel stages are cumulative: a candidate at "offer" has passed
// screening and interview. "Hired" = accepted on a fulfilled post.
const FUNNEL_STAGES = [
  { label: "Applied", test: () => true },
  {
    label: "Screened",
    test: (a: EmployerApplication) =>
      ["reviewing", "interview", "offer"].includes(a.status),
  },
  {
    label: "Interview",
    test: (a: EmployerApplication) => ["interview", "offer"].includes(a.status),
  },
  { label: "Offer", test: (a: EmployerApplication) => a.status === "offer" },
  {
    label: "Hired",
    test: (a: EmployerApplication) =>
      a.status === "offer" && a.job.status === "fulfilled",
  },
];

function DashCard({
  title,
  href,
  hrefLabel,
  className,
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "glass-3 flex min-h-0 flex-col overflow-hidden rounded-2xl p-5",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.14em]">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            aria-label={hrefLabel ?? title}
            className="text-muted-foreground hover:text-clover shrink-0 transition-colors"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<OwnJob[]>([]);
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [org, setOrg] = useState<{ organizationName: string; role: string }>({
    organizationName: "",
    role: "",
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [j, a, p] = await Promise.all([
        fetch("/api/employer/jobs", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/employer/applications", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch("/api/employer/profile", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);
      if (cancelled) return;
      if (j?.ok) setJobs(j.data.jobs);
      if (a?.ok) setApplications(a.data.applications);
      if (p?.ok) setOrg({ organizationName: p.data.organizationName, role: p.data.role });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName =
    user?.name?.trim() || user?.username?.trim() || user?.email?.split("@")[0] || "there";

  const funnel = useMemo(() => {
    const counts = FUNNEL_STAGES.map((s) => ({
      label: s.label,
      count: applications.filter(s.test).length,
    }));
    const max = Math.max(1, counts[0]?.count ?? 0);
    return { counts, max };
  }, [applications]);

  // "Interviews today": applications currently at the interview stage.
  // Interview scheduling has no date field yet, so the calendar shows the
  // real week with today marked and lists who is in the interview stage.
  const interviews = useMemo(
    () => applications.filter((a) => a.status === "interview"),
    [applications],
  );
  const today = new Date();
  const mondayIndex = (today.getDay() + 6) % 7;

  const openRoles = jobs.filter((j) => j.status === "active");

  return (
    <EmployerAppShell>
      <main className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4 px-4 pb-4 pt-2 lg:min-h-0">
        <h1 className="shrink-0 text-xl font-semibold tracking-tight sm:text-2xl">
          Good day, <span className="text-clover">{displayName}</span>
        </h1>

        <div className="grid flex-1 gap-4 lg:min-h-0 lg:grid-cols-12 lg:grid-rows-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* ── Who are you ── */}
          <DashCard
            title="Who are you?"
            href="/employers/settings"
            hrefLabel="Edit profile"
            className="lg:col-span-5"
          >
            <div className="flex min-h-0 flex-1 items-center gap-4">
              <div className="bg-clover/15 ring-clover/30 text-clover-soft flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-2">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-mono font-semibold uppercase tracking-wide">
                  {displayName}
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {org.organizationName || "Add your organization in Settings"}
                </p>
                {org.role && (
                  <p className="text-muted-foreground mt-1 flex items-center gap-1.5 truncate text-xs">
                    <Briefcase className="text-clover size-3.5 shrink-0" aria-hidden />
                    Hiring: <span className="text-foreground/90">{org.role}</span>
                  </p>
                )}
              </div>
            </div>
          </DashCard>

          {/* ── Interviews today (calendar) ── */}
          <DashCard
            title="Interviews today"
            href="/employers/applicants"
            hrefLabel="Open applicants"
            className="lg:col-span-7"
          >
            {/* Compact week strip, today ringed */}
            <div className="grid shrink-0 grid-cols-7 gap-1.5">
              {DAY_LABELS.map((d, i) => {
                const date = new Date(today);
                date.setDate(today.getDate() - mondayIndex + i);
                const isToday = i === mondayIndex;
                return (
                  <div
                    key={d}
                    className={cn(
                      "rounded-lg border px-1 py-1.5 text-center",
                      isToday
                        ? "border-clover/60 bg-clover/10"
                        : "border-border/15 bg-card/30",
                    )}
                  >
                    <p className="text-muted-foreground text-[10px] uppercase">{d}</p>
                    <p className={cn("text-sm font-semibold", isToday && "text-clover")}>
                      {date.getDate()}
                    </p>
                    {isToday && interviews.length > 0 && (
                      <span className="bg-clover mx-auto mt-0.5 block size-1.5 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 min-h-0 flex-1 overflow-hidden">
              {interviews.length === 0 ? (
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CalendarDays className="size-4" aria-hidden />
                  No interviews today.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {interviews.slice(0, 3).map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <span className="bg-clover size-1.5 shrink-0 rounded-full" aria-hidden />
                      <span className="truncate font-medium">{a.candidate.name}</span>
                      <span className="text-muted-foreground min-w-0 flex-1 truncate text-xs">
                        {a.job.title} · interview stage
                      </span>
                    </li>
                  ))}
                  {interviews.length > 3 && (
                    <li className="text-muted-foreground text-xs">
                      +{interviews.length - 3} more in the interview stage
                    </li>
                  )}
                </ul>
              )}
            </div>
          </DashCard>

          {/* ── Your open roles ── */}
          <DashCard
            title="Your open roles"
            href="/employers/post-job"
            hrefLabel="Post a job"
            className="lg:col-span-6"
          >
            {openRoles.length === 0 ? (
              <div className="flex min-h-0 flex-1 flex-col items-start justify-center gap-2">
                <p className="text-muted-foreground text-sm">
                  No open roles yet.
                </p>
                <Link
                  href="/employers/post-job"
                  className="text-clover text-sm font-medium hover:underline"
                >
                  Post your first job →
                </Link>
              </div>
            ) : (
              <ul className="divide-border/15 min-h-0 flex-1 divide-y overflow-hidden">
                {openRoles.slice(0, 4).map((j) => (
                  <li key={j.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <Chip tone="clover" className="shrink-0">You</Chip>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{j.title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {j.location}
                        {j.expiresAt
                          ? ` · expires ${new Date(j.expiresAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs tabular-nums">
                      <Users className="size-3.5" aria-hidden />
                      {j._count.applications}
                    </span>
                    <Chip tone={JOB_STATUS_TONE[j.status] ?? "neutral"} className="shrink-0">
                      {j.status}
                    </Chip>
                  </li>
                ))}
                {openRoles.length > 4 && (
                  <li className="text-muted-foreground py-2 text-xs">
                    +{openRoles.length - 4} more on the Post Job page
                  </li>
                )}
              </ul>
            )}
          </DashCard>

          {/* ── Hiring funnel ── */}
          <DashCard
            title="Hiring funnel"
            href="/employers/applicants"
            hrefLabel="Review applicants"
            className="lg:col-span-6"
          >
            {applications.length === 0 ? (
              <p className="text-muted-foreground flex min-h-0 flex-1 items-center gap-2 text-sm">
                <Filter className="size-4" aria-hidden />
                No applications yet — the funnel fills as candidates apply.
              </p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-2">
                {funnel.counts.map((stage, i) => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <span className="text-muted-foreground w-16 shrink-0 text-xs">
                      {stage.label}
                    </span>
                    <div className="flex min-w-0 flex-1 justify-center">
                      <div
                        className={cn(
                          "h-5 rounded-lg transition-[width] duration-700",
                          ["bg-clover/70", "bg-clover/55", "bg-clover/40", "bg-clover/30", "bg-clover/20"][i],
                        )}
                        style={{
                          width: `${Math.max(6, (stage.count / funnel.max) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {stage.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </DashCard>
        </div>
      </main>
    </EmployerAppShell>
  );
}
