"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Loader2, Clock } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";

interface ApplicantRow {
  id: string;
  status: string;
  createdAt: string;
  job: { id: string; title: string; company: string };
  candidate: { name: string; headline: string; skills: string[] };
  needsResponse: boolean;
}

const EMPLOYER_STATUSES = ["reviewing", "interview", "offer", "rejected"] as const;

/**
 * Employer applicant review, grouped per job. Setting a status writes an
 * ApplicationEvent (the candidate's timeline updates) and notifies the
 * candidate. Unanswered applications are flagged "No response yet" —
 * responsiveness feeds the public company leaderboard.
 */
export default function ApplicantsPage() {
  const [apps, setApps] = useState<ApplicantRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/employer/applications", { cache: "no-store" });
    const json = await res.json();
    setApps(json.ok ? json.data.applications : []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    void load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    await fetch(`/api/employer/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setBusy(null);
  }

  const byJob = useMemo(() => {
    const groups = new Map<string, { title: string; rows: ApplicantRow[] }>();
    for (const a of apps ?? []) {
      const g = groups.get(a.job.id) ?? { title: `${a.job.title} — ${a.job.company}`, rows: [] };
      g.rows.push(a);
      groups.set(a.job.id, g);
    }
    return [...groups.entries()];
  }, [apps]);

  return (
    <EmployerAppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Hiring loop
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
          <Users className="text-luminous size-6" />
          Applicants
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set a status on every application — your responsiveness is visible
          to candidates on the company leaderboard.
        </p>

        {!apps ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : apps.length === 0 ? (
          <div className="glass-3 mt-8 rounded-2xl p-8 text-center">
            <p className="font-medium">No applications yet.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              When candidates apply to catalogue jobs, they show up here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {byJob.map(([jobId, group]) => (
              <section key={jobId}>
                <h2 className="font-semibold">{group.title}</h2>
                <div className="mt-3 space-y-3">
                  {group.rows.map((a) => (
                    <div
                      key={a.id}
                      className="glass-3 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{a.candidate.name}</p>
                          {a.needsResponse && (
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="mr-1 size-3" />
                              No response yet
                            </Badge>
                          )}
                        </div>
                        {a.candidate.headline && (
                          <p className="text-muted-foreground truncate text-sm">
                            {a.candidate.headline}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {a.candidate.skills.map((s) => (
                            <Chip key={s}>{s}</Chip>
                          ))}
                        </div>
                        <p className="text-muted-foreground mt-1.5 text-xs">
                          Applied {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <label className="text-muted-foreground block text-xs">
                          Status
                          <Select
                            value={
                              EMPLOYER_STATUSES.includes(
                                a.status as (typeof EMPLOYER_STATUSES)[number],
                              )
                                ? a.status
                                : ""
                            }
                            onChange={(e) => {
                              if (e.target.value) void setStatus(a.id, e.target.value);
                            }}
                            disabled={busy === a.id}
                            wrapperClassName="mt-1 w-44"
                            className="min-h-11"
                          >
                            <option value="" disabled>
                              {a.status === "submitted" ? "Choose a response…" : a.status}
                            </option>
                            {EMPLOYER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Select>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </EmployerAppShell>
  );
}
