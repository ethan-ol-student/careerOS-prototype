"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Briefcase, MapPin, Loader2 } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { ScoreBar } from "@/components/ui/ScoreBar";

interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string;
  duration: string;
  field: string;
  requiredSkills: string[];
  isDemo: boolean;
  match: number;
  personalized: boolean;
}

/**
 * Jobs catalogue: search + field filter over the DB, with an explainable
 * match badge per job (skill-bridge score for signed-in candidates).
 */
export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [field, setField] = useState("");
  const [loading, setLoading] = useState(true);

  // Debounced fetch on search/filter change.
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (field) params.set("field", field);
      const res = await fetch(`/api/jobs?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setJobs(json.data.jobs);
        if (json.data.fields.length) setFields(json.data.fields);
      }
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, field]);

  const personalized = useMemo(() => jobs.some((j) => j.personalized), [jobs]);

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
          Opportunities
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Jobs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {personalized
            ? "Match scores are personal — based on your skills vs. each job's requirements."
            : "Curated baseline scores — add skills to your profile for personal matches."}
        </p>

        {/* Search + field filter */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="border-border/15 bg-foreground/2 focus-within:border-luminous/60 flex min-h-11 flex-1 items-center gap-2 rounded-lg border px-3">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search titles or companies…"
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setField("")}>
              <Chip tone={field === "" ? "luminous" : "neutral"}>All fields</Chip>
            </button>
            {fields.map((f) => (
              <button key={f} type="button" onClick={() => setField(f === field ? "" : f)}>
                <Chip tone={field === f ? "luminous" : "neutral"}>{f}</Chip>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading jobs…
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-muted-foreground mt-12">No jobs match that search.</p>
        ) : (
          <Grid12 className="mt-6">
            {jobs.map((job) => (
              <Col key={job.id} span={12} md={6} lg={4}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="glass-3 hover:border-luminous/40 border-border/15 flex h-full flex-col rounded-2xl border p-6 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold tracking-tight">
                        {job.title}
                      </h2>
                      <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-sm">
                        <Briefcase className="size-3.5 shrink-0" />
                        {job.company}
                      </p>
                    </div>
                    {job.isDemo && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Demo data
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                    <MapPin className="size-3.5" />
                    {job.location} · {job.duration}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.requiredSkills.slice(0, 4).map((skill) => (
                      <Chip key={skill}>{skill}</Chip>
                    ))}
                  </div>
                  {/* Reference §07: boxed match panel at the card foot */}
                  <div className="mt-auto pt-4">
                    <div className="border-border/15 bg-linear-to-b from-foreground/5 to-foreground/2 rounded-lg border px-3 py-2.5">
                      <ScoreBar
                        label={job.personalized ? "Your match" : "Base match"}
                        value={job.match}
                        size="sm"
                      />
                    </div>
                  </div>
                </Link>
              </Col>
            ))}
          </Grid12>
        )}
      </main>
    </AppShell>
  );
}
