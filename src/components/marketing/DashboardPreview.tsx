import { ArrowUpRight, Plus } from "lucide-react";

export function DashboardPreview() {
  return (
    <div className="relative w-full min-h-screen bg-black text-zinc-100 p-4 sm:p-6 md:p-8 font-sans antialiased text-left select-none">
      
      {/* Header Greeting */}
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-blue-500 font-semibold">
          Candidate · Mid-Career Phase
        </p>
        <h1 className="text-2xl font-bold tracking-tight mt-1 sm:text-3xl text-zinc-50">
          Good day, <span className="text-blue-500">Candidate.</span>
        </h1>
      </div>

      {/* Main Profile & Status Container */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 mb-5 backdrop-blur-sm">
        {/* Top Profile Info & Badges */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-950/40 text-blue-400 font-bold text-lg border border-blue-900/30">
              A
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Avery Tan</h2>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed max-w-xl">
                Product-minded engineer with proof across design, data, and shipping
              </p>
            </div>
          </div>
          
          {/* Skill Certification Badges */}
          <div className="flex flex-wrap gap-2 text-[10px] font-medium tracking-wide">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/30 px-2.5 py-1 text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> UX Research - Gold
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-zinc-300">
              <span className="size-1.5 rounded-full bg-amber-600" /> Machine Learning - Bronze
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-zinc-300">
              <span className="size-1.5 rounded-full bg-amber-600" /> Accessibility - Bronze
            </span>
          </div>
        </div>

        {/* Next Zone Segmented Progress Tracker */}
        <div className="mb-5">
          <p className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase mb-2">
            Next Zone: Senior Career
          </p>
          <div className="flex items-center gap-1 w-full">
            <div className="h-1 flex-1 rounded-sm bg-blue-600" />
            <div className="h-1 flex-1 rounded-sm bg-blue-600" />
            <div className="h-1 flex-1 rounded-sm bg-blue-600" />
            <div className="h-1 flex-1 rounded-sm bg-zinc-800" />
            <div className="h-1 flex-1 rounded-sm bg-zinc-800" />
            <span className="size-1.5 rounded-full bg-blue-500 ml-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </div>
        </div>

        {/* Dynamic Status Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900/20 px-3 py-2 text-[11px] font-medium text-zinc-300">
            <span className="size-2 rounded-full bg-rose-500 shrink-0" />
            <span>Skill Freshness</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900/20 px-3 py-2 text-[11px] font-medium text-zinc-300">
            <span className="size-2 rounded-full bg-amber-500 shrink-0" />
            <span>Network Strength</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900/20 px-3 py-2 text-[11px] font-medium text-zinc-300">
            <span className="size-2 rounded-full bg-amber-500 shrink-0" />
            <span>Learning Velocity</span>
          </div>
        </div>
      </div>

      {/* Goal & Top Gap Double Column Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-5">
        {/* Goal Matching Card */}
        <div className="md:col-span-7 rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 flex items-center gap-5">
          {/* Simulated Circular Ring Progress */}
          <div className="relative size-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500"
                strokeWidth="3"
                strokeDasharray="15, 100"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-sm font-bold text-zinc-100">15%</p>
              <p className="text-[7px] font-mono tracking-wider text-zinc-400 uppercase">Match</p>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-0.5">
              Goal
            </span>
            <h3 className="text-sm font-bold text-zinc-100">Target: Product Engineer</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-normal">
              Readiness fills as your validated skills close the role&apos;s bar.
            </p>
          </div>
        </div>

        {/* Top Gap Action Card */}
        <div className="md:col-span-5 rounded-xl border border-amber-500/20 bg-amber-950/5 p-5 flex flex-col justify-between min-h-[110px]">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-amber-500 uppercase tracking-widest mb-1">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" /> Top Gap
            </span>
            <h3 className="text-sm font-bold text-zinc-100">
              Missing: Node <span className="text-zinc-400 text-xs font-normal ml-0.5">(-100 Points)</span>
            </h3>
          </div>
          <a href="#" className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 font-medium tracking-tight mt-4 transition-colors">
            See how <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>

      {/* Priority Actions Block */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-5 mb-5">
        <p className="text-[10px] font-mono text-blue-500 uppercase tracking-widest font-semibold mb-3">
          Priority Actions
        </p>
        <div className="flex flex-col gap-2">
          {[
            { id: 1, text: 'Validate or learn "node" — It moves your match most', status: '0/100' },
            { id: 2, text: 'Strengthen "databases" with evidence or an endorsement', status: '0/100' },
            { id: 3, text: 'Apply to matched roles', status: '1 SUGGESTED', highlightStatus: true },
          ].map((action) => (
            <div key={action.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-900 bg-zinc-950/40 px-3.5 py-2.5 text-xs transition-all hover:bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-950/60 text-blue-400 font-mono text-[9px] font-bold border border-blue-900/30">
                  {action.id}
                </span>
                <span className="text-zinc-200 font-medium tracking-tight">{action.text}</span>
              </div>
              <span className={`font-mono text-[9px] tracking-wider whitespace-nowrap ${action.highlightStatus ? 'text-zinc-300 font-bold' : 'text-zinc-500'}`}>
                {action.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Job Matches Horizontal Carousel */}
      <div>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-3">
          Job Matches
        </p>
        <div className="flex gap-3 overflow-x-auto pb-3 snap-x scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {[
            { initial: 'S', match: '50%', title: 'Full-Stack Engineer', company: 'Shopify', highlight: 'Typescript', text: 'matches their top need' },
            { initial: 'C', match: '33%', title: '[TEST] Mechanical Engine...', company: 'CareerOS Judge Demo', highlight: 'Communication', text: 'matches their top need' },
            { initial: 'N', match: '25%', title: 'Machine Learning Engineer', company: 'Nvidia', highlight: 'Machine Learning', text: 'matches their top need' },
            { initial: 'T', match: '25%', title: 'ML / Controls Engineer', company: 'Tesla', highlight: 'Machine Learning', text: 'matches their top need' },
            { initial: 'U', match: '0%', title: 'Robotics Engineer', company: 'Universal Robots', highlight: null, text: 'Build the required skills to lift this match' },
          ].map((job, idx) => (
            <div key={idx} className="w-[230px] shrink-0 snap-start rounded-xl border border-zinc-900 bg-zinc-950/60 p-4 flex flex-col justify-between min-h-[135px] hover:border-zinc-800 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-zinc-300 font-bold text-[11px] border border-zinc-800">
                    {job.initial}
                  </span>
                  <span className="text-xs font-bold text-blue-500">{job.match}</span>
                </div>
                <h4 className="text-xs font-bold text-zinc-100 truncate tracking-tight">{job.title}</h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{job.company}</p>
              </div>
              <p className="text-[10px] text-zinc-400 mt-4 leading-normal tracking-tight">
                {job.highlight ? (
                  <>Your <span className="text-emerald-400 font-medium">{job.highlight}</span> {job.text}</>
                ) : (
                  job.text
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        aria-label="Add metric"
        className="absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
      >
        <Plus className="size-5 stroke-[2.5]" />
      </button>

    </div>
  );
}