"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useIntent } from "@/lib/context/IntentContext";
import { useAuth } from "@/lib/context/AuthContext";
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
  const { intent } = useIntent();
  const {
    user,
    candidateOnboardingCompleted,
    status: authStatus,
    logout,
  } = useAuth();

  const [showSignOut, setShowSignOut] = useState(false);

  // Auth-driven gating: wait for the AuthProvider to hydrate, then:
  //   - no user → bounce to /auth
  //   - employer user → bounce to /employers/marketplace
  //   - candidate without advanced onboarding → bounce to /candidate/onboarding
  useEffect(() => {
    if (!requireIntent) return;
    if (authStatus !== "ready") return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.role === "employer") {
      router.replace("/employers/marketplace");
      return;
    }
    if (!candidateOnboardingCompleted) {
      router.replace("/candidate/onboarding");
    }
  }, [
    requireIntent,
    authStatus,
    user,
    candidateOnboardingCompleted,
    router,
  ]);

  if (
    requireIntent &&
    (authStatus !== "ready" ||
      !user ||
      user.role !== "candidate" ||
      !candidateOnboardingCompleted)
  ) {
    return null;
  }

  /**
   * Candidate sign-out: end the auth session on the server, clear
   * local/session caches (NOT the database), and bounce to the
   * landing page. The user's saved data remains in their account
   * and is restored next time they sign in.
   */
  const handleSignOutConfirm = async () => {
    await logout();
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
        title="Are you sure you want to sign out?"
        description="Your saved data will remain in your account, but this device session will be cleared."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setShowSignOut(false)}
      />
    </div>
  );
}
