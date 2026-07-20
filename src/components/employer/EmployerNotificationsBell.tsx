"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Mail, UserCheck, X } from "lucide-react";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import { formatTimeAgo } from "@/lib/context/NotificationsContext";
import { cn } from "@/lib/utils";

export function EmployerNotificationsBell() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAllRead,
    dismissNotification,
  } = useSavedCandidates();

  const [isOpen, setIsOpen] = useState(false);
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

  // Mark read once the panel opens — never inside a setter callback.
  useEffect(() => {
    if (isOpen) markAllRead();
  }, [isOpen, markAllRead]);

  const handleClick = (candidateId: string | undefined) => {
    if (!candidateId) return;
    setIsOpen(false);
    router.push(`/employers/chat/${candidateId}`);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "border-border/15 bg-foreground/2 text-foreground hover:border-clover/60 hover:text-clover focus-visible:ring-clover/40 relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2",
          isOpen && "border-clover/60 text-clover",
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="bg-clover absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="bg-popover text-popover-foreground border-border/20 absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border/15 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <span className="text-muted-foreground font-mono text-[0.625rem] uppercase tracking-wider">
              {notifications.length} total
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="size-6 opacity-40" />
              <p className="text-sm">You&apos;re all caught up.</p>
              <p className="text-[0.6875rem]">
                When candidates accept your invite, you&apos;ll see them here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="border-b border-border/30 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        n.kind === "invite-accepted" &&
                          "bg-clover/15 text-clover-soft",
                        n.kind === "invite-pending" &&
                          "bg-clover/15 text-clover-soft",
                        n.kind === "system" &&
                          "bg-brand/15 text-brand",
                      )}
                    >
                      {n.kind === "invite-accepted" && <UserCheck className="size-4" />}
                      {n.kind === "invite-pending" && <Mail className="size-4" />}
                      {n.kind === "system" && <Bell className="size-4" />}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleClick(n.candidateId)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-medium leading-snug">
                        {n.title}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
                        {n.body}
                      </p>
                      <p className="text-muted-foreground mt-1 text-[0.625rem]">
                        {formatTimeAgo(n.createdAt)}
                      </p>
                      {n.kind === "invite-accepted" && n.candidateId && (
                        <span className="text-clover mt-2 inline-flex items-center gap-1 text-[0.6875rem] font-medium">
                          <Check className="size-3" />
                          Open chat
                        </span>
                      )}
                    </button>
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
    </div>
  );
}
