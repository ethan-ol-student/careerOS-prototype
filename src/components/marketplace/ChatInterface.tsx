"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import { formatTimeAgo } from "@/lib/context/NotificationsContext";
import { getApiAdapter } from "@/lib/api";
import type { Candidate } from "@/lib/candidates/types";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  candidate: Candidate;
}

/**
 * Two-pane chat UI for the employer-side prototype.
 *
 * Sending a message follows a small state machine that's shaped to
 * survive being swapped onto a real backend later:
 *
 *   idle → sending → (delivered) → typing? → idle
 *
 *  - `sending`   — request fired, awaiting server confirmation.
 *  - `typing`    — the other party (candidate) is composing a reply.
 *
 * Today the API adapter is localStorage-backed so `sending` flips
 * to `idle` almost instantly, and `typing` is a clearly-marked demo
 * fallback that fires a canned mock reply. When a real messaging
 * service lands, the `sending` window will widen naturally and the
 * mock reply block can be deleted in one place without touching
 * the rendering logic.
 */
type SendStatus = "idle" | "sending" | "typing";

const DEMO_REPLY_DELAY_MS = 1400;

export function ChatInterface({ candidate }: ChatInterfaceProps) {
  const { conversations, ensureConversation, appendMessage } =
    useSavedCandidates();

  // Seed a conversation if none exists (e.g. employer lands here from a
  // notification before sending an invite, or chat opened via deep link).
  useEffect(() => {
    ensureConversation(candidate.id, candidate.name);
  }, [candidate.id, candidate.name, ensureConversation]);

  const messages = conversations[candidate.id] ?? [];

  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to the bottom when messages change or the typing
  // indicator toggles on.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, status]);

  // Cancel any pending demo-reply timer on unmount so we never
  // append a message after the candidate has been navigated away.
  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    };
  }, []);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || status !== "idle") return;

    // Optimistic local insert so the message appears immediately.
    appendMessage(candidate.id, { sender: "employer", body: trimmed });
    setDraft("");
    setSendError(null);
    setStatus("sending");

    // Call the API adapter. Today this is localStorage; tomorrow it
    // will hit the real messaging endpoint. The adapter's response
    // shape (`{ ok, data: { message, reply? } }`) is the same in
    // both worlds, so this block doesn't need to change when we
    // swap implementations.
    try {
      const api = await getApiAdapter();
      const result = await api.sendChatMessage({
        candidateId: candidate.id,
        body: trimmed,
      });
      if (!result.ok) {
        setSendError(result.error.message);
        setStatus("idle");
        return;
      }
      // If the server already has a reply queued, append it here.
      if (result.data.reply) {
        appendMessage(candidate.id, {
          sender: result.data.reply.sender,
          body: result.data.reply.body,
        });
        setStatus("idle");
        return;
      }
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Couldn't send the message.",
      );
      setStatus("idle");
      return;
    }

    // ── DEMO-ONLY FALLBACK ───────────────────────────────────────
    // While the project has no live backend, simulate a candidate
    // reply so the conversation feels alive in demos. Delete this
    // block once a real messaging service is wired in.
    setStatus("typing");
    replyTimerRef.current = setTimeout(() => {
      appendMessage(candidate.id, {
        sender: "candidate",
        body: `Thanks for the message! I'll get back to you with more details shortly.`,
      });
      setStatus("idle");
    }, DEMO_REPLY_DELAY_MS);
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/employers/marketplace"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to marketplace
      </Link>

      <header className="glass-3 flex items-center gap-3 rounded-2xl p-4">
        <div className="bg-luminous/15 ring-luminous/30 text-luminous flex size-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ring-2">
          {candidate.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-tight">
            {candidate.name}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {candidate.targetRole} · {candidate.location}
          </p>
        </div>
        <span className="bg-clover/10 text-clover border-clover/30 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium">
          <span className="bg-clover size-1.5 rounded-full" />
          Online
        </span>
      </header>

      {/* Messages list */}
      <div
        ref={listRef}
        className="glass-3 flex h-[440px] flex-col gap-3 overflow-y-auto rounded-2xl p-4"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-muted-foreground m-auto text-sm">
            No messages yet — say hello!
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === "employer";
            return (
              <div
                key={m.id}
                className={cn(
                  "flex max-w-[80%] flex-col gap-1",
                  mine ? "self-end items-end" : "self-start items-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm leading-relaxed",
                    mine
                      ? "bg-luminous text-white rounded-br-sm"
                      : "bg-card border border-border/60 rounded-bl-sm",
                  )}
                >
                  {m.body}
                </div>
                <p className="text-muted-foreground text-[10px]">
                  {mine ? "You" : candidate.name.split(" ")[0]} ·{" "}
                  {formatTimeAgo(m.createdAt)}
                </p>
              </div>
            );
          })
        )}

        {status === "typing" ? (
          <div
            className="self-start"
            aria-live="polite"
            aria-label={`${candidate.name.split(" ")[0]} is typing`}
          >
            <div className="bg-card border-border/60 inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border px-4 py-2 text-sm">
              <span
                className="bg-muted-foreground size-1.5 animate-pulse rounded-full"
                style={{ animationDelay: "0ms" }}
                aria-hidden
              />
              <span
                className="bg-muted-foreground size-1.5 animate-pulse rounded-full"
                style={{ animationDelay: "180ms" }}
                aria-hidden
              />
              <span
                className="bg-muted-foreground size-1.5 animate-pulse rounded-full"
                style={{ animationDelay: "360ms" }}
                aria-hidden
              />
            </div>
            <p className="text-muted-foreground mt-1 text-[10px]">
              {candidate.name.split(" ")[0]} is typing —{" "}
              <span className="text-muted-foreground/80 italic">
                prototype demo
              </span>
            </p>
          </div>
        ) : null}
      </div>

      {sendError ? (
        <p role="alert" className="text-destructive text-xs">
          {sendError}
        </p>
      ) : null}

      {/* Composer */}
      <form
        className="glass-3 flex items-center gap-2 rounded-2xl p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={status === "sending"}
          placeholder={`Message ${candidate.name.split(" ")[0]}…`}
          className="placeholder:text-muted-foreground flex-1 bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-60"
        />
        <Button
          type="submit"
          disabled={!draft.trim() || status === "sending"}
          aria-busy={status === "sending"}
        >
          <Send className="size-4" />
          {status === "sending" ? "Sending…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
