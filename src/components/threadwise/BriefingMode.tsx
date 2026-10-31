import { useEffect, useState, useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { X, ChevronRight, ChevronLeft, Fingerprint, AlertTriangle, FileText, Lightbulb, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThread } from "@/lib/threadwise/store";
import { TYPE_INFO } from "@/lib/threadwise/model";
import { cn } from "@/lib/utils";

export function BriefingMode({ onExit }: { onExit: () => void }) {
  const s = useThread();
  const rf = useReactFlow();
  const [index, setIndex] = useState(0);

  // Build a logical sequence based on the intelligence flow
  const sequence = useMemo(() => {
    const dossiers = s.nodes.filter(n => n.data.kind === "dossier");
    const evidence = s.nodes.filter(n => n.data.kind === "note");
    const hypotheses = s.nodes.filter(n => n.data.kind === "idea");
    const blindspots = s.nodes.filter(n => n.data.kind === "omission" || n.data.kind === "question");
    const actions = s.nodes.filter(n => n.data.kind === "action" || n.data.kind === "experiment");
    
    return [...dossiers, ...evidence, ...hypotheses, ...blindspots, ...actions];
  }, [s.nodes]);

  const activeNode = sequence[index];

  // Move camera when index changes
  useEffect(() => {
    if (activeNode) {
      // Center the card, but offset it to the left so the glass panel doesn't cover it
      rf.setCenter(activeNode.position.x + 136 - 250, activeNode.position.y + 100, {
        zoom: 1.1,
        duration: 1200,
      });
    }
  }, [index, activeNode, rf]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setIndex((i) => Math.min(sequence.length - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sequence.length, onExit]);

  if (!activeNode) return null;

  const Icon = 
    activeNode.data.kind === "dossier" ? FolderOpen : 
    activeNode.data.kind === "omission" ? AlertTriangle : 
    activeNode.data.kind === "idea" ? Lightbulb : FileText;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col justify-between">
      {/* Dimmed Background Overlay (Pointer events none so canvas is still interactive if needed) */}
      <div className="absolute inset-0 bg-[#FDFBF7]/80 backdrop-blur-[2px] transition-opacity duration-1000 pointer-events-none" />

      {/* TOP BAR */}
      <header className="relative z-10 flex items-center justify-between px-10 py-8 pointer-events-auto">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A4BFF] flex items-center gap-2">
            <Fingerprint className="w-3.5 h-3.5" /> Live Intelligence Briefing
          </span>
          <h2 className="font-display text-2xl text-black mt-1">Threadwise Command</h2>
        </div>
        <Button variant="outline" onClick={onExit} className="bg-white/50 border-black/10 hover:bg-black/5 rounded-full px-6">
          Exit Briefing <kbd className="ml-2 font-mono text-[10px] bg-black/5 px-1.5 py-0.5 rounded text-black/50">ESC</kbd>
        </Button>
      </header>

      {/* RIGHT GLASS PANEL */}
      <aside 
        key={activeNode.id}
        className="absolute right-12 top-1/2 -translate-y-1/2 w-[420px] max-h-[70vh] flex flex-col overflow-hidden rounded-[2px] border border-white/40 bg-white/60 backdrop-blur-3xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.15)] pointer-events-auto animate-in slide-in-from-right-12 fade-in duration-700"
      >
        <div className="p-8 pb-6 border-b border-black/5 flex items-start gap-4">
          <div 
            className="p-3 rounded-2xl shrink-0"
            style={{ backgroundColor: `color-mix(in srgb, ${activeNode.data.kind === "omission" ? "#1A4BFF" : "var(--foreground)"} 10%, transparent)` }}
          >
            <Icon className="w-6 h-6" style={{ color: activeNode.data.kind === "omission" ? "#1A4BFF" : "var(--foreground)" }} />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
              {TYPE_INFO[activeNode.data.kind].label} · {activeNode.data.epistemic}
            </span>
            <h3 className={cn("font-display text-2xl leading-tight", activeNode.data.kind === "omission" ? "text-[#1A4BFF]" : "text-black")}>
              {activeNode.data.title}
            </h3>
          </div>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <p className="font-serif text-[17px] leading-relaxed text-black/80 whitespace-pre-wrap">
            {activeNode.data.body || "No detailed intelligence recorded for this node."}
          </p>
        </div>

        <div className="px-8 py-4 bg-black/5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">Node {index + 1} of {sequence.length}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIndex(i => Math.min(sequence.length - 1, i + 1))} disabled={index === sequence.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* BOTTOM TIMELINE */}
      <footer className="relative z-10 px-10 pb-10 pointer-events-auto flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-4 py-3 backdrop-blur-xl shadow-lg">
          {sequence.map((n, i) => (
            <button
              key={n.id}
              onClick={() => setIndex(i)}
              title={n.data.title}
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                i === index ? "w-8 bg-[#1A4BFF]" : 
                i < index ? "w-2 bg-black/40 hover:bg-black/60" : "w-2 bg-black/10 hover:bg-black/30"
              )}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}