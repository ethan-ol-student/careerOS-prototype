"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2, MapPin } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";
import type { CompanyMetrics } from "@/lib/services/companies.service";

interface CompanyDetail extends CompanyMetrics {
  jobs: {
    id: string;
    title: string;
    location: string;
    duration: string;
    field: string;
    baseMatch: number;
    isDemo: boolean;
  }[];
}

/** Company profile: fit signals, responsiveness, and open roles. */
export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/companies/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setCompany(json.data);
      else setError(json.error?.message ?? "Company not found.");
    })();
  }, [id]);

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <Link
          href="/companies"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" /> All companies
        </Link>

        {error && <p className="text-destructive mt-8">{error}</p>}
        {!company && !error && (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        )}

        {company && (
          <Grid12 className="mt-4">
            <Col span={12} lg={8}>
              <section className="glass-3 rounded-2xl p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Building2 className="text-luminous size-8" />
                  <h1 className="text-2xl font-semibold">{company.name}</h1>
                  {company.demoMetrics && (
                    <Badge variant="outline">Demo data</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
                  <MapPin className="size-4" />
                  {company.location || "Location not listed"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {company.size && <Chip>Size: {company.size}</Chip>}
                  {company.type && <Chip tone="luminous">Type: {company.type}</Chip>}
                </div>
                {company.sourceUrl && (
                  <a
                    href={company.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-luminous mt-3 inline-block text-sm hover:underline"
                  >
                    Careers site →
                  </a>
                )}

                <h2 className="mt-8 font-semibold">Open roles</h2>
                {company.jobs.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    No open roles right now.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {company.jobs.map((job) => (
                      <li key={job.id}>
                        <Link
                          href={`/jobs/${job.id}`}
                          className="border-border/15 bg-foreground/2 hover:border-luminous/40 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{job.title}</p>
                            <p className="text-muted-foreground text-xs">
                              {job.location} · {job.duration}
                            </p>
                          </div>
                          <span className="text-luminous shrink-0 text-sm font-semibold">
                            {job.baseMatch}%
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Col>

            <Col span={12} lg={4}>
              <section className="glass-3 rounded-2xl p-6">
                <ScoreBar
                  label="Candidate-friendly"
                  value={company.responseScore}
                  accent="clover"
                />
                <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
                  <li>
                    • {company.applicants} application
                    {company.applicants === 1 ? "" : "s"} received
                    {company.applicants === 0 ? " yet" : ""}.
                  </li>
                  {company.respondedShare !== null ? (
                    <li>
                      • {Math.round(company.respondedShare * 100)}% of applicants
                      got a response.
                    </li>
                  ) : (
                    <li>
                      • Score is a seeded demo estimate until applications
                      arrive.
                    </li>
                  )}
                </ul>
              </section>
            </Col>
          </Grid12>
        )}
      </main>
    </AppShell>
  );
}
