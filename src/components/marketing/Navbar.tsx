"use client";

import Link from "next/link";
import { Compass, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NavLink {
  text: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { text: "Features", href: "#features" },
  { text: "FAQ", href: "#faq" },
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
              className="flex items-center gap-2 whitespace-nowrap text-base font-semibold tracking-tight"
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
            <Link href="/auth">
              <Button type="button" size="sm">
                <LogIn className="size-4" />
                Sign in
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
