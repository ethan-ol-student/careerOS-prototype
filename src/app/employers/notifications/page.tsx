"use client";

import Link from "next/link";
import { Bell, Mail, UserCheck, X } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { Button } from "@/components/ui/Button";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import { formatTimeAgo } from "@/lib/context/NotificationsContext";
import { cn } from "@/lib/utils";

export default function EmployerNotificationsPage() {
  const { notifications, dismissNotification } = useSavedCandidates();

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <p className="text-luminous text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Notifications
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              What&apos;s happening with your invites
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
              When candidates accept your invite, they show up here. Click an
              accepted invite to open the chat.
            </p>
          </header>

          {notifications.length === 0 ? (
            <div className="glass-3 ring-luminous/20 flex flex-col items-center gap-3 rounded-2xl p-10 text-center ring-1">
              <div className="bg-luminous/15 text-luminous-soft flex size-14 items-center justify-center rounded-2xl">
                <Bell className="size-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                You&apos;re all caught up.
              </h2>
              <p className="text-muted-foreground max-w-md text-sm">
                Reach out to candidates from the marketplace — we&apos;ll let
                you know when they reply.
              </p>
              <Link href="/employers/marketplace">
                <Button>Browse marketplace</Button>
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {notifications.map((n) => {
                const body = (
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        n.kind === "invite-accepted" &&
                          "bg-clover/15 text-clover-soft ring-2 ring-clover/40",
                        n.kind === "invite-pending" &&
                          "bg-luminous/15 text-luminous-soft",
                        n.kind === "system" && "bg-brand/15 text-brand",
                      )}
                    >
                      {n.kind === "invite-accepted" && <UserCheck className="size-5" />}
                      {n.kind === "invite-pending" && <Mail className="size-5" />}
                      {n.kind === "system" && <Bell className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[0.625rem]">
                        {formatTimeAgo(n.createdAt)}
                      </p>
                      {n.kind === "invite-accepted" && n.candidateId && (
                        <span className="text-luminous mt-2 inline-flex items-center gap-1 text-xs font-medium">
                          Open chat →
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dismissNotification(n.id);
                      }}
                      className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-1 transition-colors"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );

                return (
                  <li
                    key={n.id}
                    className={cn(
                      "glass-3 rounded-xl p-4 transition-colors",
                      !n.read && "ring-luminous/30 ring-1",
                    )}
                  >
                    {n.kind === "invite-accepted" && n.candidateId ? (
                      <Link
                        href={`/employers/chat/${n.candidateId}`}
                        className="block hover:opacity-90"
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </EmployerAppShell>
  );
}
