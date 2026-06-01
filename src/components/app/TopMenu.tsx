"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Menu as MenuIcon,
  User,
  BookOpen,
  LogOut,
  LogIn,
  ChevronRight,
  MessageSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopMenuProps {
  userName: string;
  userField: string;
  /** Triggered when the user picks Sign Out. The shell handles the
   *  confirm dialog + data reset. */
  onSignOut: () => void;
}

/**
 * Top-right dropdown menu. Opens on hover, click, OR keyboard
 * focus-within and does NOT navigate when opened — it stays on the
 * current page. The "Sign in" button is a static UI placeholder
 * styled as an outline so it doesn't impersonate a working CTA.
 */
export function TopMenu({ userName, userField, onSignOut }: TopMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
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

  const open = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setIsOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsOpen(false), 180);
  };

  const initial = (userName?.[0] || "C").toUpperCase();

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onFocus={open}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          scheduleClose();
        }
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "border-border/60 bg-card/40 text-foreground hover:border-luminous/60 hover:text-luminous focus-visible:ring-luminous/40 inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2",
          isOpen && "border-luminous/60 text-luminous",
        )}
      >
        <MenuIcon className="size-4" />
        <span className="hidden sm:inline">Menu</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="bg-popover text-popover-foreground border-border/60 absolute right-0 top-full z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border shadow-xl"
        >
          {/* Profile preview */}
          <div className="flex items-center gap-3 border-b border-border/40 px-4 py-4">
            <div className="bg-luminous/15 ring-luminous/30 flex size-11 shrink-0 items-center justify-center rounded-full ring-2">
              <span className="text-luminous text-base font-semibold">
                {initial}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {userName || "Career OS user"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {userField || "Career OS member"}
              </p>
            </div>
          </div>

          {/* Sign-in / switch account */}
          <div className="border-b border-border/40 p-3">
            <Link
              href="/auth"
              className="border-border/60 hover:border-luminous/60 text-foreground hover:text-luminous focus-visible:ring-luminous/40 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            >
              <LogIn className="size-4" />
              Sign in / Switch account
            </Link>
            <p className="text-muted-foreground mt-2 text-center text-[10px]">
              Your saved data syncs across devices.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col py-1.5" role="none">
            <MenuLink
              href="/candidate/portfolio"
              icon={<User className="size-4 text-luminous" aria-hidden />}
              label="Living Portfolio"
              hint="AI-built profile that grows with you"
            />
            <MenuLink
              href="/candidate/chapters"
              icon={<BookOpen className="size-4 text-luminous" aria-hidden />}
              label="Life Chapter Designer"
              hint="Design and compare next-chapter scenarios"
            />
            <MenuLink
              href="/candidate/messages"
              icon={<MessageSquare className="size-4 text-luminous" aria-hidden />}
              label="Messages"
              hint="Your employer conversations"
            />
            <MenuLink
              href="/candidate/settings"
              icon={<Settings className="size-4 text-luminous" aria-hidden />}
              label="Settings"
              hint="Profile, account & privacy"
            />
          </nav>

          {/* Destructive action — full sign-out with confirmation */}
          <div className="border-t border-border/40 p-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="text-destructive/90 hover:text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/40 inline-flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="hover:bg-accent focus-visible:ring-luminous/40 group flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2"
    >
      <span
        aria-hidden
        className="bg-luminous/10 flex size-8 items-center justify-center rounded-md"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-muted-foreground block truncate text-[11px]">
          {hint}
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="text-muted-foreground group-hover:text-foreground size-3.5 transition-colors"
      />
    </Link>
  );
}
