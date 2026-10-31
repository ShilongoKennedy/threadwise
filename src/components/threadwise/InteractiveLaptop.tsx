import { useState } from "react";
import { 
  ShieldAlert, FileWarning, Play, Loader2, 
  GitCompare
} from "lucide-react";
import { cn } from "@/lib/utils";

export function InteractiveLaptop() {
  const [activeDoc, setActiveDoc] = useState("doc1");
  const [activeTab, setActiveTab] = useState("workbench");
  const [activeHighlight, setActiveHighlight] = useState<string | null>("hl1");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(true); // Start true so they see the magic immediately

  const docs = [
    { id: "doc1", title: "Al Jazeera 1", date: "Oct 2026" },
    { id: "doc2", title: "Reuters Brief", date: "Oct 2026" },
    { id: "doc3", title: "US Treasury", date: "Nov 2026" },
  ];

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setShowResults(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <div className="w-full h-full flex bg-[#FDFBF7]">
      {/* 1. Sidebar */}
      <div className="w-[18%] h-full border-r border-black/5 p-3 flex flex-col bg-[#FDFBF7]">
        <div className="text-[8px] font-mono tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1A4BFF]" />
          Corpus · 3
        </div>
        <div className="space-y-2">
          {docs.map((doc) => (
            <button 
              key={doc.id}
              onClick={() => setActiveDoc(doc.id)}
              className={cn(
                "flex flex-col gap-0.5 p-2 rounded-sm border text-left transition-all",
                activeDoc === doc.id 
                  ? "bg-white border-[#1A4BFF] shadow-sm" 
                  : "bg-black/5 border-transparent hover:bg-black/10"
              )}
            >
              <span className="text-[6px] text-muted-foreground font-mono">{doc.date}</span>
              <span className={cn(
                "text-[8px] font-medium truncate",
                activeDoc === doc.id ? "text-[#1A1A1A]" : "text-[#1A1A1A]/60"
              )}>{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="w-[82%] h-full flex flex-col">
        {/* Tabs */}
        <div className="h-10 border-b border-black/5 flex items-center px-4 gap-4 shrink-0 bg-white">
          <button 
            onClick={() => setActiveTab("workbench")}
            className={cn(
              "text-[8px] font-mono tracking-wider uppercase py-2.5 px-1 transition-colors",
              activeTab === "workbench" ? "text-[#1A1A1A] font-bold border-b-2 border-[#1A4BFF]" : "text-muted-foreground"
            )}
          >
            Forensic Workbench
          </button>
          <button 
            onClick={() => setActiveTab("diff")}
            className={cn(
              "text-[8px] font-mono tracking-wider uppercase py-2.5 px-1 transition-colors",
              activeTab === "diff" ? "text-[#1A1A1A] font-bold border-b-2 border-[#1A4BFF]" : "text-muted-foreground"
            )}
          >
            Text Diff
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === "workbench" ? (
            <>
              {/* Left: Speech Text */}
              <div className="w-1/2 h-full border-r border-black/5 p-6 overflow-hidden relative bg-[#FDFBF7]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[8px] font-mono tracking-widest uppercase text-[#1A4BFF] font-bold">Forensic Workbench</span>
                </div>
                
                {activeDoc === "doc1" && (
                  <div className="font-serif text-[11px] leading-relaxed text-[#1A1A1A]/80">
                    <p className="mb-3">
                      "I was in a country somewhere in the Middle East... and the people said, we took our gold out of the vaults in New York City. You know what I said to him?{" "}
                      <span 
                        onMouseEnter={() => setActiveHighlight("hl1")}
                        className={cn(
                          "cursor-pointer transition-colors px-1 py-0.5 rounded-sm border-b",
                          activeHighlight === "hl1" ? "bg-[#1A4BFF]/20 border-[#1A4BFF]" : "bg-[#1A4BFF]/5 border-[#1A4BFF]/30"
                        )}
                      >
                        I said, you have three armies within 400 miles who can come take your gold.
                      </span>
                      "
                    </p>
                    <p className="mb-3">
                      "That’s the real world. You’re not thinking clearly about safety.{" "}
                      <span 
                        onMouseEnter={() => setActiveHighlight("hl2")}
                        className={cn(
                          "cursor-pointer transition-colors px-1 py-0.5 rounded-sm border-b",
                          activeHighlight === "hl2" ? "bg-[#1A4BFF]/20 border-[#1A4BFF]" : "bg-[#1A4BFF]/5 border-[#1A4BFF]/30"
                        )}
                      >
                        That gold is protected by the Atlantic, the Pacific, the United States military, the rule of law.
                      </span>
                      "
                    </p>
                  </div>
                )}

                {activeDoc === "doc2" && (
                  <div className="font-serif text-[11px] leading-relaxed text-[#1A1A1A]/80">
                    <p className="mb-3">
                      "The minister emphasized that economic stability relies on diversified trade routes.{" "}
                      <span className="bg-[#1A4BFF]/10 border-b border-[#1A4BFF] px-1 py-0.5 rounded-sm">We cannot rely on a single reserve currency.</span>
                      "
                    </p>
                  </div>
                )}

                {activeDoc === "doc3" && (
                  <div className="font-serif text-[11px] leading-relaxed text-[#1A1A1A]/80">
                    <p className="mb-3">
                      "Official statements confirm the transfer of assets was completed under standard regulatory frameworks.{" "}
                      <span className="bg-[#1A4BFF]/10 border-b border-[#1A4BFF] px-1 py-0.5 rounded-sm">No anomalies detected in the ledger.</span>
                      "
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Analyst Margin */}
              <div className="w-1/2 h-full p-6 flex flex-col gap-4 overflow-hidden relative bg-white">
                
                {!showResults && !isAnalyzing && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#1A4BFF]/10 flex items-center justify-center mb-3">
                      <Play className="w-5 h-5 text-[#1A4BFF] ml-1" />
                    </div>
                    <button 
                      onClick={handleAnalyze}
                      className="px-4 py-2 bg-[#1A1A1A] text-white rounded-sm font-mono text-[9px] uppercase tracking-widest hover:bg-[#1A4BFF] transition-colors"
                    >
                      Run Forensic Analysis
                    </button>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-6 h-6 text-[#1A4BFF] animate-spin mb-3" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A4BFF]">Analyzing...</span>
                  </div>
                )}

                {showResults && (
                  <div className="flex flex-col gap-4 animate-in fade-in duration-500 h-full">
                    {/* Top Metrics */}
                    <div className="flex gap-3">
                      <div className="flex-1 rounded-sm border border-black/10 bg-[#FDFBF7] p-2 flex flex-col items-center">
                        <span className="text-[7px] font-mono uppercase text-muted-foreground self-start mb-1">Radar</span>
                        <svg viewBox="0 0 100 100" className="w-14 h-14">
                          <polygon points="50,10 90,40 75,85 25,85 10,40" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                          <polygon points="50,25 75,45 65,75 35,75 25,45" fill="none" stroke="#E5E5E5" strokeWidth="1" />
                          <polygon points="50,30 70,45 60,65 40,65 30,45" fill="#1A4BFF" fillOpacity="0.15" stroke="#1A4BFF" strokeWidth="2" />
                        </svg>
                      </div>
                      <div className="flex-1 rounded-sm border border-black/10 bg-[#FDFBF7] p-2 flex flex-col items-center justify-center relative">
                        <span className="text-[7px] font-mono uppercase text-muted-foreground self-start absolute top-2 left-2">Friction</span>
                        <div className="text-[18px] font-display text-[#1A4BFF] mt-2">85<span className="text-[8px] text-muted-foreground">/100</span></div>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-[#FDFBF7] border-l-4 border-[#1A4BFF] p-2 rounded-r shadow-sm">
                      <span className="text-[7px] font-mono uppercase text-[#1A4BFF] block mb-1 font-bold">Executive Summary</span>
                      <p className="text-[9px] leading-tight text-[#1A1A1A] font-medium line-clamp-2">The speaker is using implicit threats of military force to reassure foreign investors.</p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                      <div className={cn(
                        "bg-white border rounded-sm p-2 shadow-sm transition-all duration-300",
                        activeHighlight === "hl1" ? "border-[#1A4BFF] ring-1 ring-[#1A4BFF]/20" : "border-black/10"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert className="w-3 h-3 text-[#1A4BFF]" />
                          <span className="text-[7px] font-bold font-mono uppercase text-muted-foreground">Contradiction</span>
                        </div>
                        <b className="block text-[9px] font-display mb-1">Appeal to Force</b>
                        <p className="text-[8px] text-muted-foreground leading-tight">Using the threat of the US military to persuade the country to leave its gold.</p>
                      </div>

                      <div className={cn(
                        "bg-white border rounded-sm p-2 shadow-sm transition-all duration-300",
                        activeHighlight === "hl2" ? "border-[#1A4BFF] ring-1 ring-[#1A4BFF]/20" : "border-black/10"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <FileWarning className="w-3 h-3 text-[#E3D398]" />
                          <span className="text-[7px] font-bold font-mono uppercase text-muted-foreground">Fallacy</span>
                        </div>
                        <b className="block text-[9px] font-display mb-1">Rule of Law vs. Force</b>
                        <p className="text-[8px] text-muted-foreground leading-tight">Citing 'rule of law' alongside implicit force reveals a protection-racket mentality.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Text Diff Tab Mockup */
            <div className="w-full h-full p-6 bg-[#FDFBF7] flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-black/10 pb-2">
                <GitCompare className="w-4 h-4 text-[#1A4BFF]" />
                <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Comparative Analysis</span>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-white border border-black/10 p-4 rounded-sm shadow-sm overflow-hidden">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-2 block">Source A</span>
                  <p className="font-serif text-[10px] leading-relaxed text-[#1A1A1A]/80">
                    "That gold is protected by the Atlantic, the Pacific, the United States military..."
                  </p>
                </div>
                <div className="bg-white border border-black/10 p-4 rounded-sm shadow-sm overflow-hidden">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-2 block">Source B</span>
                  <p className="font-serif text-[10px] leading-relaxed text-[#1A1A1A]/80">
                    "We cannot rely on a single reserve currency for national security."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}