import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Terminal, CheckCircle2, ChevronRight, Activity, Cpu, 
  Network, Layers, Target, Zap, BookOpen
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

// --- CUSTOM HOOKS ---
function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  return mousePosition;
}

function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);
  return { ref, isVisible };
}

// --- MAIN COMPONENT ---
function WelcomePage() {
  const mouse = useMousePosition();
  const revealSection2 = useScrollReveal();
  const revealSection3 = useScrollReveal();
  const revealSection4 = useScrollReveal();

  const [activeNode, setActiveNode] = useState<string | null>(null);
  
  // Terminal State
  const [typedText, setTypedText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const terminalText = "> INITIATING CROSS-SOURCE INVESTIGATION...\n> SCRAPING 3 ARTICLES...\n> PARSING ENTITIES: EL SALVADOR, US, HAITI.\n> ANALYZING STRATEGIC MOTIVES...\n> EXTRACTION COMPLETE.";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setTypedText(terminalText.slice(0, i));
      i++;
      if (i > terminalText.length) {
        clearInterval(typingInterval);
        setTimeout(() => setShowResults(true), 500);
      }
    }, 25);
    return () => clearInterval(typingInterval);
  }, []);

  // Parallax calculations
  const px = (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5);
  const py = (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative">
      
      {/* CSS Animations for floating nodes */}
      <style>{`
        @keyframes float-slow { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        @keyframes float-medium { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-25px) rotate(-2deg); } }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 10s ease-in-out infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>

      {/* ARTISTIC AMBIENT BACKGROUND (Blurred Orbs) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Yellow Orb */}
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#FDF0B6] opacity-40 blur-[120px]"
          style={{ transform: `translate(${px * 40}px, ${py * 40}px)` }}
        />
        {/* Pink Orb */}
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#FBD0D4] opacity-30 blur-[150px]"
          style={{ transform: `translate(${px * -50}px, ${py * -50}px)` }}
        />
        {/* Blue Orb */}
        <div 
          className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#CBE6F9] opacity-30 blur-[120px]"
          style={{ transform: `translate(${px * 30}px, ${py * -30}px)` }}
        />
      </div>

      {/* Subtle Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* HEADER */}
      <header className="relative z-30 flex justify-between items-center px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D96C39]">
            <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
            <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
            <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="font-display italic text-2xl tracking-tight font-medium">threadwise</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50">
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#D96C39]"/> System Online</span>
            <span className="flex items-center gap-2"><Cpu className="w-3 h-3"/> DeepSeek v3</span>
          </div>
          <Link to="/" className="group flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#D96C39] transition-colors duration-300 font-mono text-xs uppercase tracking-widest shadow-xl rounded-full">
            Open Workspace <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION - CENTERED IMMERSIVE */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-16 pb-32 flex flex-col items-center justify-center min-h-[85vh] text-center">
        
        {/* Floating Artistic Nodes (Behind Text) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          
          {/* Node: Yellow (Idea) */}
          <div 
            className="absolute top-[10%] left-[5%] md:left-[15%] w-[260px] bg-[#FDF0B6] border border-[#1A1A1A]/10 shadow-[0_20px_40px_-12px_rgba(253,240,182,0.5)] rounded-2xl p-5 animate-float-slow z-0 hidden md:block"
            style={{ transform: `translate(${px * -40}px, ${py * -40}px) rotate(-4deg)` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/60 flex items-center gap-1.5 uppercase tracking-widest"><Lightbulb className="w-4 h-4"/> Idea</span>
            </div>
            <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">Niche tools for regulated industries</h4>
            <p className="text-xs text-[#1A1A1A]/60 leading-relaxed">Compliance is hard and risky, so few competitors build here.</p>
          </div>

          {/* Node: Pink (Question) */}
          <div 
            className="absolute bottom-[20%] left-[8%] md:left-[20%] w-[280px] bg-[#FBD0D4] border border-[#1A1A1A]/10 shadow-[0_20px_40px_-12px_rgba(251,208,212,0.5)] rounded-2xl p-5 animate-float-medium z-0 hidden md:block"
            style={{ transform: `translate(${px * -30}px, ${py * -30}px) rotate(3deg)` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/60 flex items-center gap-1.5 uppercase tracking-widest"><Sparkles className="w-4 h-4"/> Question</span>
            </div>
            <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">Will small firms pay for compliance help?</h4>
          </div>

          {/* Node: Green (Evidence) */}
          <div 
            className="absolute top-[15%] right-[5%] md:right-[15%] w-[300px] bg-[#C9E8C7] border border-[#1A1A1A]/10 shadow-[0_20px_40px_-12px_rgba(201,232,199,0.5)] rounded-2xl p-5 animate-float-medium z-0 hidden md:block"
            style={{ transform: `translate(${px * 40}px, ${py * 40}px) rotate(5deg)` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/60 flex items-center gap-1.5 uppercase tracking-widest"><FileText className="w-4 h-4"/> Evidence</span>
            </div>
            <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">EU AI Act introduces new hurdles</h4>
            <p className="text-xs text-[#1A1A1A]/60 leading-relaxed">New regulations mean every startup needs a compliance audit before launch.</p>
          </div>

          {/* Node: Purple (Hypothesis) */}
          <div 
            className="absolute bottom-[15%] right-[10%] md:right-[20%] w-[280px] bg-[#E8DAFB] border border-[#1A1A1A]/10 shadow-[0_20px_40px_-12px_rgba(232,218,251,0.5)] rounded-2xl p-5 animate-float-slow z-0 hidden md:block"
            style={{ transform: `translate(${px * 30}px, ${py * 30}px) rotate(-3deg)` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono font-bold text-[#1A1A1A]/60 flex items-center gap-1.5 uppercase tracking-widest"><Network className="w-4 h-4"/> Hypothesis</span>
            </div>
            <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">B2B compliance is the wedge</h4>
          </div>
        </div>

        {/* Central Typography (Foreground) */}
        <div className="relative z-20 flex flex-col items-center mt-12 bg-white/40 backdrop-blur-sm p-10 rounded-3xl border border-white/50 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-[#D96C39]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#D96C39] font-bold">For the naturally curious</span>
            <span className="h-px w-8 bg-[#D96C39]" />
          </div>

          <h1 className="font-display text-[70px] md:text-[90px] lg:text-[110px] leading-[0.9] tracking-tighter mb-8 text-[#1A1A1A]">
            Threadwise.<br />
            <span className="italic text-[#D96C39]">See what connects.</span>
          </h1>

          <p className="text-xl md:text-2xl text-[#1A1A1A]/60 leading-relaxed mb-10 max-w-2xl font-light">
            Bring your sources, questions and ideas together. Find the evidence. Test the explanation. Decide what comes next.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#1A1A1A] text-white hover:bg-[#D96C39] transition-all hover:scale-105 shadow-xl shadow-black/10 text-sm font-bold tracking-wide rounded-full">
              Start your canvas <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a href="#example" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/80 border border-[#1A1A1A]/10 text-[#1A1A1A] hover:bg-white transition-colors text-sm font-bold tracking-wide rounded-full shadow-sm">
              Explore an example <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>

      {/* SECTION 2: CHAOS VS ORDER */}
      <section 
        ref={revealSection2.ref} 
        className={`relative z-10 py-32 px-6 bg-white border-y border-[#1A1A1A]/10 transition-all duration-1000 ease-out ${revealSection2.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1200px] mx-auto text-center mb-20">
          <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-8 max-w-3xl mx-auto leading-[1.1] text-[#1A1A1A]">
            Reading them separately gives you fragments.<br />
            <span className="italic text-[#D96C39]">Connecting them gives you the truth.</span>
          </h2>
        </div>

        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Chaos Side */}
          <div className="relative h-[400px] rounded-3xl bg-[#FDFBF7] p-8 overflow-hidden flex flex-col items-center justify-center shadow-inner border border-black/5">
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
              <div className="w-[90%] h-16 bg-white border border-black/10 rounded-xl shadow-md flex items-center px-4 text-xs font-mono text-black/50 transform -rotate-12 mb-[-20px]"><Layers className="w-4 h-4 mr-2"/> A promise to the coast.pdf</div>
              <div className="w-[95%] h-16 bg-white border border-black/10 rounded-xl shadow-lg flex items-center px-4 text-xs font-mono text-black/60 transform rotate-6 mb-[-20px] z-10"><Terminal className="w-4 h-4 mr-2 text-[#D96C39]"/> Investor Call Transcript.docx</div>
              <div className="w-[85%] h-16 bg-white border border-black/10 rounded-xl shadow-sm flex items-center px-4 text-xs font-mono text-black/40 transform -rotate-3"><FileText className="w-4 h-4 mr-2"/> Local News Article.html</div>
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-widest text-black/40 flex items-center justify-center gap-2">
              <Layers className="w-4 h-4" /> Scattered Sources
            </div>
          </div>

          {/* Order Side */}
          <div className="relative h-[400px] rounded-3xl bg-[#FDFBF7] p-6 overflow-hidden border border-[#1A1A1A]/10 shadow-lg">
             <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
             <div className="relative z-10 w-full h-full flex items-center justify-center">
                {/* Glowing Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_12px_rgba(201,232,199,0.5)]">
                   <path d="M 150 150 L 300 80 L 450 150" fill="none" stroke="#6B4C7A" strokeWidth="3" strokeDasharray="6 6" opacity="0.6" />
                   <path d="M 300 80 L 350 280" fill="none" stroke="#D96C39" strokeWidth="3" strokeDasharray="6 6" opacity="0.6"/>
                </svg>
                
                <div className="absolute top-[15%] left-[15%] w-32 h-20 bg-[#C9E8C7] border border-black/5 rounded-xl shadow-xl flex items-center justify-center text-[10px] font-mono font-bold text-[#1A1A1A]/70 uppercase tracking-widest z-20">Evidence</div>
                <div className="absolute top-[40%] left-[45%] w-36 h-24 bg-[#FBD0D4] border border-black/5 rounded-xl shadow-2xl flex items-center justify-center text-[10px] font-mono font-bold text-[#1A1A1A]/70 uppercase tracking-widest z-30">Question</div>
                <div className="absolute bottom-[15%] right-[15%] w-32 h-20 bg-[#E8DAFB] border border-black/5 rounded-xl shadow-xl flex items-center justify-center text-[10px] font-mono font-bold text-[#1A1A1A]/70 uppercase tracking-widest z-20">Hypothesis</div>
             </div>
             <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 flex items-center justify-center gap-2">
                <Network className="w-4 h-4" /> Connected Canvas
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE SANDBOX */}
      <section 
        ref={revealSection3.ref}
        id="example" 
        className={`relative z-10 py-32 px-6 transition-all duration-1000 delay-200 ease-out bg-[#FDFBF7] border-b border-[#1A1A1A]/10 ${revealSection3.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#D96C39]" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/60">Interactive Demo</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl tracking-tight text-[#1A1A1A]">The Canvas.</h2>
            </div>
            <p className="text-sm text-[#1A1A1A]/60 max-w-sm font-mono leading-relaxed">
              Hover over the nodes to see how a single question can anchor an entire investigation. Every card holds a piece of the puzzle.
            </p>
          </div>

          <div className="relative border border-[#1A1A1A]/10 bg-white rounded-3xl shadow-2xl shadow-black/5 overflow-hidden h-[600px] flex">
            {/* Left Toolbar Mockup */}
            <div className="w-16 border-r border-[#1A1A1A]/5 bg-[#FDFBF7] flex flex-col items-center py-6 gap-6 z-20">
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center cursor-pointer shadow-lg"><Sparkles className="w-5 h-5"/></div>
              <div className="w-10 h-10 rounded-xl hover:bg-black/5 flex items-center justify-center cursor-pointer"><FileText className="w-5 h-5 text-[#1A1A1A]/40"/></div>
              <div className="w-10 h-10 rounded-xl hover:bg-black/5 flex items-center justify-center cursor-pointer"><Network className="w-5 h-5 text-[#1A1A1A]/40"/></div>
              <div className="w-10 h-10 rounded-xl hover:bg-black/5 flex items-center justify-center cursor-pointer mt-auto"><Terminal className="w-5 h-5 text-[#1A1A1A]/40"/></div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative bg-[#FDFBF7] overflow-hidden bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:24px_24px]">
              
              {/* Scanning Line Effect */}
              {activeNode && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-1 bg-[#D96C39]/30 shadow-[0_0_20px_#D96C39] animate-scan" />
                </div>
              )}

              {/* Dynamic SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 250 200 Q 450 200 600 350" fill="none" stroke={activeNode ? "#D96C39" : "#A6917A"} strokeWidth={activeNode ? "2" : "1"} strokeDasharray="6 6" opacity={activeNode ? "1" : "0.2"} className="transition-all duration-500" />
                <path d="M 600 350 Q 750 500 900 400" fill="none" stroke={activeNode ? "#D96C39" : "#A6917A"} strokeWidth={activeNode ? "2" : "1"} strokeDasharray="6 6" opacity={activeNode ? "1" : "0.2"} className="transition-all duration-500" />
              </svg>

              {/* Node A - Pink */}
              <div 
                onMouseEnter={() => setActiveNode('A')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute top-[15%] left-[10%] w-[300px] bg-[#FBD0D4] border ${activeNode === 'A' ? 'border-[#D96C39] shadow-[0_0_40px_rgba(217,119,54,0.15)] scale-105' : 'border-black/5 shadow-xl scale-100'} rounded-2xl p-5 transition-all duration-300 cursor-crosshair z-10`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono font-bold text-[#1A1A1A]/70 flex items-center gap-1.5 uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5"/> Question</span>
                </div>
                <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">Did the deadline change?</h4>
                <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">The 2030 target was mentioned in 2025, but the 2026 report is missing the date entirely.</p>
              </div>

              {/* Node B - Green */}
              <div 
                onMouseEnter={() => setActiveNode('B')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute top-[35%] left-[45%] w-[320px] bg-[#C9E8C7] border ${activeNode === 'B' ? 'border-[#D96C39] shadow-[0_0_40px_rgba(217,119,54,0.15)] scale-105' : 'border-black/5 shadow-xl scale-100'} rounded-2xl p-5 transition-all duration-300 cursor-crosshair z-20`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono font-bold text-[#1A1A1A]/70 flex items-center gap-1.5 uppercase tracking-widest"><FileText className="w-3.5 h-3.5"/> Evidence</span>
                </div>
                <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">Harbour energy pledge</h4>
                <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">"By 2030, our harbour will run on clean energy, and every worker will be part of that future."</p>
              </div>

              {/* Node C - Purple */}
              <div 
                onMouseEnter={() => setActiveNode('C')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute bottom-[15%] right-[10%] w-[300px] bg-[#E8DAFB] border ${activeNode === 'C' ? 'border-[#D96C39] shadow-[0_0_40px_rgba(217,119,54,0.15)] scale-105' : 'border-black/5 shadow-xl scale-100'} rounded-2xl p-5 transition-all duration-300 cursor-crosshair z-10`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono font-bold text-[#1A1A1A]/70 flex items-center gap-1.5 uppercase tracking-widest"><Lightbulb className="w-3.5 h-3.5"/> Hypothesis</span>
                </div>
                <h4 className="font-display text-xl leading-tight mb-2 text-[#1A1A1A]">Workers omitted for investors?</h4>
                <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">The speech to investors focused entirely on ROI and did not mention the worker pledge.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE AI TERMINAL */}
      <section 
        ref={revealSection4.ref}
        className={`relative z-10 py-32 px-6 bg-[#1A1A1A] text-[#FDFBF7] transition-all duration-1000 delay-300 ease-out ${revealSection4.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-5xl md:text-7xl tracking-tight mb-6 text-white">
              Your personal<br/>
              <span className="italic text-[#FBD0D4]">intelligence analyst.</span>
            </h2>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-md">
              Don't just ask an AI to summarize. Give it five different articles and watch it map the political motives, the hidden incentives, and the "dog that didn't bark."
            </p>
            <ul className="space-y-4 font-mono text-sm text-white/70">
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#C9E8C7]"/> Multi-source URL ingestion</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#C9E8C7]"/> Entity & Fact extraction</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#C9E8C7]"/> Strategic hypothesis generation</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#C9E8C7]"/> One-click canvas dispatch</li>
            </ul>
          </div>
          
          {/* Terminal Window */}
          <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
            <div className="bg-white/5 border-b border-white/10 h-12 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FBD0D4]" />
              <div className="w-3 h-3 rounded-full bg-[#FDF0B6]" />
              <div className="w-3 h-3 rounded-full bg-[#C9E8C7]" />
              <span className="ml-4 text-[10px] font-mono text-white/40 tracking-widest uppercase">discourse-lab ~ /api/investigate</span>
            </div>
            
            <div className="p-6 font-mono text-sm text-[#C9E8C7] min-h-[250px] whitespace-pre-wrap leading-relaxed">
              {typedText}
              {!showResults && <span className="animate-pulse inline-block w-2.5 h-5 bg-[#FBD0D4] align-middle ml-1" />}
            </div>

            {/* AI Results Preview */}
            {showResults && (
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="border border-white/10 bg-white/5 p-5 rounded-xl relative overflow-hidden group cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#E8DAFB]" />
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-mono text-[#E8DAFB] uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4"/> Hypothesis Found</span>
                      <span className="text-[10px] font-mono text-white/50 flex items-center gap-1 group-hover:text-white transition-colors uppercase tracking-wider">Plant on Canvas <ArrowRight className="w-3 h-3"/></span>
                    </div>
                    <p className="text-sm text-white/90 font-sans leading-relaxed">El Salvador is deploying troops to secure US diplomatic favor, using the rescue mission as a justification.</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[#FDFBF7] border-t border-[#1A1A1A]/10 pt-24 pb-12 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
            <div className="max-w-md">
              <h3 className="font-display text-5xl italic mb-6 text-[#1A1A1A]">threadwise</h3>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed">
                A spatial intelligence workbench for researchers, strategists, and complex thinkers. Built by Kennedy Shilongo.
              </p>
            </div>
            <div className="flex gap-16 font-mono text-[11px] uppercase tracking-widest text-[#1A1A1A]/50">
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Product</span>
                <Link to="/" className="hover:text-[#D96C39] transition-colors">Workspace</Link>
                <Link to="/welcome" className="hover:text-[#D96C39] transition-colors">Landing</Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">System</span>
                <a href="#" className="hover:text-[#C9E8C7] transition-colors">TanStack Start</a>
                <a href="#" className="hover:text-[#C9E8C7] transition-colors">DeepSeek V3</a>
              </div>
            </div>
          </div>
          
          {/* Massive Footer Typographic Watermark */}
          <div className="w-full border-t border-[#1A1A1A]/10 pt-8 flex justify-between items-center">
            <span className="text-[10px] font-mono text-[#1A1A1A]/40">© 2026 Threadwise Inc.</span>
            <span className="text-[10px] font-mono text-[#1A1A1A]/40 uppercase tracking-[0.2em] flex items-center gap-2"><Activity className="w-3 h-3"/> See what connects.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}