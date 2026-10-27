import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Network, ShieldAlert, Sparkles, FileText } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FAF9F5] overflow-hidden flex flex-col items-center justify-center selection:bg-black/10">
      
      {/* Dynamic Spotlight that follows the mouse */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.8), transparent 40%)`,
        }}
      />

      {/* The Grid Canvas Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(0deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-20px) rotate(-1deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes draw {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        .node-1 { animation: float-1 8s ease-in-out infinite; }
        .node-2 { animation: float-2 10s ease-in-out infinite; }
        .node-3 { animation: float-3 9s ease-in-out infinite; }
        .connect-line {
          stroke-dasharray: 6 6;
          animation: draw 5s linear infinite;
        }
      `}</style>

      {/* THE SPATIAL CANVAS NODES */}
      <div className="absolute inset-0 z-10 pointer-events-none hidden md:block">
        
        {/* Node 1: The Question (Top Left) */}
        <div className="node-1 absolute top-[20%] left-[12%] w-64 bg-white border border-black/10 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-black/[0.02]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Question</span>
            <span className="text-[10px] font-mono text-muted-foreground">UNKNOWN</span>
          </div>
          <div className="p-4">
            <h4 className="font-display text-lg leading-tight text-black mb-2">What is the real motive?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
          </div>
        </div>

        {/* Node 2: The Evidence (Bottom Right) */}
        <div className="node-2 absolute bottom-[25%] right-[15%] w-72 bg-white border border-black/10 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-black/[0.02]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 flex items-center gap-1"><FileText className="w-3 h-3"/> Evidence</span>
            <span className="text-[10px] font-mono text-muted-foreground">FACT</span>
          </div>
          <div className="p-4">
            <h4 className="font-display text-lg leading-tight text-black mb-2">El Salvador sends troops</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
            <div className="mt-3 pt-3 border-t border-black/5">
              <span className="text-[10px] font-mono bg-black/5 px-2 py-1 rounded">Miami Herald</span>
            </div>
          </div>
        </div>

        {/* Node 3: The Hypothesis (Top Right) */}
        <div className="node-3 absolute top-[25%] right-[18%] w-56 bg-white border border-black/10 rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-black/[0.02]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-orange-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Hypothesis</span>
          </div>
          <div className="p-4">
            <h4 className="font-display text-lg leading-tight text-black mb-2">Securing US Favor</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
          </div>
        </div>

        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full z-0" xmlns="http://www.w3.org/2000/svg">
          <path d="M 350 300 Q 600 400 850 350" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" className="connect-line" />
          <path d="M 850 350 Q 1000 600 1100 600" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" className="connect-line" />
          <path d="M 350 300 Q 300 500 400 600" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" className="connect-line" />
        </svg>
      </div>

      {/* HERO TEXT CONTENT */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 text-center flex flex-col items-center mt-[-5vh]">
        
        <div className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/10 shadow-sm">
          <Network className="w-4 h-4 text-black" />
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-black">The Spatial Workbench</span>
        </div>

        <h1 className="font-display text-[64px] md:text-[90px] lg:text-[110px] leading-[0.9] text-[#111] mb-8 tracking-tighter mix-blend-multiply">
          Map the <br />
          <span className="italic text-black/80">unseen.</span>
        </h1>

        <p className="text-xl md:text-2xl text-black/60 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Stop summarizing. Start investigating. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
        </p>

        <Link to="/" className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#111] text-[#FAF9F5] rounded-full font-medium text-lg transition-all hover:scale-105 hover:bg-black hover:shadow-2xl">
          Enter the Workspace
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>

      </div>

    </div>
  );
}