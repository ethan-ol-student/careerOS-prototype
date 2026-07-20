import { ArrowUpRight, Briefcase, Info, Sparkles, TrendingUp } from "lucide-react";

export function DashboardPreview1() {
  return (
    <div className="relative w-full min-h-screen bg-black text-zinc-100 p-4 sm:p-6 md:p-8 font-sans antialiased text-left select-none">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600/10 border border-blue-500/20">
            <Sparkles className="size-3 text-blue-400" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">
            Career Intelligence
          </h1>
        </div>
        
        {/* Sub-navigation Menu Toggle */}
        <div className="flex items-center bg-zinc-900/40 p-0.5 rounded-lg border border-zinc-900 text-[11px] font-medium">
          <button className="px-3 py-1 rounded-md bg-blue-950/40 text-blue-400 border border-blue-900/30 shadow-sm">
            Analysis
          </button>
          <button className="px-3 py-1 text-zinc-500 hover:text-zinc-300 transition-colors">
            Actions
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Top Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        
        {/* Column 1: Potential Roles List */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 flex flex-col min-h-[400px]">
          <div className="flex items-center gap-1.5 rounded-lg border border-blue-900/20 bg-blue-950/10 px-2.5 py-1.5 text-[9px] font-mono font-semibold tracking-wider text-blue-400 uppercase mb-3">
            <Briefcase className="size-3" />
            <span>Potential Roles</span>
          </div>
          
          <Info className="size-3.5 text-zinc-600 mb-3 cursor-help hover:text-zinc-400 transition-colors" />

          {/* Vertical Role Selection Stack */}
          <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
            {[
              { title: "Full-Stack Engineer", company: "Shopify", match: "50%", active: true },
              { title: "[TEST] Mechanical Engineeri...", company: "CareerOS Judge Demo", match: "33%" },
              { title: "Machine Learning Engineer", company: "Nvidia", match: "25%" },
              { title: "ML / Controls Engineer", company: "Tesla", match: "25%" },
              { title: "Robotics Engineer", company: "Universal Robots", match: "0%" },
              { title: "Mechanical Design Lead", company: "Dyson", match: "0%" },
            ].map((role, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-lg text-xs transition-all flex flex-col justify-between min-h-[56px] border ${
                  role.active 
                    ? "border-blue-500/30 bg-blue-950/10 shadow-[inset_0_1px_12px_rgba(59,130,246,0.05)]" 
                    : "border-zinc-900/60 bg-zinc-950/30 hover:border-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-zinc-200 tracking-tight truncate max-w-[130px]">{role.title}</span>
                  <span className={`font-mono text-[10px] shrink-0 ${role.active ? "text-blue-400 font-semibold" : "text-zinc-500"}`}>{role.match}</span>
                </div>
                <span className="text-[10px] text-zinc-500 truncate mt-0.5">{role.company}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Core Capability Bar Chart */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-wider text-blue-400 uppercase mb-4">
              <TrendingUp className="size-3.5" />
              <span>Where you are – Full-Stack Engineer</span>
            </div>

            {/* Simulated Bar Graph Area */}
            <div className="relative h-44 w-full mt-6 flex items-end justify-around border-b border-zinc-800 pb-1">
              
              {/* Requirement Baseline Marker */}
              <div className="absolute top-6 left-0 w-full flex items-center z-0">
                <div className="flex-1 border-t border-dashed border-rose-500/50" />
                <span className="text-[8px] font-mono tracking-widest text-rose-500/80 bg-black px-1 shrink-0 uppercase">Requirement</span>
              </div>

              {/* Chart Bars */}
              {[
                { name: "Typescript", val: 30, height: "h-[65%]" },
                { name: "React", val: 30, height: "h-[65%]" },
                { name: "Node", val: 0, height: "h-0.5 bg-blue-500/30" },
                { name: "Databases", val: 0, height: "h-0.5 bg-blue-500/30" },
              ].map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center w-16 relative z-10 group">
                  <span className="text-[10px] font-bold font-mono text-blue-400 mb-1.5 opacity-90">{bar.val}</span>
                  <div className={`w-full rounded-t bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.15)] ${bar.height}`} />
                  <span className="text-[9px] text-zinc-400 font-sans tracking-tight mt-2 truncate max-w-full text-center">{bar.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Insight Snippet */}
          <div className="rounded-lg border border-zinc-900 bg-zinc-900/20 p-3 mt-4 text-xs">
            <p className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase mb-0.5">Skills</p>
            <p className="text-zinc-300 font-medium leading-relaxed tracking-tight">
              Your typescript is about to reach the requirement level — <span className="text-zinc-100 font-bold">level it up by adding evidence.</span>
            </p>
          </div>
        </div>

        {/* Column 3: Stats Overview & AI Summary */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-[400px]">
          
          {/* Top Panel: Match Status & Portfolio Action */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-zinc-400 uppercase mb-2">
                <span>Full-Stack Engineer</span>
                <span className="text-blue-500 font-bold text-xs">15%</span>
              </div>
              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-blue-600 rounded-full w-[15%]" />
              </div>
              
              <div className="space-y-2 mt-2">
                <div>
                  <p className="text-[8px] font-mono tracking-wider text-zinc-500 uppercase">Living Portfolio</p>
                  <p className="text-xs text-zinc-200 font-medium mt-0.5">
                    <span className="text-zinc-100 font-bold">1</span> of 11 skills backed by evidence
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    <span className="text-zinc-100 font-bold">0</span> reflection themes from your journal · mostly steady
                  </p>
                </div>
              </div>
            </div>

            <button className="w-fit text-xs font-medium tracking-tight bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-zinc-50 hover:bg-zinc-800/80 px-3.5 py-1.5 rounded-lg transition-colors mt-4">
              Open portfolio
            </button>
          </div>

          {/* Bottom Panel: AI Insights Summary Block */}
          <div className="rounded-xl border border-blue-950/40 bg-blue-950/5 p-4 flex flex-col justify-between flex-1">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-blue-400 uppercase tracking-widest mb-2 font-semibold">
                <Sparkles className="size-3" /> AI Summary
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed tracking-tight font-medium">
                Your working style reads as <span className="text-zinc-100 font-bold">The Explorer</span>, a <span className="text-zinc-100 font-bold">42% fit</span> with the typical Technology role, with 1 of 11 tracked skills backed by real evidence. To raise your readiness, <span className="text-blue-400 font-semibold">systems design</span> is the highest-demand skill you haven't validated yet.
              </p>
            </div>
            <Info className="size-3.5 text-zinc-600 mt-3 cursor-help hover:text-zinc-400 transition-colors" />
          </div>

        </div>
      </div>

      {/* Row 2: Comprehensive Profile Analysis Section (Your Work Animal) */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[140px]">
        
        {/* Floating Sector Redirect Anchor */}
        <ArrowUpRight className="absolute top-4 right-4 size-4 text-zinc-600 pointer-events-none" />

        <div className="flex flex-col gap-3">
          <div className="w-fit rounded-full border border-blue-900/30 bg-blue-950/20 px-2.5 py-0.5 text-[9px] font-mono font-semibold tracking-widest text-blue-400 uppercase">
            ⚡ Your Work Animal
          </div>
          
          <div className="flex items-start gap-4 mt-1">
            {/* Geometric Fox Profile Placeholder Illustration */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-950/20 border border-orange-700/30 shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
              {/* Minimal SVG Geometric Fox Shape */}
              <svg className="size-7 text-orange-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm-3.5-14.5L12 11l3.5-3.5 1.5 4.5-5 5-5-5 1.5-4.5z" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">
                  The Fox <span className="text-zinc-500 font-normal text-xs ml-1">The Explorer</span>
                </h3>
                <Info className="size-3 text-zinc-600 mt-1 cursor-help" />
              </div>
              
              <ul className="text-xs text-zinc-400 font-medium space-y-1 tracking-tight">
                <li className="flex items-baseline gap-1.5">
                  <span className="text-blue-500 font-bold font-mono text-xs select-none">•</span>
                  <span>Shared strength: <span className="text-zinc-300 font-semibold">Intellectual Curiosity.</span></span>
                </li>
                <li className="flex items-baseline gap-1.5">
                  <span className="text-blue-500 font-bold font-mono text-xs select-none">•</span>
                  <span>These roles lean on <span className="text-zinc-300 font-semibold">Attention to Detail</span> more than your style does.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Circular Concentric Segment Progress Meter */}
        <div className="flex items-center gap-3 self-end md:self-auto shrink-0 pr-4">
          <div className="text-right">
            <p className="text-[13px] font-bold font-mono text-zinc-100 leading-none">42%</p>
            <p className="text-[7px] font-mono tracking-wider text-zinc-500 uppercase mt-1 leading-tight">
              Fit · Technology<br />and Software
            </p>
          </div>

          <div className="relative size-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-900"
                strokeWidth="2.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500 drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]"
                strokeWidth="2.5"
                strokeDasharray="42, 100"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>

      </div>

    </div>
  );
}