"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare, Send, TriangleAlert } from "lucide-react";
import AppShell from "@/components/app/AppShell";
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
 * Wireframe layout: two persistent panes — conversation list left, open
 * thread right (chat bubbles + composer). Zero-scroll frame on desktop;
 * on mobile the panes swap (list ⇄ thread) like a native chat app.
 *
 * Employer chats are stored against the candidate's marketplace mirror
 * (`Candidate.id = real-<userId>`), read via `/api/me/conversations`,
 * replies via `/api/me/conversations/[id]`. Separate from notifications.
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
    <div className="max-w-container mx-auto flex w-full flex-col px-4 pb-4 pt-2 lg:h-full lg:min-h-0">
      <div className="shrink-0">
        <p className="text-luminous font-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em]">
          Messages
        </p>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Your <span className="text-luminous">conversations</span>
        </h1>
      </div>

      <div className="mt-3 flex flex-1 gap-4 lg:min-h-0">
        {/* ── Conversation list pane ── */}
        <aside
          className={cn(
            "glass-3 w-full flex-col rounded-2xl p-2 md:flex md:w-72 md:shrink-0 lg:min-h-0 lg:w-80",
            active ? "hidden" : "flex",
          )}
        >
          {status === "loading" ? (
            <div className="text-muted-foreground m-auto flex items-center gap-2 p-8 text-sm">
              <Loader2 className="text-luminous size-4 animate-spin" />
              Loading…
            </div>
          ) : status === "error" ? (
            <div className="m-auto p-6 text-center">
              <TriangleAlert className="text-destructive mx-auto size-6" />
              <p className="mt-3 text-sm font-medium">Couldn&apos;t load messages</p>
              <p className="text-muted-foreground mt-1 text-xs">{error ?? "Please try again."}</p>
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
            <div className="m-auto flex flex-col items-center gap-3 p-6 text-center">
              <div className="bg-luminous/15 text-luminous-soft flex size-12 items-center justify-center rounded-2xl">
                <MessageSquare className="size-5" />
              </div>
              <p className="text-sm font-semibold tracking-tight">
                No employer messages yet.
              </p>
              <p className="text-muted-foreground text-xs">
                Turn on discovery so employers can find and reach you.
              </p>
              <LinkButton href="/candidate/settings" size="sm" variant="outline">
                Open settings
              </LinkButton>
            </div>
          ) : (
            <ul className="max-lg:max-h-[70vh] flex-1 space-y-1 overflow-y-auto pr-1 lg:min-h-0">
              {rows.map((c) => {
                const selected = active?.conversationId === c.conversationId;
                return (
                  <li key={c.conversationId}>
                    <button
                      type="button"
                      onClick={() => setActive(c)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                        selected
                          ? "border-luminous/25 bg-luminous/12"
                          : "border-transparent hover:bg-foreground/4",
                      )}
                    >
                      <div className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2">
                        {c.employerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{c.employerName}</p>
                          <span className="text-muted-foreground shrink-0 text-[0.625rem]">
                            {formatTimeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 truncate text-xs",
                            c.lastMessage
                              ? "text-muted-foreground"
                              : "text-muted-foreground/60 italic",
                          )}
                        >
                          {c.lastMessage
                            ? `${c.lastSender === "candidate" ? "You: " : ""}${c.lastMessage}`
                            : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ── Thread pane ── */}
        <section
          className={cn(
            "glass-3 min-h-0 flex-1 flex-col overflow-hidden rounded-2xl md:flex",
            active ? "flex" : "hidden",
          )}
        >
          {active ? (
            <ThreadView
              key={active.conversationId}
              conversation={active}
              onBack={() => {
                setActive(null);
                setReloadKey((k) => k + 1);
              }}
            />
          ) : (
            <div className="text-muted-foreground m-auto flex flex-col items-center gap-3 p-8 text-center">
              <MessageSquare className="size-6 opacity-60" aria-hidden />
              <p className="text-sm">Select a conversation to read and reply.</p>
            </div>
          )}
        </section>
      </div>
    </div>
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
    <>
      {/* Thread header */}
      <header className="line-b flex shrink-0 items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="bg-luminous/15 ring-luminous/30 text-luminous-soft flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2">
          {conversation.employerName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">
            {conversation.employerName}
          </p>
          <p className="text-muted-foreground font-mono text-[0.5625rem] font-semibold uppercase tracking-[0.14em]">
            Employer
          </p>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        className="max-lg:h-110 flex flex-col gap-3 overflow-y-auto p-4 lg:min-h-0 lg:flex-1"
        role="log"
        aria-live="polite"
      >
        {status === "loading" ? (
          <p className="text-muted-foreground m-auto inline-flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground m-auto text-sm">
            No messages yet — say hello!
          </p>
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
                <p className="text-muted-foreground text-[0.625rem]">
                  {mine ? "You" : conversation.employerName} · {formatTimeAgo(m.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form
        className="line-t flex shrink-0 items-center gap-2 p-3"
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
          className="bg-foreground/2 border-border/15 focus-visible:border-luminous/60 placeholder:text-muted-foreground min-h-11 flex-1 rounded-full border px-4 text-sm outline-none transition-colors disabled:opacity-60"
        />
        <Button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-busy={sending}
          aria-label={sending ? "Sending…" : "Send message"}
          className="size-11 shrink-0 rounded-full p-0"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </>
  );
}
