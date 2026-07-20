import { ArrowUpRight, Briefcase, User } from "lucide-react";

export function DashboardPreview2() {
  return (
    <div className="relative w-full min-h-screen bg-black text-zinc-100 p-4 sm:p-6 md:p-8 font-sans antialiased text-left select-none">
      
      {/* Header Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-zinc-50">
          Good day, <span className="text-green-500">Employer</span>
        </h1>
      </div>

      {/* Row 1: Who Are You & Interviews Today */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
        
        {/* Card: Who Are You */}
        <div className="md:col-span-5 rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start w-full">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
              Who are you?
            </span>
            <ArrowUpRight className="size-4 text-zinc-600" />
          </div>

          <div className="flex items-center gap-4 my-auto">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-950/30 text-green-400 font-bold text-lg border border-green-900/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
              EM
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-wider font-mono">Employer</h2>
              <p className="text-xs text-zinc-400 mt-0.5">CareerOS Employer</p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-300">
                <Briefcase className="size-3.5 text-green-500" />
                <span>Hiring: <span className="font-semibold text-zinc-200">Product Engineer</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Interviews Today */}
        <div className="md:col-span-7 rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-start w-full mb-4">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
              Interviews Today
            </span>
            <ArrowUpRight className="size-4 text-zinc-600" />
          </div>

          {/* Horizontal Weekly Calendar Tracker */}
          <div className="grid grid-cols-7 gap-1.5 mb-5 w-full">
            {[
              { day: "MON", num: 13 },
              { day: "TUE", num: 14 },
              { day: "WED", num: 15 },
              { day: "THU", num: 16 },
              { day: "FRI", num: 17 },
              { day: "SAT", num: 18 },
              { day: "SUN", num: 19, active: true },
            ].map((date, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col items-center justify-center py-2 rounded-lg border text-center transition-all ${
                  date.active 
                    ? "border-green-500/50 bg-green-950/20 relative" 
                    : "border-zinc-900 bg-zinc-950/40"
                }`}
              >
                <span className="text-[8px] font-mono text-zinc-500 tracking-wider">{date.day}</span>
                <span className={`text-xs font-bold font-mono mt-0.5 ${date.active ? "text-green-400" : "text-zinc-200"}`}>
                  {date.num}
                </span>
                {date.active && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-green-500" />
                )}
              </div>
            ))}
          </div>

          {/* Interview Action Row */}
          <div className="flex items-center gap-2 text-xs bg-zinc-900/10 p-2.5 rounded-lg border border-zinc-900/40">
            <span className="size-2 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <p className="text-zinc-200 font-medium"> Avery Tan 
              <span className="text-zinc-500 font-normal font-mono text-[11px] ml-1">
                [TEST] Mechanical Engineering · interview stage
              </span>
            </p>
          </div>
        </div>

      </div>

      {/* Row 2: Your Open Roles & Hiring Funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Card: Your Open Roles */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 flex flex-col justify-between min-h-[260px]">
          <div className="flex justify-between items-start w-full mb-4">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
              Your Open Roles
            </span>
            <ArrowUpRight className="size-4 text-zinc-600" />
          </div>

          <div className="flex items-center justify-between gap-4 border border-zinc-900 bg-zinc-950/40 p-3 rounded-lg hover:border-zinc-800 transition-colors my-auto">
            <div className="flex items-start gap-3 min-w-0">
              <span className="inline-flex shrink-0 items-center justify-center rounded border border-green-500/20 bg-green-950/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-green-400">
                You
              </span>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-100 truncate tracking-tight">
                  [TEST] Mechanical Engineering
                </h4>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  Kuala Lumpur · expires 8/8/2026
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                <User className="size-3.5" />
                <span>1</span>
              </div>
              <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-950/40 px-2 py-0.5 text-[9px] font-medium text-green-400 uppercase tracking-wider font-mono">
                active
              </span>
            </div>
          </div>
        </div>

        {/* Card: Hiring Funnel */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 flex flex-col justify-between min-h-[260px]">
          <div className="flex justify-between items-start w-full mb-4">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">
              Hiring Funnel
            </span>
            <ArrowUpRight className="size-4 text-zinc-600" />
          </div>

          {/* Centered Funnel Visual Graph */}
          <div className="flex flex-col gap-2.5 my-auto py-2">
            {[
              { stage: "Applied", count: 7, width: "w-4/5" },
              { stage: "Screened", count: 2, width: "w-2/5" },
              { stage: "Interview", count: 2, width: "w-2/5" },
              { stage: "Offer", count: 1, width: "w-1/5" },
              { stage: "Hired", count: 0, width: "w-3" },
            ].map((row, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                <span className="w-16 text-zinc-400 text-left text-[10px]">{row.stage}</span>
                
                {/* Centered dynamically sizing bar item */}
                <div className="flex-1 flex justify-center px-4">
                  <div className={`h-3 rounded-full bg-green-600/80 transition-all ${row.width} ${
                    row.count === 0 ? "bg-green-900/20 h-2.5" : ""
                  }`} />
                </div>
                
                <span className={`w-4 text-right font-bold ${row.count > 0 ? "text-zinc-100" : "text-zinc-600"}`}>
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}