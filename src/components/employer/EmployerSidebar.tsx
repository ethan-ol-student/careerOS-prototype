"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  FilePlus2,
  UsersRound,
  Bookmark,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Path prefixes that mark this item active (defaults to [href]). */
  match?: string[];
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

// Copy of CandidateSidebar's grouped structure, adapted to the employer
// feature list; clover is the employer accent.
const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Dashboard", href: "/employers/dashboard", icon: LayoutDashboard },
      { label: "Marketplace", href: "/employers/marketplace", icon: Store },
    ],
  },
  {
    label: "My Hiring",
    items: [
      { label: "Post Job", href: "/employers/post-job", icon: FilePlus2 },
      { label: "Applicants", href: "/employers/applicants", icon: UsersRound },
    ],
  },
  {
    label: "My Talent",
    items: [
      { label: "Saved Candidates", href: "/employers/saved", icon: Bookmark },
      {
        label: "Messages",
        href: "/employers/messages",
        icon: MessageSquare,
        match: ["/employers/messages", "/employers/chat"],
      },
    ],
  },
];

/**
 * Persistent left navigation for every employer view — the candidate
 * sidebar copied over, with the employer feature list and clover accent.
 * Desktop-only (`lg:`+); below that the top menu dropdown remains the nav.
 */
export function EmployerSidebar({ onSignOut }: { onSignOut: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Employer navigation"
      className="border-border/15 bg-card/20 hidden w-60 shrink-0 flex-col overflow-y-auto border-r px-3 py-4 lg:flex"
    >
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((group) => (
          <div key={group.label ?? "top"} className="mb-2">
            {group.label && (
              <p className="text-muted-foreground px-3 pb-1.5 pt-2 text-[0.625rem] font-mono font-semibold uppercase tracking-[0.18em]">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = (item.match ?? [item.href]).some(
                (p) => pathname === p || pathname.startsWith(`${p}/`),
              );
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-clover/25 bg-clover/12 text-foreground font-medium [&_svg]:text-clover"
                      : "border-transparent text-muted-foreground hover:bg-foreground/4 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={onSignOut}
        className="text-destructive/90 hover:text-destructive hover:bg-destructive/10 mt-auto flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </aside>
  );
}
