"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Building2,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { MarketValuePanel } from "@/components/market/MarketValuePanel";

interface JobDetail {
  id: string;
  title: string;
  company: string;
  companyId: string;
  companySize: string;
  companyType: string;
  location: string;
  duration: string;
  field: string;
  requiredSkills: string[];
  isDemo: boolean;
  sourceUrl: string | null;
  match: number;
  matchReasons: string[];
  matched: string[];
  missing: string[];
  personalized: boolean;
  alreadyApplied: boolean;
}

/** Job detail: explainable match (matched vs missing skills) + easy apply. */
export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setJob(json.data);
      setApplied(json.data.alreadyApplied);
    } else {
      setError(json.error?.message ?? "Job not found.");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    void load();
  }, [load]);

  async function apply() {
    setApplying(true);
    setError(null);
    const res = await fetch(`/api/jobs/${id}/apply`, { method: "POST" });
    const json = await res.json();
    setApplying(false);
    if (json.ok || res.status === 409) setApplied(true);
    if (!json.ok && res.status !== 409) {
      setError(json.error?.message ?? "Could not apply.");
    }
  }

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <Link
          href="/jobs"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> All jobs
        </Link>

        {error && !job && <p className="text-destructive mt-8">{error}</p>}
        {!job && !error && (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        )}

        {job && (
          <Grid12 className="mt-4">
            <Col span={12} lg={8}>
              <section className="glass-3 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-luminous font-mono text-xs font-semibold uppercase tracking-[0.18em]">
                      Opportunity
                    </p>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
                      {job.title}
                    </h1>
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="size-4" /> {job.company}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-4" /> {job.location}
                      </span>
                      <span>{job.duration}</span>
                    </p>
                  </div>
                  {job.isDemo && <Badge variant="outline">Demo data</Badge>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <Building2 className="text-luminous size-4" />
                  {job.companySize && <Chip>{job.companySize}</Chip>}
                  {job.companyType && <Chip>{job.companyType}</Chip>}
                  <Link
                    href={`/companies/${job.companyId}`}
                    className="text-luminous text-sm hover:underline"
                  >
                    Company profile →
                  </Link>
                </div>

                <h2 className="text-muted-foreground mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Required skills
                </h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((s) => {
                    const have = job.matched.includes(s);
                    return (
                      <Chip key={s} tone={have ? "clover" : "neutral"}>
                        {have ? "✓ " : ""}
                        {s}
                      </Chip>
                    );
                  })}
                </div>

                <div className="mt-6">
                  {applied ? (
                    <p className="text-clover inline-flex items-center gap-2 font-medium">
                      <CheckCircle2 className="size-5" />
                      Applied — track it in{" "}
                      <Link href="/candidate/applications" className="underline">
                        My applications
                      </Link>
                    </p>
                  ) : (
                    <Button onClick={apply} disabled={applying}>
                      <Send />
                      {applying ? "Applying…" : "Easy apply"}
                    </Button>
                  )}
                  {error && applied === false && (
                    <p className="text-destructive mt-2 text-sm">{error}</p>
                  )}
                </div>
              </section>
            </Col>

            <Col span={12} lg={4}>
              <section className="glass-3 rounded-2xl p-6">
                <ScoreBar
                  label={job.personalized ? "Your match" : "Base match"}
                  value={job.match}
                />
                <h2 className="text-muted-foreground mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Why this score?
                </h2>
                <ul className="text-muted-foreground mt-2 space-y-1.5 text-sm">
                  {job.matchReasons.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
                {job.missing.length > 0 && (
                  <>
                    <h3 className="text-muted-foreground mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
                      Bridge to close
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.missing.map((s) => (
                        <Chip key={s} tone="warning">
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </>
                )}

                {/* Market value for this role (Feature 5.7) */}
                <div className="border-border/15 mt-4 border-t pt-4">
                  <MarketValuePanel field={job.field} roleTitle={job.title} />
                </div>
              </section>
            </Col>
          </Grid12>
        )}
      </main>
    </AppShell>
  );
}
