"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare, Send, TriangleAlert } from "lucide-react";
import AppShell from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Grid12, Col } from "@/components/app/Grid";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { formatTimeAgo } from "@/lib/context/NotificationsContext";
import type { ContextStatus } from "@/lib/types/contextStatus";
import { cn } from "@/lib/utils";

interface ConversationRow {
  conversationId: string;
  employerName: string;
  lastMessage: string | null;
  lastSender: string | null;
  lastMessageAt: number;
}

interface ThreadMessage {
  id: string;
  sender: "employer" | "candidate";
  body: string;
  createdAt: number;
}

/**
 * Candidate Messages — the real, server-backed inbox.
 *
 * Employer chats are stored against the candidate's marketplace mirror
 * (`Candidate.id = real-<userId>`), so this reads them via
 * `/api/me/conversations` and lets the candidate reply through
 * `/api/me/conversations/[id]`. Completely separate from notifications.
 */
export default function CandidateMessagesPage() {
  return (
    <AppShell>
      <CandidateMessagesContent />
    </AppShell>
  );
}

function CandidateMessagesContent() {
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [status, setStatus] = useState<ContextStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [active, setActive] = useState<ConversationRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time fetch transition.
    setStatus("loading");
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/me/conversations", { cache: "no-store" });
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
    <>
      <PageHeader
        eyebrow="Messages"
        title="Your conversations"
        description="Messages from employers who reached out about your Living Portfolio. This is separate from your notifications."
      />

      <section className="px-4 py-8 sm:py-12">
        <Grid12>
          <Col span={12} lg={8} startLg={3}>
            {active ? (
              <ThreadView
                conversation={active}
                onBack={() => {
                  setActive(null);
                  setReloadKey((k) => k + 1);
                }}
              />
            ) : status === "loading" ? (
              <div className="glass-3 flex items-center justify-center gap-2 rounded-2xl p-10 text-sm">
                <Loader2 className="text-luminous size-4 animate-spin" />
                <span className="text-muted-foreground">Loading conversations…</span>
              </div>
            ) : status === "error" ? (
              <div className="glass-3 rounded-2xl p-10 text-center">
                <TriangleAlert className="text-destructive mx-auto size-6" />
                <p className="text-foreground mt-3 text-sm font-medium">
                  Couldn&apos;t load messages
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{error ?? "Please try again."}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
                  Retry
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="glass-3 ring-luminous/20 flex flex-col items-center gap-4 rounded-2xl p-10 text-center ring-1">
                <div className="bg-luminous/15 text-luminous-soft flex size-14 items-center justify-center rounded-2xl">
                  <MessageSquare className="size-6" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight">No employer messages yet.</h2>
                <p className="text-muted-foreground max-w-md text-sm">
                  When an employer starts a conversation about your profile it will appear here. Turn on
                  discovery in Settings so employers can find and reach you.
                </p>
                <LinkButton href="/candidate/settings" size="default" variant="outline">
                  Open settings
                </LinkButton>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {rows.map((c) => (
                  <li key={c.conversationId}>
                    <button
                      type="button"
                      onClick={() => setActive(c)}
                      className="glass-3 hover:border-luminous/50 flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors"
                    >
                      <div className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-2">
                        {c.employerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{c.employerName}</p>
                          <span className="text-muted-foreground shrink-0 text-[10px]">
                            {formatTimeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 truncate text-xs",
                            c.lastMessage ? "text-muted-foreground" : "text-muted-foreground/60 italic",
                          )}
                        >
                          {c.lastMessage
                            ? `${c.lastSender === "candidate" ? "You: " : ""}${c.lastMessage}`
                            : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Col>
        </Grid12>
      </section>
    </>
  );
}

function ThreadView({
  conversation,
  onBack,
}: {
  conversation: ConversationRow;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [status, setStatus] = useState<ContextStatus>("loading");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/me/conversations/${conversation.conversationId}`, {
        cache: "no-store",
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: ThreadMessage[] }
        | null;
      if (body?.ok && Array.isArray(body.data)) {
        setMessages(body.data);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, [conversation.conversationId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() sets loading before its async fetch; runs once per thread.
    void load();
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    // Optimistic append.
    const optimistic: ThreadMessage = {
      id: `tmp_${Date.now()}`,
      sender: "candidate",
      body: trimmed,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    try {
      const res = await fetch(`/api/me/conversations/${conversation.conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: { message?: ThreadMessage } }
        | null;
      if (body?.ok && body.data?.message) {
        const saved = body.data.message;
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      }
    } catch {
      /* keep optimistic */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to conversations
      </button>

      <header className="glass-3 flex items-center gap-3 rounded-2xl p-4">
        <div className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-2">
          {conversation.employerName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-tight">
            {conversation.employerName}
          </p>
          <p className="text-muted-foreground truncate text-xs">Employer</p>
        </div>
      </header>

      <div
        ref={listRef}
        className="glass-3 flex h-[440px] flex-col gap-3 overflow-y-auto rounded-2xl p-4"
        role="log"
        aria-live="polite"
      >
        {status === "loading" ? (
          <p className="text-muted-foreground m-auto inline-flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground m-auto text-sm">No messages yet — say hello!</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === "candidate";
            return (
              <div
                key={m.id}
                className={cn(
                  "flex max-w-[80%] flex-col gap-1",
                  mine ? "items-end self-end" : "items-start self-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm leading-relaxed",
                    mine
                      ? "bg-luminous rounded-br-sm text-white"
                      : "bg-card border-border/20 rounded-bl-sm border",
                  )}
                >
                  {m.body}
                </div>
                <p className="text-muted-foreground text-[10px]">
                  {mine ? "You" : conversation.employerName} · {formatTimeAgo(m.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form
        className="glass-3 flex items-center gap-2 rounded-2xl p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="candidate-chat-input" className="sr-only">
          Message
        </label>
        <input
          id="candidate-chat-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={sending}
          placeholder="Write a reply…"
          className="placeholder:text-muted-foreground flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-60"
        />
        <Button type="submit" disabled={!draft.trim() || sending} aria-busy={sending}>
          <Send className="size-4" />
          {sending ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
