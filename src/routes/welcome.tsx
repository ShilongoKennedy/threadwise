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
      
      // Calculate parallax tilt for the 3D window
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * -10;
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
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.7), transparent 40%)`,
        }}
      />

      {/* Hard Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Brutalist Top Bar */}
      <header className="relative z-20 flex justify-between items-center px-8 py-6 w-full max-w-[1400px] mx-auto">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="text-[#D96C39]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
              <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
              <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
              <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-3xl italic tracking-tight font-medium group-hover:opacity-70 transition-opacity">Threadwise</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">
          <span>THE SPATIAL WORKBENCH</span>
        </div>

        <Link to="/" className="group flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-[#F5F2EB] hover:bg-[#D96C39] transition-colors duration-300 font-mono text-xs uppercase tracking-widest">
          Access Studio
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-16 md:pt-24 pb-32 flex flex-col items-center text-center">
        
        {/* Kicker */}
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-12 bg-[#1A1A1A]/20" />
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#1A1A1A]/60">Stop summarizing. Start investigating.</span>
          <span className="h-px w-12 bg-[#1A1A1A]/20" />
        </div>

        {/* Huge Headline */}
        <h1 className="font-display text-[80px] md:text-[120px] lg:text-[150px] leading-[0.85] text-[#1A1A1A] mb-8 tracking-tighter">
          Map the <br />
          <span className="italic text-[#D96C39] relative inline-block">
            unseen.
            <svg className="absolute -bottom-2 left-0 w-full h-4 text-[#D96C39]/30" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[#1A1A1A]/60 leading-relaxed font-light mb-12 max-w-xl mx-auto">
          Threadwise is a spatial intelligence workbench. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
        </p>

        {/* Magnetic CTA */}
        <Link 
          to="/" 
          className="group flex items-center justify-center gap-4 px-10 py-5 bg-[#1A1A1A] text-[#F5F2EB] font-mono text-sm uppercase tracking-widest transition-all duration-300 ease-out hover:bg-[#D96C39] hover:scale-105 hover:shadow-2xl hover:shadow-[#D96C39]/20"
        >
          Start your first investigation
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Link>

        {/* THE CINEMATIC 3D DOSSIER */}
        <div className="mt-24 w-full max-w-[1100px] perspective-[2000px] group">
          <div 
            className="w-full bg-[#FAF9F5] border border-[#1A1A1A]/10 rounded-xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden transition-transform duration-200 ease-out"
            style={{ 
              transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(0.98)`,
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
            <div className="relative h-[550px] bg-[#F5F2EB] p-12 overflow-hidden">
              
              {/* Internal Grid */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
                  `,
                  backgroundSize: '30px 30px',
                }}
              />

              {/* Animated Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 300 200 Q 500 250 600 400" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.2" />
                <path d="M 600 400 Q 800 500 900 350" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.2" />
              </svg>

              {/* Node 1: Question (Orange) */}
              <div className="absolute top-[15%] left-[8%] w-[280px] bg-[#1A1A1A] text-[#F5F2EB] border border-[#1A1A1A] shadow-xl z-20 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#D96C39] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> Question</span>
                  <span className="text-[10px] font-mono text-white/40">UNKNOWN</span>
                </div>
                <div className="p-5">
                  <h4 className="font-display text-xl leading-tight mb-2">What is the real motive?</h4>
                  <p className="text-[13px] text-white/60 leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
                </div>
              </div>

              {/* Node 2: Evidence (Teal) */}
              <div className="absolute top-[35%] left-[35%] w-[320px] bg-white border border-[#1A1A1A]/10 shadow-2xl z-10 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A1A1A]/5 bg-[#2A6B65]/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#2A6B65] flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Evidence</span>
                  <span className="text-[10px] font-mono text-[#1A1A1A]/40">FACT</span>
                </div>
                <div className="p-5">
                  <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">El Salvador sends troops</h4>
                  <p className="text-[13px] text-[#1A1A1A]/60 leading-relaxed mb-4">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
                  <div className="pt-3 border-t border-[#1A1A1A]/5 flex justify-between items-center">
                    <span className="text-[10px] font-mono bg-[#1A1A1A]/5 px-2 py-1">Miami Herald</span>
                    <span className="text-[10px] font-mono text-[#2A6B65]">VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Node 3: Hypothesis (Purple) */}
              <div className="absolute bottom-[15%] right-[10%] w-[300px] bg-white border border-[#1A1A1A]/10 shadow-2xl z-20 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1A1A1A]/5 bg-[#5B456B]/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B456B] flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5"/> Hypothesis</span>
                </div>
                <div className="p-5">
                  <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">Securing US Favor</h4>
                  <p className="text-[13px] text-[#1A1A1A]/60 leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
                </div>
              </div>

              {/* Terminal Decoration */}
              <div className="absolute bottom-6 left-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/30">
                <Terminal className="w-3 h-3" />
                <span>Discourse Lab // Active</span>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Footer Metadata */}
      <footer className="relative z-10 border-t border-[#1A1A1A]/10 py-8 flex justify-center gap-16 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">
        <div className="text-center">
          <p className="mb-1 text-[#1A1A1A]/80">Framework</p>
          <p>TanStack Start</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-[#1A1A1A]/80">Intelligence</p>
          <p>DeepSeek v3</p>
        </div>
        <div className="text-center">
          <p className="mb-1 text-[#1A1A1A]/80">Security</p>
          <p>Supabase Auth</p>
        </div>
      </footer>
    </div>
  );
}