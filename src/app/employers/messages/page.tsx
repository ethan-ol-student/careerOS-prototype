"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, TriangleAlert, ArrowUpRight } from "lucide-react";
import EmployerAppShell from "@/components/employer/EmployerAppShell";
import { Button } from "@/components/ui/Button";
import { formatTimeAgo } from "@/lib/context/NotificationsContext";
import type { ContextStatus } from "@/lib/types/contextStatus";
import { cn } from "@/lib/utils";

interface ConversationRow {
  conversationId: string;
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  candidateHeadline: string;
  lastMessage: string | null;
  lastSender: string | null;
  lastMessageAt: number;
}

/**
 * Dedicated Employer Messages page. Lists chat threads from the
 * `ChatConversation`/`ChatMessage` tables — completely independent of
 * the notification system, so marking notifications read never affects
 * message history. Clicking a thread opens the existing chat page.
 */
export default function EmployerMessagesPage() {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [status, setStatus] = useState<ContextStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time fetch transition.
    setStatus("loading");
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/employer/messages", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: { conversations?: ConversationRow[] }; error?: { message?: string } }
          | null;
        if (cancelled) return;
        if (!res.ok || !body?.ok || !body.data) {
          setStatus("error");
          setError(body?.error?.message ?? `HTTP ${res.status}`);
          return;
        }
        setRows(body.data.conversations ?? []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load messages.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <EmployerAppShell>
      <main className="px-4 pb-16 pt-8">
        <div className="max-w-container mx-auto flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <p className="text-clover text-xs font-mono font-semibold uppercase tracking-[0.18em]">
              Messages
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your conversations
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
              Chat threads with candidates. This history is independent of your
              notifications — marking notifications read never clears it.
            </p>
          </header>

          {status === "loading" ? (
            <div className="glass-3 flex items-center justify-center gap-2 rounded-2xl p-10 text-sm">
              <Loader2 className="text-clover size-4 animate-spin" />
              <span className="text-muted-foreground">Loading conversations…</span>
            </div>
          ) : status === "error" ? (
            <div className="glass-3 rounded-2xl p-10 text-center">
              <TriangleAlert className="text-destructive mx-auto size-6" />
              <p className="text-foreground mt-3 text-sm font-medium">
                Couldn&apos;t load messages
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {error ?? "Please try again."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                Retry
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="glass-3 ring-clover/20 flex flex-col items-center gap-3 rounded-2xl p-10 text-center ring-1">
              <div className="bg-clover/15 text-clover-soft flex size-14 items-center justify-center rounded-2xl">
                <MessageSquare className="size-6" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight">
                No conversations yet
              </h2>
              <p className="text-muted-foreground max-w-md text-sm">
                Reach out to a candidate from the marketplace to start a chat.
              </p>
              <Link href="/employers/marketplace">
                <Button>Browse marketplace</Button>
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {rows.map((c) => (
                <li key={c.conversationId}>
                  <Link
                    href={`/employers/chat/${c.candidateId}`}
                    className="glass-3 hover:border-clover/50 flex items-center gap-4 rounded-xl p-4 transition-colors"
                  >
                    <div className="bg-clover/15 ring-clover/30 text-clover-soft flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-2">
                      {c.candidateName
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold">
                          {c.candidateName}
                        </p>
                        <span className="text-muted-foreground shrink-0 text-[0.625rem]">
                          {formatTimeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      {c.candidateRole ? (
                        <p className="text-muted-foreground truncate text-[0.6875rem]">
                          {c.candidateRole}
                        </p>
                      ) : null}
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          c.lastMessage
                            ? "text-muted-foreground"
                            : "text-muted-foreground/60 italic",
                        )}
                      >
                        {c.lastMessage
                          ? `${c.lastSender === "employer" ? "You: " : ""}${c.lastMessage}`
                          : "No messages yet"}
                      </p>
                    </div>
                    <ArrowUpRight className="text-muted-foreground size-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </EmployerAppShell>
  );
}
