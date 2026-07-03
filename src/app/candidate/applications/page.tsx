"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Loader2, Clock } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
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

const STATUS_TONE: Record<string, string> = {
  submitted: "text-luminous",
  reviewing: "text-luminous",
  interview: "text-clover",
  offer: "text-clover",
  rejected: "text-destructive",
  withdrawn: "text-muted-foreground",
  expired: "text-muted-foreground",
};

function eventLabel(e: EventRow): string {
  if (e.type === "submitted") return "Application submitted";
  if (e.type === "expired") return "Expired — no decision in time";
  return `Status: ${e.fromStatus ?? "?"} → ${e.toStatus ?? "?"}`;
}

/**
 * Candidate application tracker — every application with its full
 * event timeline (submitted → status changes → expiry). Applications
 * awaiting an answer show an explicit "No response yet".
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

  return (
    <AppShell>
      <main className="max-w-container mx-auto px-4 pb-16 pt-6">
        <p className="text-luminous text-xs font-semibold uppercase tracking-[0.18em]">
          Your loop
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold sm:text-3xl">
          <ClipboardList className="text-luminous size-6" />
          My applications
        </h1>

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
          <div className="mt-6 space-y-4">
            {apps.map((app) => (
              <section key={app.id} className="glass-3 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/jobs/${app.job.id}`}
                      className="font-semibold hover:underline"
                    >
                      {app.job.title}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {app.job.company} · {app.job.location}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold uppercase tracking-wide",
                      STATUS_TONE[app.status] ?? "text-foreground",
                    )}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Timeline */}
                <ol className="border-border/40 mt-4 space-y-3 border-l pl-4">
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

                {app.noResponseYet && (
                  <Badge variant="outline" className="mt-3 text-[10px]">
                    Waiting on employer
                  </Badge>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
