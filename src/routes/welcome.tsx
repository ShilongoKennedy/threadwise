import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, FileText, Lightbulb, Network, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * -8;
      setTilt({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1A1A1A] font-sans selection:bg-[#D96C39] selection:text-white overflow-hidden relative">
      
      {/* Film Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Interactive Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.8), transparent 40%)`,
        }}
      />

      {/* Hard Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Giant Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-[0.03] select-none">
        <h1 className="font-display text-[40vw] leading-none whitespace-nowrap">Threadwise</h1>
      </div>

      {/* Brutalist Top Bar */}
      <header className="relative z-20 flex justify-between items-center px-6 py-6 w-full border-b border-[#1A1A1A]/10 bg-[#F5F2EB]/80 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="text-[#D96C39]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
              <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
              <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
              <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-2xl italic tracking-tight font-medium group-hover:opacity-70 transition-opacity">Threadwise</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">
          <span>SYS.STATUS: ONLINE</span>
          <span>NODE: 01</span>
          <span>THE SPATIAL WORKBENCH</span>
        </div>

        <Link to="/" className="group flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-[#F5F2EB] hover:bg-[#D96C39] transition-colors duration-300 font-mono text-[11px] uppercase tracking-widest">
          Access Studio
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </header>

      {/* ASYMMETRICAL EDITORIAL HERO */}
      <main className="relative z-10 w-full px-6 pt-12 md:pt-20 pb-20 max-w-[1600px] mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* Left Column: Massive Typography */}
          <div className="lg:col-span-8 flex flex-col relative z-20">
            
            <div className="flex items-center gap-4 mb-8">
              <span className="h-px w-12 bg-[#D96C39]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#D96C39]">Stop summarizing.</span>
            </div>

            <h1 className="font-display text-[90px] md:text-[140px] lg:text-[180px] xl:text-[210px] leading-[0.8] text-[#1A1A1A] tracking-tighter">
              Map the <br />
              <span className="italic text-[#D96C39] relative inline-block pl-12 md:pl-24">
                unseen.
                {/* Decorative underline */}
                <svg className="absolute -bottom-4 left-12 md:left-24 w-[80%] h-4 text-[#D96C39]/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
              </span>
            </h1>
            
            <div className="mt-12 flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40">
              <span>EST. 2026</span>
              <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/20" />
              <span>INTELLIGENCE WORKBENCH</span>
            </div>
          </div>

          {/* Right Column: Subtext & CTA anchored to the right */}
          <div className="lg:col-span-4 flex flex-col justify-end pt-8 lg:pt-32 relative z-20">
            
            {/* Vertical Structural Line */}
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-[#1A1A1A]/10" />

            <p className="text-xl md:text-2xl text-[#1A1A1A]/80 leading-relaxed font-light mb-12">
              Threadwise is a spatial intelligence workbench. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
            </p>

            <Link 
              to="/" 
              className="group flex items-center justify-between w-full px-8 py-6 bg-[#1A1A1A] text-[#F5F2EB] font-mono text-sm uppercase tracking-widest transition-all duration-300 ease-out hover:bg-[#D96C39] hover:scale-[1.02]"
            >
              Start your first investigation
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            
            <div className="mt-6 flex justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/40">
              <span>FRAMEWORK: TANSTACK</span>
              <span>SECURITY: SUPABASE</span>
            </div>
          </div>

        </div>

        {/* THE CINEMATIC 3D DOSSIER - Overlapping the text slightly for depth */}
        <div className="mt-24 lg:-mt-12 w-full max-w-[1300px] mx-auto perspective-[2000px] group relative z-30">
          <div 
            className="w-full bg-[#FAF9F5] border border-[#1A1A1A]/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden transition-transform duration-200 ease-out rounded-xl"
            style={{ 
              transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(1)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Window Toolbar */}
            <div className="h-12 border-b border-[#1A1A1A]/10 bg-[#F5F2EB] flex items-center px-4 gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1A1A1A]/10" />
                <div className="w-3 h-3 rounded-full bg-[#1A1A1A]/10" />
                <div className="w-3 h-3 rounded-full bg-[#1A1A1A]/10" />
              </div>
              <div className="mx-auto flex items-center gap-2 text-[10px] font-mono text-[#1A1A1A]/40 bg-white/50 px-4 py-1.5 rounded border border-[#1A1A1A]/5">
                <Network className="w-3 h-3" /> threadwise.app / workspace / haiti-investigation
              </div>
            </div>

            {/* Window Canvas Area */}
            <div className="relative h-[600px] bg-[#F5F2EB] p-12 overflow-hidden">
              
              {/* Internal Grid */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Animated Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 350 250 Q 550 250 650 450" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.2" />
                <path d="M 650 450 Q 850 600 950 400" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.2" />
              </svg>

              {/* Node 1: Question (Orange) */}
              <div className="absolute top-[15%] left-[10%] w-[320px] bg-[#1A1A1A] text-[#F5F2EB] border border-[#1A1A1A] shadow-2xl z-20 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#D96C39] flex items-center gap-2"><Sparkles className="w-4 h-4"/> Question</span>
                  <span className="text-[10px] font-mono text-white/40">UNKNOWN</span>
                </div>
                <div className="p-6">
                  <h4 className="font-display text-2xl leading-tight mb-2">What is the real motive?</h4>
                  <p className="text-[13px] text-white/60 leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
                </div>
              </div>

              {/* Node 2: Evidence (Teal) */}
              <div className="absolute top-[40%] left-[40%] w-[360px] bg-white border border-[#1A1A1A]/10 shadow-2xl z-10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1A1A]/5 bg-[#2A6B65]/5">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#2A6B65] flex items-center gap-2"><FileText className="w-4 h-4"/> Evidence</span>
                  <span className="text-[10px] font-mono text-[#1A1A1A]/40">FACT</span>
                </div>
                <div className="p-6">
                  <h4 className="font-display text-2xl leading-tight mb-2 text-[#1A1A1A]">El Salvador sends troops</h4>
                  <p className="text-[13px] text-[#1A1A1A]/60 leading-relaxed mb-4">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
                  <div className="pt-4 border-t border-[#1A1A1A]/5 flex justify-between items-center">
                    <span className="text-[10px] font-mono bg-[#1A1A1A]/5 px-2.5 py-1">Miami Herald</span>
                    <span className="text-[10px] font-mono text-[#2A6B65]">VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Node 3: Hypothesis (Purple) */}
              <div className="absolute bottom-[10%] right-[10%] w-[340px] bg-white border border-[#1A1A1A]/10 shadow-2xl z-20 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1A1A]/5 bg-[#5B456B]/5">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#5B456B] flex items-center gap-2"><Lightbulb className="w-4 h-4"/> Hypothesis</span>
                </div>
                <div className="p-6">
                  <h4 className="font-display text-2xl leading-tight mb-2 text-[#1A1A1A]">Securing US Favor</h4>
                  <p className="text-[13px] text-[#1A1A1A]/60 leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
                </div>
              </div>

              {/* Terminal Decoration */}
              <div className="absolute bottom-8 left-12 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[#1A1A1A]/30">
                <Terminal className="w-4 h-4" />
                <span>Discourse Lab // Active</span>
              </div>

            </div>
          </div>
        </div>

      </main>
    </div>
  );
}