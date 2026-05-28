"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useEmployer } from "@/lib/context/EmployerContext";
import { useIntent } from "@/lib/context/IntentContext";
import { useSavedCandidates } from "@/lib/context/SavedCandidatesContext";
import { LayoutLines } from "@/components/ui/LayoutLines";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { EmployerTopMenu } from "./EmployerTopMenu";
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
  const { hasCompletedOnboarding, isHydrated, resetGoal } = useEmployer();
  const { resetIntent } = useIntent();
  const { resetAll: resetSavedCandidates } = useSavedCandidates();

  const [showSignOut, setShowSignOut] = useState(false);

  useEffect(() => {
    if (!requireOnboarding) return;
    if (!isHydrated) return;
    if (!hasCompletedOnboarding) {
      router.replace("/employers/onboarding");
    }
  }, [requireOnboarding, hasCompletedOnboarding, isHydrated, router]);

  // While hydration in progress (or onboarding incomplete), render
  // nothing to avoid a flash of protected content.
  if (requireOnboarding && (!isHydrated || !hasCompletedOnboarding)) {
    return null;
  }

  /**
   * Employer sign-out: wipe the employer-owned localStorage slots and
   * also clear `intent.role` (which we set to `"employer"` at the end
   * of onboarding so AppShell can tell the two sides apart). Send the
   * user back to the landing page.
   */
  const handleSignOutConfirm = () => {
    resetGoal();
    resetSavedCandidates();
    resetIntent();
    setShowSignOut(false);
    router.push("/");
  };

  return (
    <div className="bg-background text-foreground relative min-h-screen w-full">
      <LayoutLines />
      <DemoDataBanner />
      <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
        <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
        <div className="max-w-container relative mx-auto">
          <nav className="flex items-center justify-between py-4">
            {/* Employer logo stays inside the employer experience —
                clicking it returns to the marketplace, not the landing
                page. The clover-tinted Compass + "Employer" label make
                the current mode unmistakable. */}
            <Link
              href="/employers/marketplace"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <Compass className="size-5 text-clover" />
              Career OS
              <span className="text-muted-foreground ml-1 text-[10px] font-medium uppercase tracking-wider">
                · Employer
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <EmployerNotificationsBell />
              <EmployerTopMenu onSignOut={() => setShowSignOut(true)} />
            </div>
          </nav>
        </div>
      </header>
      <div className="relative z-10">{children}</div>

      <ConfirmDialog
        isOpen={showSignOut}
        title="Do you wish to sign out?"
        description="You'll lose all employer prototype data — saved candidates, messages, notifications, and your hiring goal — on this device."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setShowSignOut(false)}
      />
    </div>
  );
}
