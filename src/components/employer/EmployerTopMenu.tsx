"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu as MenuIcon,
  Bookmark,
  Briefcase,
  ChevronRight,
  LogIn,
  LogOut,
  MessageSquare,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployerTopMenuProps {
  /** Triggered when the user picks Sign Out. The shell handles the
   *  confirm dialog + data reset. */
  onSignOut: () => void;
}

/**
 * Employer-side dropdown menu. Compact menu-button surface that
 * mirrors the candidate `TopMenu` so the two shells feel coherent.
 * The header itself now only shows the brand, mode label, the
 * notification bell, and this menu — every other route (Marketplace,
 * Saved Candidates, Messages) lives inside the popover.
 */
export function EmployerTopMenu({ onSignOut }: EmployerTopMenuProps) {
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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "border-border/60 bg-card/40 text-foreground hover:border-clover/60 hover:text-clover focus-visible:ring-clover/40 inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2",
          isOpen && "border-clover/60 text-clover",
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
          {/* Profile / mode preview */}
          <div className="flex items-center gap-3 border-b border-border/40 px-4 py-4">
            <div className="bg-clover/15 ring-clover/30 text-clover flex size-10 shrink-0 items-center justify-center rounded-full ring-2">
              <Briefcase className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Employer</p>
              <p className="text-muted-foreground truncate text-xs">
                Find Talent · Career OS
              </p>
            </div>
          </div>

          {/* Sign-in placeholder — matches the candidate TopMenu treatment */}
          <div className="border-b border-border/40 p-3">
            <button
              type="button"
              aria-disabled="true"
              title="Sign in is a static preview"
              onClick={(e) => e.preventDefault()}
              className="border-border/60 hover:border-clover/60 text-foreground hover:text-clover focus-visible:ring-clover/40 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2"
            >
              <LogIn className="size-4" />
              Sign in
              <span className="text-muted-foreground ml-1 text-[10px] font-normal uppercase tracking-wider">
                Coming soon
              </span>
            </button>
          </div>

          {/* Nav links — every employer surface lives here so the
              header itself can stay minimal. */}
          <nav className="flex flex-col py-1.5" role="none">
            <MenuLink
              href="/employers/marketplace"
              icon={<Store className="text-clover size-4" aria-hidden />}
              label="Marketplace"
              hint="Browse candidates on trajectory"
              onClick={() => setIsOpen(false)}
            />
            <MenuLink
              href="/employers/saved"
              icon={<Bookmark className="text-clover size-4" aria-hidden />}
              label="Saved Candidates"
              hint="Candidates you've bookmarked"
              onClick={() => setIsOpen(false)}
            />
            <MenuLink
              href="/employers/notifications"
              icon={
                <MessageSquare className="text-clover size-4" aria-hidden />
              }
              label="Messages"
              hint="Invite replies & chat threads"
              onClick={() => setIsOpen(false)}
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
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="hover:bg-accent focus-visible:ring-clover/40 group flex min-h-11 items-center gap-3 px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2"
    >
      <span
        aria-hidden
        className="bg-clover/10 flex size-8 items-center justify-center rounded-md"
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
