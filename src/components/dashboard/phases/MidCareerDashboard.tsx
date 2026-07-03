"use client";

import { Col } from "@/components/app/Grid";
import { GatekeeperChecklist } from "@/components/dashboard/GatekeeperChecklist";
import { PhaseWidgetGrid } from "@/components/dashboard/PhaseWidgetGrid";
import { CareerHealthHome } from "@/components/dashboard/midcareer/CareerHealthHome";
import type { PhaseDashboardProps } from "@/lib/dashboard/types";

/**
 * Mid-career dashboard = the Career Health home (Career Health Score,
 * skill relevance, fair pay, best next move, top gaps + monthly action,
 * story map, transferable map, skill bridge plan). Every card is wired to
 * a deterministic engine with a "Why this recommendation?" expander —
 * see `src/components/dashboard/midcareer/CareerHealthHome.tsx`.
 */
export function MidCareerDashboard({ data }: PhaseDashboardProps) {
  return (
    <>
      <CareerHealthHome data={data} />
      <PhaseWidgetGrid topLine>
        <Col span={12}>
          <GatekeeperChecklist />
        </Col>
      </PhaseWidgetGrid>
    </>
  );
}
