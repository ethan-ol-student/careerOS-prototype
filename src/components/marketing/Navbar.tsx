"use client";

import Link from "next/link";
import { Compass, LogIn } from "lucide-react";
import { LinkButton } from "@/components/ui/LinkButton";

interface NavLink {
  text: string;
  href: string;
}

// "Employer" anchors to the Employer VP section on this same page.
// A dedicated employer route does not exist yet — link target is
// intentionally in-page so it never 404s.
const NAV_LINKS: NavLink[] = [
  { text: "Employer", href: "#employer-vp" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
      <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
      <div className="max-w-container relative mx-auto">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <Compass className="size-5 text-brand" />
              Career OS
            </Link>
            <ul className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-3">
            {/* Sign in is a static preview across all entrypoints (Navbar,
                TopMenu, EmployerTopMenu) — no auth backend is wired yet. */}
            <button
              type="button"
              aria-disabled="true"
              title="Sign in is a static preview"
              onClick={(e) => e.preventDefault()}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-luminous/40 hidden items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors focus:outline-none focus-visible:ring-2 md:inline-flex"
            >
              <LogIn className="size-3.5" aria-hidden />
              Sign in
              <span className="text-muted-foreground/70 text-[10px] font-normal uppercase tracking-wider">
                soon
              </span>
            </button>
            <LinkButton
              href="/employers/onboarding"
              size="sm"
              variant="glow"
              className="hidden sm:inline-flex"
            >
              Find Talent
            </LinkButton>
            <LinkButton href="/onboarding" size="sm" variant="default">
              Begin your journey
            </LinkButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
