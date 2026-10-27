import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Network } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="relative min-h-screen bg-[#faf8f2] overflow-hidden flex flex-col items-center justify-center selection:bg-primary/20">
      
      {/* CSS Animations for the floating background */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-2deg); }
        }
        @keyframes draw-line {
          0% { stroke-dashoffset: 1000; opacity: 0; }
          50% { opacity: 0.5; }
          100% { stroke-dashoffset: 0; opacity: 0.2; }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 10s ease-in-out infinite; }
        .animate-draw-line { stroke-dasharray: 1000; animation: draw-line 4s ease-out forwards; }
        .bg-grid { 
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Floating Visual Elements (Abstract Nodes) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Left Card */}
        <div className="absolute top-[15%] left-[10%] w-64 p-4 bg-white/60 backdrop-blur-sm border border-black/5 rounded-xl shadow-xl animate-float-slow opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Hypothesis</span>
          </div>
          <div className="h-4 bg-black/5 rounded w-3/4 mb-2" />
          <div className="h-3 bg-black/5 rounded w-full mb-1" />
          <div className="h-3 bg-black/5 rounded w-5/6" />
        </div>

        {/* Bottom Right Card */}
        <div className="absolute bottom-[20%] right-[12%] w-72 p-4 bg-white/60 backdrop-blur-sm border border-black/5 rounded-xl shadow-xl animate-float-medium opacity-60">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Evidence</span>
          </div>
          <div className="h-4 bg-black/5 rounded w-1/2 mb-3" />
          <div className="h-3 bg-black/5 rounded w-full mb-1" />
          <div className="h-3 bg-black/5 rounded w-4/5 mb-1" />
          <div className="h-3 bg-black/5 rounded w-full" />
        </div>

        {/* Connecting SVG Line */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M 300 200 Q 500 300 800 600" 
            fill="none" 
            stroke="rgba(0,0,0,0.2)" 
            strokeWidth="2" 
            strokeDasharray="8 8"
            className="animate-draw-line"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        
        {/* Top Badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-black/5 shadow-sm backdrop-blur-md">
          <Network className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">The Spatial Workbench</span>
        </div>

        {/* Kicker */}
        <p className="text-sm font-medium tracking-wide text-muted-foreground mb-4">
          Stop summarizing. Start investigating.
        </p>

        {/* Huge Headline */}
        <h1 className="font-display text-5xl md:text-7xl lg:text-[80px] leading-[1.1] text-[#1a1a1a] mb-6 tracking-tight">
          The canvas for <br className="hidden md:block" />
          <span className="italic text-primary/90">complex thinkers.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Threadwise is a spatial intelligence workbench. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
        </p>

        {/* Call to Action */}
        <Link to="/" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a1a] text-[#faf8f2] rounded-full font-medium text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(0,0,0,0.2)]">
          Enter the Workspace
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>

      </div>

      {/* Footer Note */}
      <div className="absolute bottom-8 text-xs font-mono text-muted-foreground/50 tracking-widest uppercase">
        Built for researchers, strategists & analysts
      </div>
    </div>
  );
}