"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  TriangleAlert,
  UserRound,
  Building2,
  LogOut,
  RefreshCw,
  Trash2,
  Database,
  Compass,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  clearClientCaches,
  TEST_ADMIN_USERNAME,
  TEST_ADMIN_PASSWORD,
  type DevDataAction,
  type DevResetScope,
  type DevStatus,
  type DevStatePatch,
  type DevUserMode,
} from "@/lib/dev/testMode";
import type { CareerPhase } from "@/lib/dashboard/types";
import { TestPhaseSwitcher } from "./TestPhaseSwitcher";
import { TestRouteSwitcher } from "./TestRouteSwitcher";
import { TestDataControls } from "./TestDataControls";

interface PanelMessage {
  tone: "ok" | "err";
  text: string;
}

export function TestModePanel() {
  const router = useRouter();
  const auth = useAuth();
  const [status, setStatus] = useState<DevStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<PanelMessage | null>(null);
  const [resetScope, setResetScope] = useState<DevResetScope | null>(null);

  const refreshStatus = useCallback(async (): Promise<DevStatus | null> => {
    try {
      const res = await fetch("/api/dev/status", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: DevStatus }
        | null;
      if (body?.ok && body.data) {
        setStatus(body.data);
        return body.data;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time status bootstrap; refreshStatus sets state after an async fetch.
    void refreshStatus();
  }, [refreshStatus]);

  const post = useCallback(async (path: string, body?: unknown) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: { message?: string }; error?: { message?: string } }
      | null;
    if (!res.ok || json?.ok === false) {
      throw new Error(json?.error?.message ?? `Request failed (${res.status}).`);
    }
    return json?.data?.message;
  }, []);

  /** Run a mutation: set busy, refresh status + caches, surface a toast. */
  const run = useCallback(
    async (label: string, fn: () => Promise<string | undefined | void>) => {
      setBusy(label);
      setMessage(null);
      try {
        const msg = await fn();
        await refreshStatus();
        clearClientCaches();
        setMessage({ tone: "ok", text: (msg as string) || `${label} ✓` });
      } catch (err) {
        setMessage({
          tone: "err",
          text: err instanceof Error ? err.message : "Action failed.",
        });
      } finally {
        setBusy(null);
      }
    },
    [refreshStatus],
  );

  // ── User mode ─────────────────────────────────────────────────────
  const enterMode = useCallback(
    async (role: DevUserMode) => {
      setBusy(`Entering ${role} mode`);
      setMessage(null);
      try {
        await post("/api/dev/session", { role });
        await auth.refresh();
        clearClientCaches();
        const s = await refreshStatus();
        const target =
          role === "candidate"
            ? s?.candidate.onboardingCompleted
              ? "/candidate/dashboard"
              : "/candidate/onboarding"
            : s?.employer.onboardingCompleted
              ? "/employers/dashboard"
              : "/employers/onboarding";
        router.push(target);
      } catch (err) {
        setMessage({
          tone: "err",
          text: err instanceof Error ? err.message : "Failed to switch mode.",
        });
        setBusy(null);
      }
    },
    [post, auth, refreshStatus, router],
  );

  const logout = useCallback(async () => {
    setBusy("Logging out");
    setMessage(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await auth.refresh();
      clearClientCaches();
      router.push("/");
    } catch {
      setBusy(null);
    }
  }, [auth, router]);

  // ── State patches ─────────────────────────────────────────────────
  const patchState = useCallback(
    (label: string, patch: DevStatePatch) =>
      run(label, async () => {
        await post("/api/dev/state", patch);
      }),
    [run, post],
  );

  const setPhase = useCallback(
    (phase: CareerPhase) =>
      patchState(`Phase → ${phase}`, { careerPhase: phase }),
    [patchState],
  );

  const runData = useCallback(
    (action: DevDataAction) =>
      run(action, async () => post("/api/dev/data", { action })),
    [run, post],
  );

  const confirmReset = useCallback(async () => {
    if (!resetScope) return;
    const scope = resetScope;
    setResetScope(null);
    await run(`Reset ${scope}`, async () => {
      const msg = await post("/api/dev/reset", { scope });
      await auth.refresh();
      return msg;
    });
  }, [resetScope, run, post, auth]);

  const isBusy = busy !== null;

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl border border-yellow-400/50 bg-yellow-400/15 text-yellow-400">
              <FlaskConical className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Developer Test Mode
              </h1>
              <p className="text-muted-foreground text-xs">
                Dev-only harness · not available in production
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {busy ? (
              <Badge variant="outline">
                <RefreshCw className="size-3 animate-spin" />
                {busy}…
              </Badge>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => void refreshStatus()}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </header>

        {/* Safety banner */}
        <div className="flex items-start gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-xs text-yellow-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-yellow-400" />
          <p>
            All actions here affect <strong>only</strong> the seeded test
            account{" "}
            <code className="rounded bg-black/30 px-1">{TEST_ADMIN_USERNAME}</code>{" "}
            (password{" "}
            <code className="rounded bg-black/30 px-1">{TEST_ADMIN_PASSWORD}</code>
            ). Real users are never touched. This panel is gated by{" "}
            <code className="rounded bg-black/30 px-1">
              NEXT_PUBLIC_ENABLE_TEST_MODE
            </code>
            .
          </p>
        </div>

        {/* Toast */}
        {message ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              message.tone === "ok"
                ? "border-clover/40 bg-clover/10 text-clover"
                : "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            {message.tone === "ok" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <XCircle className="size-4" />
            )}
            {message.text}
          </div>
        ) : null}

        {/* Current state */}
        <Section title="Current account state" icon={Database}>
          {status ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <StateTile label="Account role" value={status.account.role} />
              <StateTile
                label="Session"
                value={
                  status.session.signedIn
                    ? `${status.session.role ?? "?"}${status.session.isTestAccount ? " (test)" : ""}`
                    : "signed out"
                }
              />
              <StateTile
                label="Phase"
                value={status.candidate.phase ?? (status.candidate.careerStage || "—")}
              />
              <StateTile
                label="Cand. onboarding"
                value={status.candidate.onboardingCompleted ? "complete" : "incomplete"}
              />
              <StateTile
                label="Cand. advanced data"
                value={status.candidate.hasAdvancedData ? "present" : "missing"}
              />
              <StateTile
                label="Emp. onboarding"
                value={status.employer.onboardingCompleted ? "complete" : "incomplete"}
              />
              <StateTile
                label="Emp. AI data"
                value={status.employer.hasAIData ? "present" : "missing"}
              />
              <StateTile
                label="Saved / invites"
                value={`${status.employer.saved} / ${status.employer.invites}`}
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Loading state…</p>
          )}
        </Section>

        {/* User mode */}
        <Section title="User mode" icon={UserRound}>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isBusy} onClick={() => void enterMode("candidate")}>
              <UserRound className="size-4" />
              Enter Candidate mode
            </Button>
            <Button disabled={isBusy} onClick={() => void enterMode("employer")}>
              <Building2 className="size-4" />
              Enter Employer mode
            </Button>
            <Button variant="outline" disabled={isBusy} onClick={() => void logout()}>
              <LogOut className="size-4" />
              Log out (landing)
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-[11px]">
            Switching mode sets the test account&apos;s role, issues a fresh
            session, and routes to the dashboard or onboarding based on the
            completion flags below.
          </p>
        </Section>

        {/* Career phase */}
        <Section title="Career Phase Tester" icon={Compass}>
          <TestPhaseSwitcher
            current={status?.candidate.phase ?? null}
            busy={isBusy}
            onSelect={(p) => void setPhase(p)}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={isBusy}
            onClick={() => router.push("/candidate/dashboard")}
          >
            Open Candidate dashboard
          </Button>
        </Section>

        {/* Onboarding state */}
        <Section title="Onboarding state" icon={CheckCircle2}>
          <div className="grid gap-3 lg:grid-cols-2">
            <ToggleRow
              label="Candidate onboarding"
              value={status?.candidate.onboardingCompleted}
              busy={isBusy}
              onComplete={() =>
                void patchState("Candidate onboarding → complete", {
                  candidateOnboardingCompleted: true,
                })
              }
              onIncomplete={() =>
                void patchState("Candidate onboarding → incomplete", {
                  candidateOnboardingCompleted: false,
                })
              }
            />
            <ToggleRow
              label="Candidate advanced data"
              value={status?.candidate.hasAdvancedData}
              presentLabel="present"
              absentLabel="missing"
              busy={isBusy}
              onComplete={() =>
                void patchState("Candidate advanced data → present", {
                  candidateAdvancedData: "present",
                })
              }
              onIncomplete={() =>
                void patchState("Candidate advanced data → missing", {
                  candidateAdvancedData: "missing",
                })
              }
            />
            <ToggleRow
              label="Employer onboarding"
              value={status?.employer.onboardingCompleted}
              busy={isBusy}
              onComplete={() =>
                void patchState("Employer onboarding → complete", {
                  employerOnboardingCompleted: true,
                })
              }
              onIncomplete={() =>
                void patchState("Employer onboarding → incomplete", {
                  employerOnboardingCompleted: false,
                })
              }
            />
            <ToggleRow
              label="Employer AI / hiring data"
              value={status?.employer.hasAIData}
              presentLabel="present"
              absentLabel="missing"
              busy={isBusy}
              onComplete={() =>
                void patchState("Employer AI data → present", {
                  employerAIData: "present",
                })
              }
              onIncomplete={() =>
                void patchState("Employer AI data → missing", {
                  employerAIData: "missing",
                })
              }
            />
          </div>
        </Section>

        {/* Page tester */}
        <Section title="Page Tester" icon={Compass}>
          <TestRouteSwitcher
            sampleCandidateId={status?.sampleCandidateId ?? null}
          />
        </Section>

        {/* Mock data */}
        <Section title="Mock Data Controls" icon={Database}>
          <TestDataControls
            status={status}
            busy={isBusy}
            onAction={(a) => void runData(a)}
          />
        </Section>

        {/* Reset */}
        <Section title="Reset controls" icon={Trash2}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => setResetScope("candidate")}
            >
              <Trash2 className="size-4" />
              Reset Candidate data
            </Button>
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => setResetScope("employer")}
            >
              <Trash2 className="size-4" />
              Reset Employer data
            </Button>
            <Button
              variant="outline"
              disabled={isBusy}
              onClick={() => setResetScope("all")}
            >
              <Trash2 className="size-4" />
              Reset ALL test data
            </Button>
            <Button
              variant="ghost"
              disabled={isBusy}
              onClick={() => {
                clearClientCaches();
                setMessage({ tone: "ok", text: "Local caches cleared." });
              }}
            >
              <RefreshCw className="size-4" />
              Clear local cache
            </Button>
            <Button variant="ghost" disabled={isBusy} onClick={() => router.push("/")}>
              <Compass className="size-4" />
              Return to landing
            </Button>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        isOpen={resetScope !== null}
        title={`Reset ${resetScope ?? ""} test data?`}
        description="This permanently clears the seeded test account's data for the selected scope. Real users are not affected."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={() => void confirmReset()}
        onCancel={() => setResetScope(null)}
      />
    </main>
  );
}

// ── Local presentational helpers ──────────────────────────────────────

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="glass-3 rounded-2xl border p-5">
      <h2 className="text-luminous mb-3 flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-[0.18em]">
        <Icon className="size-3.5" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function StateTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/40 bg-card/40 rounded-lg border p-2.5">
      <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-sm">{value}</p>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  busy,
  onComplete,
  onIncomplete,
  presentLabel = "complete",
  absentLabel = "incomplete",
}: {
  label: string;
  value: boolean | undefined;
  busy: boolean;
  onComplete: () => void;
  onIncomplete: () => void;
  presentLabel?: string;
  absentLabel?: string;
}) {
  return (
    <div className="border-border/40 bg-card/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p
          className={cn(
            "font-mono text-[11px]",
            value ? "text-clover" : "text-muted-foreground",
          )}
        >
          {value === undefined ? "—" : value ? presentLabel : absentLabel}
        </p>
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" disabled={busy} onClick={onComplete}>
          {presentLabel}
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onIncomplete}>
          {absentLabel}
        </Button>
      </div>
    </div>
  );
}
