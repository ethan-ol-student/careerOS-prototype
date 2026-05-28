"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Sparkles, Briefcase, X, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  useNotifications,
  formatTimeAgo,
  type AppNotification,
} from "@/lib/context/NotificationsContext";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    hasImportant,
    markAllRead,
    dismissNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [reachOut, setReachOut] = useState<AppNotification | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isOpen]);

  // History is preserved — the user explicitly clears the unread
  // badge via the "Mark all as read" button below.

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "border-border/60 bg-card/40 text-foreground hover:border-luminous/60 hover:text-luminous focus-visible:ring-luminous/40 relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2",
          isOpen && "border-luminous/60 text-luminous",
          hasImportant && "border-yellow-400/60",
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white",
              hasImportant ? "bg-yellow-400 text-black" : "bg-luminous",
            )}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {hasImportant && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-yellow-400/40"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-1 -top-1 size-4 animate-ping rounded-full bg-yellow-400/60"
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="bg-popover text-popover-foreground border-border/60 absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Notifications
              </p>
              <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                {notifications.length} total · {unreadCount} unread
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-luminous hover:text-luminous focus-visible:ring-luminous/40 disabled:text-muted-foreground/60 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:hover:text-muted-foreground/60"
            >
              Mark all as read
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="size-6 opacity-40" />
              <p className="text-sm">You&apos;re all caught up.</p>
              <p className="text-[11px]">
                We&apos;ll ping you when you gain a skill or match a role.
              </p>
            </div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-border/30 px-4 py-3 last:border-b-0 transition-colors",
                    n.severity === "important" && "bg-yellow-400/5",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                        n.kind === "skill" && "bg-luminous/15 text-luminous",
                        n.kind === "job-match" &&
                          "bg-yellow-400/20 text-yellow-400 ring-2 ring-yellow-400/40",
                        n.kind === "system" && "bg-clover/15 text-clover",
                      )}
                    >
                      {n.kind === "skill" && <Sparkles className="size-4" />}
                      {n.kind === "job-match" && <Briefcase className="size-4" />}
                      {n.kind === "system" && <Bell className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">
                        {n.title}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                        {n.body}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[10px]">
                        {formatTimeAgo(n.createdAt)}
                      </p>
                      {n.actionLabel && (
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={n.severity === "important" ? "default" : "outline"}
                            onClick={() => {
                              setConfirmed(false);
                              setReachOut(n);
                              setIsOpen(false);
                            }}
                            className={cn(
                              n.severity === "important" &&
                                "from-yellow-400 to-yellow-500 border-t-yellow-300 text-black hover:from-yellow-300 hover:to-yellow-400",
                            )}
                          >
                            {n.actionLabel}
                          </Button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={() => dismissNotification(n.id)}
                      className="text-muted-foreground hover:text-foreground -mr-1 -mt-1 shrink-0 p-1 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ReachOutModal
        notification={reachOut}
        confirmed={confirmed}
        onConfirm={() => setConfirmed(true)}
        onClose={() => {
          setReachOut(null);
          setConfirmed(false);
        }}
      />
    </div>
  );
}

function ReachOutModal({
  notification,
  confirmed,
  onConfirm,
  onClose,
}: {
  notification: AppNotification | null;
  confirmed: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isOpen = notification !== null;
  const jobTitle = (notification?.payload?.jobTitle as string) || "this role";
  const company = (notification?.payload?.company as string) || "the employer";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={confirmed ? "You have notified the employer!" : `Reach out to ${company}?`}
      size="sm"
      hideVisibleTitle
    >
      {!confirmed ? (
        <>
          <div className="mb-4 flex items-start gap-3">
            <div className="bg-yellow-400/20 text-yellow-400 ring-2 ring-yellow-400/40 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Briefcase className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-tight">
                Reach out to {company}?
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                You match the required skills for{" "}
                <span className="text-foreground font-medium">{jobTitle}</span>.
                We&apos;ll share your Living Portfolio with their team and let
                you know if they respond.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Not now
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              className="from-yellow-400 to-yellow-500 border-t-yellow-300 text-black hover:from-yellow-300 hover:to-yellow-400"
            >
              <Mail className="size-4" />
              Yes, notify the employer
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="bg-clover/15 text-clover ring-2 ring-clover/40 flex size-14 items-center justify-center rounded-full">
            <Check className="size-7" strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-semibold leading-tight">
            You have notified the employer!
          </h3>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            Be sure to keep an eye out for your email — replies usually
            arrive within 3 to 5 business days.
          </p>
          <Button type="button" onClick={onClose} size="lg">
            Got it
          </Button>
        </div>
      )}
    </Modal>
  );
}