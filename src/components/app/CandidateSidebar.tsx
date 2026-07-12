"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Radar,
  BookOpen,
  NotebookPen,
  Fingerprint,
  User,
  Sparkles,
  ClipboardList,
  Route,
  Trophy,
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
  /** Placeholder entries render disabled with a "Soon" tag. */
  soon?: boolean;
  /** Sub-items shown as an expandable disclosure when parent/child active. */
  children?: NavItem[];
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

// ponytail: plain links into existing routes — Next's client router IS the
// SPA layer (layout persists, contexts live at the root, caches are
// user-scoped). No tab-state machine to maintain.
const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      {
        label: "Dashboard",
        href: "/candidate/dashboard",
        icon: LayoutDashboard,
        match: ["/candidate/dashboard", "/candidate/career-health"],
      },
      {
        label: "Jobs",
        href: "/jobs",
        icon: Briefcase,
        match: ["/jobs", "/companies"],
      },
    ],
  },
  {
    label: "My Life",
    items: [
      { label: "Skill Radar", href: "/candidate/skills", icon: Radar },
      {
        label: "Life Chapter Designer",
        href: "/candidate/chapters",
        icon: BookOpen,
        children: [
          {
            label: "Timeline Journal",
            href: "/candidate/chapters/journal",
            icon: NotebookPen,
          },
        ],
      },
      { label: "Working Style Quiz", href: "/candidate/personality", icon: Fingerprint },
      { label: "Living Portfolio", href: "/candidate/portfolio", icon: User },
      { label: "Career Intelligence", href: "/candidate/insights", icon: Sparkles },
    ],
  },
  {
    label: "My Progress",
    items: [
      { label: "My Applications", href: "/candidate/applications", icon: ClipboardList },
      { label: "Career Path Navigation", href: "#", icon: Route, soon: true },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Messages", href: "/candidate/messages", icon: MessageSquare },
    ],
  },
];

/**
 * Persistent left navigation for every candidate view (Phase 3 hierarchy).
 * Desktop-only (`lg:` and up) — below that the TopMenu dropdown remains
 * the nav. Fills the shell's fixed-height row; scrolls internally if short.
 */
export function CandidateSidebar({ onSignOut }: { onSignOut: () => void }) {
  const pathname = usePathname();
  const isActive = (it: NavItem) =>
    (it.match ?? [it.href]).some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

  return (
    <aside
      aria-label="Candidate navigation"
      className="border-border/15 bg-card/20 hidden w-60 shrink-0 flex-col overflow-y-auto border-r px-3 py-4 lg:flex"
    >
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((group) => (
          <div key={group.label ?? "top"} className="mb-2">
            {group.label && (
              <p className="text-muted-foreground px-3 pb-1.5 pt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.18em]">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              if (item.soon) {
                return (
                  <span
                    key={item.label}
                    aria-disabled
                    title="Coming soon"
                    className="text-muted-foreground/60 flex min-h-10 cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <span className="border-border/20 rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider">
                      Soon
                    </span>
                  </span>
                );
              }
              const kids = item.children ?? [];
              const childActive = kids.some(isActive);
              // Parent path prefix-matches its children, so don't double-highlight
              // when a child is the active page.
              const active = isActive(item) && !childActive;
              return (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-luminous/25 bg-luminous/12 text-foreground font-medium [&_svg]:text-luminous"
                        : "border-transparent text-muted-foreground hover:bg-foreground/4 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                  {kids.length > 0 && (active || childActive) && (
                    <div className="border-border/15 ml-5 mt-0.5 flex flex-col gap-0.5 border-l pl-2">
                      {kids.map((child) => {
                        const cActive = isActive(child);
                        const CIcon = child.icon;
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            aria-current={cActive ? "page" : undefined}
                            className={cn(
                              "flex min-h-9 items-center gap-2.5 rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
                              cActive
                                ? "border-luminous/25 bg-luminous/12 text-foreground font-medium [&_svg]:text-luminous"
                                : "border-transparent text-muted-foreground hover:bg-foreground/4 hover:text-foreground",
                            )}
                          >
                            <CIcon className="size-3.5 shrink-0" aria-hidden />
                            <span className="min-w-0 flex-1 truncate">
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
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
