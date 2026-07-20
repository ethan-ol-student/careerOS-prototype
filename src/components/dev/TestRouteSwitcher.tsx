"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import {
  TEST_ROUTES,
  TEST_ROUTE_GROUPS,
  resolveRoutePath,
} from "@/lib/dev/testRoutes";

/**
 * Page Tester — instant navigation to every key route, grouped. Dynamic
 * routes are resolved with a real seeded candidate id when available.
 */
export function TestRouteSwitcher({
  sampleCandidateId,
}: {
  sampleCandidateId: string | null;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {TEST_ROUTE_GROUPS.map((group) => {
        const routes = TEST_ROUTES.filter((r) => r.group === group);
        if (routes.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-muted-foreground mb-2 text-[0.6875rem] font-mono font-semibold uppercase tracking-wider">
              {group}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((route) => {
                const path = resolveRoutePath(route, sampleCandidateId);
                const missingSample = !!route.dynamic && !sampleCandidateId;
                return (
                  <button
                    key={route.path}
                    type="button"
                    onClick={() => router.push(path)}
                    className="border-border/60 bg-card/40 hover:border-luminous/60 group rounded-lg border px-3 py-2 text-left transition-colors"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{route.label}</span>
                      <ArrowUpRight className="text-muted-foreground group-hover:text-luminous size-3.5 shrink-0" />
                    </span>
                    <span className="text-muted-foreground block truncate font-mono text-[0.6875rem]">
                      {path}
                    </span>
                    {route.note ? (
                      <span className="text-muted-foreground/70 block text-[0.625rem]">
                        {route.note}
                      </span>
                    ) : null}
                    {missingSample ? (
                      <span className="block text-[0.625rem] text-yellow-400">
                        Using fallback id — run db:seed for real data.
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
