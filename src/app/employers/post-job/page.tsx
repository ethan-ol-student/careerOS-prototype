"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { JobPostForm } from "@/components/employer/JobPostForm";
import { Grid12, Col } from "@/components/app/Grid";
import { Chip, type ChipTone } from "@/components/ui/Chip";

/**
 * Dedicated Post Job page — the full form (Quick Post fields + budget,
 * start date, timeline, team size) plus the employer's posting history.
 * Posts are soft-deleted only: fulfilled/expired posts leave the public
 * feed but stay here.
 */

interface OwnJob {
  id: string;
  title: string;
  status: string;
  field: string;
  location: string;
  createdAt: string;
  expiresAt: string | null;
  company: { name: string };
  _count: { applications: number };
}

const STATUS_TONE: Record<string, ChipTone> = {
  active: "clover",
  fulfilled: "luminous",
  expired: "neutral",
};

export default function PostJobPage() {
  const [jobs, setJobs] = useState<OwnJob[] | null>(null);

  const loadJobs = useCallback(async () => {
    const res = await fetch("/api/employer/jobs", { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (json?.ok) setJobs(json.data.jobs as OwnJob[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time fetch of the caller's posts.
    void loadJobs();
  }, [loadJobs]);

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto flex flex-col gap-8">
          <header>
            <p className="text-clover text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Hiring
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Post a job
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Goes live in the candidate feed immediately, runs for 30 days,
              and auto-fulfills once you accept an applicant you&apos;ve
              messaged.
            </p>
          </header>

          <Grid12>
            <Col span={12} lg={7}>
              <section className="glass-3 rounded-2xl p-6">
                <JobPostForm variant="full" onCreated={loadJobs} />
              </section>
            </Col>

            <Col span={12} lg={5}>
              <section className="glass-3 rounded-2xl p-6">
                <h2 className="text-sm font-mono font-semibold uppercase tracking-wider">
                  Your job posts
                </h2>
                {jobs === null ? (
                  <p className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading your posts…
                  </p>
                ) : jobs.length === 0 ? (
                  <p className="text-muted-foreground mt-4 text-sm">
                    Nothing posted yet — your posts and their status (active,
                    fulfilled, expired) will appear here.
                  </p>
                ) : (
                  <ul className="divide-border/15 mt-2 divide-y">
                    {jobs.map((j) => (
                      <li key={j.id} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {j.title}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {j.company.name} · {j.location} · posted{" "}
                            {new Date(j.createdAt).toLocaleDateString()}
                            {j.status === "active" && j.expiresAt
                              ? ` · expires ${new Date(j.expiresAt).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>
                        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs tabular-nums">
                          <Users className="size-3.5" aria-hidden />
                          {j._count.applications}
                        </span>
                        <Chip tone={STATUS_TONE[j.status] ?? "neutral"}>
                          {j.status}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Col>
          </Grid12>
        </div>
      </main>
    </EmployerAppShell>
  );
}
