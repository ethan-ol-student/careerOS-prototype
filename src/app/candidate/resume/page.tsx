"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Download,
  Save,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Grid12, Col } from "@/components/app/Grid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { MeterRow } from "@/components/dashboard/PhaseWidgetGrid";
import type { ResumeData } from "@/lib/resume/data";
import type { CompletenessItem } from "@/lib/resume/completeness";

interface ResumePayload {
  data: ResumeData;
  completeness: { pct: number; items: CompletenessItem[] };
}
interface VersionRow {
  id: string;
  label: string;
  createdAt: string;
}

/**
 * Living Portfolio resume: real data preview, editable summary, PDF
 * download, named version snapshots, and a completeness meter. Mid-career
 * candidates see their "problems solved" leading the document — proof of
 * capability, not just titles.
 */
export default function ResumePage() {
  const [payload, setPayload] = useState<ResumePayload | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/me/resume", { cache: "no-store" }),
      fetch("/api/me/resume/versions", { cache: "no-store" }),
    ]);
    const j1 = await r1.json();
    const j2 = await r2.json();
    if (j1.ok) {
      setPayload(j1.data);
      setSummary(j1.data.data.summary);
    }
    if (j2.ok) setVersions(j2.data.versions);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time data bootstrap
    void load();
  }, [load]);

  async function saveSummary() {
    setBusy("summary");
    setNote(null);
    const res = await fetch("/api/me/portfolio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });
    const json = await res.json();
    setBusy(null);
    setNote(json.ok ? "Summary saved." : json.error?.message ?? "Save failed.");
    if (json.ok) void load();
  }

  async function saveVersion() {
    const label = window.prompt(
      "Name this version (e.g. \"Platform roles v2\"):",
    );
    if (!label?.trim()) return;
    setBusy("version");
    setNote(null);
    const res = await fetch("/api/me/resume/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }),
    });
    const json = await res.json();
    setBusy(null);
    setNote(json.ok ? `Saved version "${label.trim()}".` : json.error?.message ?? "Save failed.");
    if (json.ok) void load();
  }

  const d = payload?.data;

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
          Living portfolio
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">Resume</h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={saveVersion} variant="outline" disabled={busy !== null}>
              <Save />
              {busy === "version" ? "Saving…" : "Save version"}
            </Button>
            <a href="/api/me/resume/pdf" download>
              <Button disabled={busy !== null}>
                <Download />
                Download PDF
              </Button>
            </a>
          </div>
        </div>
        {note && <p className="text-clover mt-2 text-sm">{note}</p>}

        {!payload ? (
          <div className="text-muted-foreground mt-12 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading your resume…
          </div>
        ) : (
          <Grid12 className="mt-6">
            {/* Left: editable summary + preview of real data */}
            <Col span={12} lg={8}>
              <section className="glass-3 rounded-2xl p-6">
                <h2 className="flex items-center gap-2 font-semibold">
                  <FileText className="text-luminous size-4" />
                  Professional summary
                </h2>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  maxLength={600}
                  placeholder="A 2–3 sentence summary of who you are professionally…"
                  className="border-border/60 bg-card/40 focus:border-luminous/60 mt-3 w-full rounded-lg border p-3 text-sm outline-none"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">
                    {summary.length}/600 — this is the summary the PDF uses.
                  </p>
                  <Button size="sm" onClick={saveSummary} disabled={busy !== null}>
                    {busy === "summary" ? "Saving…" : "Save summary"}
                  </Button>
                </div>
              </section>

              {d && d.problemsSolved.length > 0 && (
                <section className="glass-3 mt-4 rounded-2xl p-6">
                  <h2 className="font-semibold">Selected problems solved</h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Leads your PDF — proof of capability before job titles.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {d.problemsSolved.map((p) => (
                      <li key={p} className="border-border/40 bg-card/40 rounded-lg border px-3 py-2 text-sm">
                        {p}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {d && (
                <section className="glass-3 mt-4 rounded-2xl p-6">
                  <h2 className="font-semibold">What goes into the PDF</h2>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Experience</p>
                      <ul className="mt-1.5 space-y-1.5 text-sm">
                        {d.experiences.length ? (
                          d.experiences.map((e, i) => (
                            <li key={i}>
                              <span className="font-medium">{e.role}</span>{" "}
                              <span className="text-muted-foreground">· {e.company} · {e.period}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-muted-foreground">None yet — add via Living Portfolio.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider">Skills</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {d.skills.length ? (
                          d.skills.map((skill) => <Chip key={skill}>{skill}</Chip>)
                        ) : (
                          <p className="text-muted-foreground text-sm">No skills yet.</p>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-3 text-xs uppercase tracking-wider">Projects</p>
                      <ul className="mt-1.5 space-y-1 text-sm">
                        {d.projects.length ? (
                          d.projects.map((p, i) => <li key={i}>{p.title}</li>)
                        ) : (
                          <li className="text-muted-foreground">None yet.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </section>
              )}
            </Col>

            {/* Right: completeness + versions */}
            <Col span={12} lg={4}>
              <section className="glass-3 rounded-2xl p-6">
                <h2 className="font-semibold">Completeness</h2>
                <MeterRow
                  label="Resume completeness"
                  value={payload.completeness.pct}
                  accent="clover"
                  className="mt-3"
                />
                <ul className="mt-4 space-y-2">
                  {payload.completeness.items.map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-sm">
                      {item.done ? (
                        <CheckCircle2 className="text-clover size-4 shrink-0" />
                      ) : (
                        <Circle className="text-muted-foreground size-4 shrink-0" />
                      )}
                      <span className={item.done ? "" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="glass-3 mt-4 rounded-2xl p-6">
                <h2 className="font-semibold">Saved versions</h2>
                {versions.length ? (
                  <ul className="mt-3 space-y-2">
                    {versions.map((v) => (
                      <li key={v.id} className="border-border/40 bg-card/40 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <span className="truncate font-medium">{v.label}</span>
                        <span className="text-muted-foreground ml-2 shrink-0 text-xs">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-2 text-sm">
                    No versions yet — save one before big edits.
                  </p>
                )}
              </section>
            </Col>
          </Grid12>
        )}
      </main>
    </AppShell>
  );
}
