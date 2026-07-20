"use client"; 

import { useState } from "react";
import { DashboardPreview } from "@/components/marketing/DashboardPreview"; // Adjust path as needed
import { Parallax } from "@/components/marketing/Parallax";
import { Mockup, MockupFrame } from "@/components/ui/Mockup";
import { Glow } from "@/components/ui/Glow";
import { DashboardPreview2 } from "@/components/marketing/DashboardPreview2";
import { DashboardPreview1 } from "@/components/marketing/DashboardPreview1";
// Import your Parallax, MockupFrame, Mockup, and Glow components here

export function DashboardGallery() {
  const [activeDash, setActiveDash] = useState(0);

  return (
    <div className="relative w-full pt-10 max-w-40xl mx-auto flex flex-col items-center gap-6">
      
      {/* Navigation Controller */}
      <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-full border border-zinc-800 backdrop-blur-md z-10">
        {[
          { id: 0, label: "Candidate Overview" },
          { id: 1, label: "Employer View" },
          // { id: 2, label: "Skill Analytics" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveDash(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none ${
              activeDash === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Display Container */}
      <div className="w-350 relative">
        <Parallax speed={-30}>
          <MockupFrame
            key={activeDash} 
            className="animate-appear opacity-0 [animation-delay:0.2s]"
            size="small"
          >
            <Mockup type="responsive" className="bg-background/90 w-full rounded-xl border-0">
              {activeDash === 0 && <DashboardPreview />}
              {activeDash === 1 && <DashboardPreview2 />} 
              {activeDash === 2 && <DashboardPreview1 />}
            </Mockup>
          </MockupFrame>
        </Parallax>
        
        <Glow variant="top" className="animate-appear-zoom opacity-0 [animation-delay:0.5s] pointer-events-none" />
      </div>
    </div>
  );
}