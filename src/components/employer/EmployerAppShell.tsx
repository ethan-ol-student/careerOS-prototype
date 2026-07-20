"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { LayoutLines } from "@/components/ui/LayoutLines";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { EmployerTopMenu } from "./EmployerTopMenu";
import { EmployerSidebar } from "./EmployerSidebar";
import { EmployerNotificationsBell } from "./EmployerNotificationsBell";
import { DemoDataBanner } from "./DemoDataBanner";

interface EmployerAppShellProps {
  children: ReactNode;
  /**
   * When true (default) employers without a completed onboarding will be
   * redirected to /employers/onboarding.
   */
  requireOnboarding?: boolean;
}

export default function EmployerAppShell({
  children,
  requireOnboarding = true,
}: EmployerAppShellProps) {
  const router = useRouter();
  const {
    user,
    employerOnboardingCompleted,
    status: authStatus,
    logout,
  } = useAuth();

  const [showSignOut, setShowSignOut] = useState(false);

  // Auth + role + onboarding gate.
  useEffect(() => {
    if (!requireOnboarding) return;
    if (authStatus !== "ready") return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.role === "candidate") {
      router.replace("/candidate/dashboard");
      return;
    }
    if (!employerOnboardingCompleted) {
      router.replace("/employers/onboarding");
    }
  }, [requireOnboarding, authStatus, user, employerOnboardingCompleted, router]);

  if (
    requireOnboarding &&
    (authStatus !== "ready" ||
      !user ||
      user.role !== "employer" ||
      !employerOnboardingCompleted)
  ) {
    return null;
  }

  /**
   * Employer sign-out: end the auth session on the server, clear
   * local/session caches (NOT the database), and bounce to the
   * landing page. Saved candidates, messages, and hiring goal stay
   * in the database and are restored on next sign-in.
   */
  const handleSignOutConfirm = async () => {
    await logout();
    setShowSignOut(false);
    router.push("/");
  };

  return (
    /* Zero-scroll frame mirroring the candidate AppShell: header +
       persistent sidebar (desktop) + internally-scrolling content. */
    <div
      data-role-accent="employer"
      className="bg-background text-foreground relative flex h-dvh w-full flex-col overflow-hidden"
    >
      <LayoutLines />
      <DemoDataBanner />
      <header className="relative z-50 -mb-4 shrink-0 pb-4">
        <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
        <nav className="relative flex items-center justify-between py-4 pr-4">
          {/* Logo slot mirrors the sidebar width; clicking it returns to
              the employer dashboard. Clover Compass = employer mode. */}
          <div className="flex shrink-0 items-center px-4 lg:w-60 lg:px-6">
            <Link
              href="/employers/dashboard"
              className="flex items-center gap-2 whitespace-nowrap text-base font-semibold tracking-tight"
            >
              <Compass className="size-5 text-clover" />
              Career OS
              <span className="text-muted-foreground ml-1 hidden text-[0.625rem] font-mono font-medium uppercase tracking-wider sm:inline">
                · Employer
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <EmployerNotificationsBell />
            <EmployerTopMenu onSignOut={() => setShowSignOut(true)} />
          </div>
        </nav>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <EmployerSidebar onSignOut={() => setShowSignOut(true)} />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <ConfirmDialog
        isOpen={showSignOut}
        title="Do you wish to sign out?"
        description="Your saved data will remain in your account, but this device session will be cleared."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setShowSignOut(false)}
      />
    </div>
  );
}
