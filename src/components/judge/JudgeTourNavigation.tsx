"use client";

import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ClipboardList,
  Compass,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RotateCcw,
  UserRoundSearch,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import type { JudgeTourView } from "@/lib/judge/judgeTourSteps";
import { cn } from "@/lib/utils";
import { useJudgeTour } from "./JudgeTourProvider";

const NAV_ITEMS: Array<{
  view: JudgeTourView;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { view: "candidate-dashboard", label: "Candidate Dashboard", icon: LayoutDashboard },
  { view: "living-portfolio", label: "Living Portfolio", icon: ClipboardList },
  { view: "life-chapters", label: "Life Chapter Designer", icon: Compass },
  { view: "candidate-messages", label: "Candidate Messages", icon: MessageSquare },
  { view: "employer-marketplace", label: "Employer Marketplace", icon: Briefcase },
  { view: "candidate-profile", label: "Candidate Profile", icon: UserRoundSearch },
  { view: "employer-messages", label: "Employer Messages", icon: MessageSquare },
];

export function JudgeTourNavigation() {
  const router = useRouter();
  const { logout } = useAuth();
  const { currentView, goToView, restart } = useJudgeTour();

  const exit = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside className="glass-4 sticky top-20 z-30 rounded-2xl p-3">
      <div className="mb-3 px-2">
        <p className="text-luminous text-[10px] font-mono font-semibold uppercase tracking-[0.18em]">
          Judge mode
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Tour controls are visible only on this protected route.
        </p>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Judge tour sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            currentView === item.view ||
            (item.view === "employer-marketplace" &&
              currentView === "candidate-profile");
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => goToView(item.view)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                active
                  ? "bg-luminous/15 text-luminous-soft"
                  : "text-muted-foreground hover:bg-card/40 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={restart}>
          <RotateCcw className="size-4" />
          Restart
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={exit}>
          <LogOut className="size-4" />
          Exit
        </Button>
      </div>
    </aside>
  );
}
