"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useIntent } from "@/lib/context/IntentContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useCandidatesAI } from "@/lib/hooks/useCandidatesAI";
import { useUiDensity } from "@/lib/dashboard/useUiDensity";
import { TopMenu } from "@/components/app/TopMenu";
import { CarrieWidget } from "@/components/carrie/CarrieWidget";
import { CandidateSidebar } from "@/components/app/CandidateSidebar";
import { NotificationBell } from "@/components/app/NotificationBell";
import { StreakChip } from "@/components/app/StreakChip";
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
  const pathname = usePathname() ?? "";
  const { intent } = useIntent();
  const {
    user,
    candidateOnboardingCompleted,
    status: authStatus,
    logout,
  } = useAuth();
  const { data: ai } = useCandidatesAI();

  const [showSignOut, setShowSignOut] = useState(false);
  // Detailed | Vibrant density — set once on the shell so every candidate
  // page (jobs, skills, portfolio, …) can swap prose ↔ InfoHint via CSS.
  const uiDensity = useUiDensity();

  // Students are exploration-first — the job section is off-limits. Bounce
  // any direct hit on /jobs (list or detail) back to the dashboard; the
  // sidebar already hides the link.
  const studentBlockedFromJobs =
    ai?.careerStage === "student" && pathname.startsWith("/jobs");
  useEffect(() => {
    if (studentBlockedFromJobs) router.replace("/candidate/dashboard");
  }, [studentBlockedFromJobs, router]);

  // Auth-driven gating: wait for the AuthProvider to hydrate, then:
  //   - no user → bounce to /auth
  //   - employer user → bounce to /employers/dashboard
  //   - candidate without advanced onboarding → bounce to /candidate/onboarding
  useEffect(() => {
    if (!requireIntent) return;
    if (authStatus !== "ready") return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (user.role === "employer") {
      router.replace("/employers/dashboard");
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
      !candidateOnboardingCompleted ||
      studentBlockedFromJobs)
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
    /* Zero-scroll frame: the app is exactly one viewport tall; only the
       content region (and, if needed, the sidebar) scrolls internally. */
    <div
      data-ui-density={uiDensity}
      className="bg-background text-foreground relative flex h-dvh w-full flex-col overflow-hidden"
    >
      <header className="relative z-50 -mb-4 shrink-0 pb-4">
        <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
        <nav className="relative flex items-center justify-between py-4 pr-4">
          {/* Logo slot mirrors the sidebar width so the brand sits flush
              above the left nav on desktop. Clicking it returns to the
              dashboard so the user never loses progress. */}
          <div className="flex shrink-0 items-center px-4 lg:w-60 lg:px-6">
            <Link
              href="/candidate/dashboard"
              className="flex items-center gap-2 whitespace-nowrap text-base font-semibold tracking-tight"
            >
              <Compass className="size-5 text-luminous" />
              Career OS
              <span className="text-muted-foreground ml-1 hidden text-[0.625rem] font-mono font-medium uppercase tracking-wider sm:inline">
                · Candidate
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <StreakChip />
            <NotificationBell />
            <TopMenu
              userName={intent.name}
              userField={intent.field}
              onSignOut={() => setShowSignOut(true)}
            />
          </div>
        </nav>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1">
        <CandidateSidebar onSignOut={() => setShowSignOut(true)} />
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <CarrieWidget />

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
