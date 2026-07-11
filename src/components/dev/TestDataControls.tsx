"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { DevDataAction, DevStatus } from "@/lib/dev/testMode";

/**
 * Mock Data Controls — seed / clear prototype data for the test account.
 * Each control maps to a `DevDataAction` handled by `/api/dev/data`.
 */
export function TestDataControls({
  status,
  busy,
  onAction,
}: {
  status: DevStatus | null;
  busy: boolean;
  onAction: (action: DevDataAction) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Candidate data */}
      <div className="flex flex-col gap-2">
        <p className="text-luminous text-[11px] font-mono font-semibold uppercase tracking-wider">
          Candidate data
        </p>
        <Row
          label="Portfolio"
          state={status ? (status.candidate.portfolioFilled ? "filled" : "empty") : undefined}
        >
          <Fill busy={busy} onClick={() => onAction("candidate.portfolio.fill")} />
          <Empty busy={busy} onClick={() => onAction("candidate.portfolio.empty")} />
        </Row>
        <Row label="Skills" state={status ? `${status.candidate.skills}` : undefined}>
          <Fill busy={busy} onClick={() => onAction("candidate.skills.fill")} />
          <Empty busy={busy} onClick={() => onAction("candidate.skills.empty")} />
        </Row>
        <Row label="Chapters" state={status ? `${status.candidate.chapters}` : undefined}>
          <Fill busy={busy} onClick={() => onAction("candidate.chapters.fill")} />
          <Empty busy={busy} onClick={() => onAction("candidate.chapters.empty")} />
        </Row>
        <Row
          label="Notifications"
          state={
            status
              ? `${status.candidate.notificationsUnread}/${status.candidate.notificationsTotal} unread`
              : undefined
          }
        >
          <Fill busy={busy} onClick={() => onAction("candidate.notifications.fill")} />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("candidate.notifications.read")}>
            Read
          </Button>
          <Empty busy={busy} onClick={() => onAction("candidate.notifications.empty")} />
        </Row>
      </div>

      {/* Employer data */}
      <div className="flex flex-col gap-2">
        <p className="text-clover text-[11px] font-mono font-semibold uppercase tracking-wider">
          Employer data
        </p>
        <Row label="Saved candidates" state={status ? `${status.employer.saved}` : undefined}>
          <Fill busy={busy} onClick={() => onAction("employer.saved.fill")} />
          <Empty busy={busy} onClick={() => onAction("employer.saved.empty")} />
        </Row>
        <Row
          label="Notifications"
          state={
            status
              ? `${status.employer.notificationsUnread}/${status.employer.notificationsTotal} unread`
              : undefined
          }
        >
          <Fill busy={busy} onClick={() => onAction("employer.notifications.fill")} />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("employer.notifications.read")}>
            Read
          </Button>
          <Empty busy={busy} onClick={() => onAction("employer.notifications.empty")} />
        </Row>
        <Row label="Messages" state={status ? `${status.employer.conversations} convo` : undefined}>
          <Fill busy={busy} onClick={() => onAction("employer.messages.fill")} />
          <Empty busy={busy} onClick={() => onAction("employer.messages.empty")} />
        </Row>
        <Row label="Invites" state={status ? `${status.employer.invites}` : undefined}>
          <Fill busy={busy} onClick={() => onAction("employer.invites.fill")} />
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction("employer.invites.accept")}>
            Accept
          </Button>
          <Empty busy={busy} onClick={() => onAction("employer.invites.empty")} />
        </Row>
      </div>
    </div>
  );
}

function Row({
  label,
  state,
  children,
}: {
  label: string;
  state?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-border/40 bg-card/40 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {state !== undefined ? (
          <p className="text-muted-foreground font-mono text-[11px]">{state}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Fill({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={onClick}>
      Fill
    </Button>
  );
}

function Empty({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Button size="sm" variant="ghost" disabled={busy} onClick={onClick}>
      Empty
    </Button>
  );
}
