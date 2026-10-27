import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, FileText, Lightbulb, Terminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const [isHoveringBtn, setIsHoveringBtn] = useState(false);
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleBtnMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setBtnPos({ x: x * 0.2, y: y * 0.2 });
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#1A1A1A] font-sans selection:bg-[#D96C39] selection:text-white overflow-hidden relative">
      
      {/* Film Grain */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Interactive Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.6), transparent 40%)`,
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
          backgroundSize: '80px 80px',
        }}
      />

      {/* Brutalist Top Bar */}
      <header className="relative z-20 flex justify-between items-center px-6 md:px-12 py-6 border-b border-[#1A1A1A]/10 bg-[#F5F2EB]/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="text-[#D96C39]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
              <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
              <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
              <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-2xl italic tracking-tight font-medium">Threadwise</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">
          <span>SYS.STATUS: ONLINE</span>
          <span>NODE: 01</span>
          <span>BUILD 2.0.4</span>
        </div>

        <Link to="/" className="group flex items-center gap-2 px-5 py-2 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F5F2EB] transition-colors duration-300 font-mono text-xs uppercase tracking-widest">
          Access Studio
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </header>

      {/* Main Asymmetrical Layout */}
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 min-h-[calc(100vh-100px)]">
        
        {/* LEFT COLUMN: Typography & CTA (Spans 5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-center relative z-30">
          
          <div className="mb-8 inline-flex items-center gap-3 w-fit">
            <span className="h-px w-8 bg-[#D96C39]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#D96C39]">The Spatial Workbench</span>
          </div>

          <h1 className="font-display text-[80px] md:text-[110px] lg:text-[130px] leading-[0.85] text-[#1A1A1A] mb-8 tracking-tighter">
            Map the <br />
            <span className="italic text-[#D96C39] relative">
              unseen.
              <svg className="absolute -bottom-4 left-0 w-full h-4 text-[#D96C39]/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[#1A1A1A]/70 leading-relaxed font-light mb-12 max-w-md">
            Stop summarizing. Start investigating. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
          </p>

          {/* Magnetic Brutalist Button */}
          <Link 
            to="/" 
            ref={btnRef}
            onMouseEnter={() => setIsHoveringBtn(true)}
            onMouseLeave={() => { setIsHoveringBtn(false); setBtnPos({ x: 0, y: 0 }); }}
            onMouseMove={handleBtnMouseMove}
            style={{ transform: `translate(${btnPos.x}px, ${btnPos.y}px)` }}
            className={`group flex items-center justify-center gap-4 w-fit px-10 py-5 bg-[#1A1A1A] text-[#F5F2EB] font-mono text-sm uppercase tracking-widest transition-all duration-300 ease-out hover:bg-[#D96C39] hover:scale-105 ${isHoveringBtn ? 'shadow-2xl shadow-[#D96C39]/20' : ''}`}
          >
            Start your first investigation
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </Link>

          {/* Metadata Footnotes */}
          <div className="mt-20 flex gap-12 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">
            <div>
              <p className="mb-1 text-[#1A1A1A]/80">Framework</p>
              <p>TanStack Start</p>
            </div>
            <div>
              <p className="mb-1 text-[#1A1A1A]/80">Intelligence</p>
              <p>DeepSeek v3</p>
            </div>
            <div>
              <p className="mb-1 text-[#1A1A1A]/80">Security</p>
              <p>Supabase Auth</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: The Interactive Canvas (Spans 7 cols) */}
        <div className="lg:col-span-7 relative h-[600px] lg:h-auto pointer-events-none lg:pointer-events-auto">
          
          {/* SVG Connecting Lines spanning the canvas */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none">
            <path d="M 100 150 Q 300 200 400 400" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <path d="M 400 400 Q 500 600 700 500" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <path d="M 400 400 Q 200 500 150 700" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
          </svg>

          {/* FLOATING NODE 1: Evidence (Teal) */}
          <div className="absolute top-[5%] left-[5%] w-[340px] bg-white border border-[#1A1A1A]/10 shadow-2xl z-20 transition-transform hover:scale-105 duration-500">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1A1A]/5 bg-[#2A6B65]/5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#2A6B65] flex items-center gap-2"><FileText className="w-4 h-4"/> Evidence</span>
              <span className="text-[10px] font-mono text-[#1A1A1A]/40">FACT</span>
            </div>
            <div className="p-6">
              <h4 className="font-display text-2xl leading-tight text-[#1A1A1A] mb-3">El Salvador sends troops</h4>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed mb-4">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
              <div className="pt-4 border-t border-[#1A1A1A]/5 flex justify-between items-center">
                <span className="text-[10px] font-mono bg-[#1A1A1A]/5 px-2 py-1">Miami Herald</span>
                <span className="text-[10px] font-mono text-[#2A6B65]">VERIFIED</span>
              </div>
            </div>
          </div>

          {/* FLOATING NODE 2: Hypothesis (Purple) */}
          <div className="absolute bottom-[10%] right-[5%] w-[300px] bg-white border border-[#1A1A1A]/10 shadow-2xl z-20 transition-transform hover:scale-105 duration-500 delay-100">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1A1A1A]/5 bg-[#5B456B]/5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B456B] flex items-center gap-2"><Lightbulb className="w-4 h-4"/> Hypothesis</span>
            </div>
            <div className="p-6">
              <h4 className="font-display text-2xl leading-tight text-[#1A1A1A] mb-3">Securing US Favor</h4>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
            </div>
          </div>

          {/* FLOATING NODE 3: Question (Orange) */}
          <div className="absolute top-[40%] left-[25%] w-[280px] bg-[#1A1A1A] text-[#F5F2EB] border border-[#1A1A1A] shadow-2xl z-30 transition-transform hover:scale-105 duration-500 delay-200">
             <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D96C39] flex items-center gap-2"><Sparkles className="w-4 h-4"/> Question</span>
              <span className="text-[10px] font-mono text-white/40">UNKNOWN</span>
            </div>
            <div className="p-6">
              <h4 className="font-display text-2xl leading-tight mb-3">What is the real motive?</h4>
              <p className="text-sm text-white/60 leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
            </div>
          </div>

          {/* Aesthetic Terminal Tag */}
          <div className="absolute bottom-[40%] left-[0%] flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/40">
            <Terminal className="w-3 h-3" />
            <span>Discourse Lab // Active</span>
          </div>

        </div>
      </main>
    </div>
  );
}