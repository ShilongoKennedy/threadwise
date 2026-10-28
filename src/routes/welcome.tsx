import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowRight, Quote, MapPin, Edit3, Circle, Sparkles, FileText, Lightbulb, Terminal, CheckCircle2, ChevronRight, Activity, Cpu, Network } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

// --- CUSTOM HOOKS FOR INTERACTIVITY ---

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
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return { ref, isVisible };
}

// --- MAIN COMPONENT ---

function WelcomePage() {
  const mouse = useMousePosition();
  const revealSection2 = useScrollReveal();
  const revealSection3 = useScrollReveal();
  const revealSection4 = useScrollReveal();

  // State for the interactive sandbox
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // State for the typing terminal
  const [typedText, setTypedText] = useState("");
  const terminalText = "> Cross-referencing 3 sources...\n> Entity detected: El Salvador, US, Haiti\n> Analysis: Strategic motive found.\n> Hypothesis planted on canvas.";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      setTypedText(terminalText.slice(0, i));
      i++;
      if (i > terminalText.length) clearInterval(typingInterval);
    }, 30);
    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1A1A1A] font-sans selection:bg-[#C24A35] selection:text-white overflow-hidden relative">
      
      {/* Film Grain Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Dynamic Cursor Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,0.6), transparent 40%)`,
        }}
      />

      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* HEADER */}
      <header className="relative z-20 flex justify-between items-center px-6 md:px-12 py-6 border-b border-[#1A1A1A]/10 bg-[#F6F5F2]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#C24A35]">
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
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#C24A35]"/> System Online</span>
            <span className="flex items-center gap-2"><Cpu className="w-3 h-3"/> DeepSeek v3</span>
          </div>
          <Link to="/" className="group flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-[#F6F5F2] hover:bg-[#C24A35] transition-colors duration-300 font-mono text-xs uppercase tracking-widest">
            Open Workspace <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
        
        {/* Left: Typography */}
        <div className="flex flex-col relative z-20">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-10 bg-[#C24A35]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#C24A35] font-medium">For the naturally curious</span>
          </div>

          <h1 className="font-display text-[70px] md:text-[90px] lg:text-[110px] leading-[0.9] tracking-tighter mb-8">
            Threadwise.<br />
            See what <span className="text-[#C24A35] italic relative inline-block">
              connects.
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#C24A35]/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            </span>
          </h1>

          <div className="text-xl md:text-2xl text-[#1A1A1A]/70 leading-relaxed mb-12 space-y-3 font-light">
            <p>Bring your sources, questions and ideas together.</p>
            <p>Find the evidence. Test the explanation.</p>
            <p>Decide what comes next.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Link to="/" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#C24A35] text-white hover:bg-[#A33C2A] transition-all hover:scale-[1.02] shadow-xl shadow-[#C24A35]/20 text-sm font-medium tracking-wide">
              Start your canvas <ArrowUpRight className="w-4 h-4" />
            </Link>
            <a href="#example" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-[#1A1A1A] hover:bg-black/5 transition-colors text-sm font-medium tracking-wide">
              Explore an example <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/40">
            Your thinking. A little more connected.
          </p>
        </div>

        {/* Right: Interactive Parallax Canvas */}
        <div className="relative h-[500px] lg:h-[600px] w-full flex items-center justify-center">
          {/* Decorative Background Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ transform: `translate(${mouse.x * 0.01}px, ${mouse.y * 0.01}px)` }}>
            <path d="M 100 100 Q 300 200 400 400 T 600 500" fill="none" stroke="#C24A35" strokeWidth="2" strokeDasharray="8 8" opacity="0.4" />
            <path d="M 200 500 Q 350 400 500 200 T 700 100" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
          </svg>

          {/* Node 1: Evidence */}
          <div 
            className="absolute top-[10%] left-[5%] w-[280px] bg-white border border-black/10 shadow-2xl p-5 rounded-xl z-20 transition-transform duration-300 hover:scale-105"
            style={{ transform: `translate(${mouse.x * -0.02}px, ${mouse.y * -0.02}px)` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-[#2A6B65] flex items-center gap-1.5 uppercase tracking-widest"><FileText className="w-4 h-4"/> Evidence</span>
              <span className="text-[10px] font-mono text-black/30">FACT</span>
            </div>
            <h4 className="font-display text-xl leading-tight mb-2">Salvadoran troops deploy</h4>
            <p className="text-xs text-black/60 leading-relaxed">Troops land in Haiti aboard a Pentagon plane to search for four missing soldiers.</p>
          </div>

          {/* Node 2: Hypothesis */}
          <div 
            className="absolute bottom-[15%] right-[5%] w-[300px] bg-white border border-black/10 shadow-2xl p-5 rounded-xl z-20 transition-transform duration-300 hover:scale-105"
            style={{ transform: `translate(${mouse.x * 0.03}px, ${mouse.y * 0.03}px)` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-[#5B456B] flex items-center gap-1.5 uppercase tracking-widest"><Lightbulb className="w-4 h-4"/> Hypothesis</span>
              <span className="text-[10px] font-mono text-black/30">UNKNOWN</span>
            </div>
            <h4 className="font-display text-xl leading-tight mb-2">Securing US Favor</h4>
            <p className="text-xs text-black/60 leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
          </div>

          {/* Node 3: The Anchor (Question) */}
          <div 
            className="absolute top-[40%] left-[30%] w-[260px] bg-[#1A1A1A] text-white shadow-2xl p-5 rounded-xl z-30 transition-transform duration-300 hover:scale-105"
            style={{ transform: `translate(${mouse.x * -0.01}px, ${mouse.y * -0.01}px)` }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-mono text-[#C24A35] flex items-center gap-1.5 uppercase tracking-widest"><Sparkles className="w-4 h-4"/> Question</span>
              <span className="text-[10px] font-mono text-white/30">OPEN</span>
            </div>
            <h4 className="font-display text-xl leading-tight mb-2">What is the real motive?</h4>
            <p className="text-xs text-white/50 leading-relaxed">If the deployment is about security, why send special forces instead of humanitarian aid?</p>
          </div>
        </div>
      </main>

      {/* SECTION 2: THE PROBLEM / SCROLL REVEAL */}
      <section 
        ref={revealSection2.ref} 
        className={`relative z-10 py-32 px-6 border-y border-black/5 bg-white transition-all duration-1000 ease-out ${revealSection2.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-8 max-w-3xl mx-auto leading-[1.1]">
            Reading them separately gives you fragments.<br />
            <span className="italic text-[#C24A35]">Connecting them gives you the truth.</span>
          </h2>
          <p className="text-lg text-black/50 max-w-2xl mx-auto leading-relaxed">
            A promise to the public. A speech to investors. A missing timetable. Modern research is drowning in scattered tabs and PDFs. Threadwise forces you to put them on the same table.
          </p>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE SANDBOX */}
      <section 
        ref={revealSection3.ref}
        id="example" 
        className={`relative z-10 py-32 px-6 transition-all duration-1000 delay-200 ease-out ${revealSection3.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#C24A35]" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/60">Interactive Demo</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl tracking-tight">The Canvas.</h2>
            </div>
            <p className="text-sm text-black/50 max-w-sm font-mono leading-relaxed">
              Hover over the nodes to see how a single question can anchor an entire investigation. Every card holds a piece of the puzzle.
            </p>
          </div>

          <div className="relative border border-black/10 bg-white rounded-2xl shadow-2xl shadow-black/5 overflow-hidden h-[600px] flex">
            {/* Left Toolbar Mockup */}
            <div className="w-16 border-r border-black/5 bg-[#FAF9F5] flex flex-col items-center py-6 gap-6 z-20">
              <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center cursor-pointer"><Sparkles className="w-4 h-4"/></div>
              <div className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center cursor-pointer"><FileText className="w-4 h-4 text-black/40"/></div>
              <div className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center cursor-pointer"><Network className="w-4 h-4 text-black/40"/></div>
              <div className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center cursor-pointer mt-auto"><Terminal className="w-4 h-4 text-black/40"/></div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative bg-[#F6F5F2] overflow-hidden bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:20px_20px]">
              
              {/* Dynamic SVG Lines based on activeNode */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 250 200 Q 450 200 600 350" fill="none" stroke={activeNode ? "#C24A35" : "#1A1A1A"} strokeWidth={activeNode ? "2" : "1"} strokeDasharray="6 6" opacity={activeNode ? "0.8" : "0.2"} className="transition-all duration-500" />
                <path d="M 600 350 Q 750 500 900 400" fill="none" stroke={activeNode ? "#C24A35" : "#1A1A1A"} strokeWidth={activeNode ? "2" : "1"} strokeDasharray="6 6" opacity={activeNode ? "0.8" : "0.2"} className="transition-all duration-500" />
              </svg>

              {/* Node A */}
              <div 
                onMouseEnter={() => setActiveNode('A')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute top-[15%] left-[10%] w-[300px] bg-white border ${activeNode === 'A' ? 'border-[#C24A35] shadow-2xl scale-105' : 'border-black/10 shadow-lg scale-100'} rounded-xl p-5 transition-all duration-300 cursor-crosshair z-10`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-[#C24A35] flex items-center gap-1.5 uppercase tracking-widest"><Sparkles className="w-3 h-3"/> Question</span>
                  <span className="text-[10px] font-mono text-black/30">01</span>
                </div>
                <h4 className="font-display text-lg leading-tight mb-2">Did the deadline change?</h4>
                <p className="text-xs text-black/60 leading-relaxed">The 2030 target was mentioned in 2025, but the 2026 report is missing the date entirely.</p>
              </div>

              {/* Node B */}
              <div 
                onMouseEnter={() => setActiveNode('B')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute top-[35%] left-[45%] w-[320px] bg-white border ${activeNode === 'B' ? 'border-[#2A6B65] shadow-2xl scale-105' : 'border-black/10 shadow-lg scale-100'} rounded-xl p-5 transition-all duration-300 cursor-crosshair z-20`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-[#2A6B65] flex items-center gap-1.5 uppercase tracking-widest"><FileText className="w-3 h-3"/> Evidence</span>
                  <span className="text-[10px] font-mono text-black/30">02</span>
                </div>
                <h4 className="font-display text-lg leading-tight mb-2">Harbour energy pledge</h4>
                <p className="text-xs text-black/60 leading-relaxed">"By 2030, our harbour will run on clean energy, and every worker will be part of that future."</p>
                <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono bg-black/5 px-2 py-1 rounded">Transcript</span>
                  <span className="text-[10px] font-mono text-[#2A6B65] flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>
                </div>
              </div>

              {/* Node C */}
              <div 
                onMouseEnter={() => setActiveNode('C')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute bottom-[15%] right-[10%] w-[300px] bg-white border ${activeNode === 'C' ? 'border-[#5B456B] shadow-2xl scale-105' : 'border-black/10 shadow-lg scale-100'} rounded-xl p-5 transition-all duration-300 cursor-crosshair z-10`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-[#5B456B] flex items-center gap-1.5 uppercase tracking-widest"><Lightbulb className="w-3 h-3"/> Hypothesis</span>
                  <span className="text-[10px] font-mono text-black/30">03</span>
                </div>
                <h4 className="font-display text-lg leading-tight mb-2">Workers omitted for investors?</h4>
                <p className="text-xs text-black/60 leading-relaxed">The speech to investors focused entirely on ROI and did not mention the worker pledge.</p>
              </div>

              {/* Floating Hover Prompt */}
              <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-black/30">
                <Activity className="w-3 h-3" /> Interactive Sandbox
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE AI TERMINAL */}
      <section 
        ref={revealSection4.ref}
        className={`relative z-10 py-32 px-6 bg-[#1A1A1A] text-[#F6F5F2] transition-all duration-1000 delay-300 ease-out ${revealSection4.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-5xl md:text-7xl tracking-tight mb-6">
              Your personal<br/>
              <span className="italic text-[#C24A35]">intelligence analyst.</span>
            </h2>
            <p className="text-lg text-white/50 leading-relaxed mb-8 max-w-md">
              Don't just ask an AI to summarize. Give it five different articles and watch it map the political motives, the hidden incentives, and the "dog that didn't bark."
            </p>
            <ul className="space-y-4 font-mono text-xs text-white/70">
              <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-[#C24A35]"/> Multi-source URL ingestion</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-[#C24A35]"/> Entity & Fact extraction</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-[#C24A35]"/> Strategic hypothesis generation</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-4 h-4 text-[#C24A35]"/> One-click canvas dispatch</li>
            </ul>
          </div>
          
          {/* Terminal Window */}
          <div className="bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
            <div className="bg-white/5 border-b border-white/10 h-10 flex items-center px-4 gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <span className="ml-4 text-[10px] font-mono text-white/40">discourse-lab ~ /api/investigate</span>
            </div>
            <div className="p-6 font-mono text-sm text-[#2A6B65] min-h-[250px] whitespace-pre-wrap leading-relaxed">
              {typedText}
              <span className="animate-pulse inline-block w-2 h-4 bg-[#C24A35] align-middle ml-1" />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[#F6F5F2] border-t border-black/10 pt-24 pb-12 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
            <div className="max-w-md">
              <h3 className="font-display text-4xl italic mb-4">threadwise</h3>
              <p className="text-sm text-black/50 leading-relaxed">
                A spatial intelligence workbench for researchers, strategists, and complex thinkers. Built by Kennedy Shilongo.
              </p>
            </div>
            <div className="flex gap-12 font-mono text-[10px] uppercase tracking-widest text-black/40">
              <div className="flex flex-col gap-3">
                <span className="text-black/80 font-bold mb-1">Product</span>
                <Link to="/" className="hover:text-black transition-colors">Workspace</Link>
                <Link to="/welcome" className="hover:text-black transition-colors">Landing</Link>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-black/80 font-bold mb-1">System</span>
                <a href="#" className="hover:text-black transition-colors">TanStack Start</a>
                <a href="#" className="hover:text-black transition-colors">DeepSeek V3</a>
              </div>
            </div>
          </div>
          
          {/* Massive Footer Typographic Watermark */}
          <div className="w-full border-t border-black/10 pt-8 flex justify-between items-center">
            <span className="text-[10px] font-mono text-black/40">© 2026 Threadwise Inc.</span>
            <span className="text-[10px] font-mono text-black/40 uppercase tracking-[0.2em]">See what connects.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}