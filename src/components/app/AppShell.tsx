"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useIntent } from "@/lib/context/IntentContext";
import { useNotifications } from "@/lib/context/NotificationsContext";
import { usePortfolio } from "@/lib/hooks/usePortfolio";
import { useChapters } from "@/lib/context/ChaptersContext";
import { LayoutLines } from "@/components/ui/LayoutLines";
import { TopMenu } from "@/components/app/TopMenu";
import { NotificationBell } from "@/components/app/NotificationBell";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface AppShellProps {
  children: ReactNode;
  /**
   * When true (default) the shell will redirect users without an
   * onboarded intent back to /onboarding. Set false for the
   * onboarding flow itself.
   */
  requireIntent?: boolean;
}

export default function AppShell({
  children,
  requireIntent = true,
}: AppShellProps) {
  const router = useRouter();
  const { intent, isHydrated, resetIntent } = useIntent();
  const { clearAll: clearNotifications } = useNotifications();
  const { resetPortfolio } = usePortfolio();
  const { resetEvents } = useChapters();

  const [showSignOut, setShowSignOut] = useState(false);

  // Wait for hydration before deciding whether to redirect — without
  // this gate every refresh on a candidate route briefly sees
  // `intent.role === null` and bounces back to onboarding.
  const isCandidate = intent.role === "candidate";
  useEffect(() => {
    if (!requireIntent) return;
    if (!isHydrated) return;
    if (intent.role === null) {
      router.replace("/onboarding");
    } else if (intent.role === "employer") {
      router.replace("/employers/marketplace");
    }
  }, [requireIntent, isHydrated, intent.role, router]);

  // While hydration is in progress (or the user isn't a candidate)
  // render nothing to avoid a flash of protected content.
  if (requireIntent && (!isHydrated || !isCandidate)) return null;

  /**
   * Candidate sign-out: wipe every candidate-side localStorage slot
   * we own, then send the user back to the landing page. The
   * confirmation is rendered through the shared `ConfirmDialog` so
   * the affordance matches everything else in the app.
   */
  const handleSignOutConfirm = () => {
    resetIntent();
    resetPortfolio();
    resetEvents();
    clearNotifications();
    setShowSignOut(false);
    router.push("/");
  };

  return (
    <div className="bg-background text-foreground relative min-h-screen w-full">
      <LayoutLines />
      <header className="sticky top-0 z-50 -mb-4 px-4 pb-4">
        <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
        <div className="max-w-container relative mx-auto">
          <nav className="flex items-center justify-between py-4">
            {/* Candidate logo always returns to the candidate dashboard
                so the user never loses progress by clicking the brand. */}
            <Link
              href="/candidate/dashboard"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <Compass className="size-5 text-luminous" />
              Career OS
              <span className="text-muted-foreground ml-1 text-[10px] font-medium uppercase tracking-wider">
                · Candidate
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <TopMenu
                userName={intent.name}
                userField={intent.field}
                onSignOut={() => setShowSignOut(true)}
              />
            </div>
          </nav>
        </div>
      </header>
      <div className="relative z-10">{children}</div>

      <ConfirmDialog
        isOpen={showSignOut}
        title="Are you sure?"
        description="Signing out will clear your Career OS profile, portfolio, life chapters, and notifications on this device. You'll return to the landing page."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setShowSignOut(false)}
      />
    </div>
  );
}
