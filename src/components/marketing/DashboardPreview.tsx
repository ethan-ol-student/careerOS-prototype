import {
  Compass,
  TrendingUp,
  Sparkles,
  Target,
  Layers,
  ArrowUpRight,
  Activity,
} from "lucide-react";

// In-product dashboard mockup rendered inline so the hero doesn't
// depend on an external screenshot. Mirrors the Career OS pillars
// described in the concept brief: career state, trajectory, skill
// gaps, opportunity alignment, continuous guidance.
export function DashboardPreview() {
  return (
    <div className="bg-background relative w-full overflow-hidden text-left text-foreground">
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          <span className="size-2.5 rounded-full bg-muted-foreground/40" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Compass className="size-3.5 text-brand" />
          <span>Career OS · Candidate Dashboard</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-4 sm:p-6">
        {/* Sidebar */}
        <aside className="col-span-3 hidden flex-col gap-1 md:flex">
          {[
            { label: "Overview", active: true },
            { label: "Portfolio" },
            { label: "Chapters" },
            { label: "Skill Lab" },
            { label: "Opportunities" },
          ].map((item) => (
            <div
              key={item.label}
              className={
                "rounded-md px-3 py-2 text-xs font-medium transition-colors " +
                (item.active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground")
              }
            >
              {item.label}
            </div>
          ))}
        </aside>

        {/* Main */}
        <div className="col-span-12 flex flex-col gap-4 md:col-span-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Career state
              </p>
              <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                Exploration phase · Building momentum
              </h3>
            </div>
            <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-[10px] font-medium text-brand">
              <Sparkles className="mr-1 inline size-2.5" />
              AI-guided
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <Activity className="size-3.5" />,
                label: "Momentum",
                value: "+18%",
                hint: "vs. last month",
              },
              {
                icon: <Layers className="size-3.5" />,
                label: "Skill depth",
                value: "7 / 12",
                hint: "core stack",
              },
              {
                icon: <Target className="size-3.5" />,
                label: "Readiness",
                value: "Mid",
                hint: "for product roles",
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border border-border/40 bg-card/60 p-3"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {kpi.icon}
                  {kpi.label}
                </div>
                <p className="mt-1 text-lg font-semibold">{kpi.value}</p>
                <p className="text-[10px] text-muted-foreground">{kpi.hint}</p>
              </div>
            ))}
          </div>

          {/* Trajectory chart */}
          <div className="rounded-lg border border-border/40 bg-card/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <TrendingUp className="size-3.5 text-brand" />
                Trajectory · next 5 years
              </div>
              <span className="text-[10px] text-muted-foreground">
                3 pathways
              </span>
            </div>
            <svg
              viewBox="0 0 300 80"
              className="h-20 w-full text-brand"
              preserveAspectRatio="none"
            >
              {/* grid */}
              <line
                x1="0"
                y1="60"
                x2="300"
                y2="60"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="40"
                x2="300"
                y2="40"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <line
                x1="0"
                y1="20"
                x2="300"
                y2="20"
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              {/* pathway 1 - aggressive growth */}
              <path
                d="M0,60 C40,55 80,38 120,28 S220,12 300,6"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.9"
                strokeWidth="1.6"
              />
              {/* pathway 2 - steady */}
              <path
                d="M0,60 C50,52 110,42 170,32 S260,22 300,18"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.55"
                strokeWidth="1.4"
                strokeDasharray="3 3"
              />
              {/* pathway 3 - pivot */}
              <path
                d="M0,60 C40,58 90,55 150,48 S240,38 300,32"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="1.4"
                strokeDasharray="2 4"
              />
              {/* dot */}
              <circle cx="0" cy="60" r="2.5" fill="currentColor" />
            </svg>
            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Now</span>
              <span>Year 2</span>
              <span>Year 5</span>
            </div>
          </div>

          {/* Recommended actions */}
          <div className="rounded-lg border border-border/40 bg-card/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-brand" />
                Next steps · AI recommendations
              </span>
              <span className="text-[10px] text-muted-foreground">
                3 active
              </span>
            </div>
            <ul className="flex flex-col divide-y divide-border/30">
              {[
                {
                  title: "Bridge skill · Product analytics",
                  body: "Unlocks 4 new pathways in tech",
                },
                {
                  title: "Portfolio gap · Case study",
                  body: "Adds depth to your Living Portfolio",
                },
                {
                  title: "Compounding skill · Storytelling",
                  body: "Reused across 7 of your 8 trajectories",
                },
              ].map((item) => (
                <li
                  key={item.title}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {item.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                  <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
