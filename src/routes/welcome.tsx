import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Terminal, CheckCircle2, ChevronRight, Activity, Cpu, Network, 
  MousePointer2, Layers, Target, Shield, Zap, Quote
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

// --- CUSTOM HOOKS ---
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const updateScroll = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((currentScroll / scrollHeight) * 100);
    };
    window.addEventListener("scroll", updateScroll);
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);
  return progress;
}

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
  const scrollProgress = useScrollProgress();
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

  // 3D Tilt calculations
  const tiltX = (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 12;
  const tiltY = (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * -12;

  return (
    <div className="min-h-screen bg-[#FCF8ED] text-[#2C2A28] font-sans selection:bg-[#D97736] selection:text-white overflow-hidden relative">
      
      {/* Paper Grain & Vignette Overlays */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.05] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(252,248,237,0.8)_100%)]" />

      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-[#2D6A65] via-[#D97736] to-[#6B4C7A] z-50 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(217,119,54,0.5)]"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Dynamic Cursor Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,0.4), transparent 50%)`,
        }}
      />

      {/* Canvas Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #A6917A 1px, transparent 1px),
            linear-gradient(to bottom, #A6917A 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* HEADER */}
      <header className="relative z-30 flex justify-between items-center px-6 md:px-12 py-6 border-b border-[#2C2A28]/10">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#D97736]">
            <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
            <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
            <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="font-display italic text-2xl tracking-tight font-medium text-[#2C2A28]">threadwise</span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#2C2A28]/60">
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#2D6A65]"/> System Online</span>
            <span className="flex items-center gap-2"><Cpu className="w-3 h-3"/> DeepSeek v3</span>
          </div>
          <Link to="/" className="group flex items-center gap-2 px-6 py-2.5 bg-[#2C2A28] text-[#FCF8ED] hover:bg-[#D97736] transition-colors duration-300 font-mono text-xs uppercase tracking-widest shadow-xl shadow-[#2C2A28]/10">
            Open Workspace <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 w-full max-w-[1500px] mx-auto px-6 pt-24 pb-32 flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Massive Background Typography */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-80 mix-blend-multiply">
          <h1 className="font-display text-[15vw] leading-[0.8] tracking-tighter text-[#2C2A28] text-center">
            Map the<br/>
            <span className="italic text-[#D97736]">unseen.</span>
          </h1>
        </div>

        {/* Floating Canvas Nodes (Foreground) */}
        <div className="relative w-full h-[600px] z-20 perspective-[1500px]">
          
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <path d="M 20% 30% Q 40% 40% 60% 60%" fill="none" stroke="#2D6A65" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
            <path d="M 80% 20% Q 70% 50% 60% 60%" fill="none" stroke="#6B4C7A" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
          </svg>

          {/* Node 1: Evidence (Teal) */}
          <div 
            className="absolute top-[10%] left-[5%] md:left-[10%] w-[300px] bg-white border border-[#2D6A65]/20 shadow-[0_20px_50px_-12px_rgba(45,106,101,0.3)] rounded-xl overflow-hidden transition-transform duration-100 ease-out z-20"
            style={{ transform: `translate(${mouse.x * -0.03}px, ${mouse.y * -0.03}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#2D6A65] rounded-full shadow-lg border-2 border-white z-30" />
            <div className="flex justify-between items-center px-5 py-3 bg-[#E5F0EF] border-b border-[#2D6A65]/10">
              <span className="text-[11px] font-mono font-bold text-[#2D6A65] flex items-center gap-1.5 uppercase tracking-widest"><FileText className="w-4 h-4"/> Evidence</span>
              <span className="text-[10px] font-mono text-[#2D6A65]/60">FACT</span>
            </div>
            <div className="p-5">
              <h4 className="font-display text-xl leading-tight mb-2 text-[#2C2A28]">El Salvador sends troops</h4>
              <p className="text-sm text-[#2C2A28]/70 leading-relaxed mb-4">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
              <div className="pt-3 border-t border-black/5 flex justify-between items-center">
                <span className="text-[10px] font-mono bg-[#2D6A65]/5 text-[#2D6A65] px-2 py-1 rounded">Miami Herald</span>
                <span className="text-[10px] font-mono text-[#2D6A65] flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>
              </div>
            </div>
          </div>

          {/* Node 2: Hypothesis (Purple) */}
          <div 
            className="absolute top-[15%] right-[5%] md:right-[10%] w-[320px] bg-white border border-[#6B4C7A]/20 shadow-[0_20px_50px_-12px_rgba(107,76,122,0.3)] rounded-xl overflow-hidden transition-transform duration-100 ease-out z-20"
            style={{ transform: `translate(${mouse.x * 0.02}px, ${mouse.y * 0.02}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#6B4C7A] rounded-full shadow-lg border-2 border-white z-30" />
            <div className="flex justify-between items-center px-5 py-3 bg-[#F2EAF5] border-b border-[#6B4C7A]/10">
              <span className="text-[11px] font-mono font-bold text-[#6B4C7A] flex items-center gap-1.5 uppercase tracking-widest"><Lightbulb className="w-4 h-4"/> Hypothesis</span>
              <span className="text-[10px] font-mono text-[#6B4C7A]/60">UNKNOWN</span>
            </div>
            <div className="p-5">
              <h4 className="font-display text-xl leading-tight mb-2 text-[#2C2A28]">Securing US Favor</h4>
              <p className="text-sm text-[#2C2A28]/70 leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
            </div>
          </div>

          {/* Node 3: Question (Orange) */}
          <div 
            className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[340px] bg-[#2C2A28] text-white shadow-[0_20px_50px_-12px_rgba(44,42,40,0.5)] rounded-xl overflow-hidden transition-transform duration-100 ease-out z-30"
            style={{ transform: `translate(calc(-50% + ${mouse.x * -0.01}px), calc(0% + ${mouse.y * -0.01}px)) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#D97736] rounded-full shadow-lg border-2 border-[#2C2A28] z-30" />
            <div className="flex justify-between items-center px-5 py-3 bg-[#D97736]/10 border-b border-[#D97736]/20">
              <span className="text-[11px] font-mono font-bold text-[#D97736] flex items-center gap-1.5 uppercase tracking-widest"><Sparkles className="w-4 h-4"/> Question</span>
              <span className="text-[10px] font-mono text-white/40">OPEN</span>
            </div>
            <div className="p-6">
              <h4 className="font-display text-2xl leading-tight mb-3">What is the real motive?</h4>
              <p className="text-sm text-white/60 leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
            </div>
          </div>
        </div>

        {/* CTA Floating at the bottom of the Hero */}
        <div className="relative z-40 mt-[-50px] flex flex-col sm:flex-row items-center gap-6">
            <Link to="/" className="flex items-center gap-3 px-8 py-4 bg-[#D97736] text-white hover:bg-[#C2662A] transition-all hover:scale-105 shadow-xl shadow-[#D97736]/30 rounded-full font-medium tracking-wide">
              Start your investigation <ArrowUpRight className="w-5 h-5" />
            </Link>
            <a href="#example" className="flex items-center gap-3 px-8 py-4 bg-white text-[#2C2A28] hover:bg-black/5 transition-colors shadow-lg rounded-full font-medium tracking-wide border border-black/5">
              Explore an example <ArrowRight className="w-5 h-5" />
            </a>
        </div>
      </main>

      {/* INFINITE TICKER */}
      <div className="relative z-30 w-full overflow-hidden border-y border-[#2C2A28]/10 bg-white/40 py-5 backdrop-blur-md">
        <div className="flex whitespace-nowrap animate-marquee w-max">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 px-6 font-mono text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/60">
              <span>Geopolitics</span> <span className="text-[#D97736]">•</span>
              <span>Forensic Accounting</span> <span className="text-[#2D6A65]">•</span>
              <span>Corporate Strategy</span> <span className="text-[#6B4C7A]">•</span>
              <span>Sociology</span> <span className="text-[#D97736]">•</span>
              <span>Intelligence Analysis</span> <span className="text-[#2D6A65]">•</span>
              <span>Investigative Reporting</span> <span className="text-[#6B4C7A]">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CHAOS VS ORDER */}
      <section 
        ref={revealSection2.ref} 
        className={`relative z-10 py-32 px-6 bg-white/50 border-b border-[#2C2A28]/10 transition-all duration-1000 ease-out ${revealSection2.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1200px] mx-auto text-center mb-20">
          <h2 className="font-display text-4xl md:text-6xl tracking-tight mb-8 max-w-3xl mx-auto leading-[1.1] text-[#2C2A28]">
            Reading them separately gives you fragments.<br />
            <span className="italic text-[#D97736]">Connecting them gives you the truth.</span>
          </h2>
        </div>

        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Chaos Side */}
          <div className="relative h-[400px] rounded-2xl bg-[#F2ECE1] p-8 overflow-hidden flex flex-col items-center justify-center shadow-inner border border-black/5">
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
              <div className="w-[90%] h-16 bg-white border border-black/10 rounded shadow-md flex items-center px-4 text-xs text-black/50 transform -rotate-12 mb-[-20px]"><Layers className="w-4 h-4 mr-2"/> A promise to the coast.pdf</div>
              <div className="w-[95%] h-16 bg-white border border-black/10 rounded shadow-lg flex items-center px-4 text-xs text-black/60 transform rotate-6 mb-[-20px] z-10"><Terminal className="w-4 h-4 mr-2 text-[#D97736]"/> Investor Call Transcript.docx</div>
              <div className="w-[85%] h-16 bg-white border border-black/10 rounded shadow-sm flex items-center px-4 text-xs text-black/40 transform -rotate-3"><FileText className="w-4 h-4 mr-2"/> Local News Article.html</div>
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-widest text-black/40 flex items-center justify-center gap-2">
              <Layers className="w-4 h-4" /> Scattered Sources
            </div>
          </div>

          {/* Order Side */}
          <div className="relative h-[400px] rounded-2xl bg-[#FCF8ED] p-6 overflow-hidden border border-[#2C2A28]/10 shadow-lg">
             <div className="absolute inset-0 bg-[radial-gradient(#d4c8b8_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
             <div className="relative z-10 w-full h-full flex items-center justify-center">
                {/* Glowing Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_12px_rgba(45,106,101,0.3)]">
                   <path d="M 150 150 L 300 80 L 450 150" fill="none" stroke="#2D6A65" strokeWidth="3" strokeDasharray="6 6" />
                   <path d="M 300 80 L 350 280" fill="none" stroke="#D97736" strokeWidth="3" strokeDasharray="6 6" opacity="0.6"/>
                </svg>
                
                <div className="absolute top-[15%] left-[15%] w-32 h-20 bg-white border border-[#2D6A65] rounded-lg shadow-xl flex items-center justify-center text-[10px] font-mono text-[#2D6A65] uppercase tracking-widest z-20">Evidence</div>
                <div className="absolute top-[40%] left-[45%] w-36 h-24 bg-[#2C2A28] border border-[#2C2A28] rounded-lg shadow-2xl flex items-center justify-center text-[10px] font-mono text-[#D97736] uppercase tracking-widest z-30">Question</div>
                <div className="absolute bottom-[15%] right-[15%] w-32 h-20 bg-white border border-[#6B4C7A] rounded-lg shadow-xl flex items-center justify-center text-[10px] font-mono text-[#6B4C7A] uppercase tracking-widest z-20">Hypothesis</div>
             </div>
             <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-widest text-[#2D6A65] flex items-center justify-center gap-2">
                <Network className="w-4 h-4" /> Connected Canvas
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE SANDBOX */}
      <section 
        ref={revealSection3.ref}
        id="example" 
        className={`relative z-10 py-32 px-6 transition-all duration-1000 delay-200 ease-out bg-[#FCF8ED] border-b border-[#2C2A28]/10 ${revealSection3.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1300px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#D97736]" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#2C2A28]/60">Interactive Demo</span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl tracking-tight text-[#2C2A28]">The Canvas.</h2>
            </div>
            <p className="text-sm text-[#2C2A28]/60 max-w-sm font-mono leading-relaxed">
              Hover over the nodes to see how a single question can anchor an entire investigation. Every card holds a piece of the puzzle.
            </p>
          </div>

          <div className="relative border border-[#2C2A28]/10 bg-[#F6F2EA] rounded-2xl shadow-2xl shadow-[#2C2A28]/10 overflow-hidden h-[600px] flex">
            {/* Left Toolbar Mockup */}
            <div className="w-16 border-r border-[#2C2A28]/10 bg-[#FCF8ED] flex flex-col items-center py-6 gap-6 z-20">
              <div className="w-10 h-10 rounded-xl bg-[#2C2A28] text-[#FCF8ED] flex items-center justify-center cursor-pointer shadow-lg"><Sparkles className="w-5 h-5"/></div>
              <div className="w-10 h-10 rounded-xl hover:bg-black/5 flex items-center justify-center cursor-pointer"><FileText className="w-5 h-5 text-[#2C2A28]/40"/></div>
              <div className="w-10 h-10 rounded-xl hover:bg-black/5 flex items-center justify-center cursor-pointer"><Network className="w-5 h-5 text-[#2C2A28]/40"/></div>
              <div className="w-10 h-10 rounded-xl hover:bg-black/5 flex items-center justify-center cursor-pointer mt-auto"><Terminal className="w-5 h-5 text-[#2C2A28]/40"/></div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative bg-[#FCF8ED] overflow-hidden bg-[radial-gradient(#d4c8b8_1px,transparent_1px)] [background-size:24px_24px]">
              
              {/* Simulated Custom Cursor */}
              <div 
                className="absolute z-50 pointer-events-none transition-transform duration-100 ease-out"
                style={{ left: `${mouse.x * 0.4}px`, top: `${mouse.y * 0.4}px` }}
              >
                 <MousePointer2 className="w-6 h-6 text-[#2C2A28] fill-white drop-shadow-md" />
              </div>

              {/* Scanning Line Effect */}
              {activeNode && (
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <div className="w-full h-1 bg-[#D97736]/40 shadow-[0_0_20px_#D97736] animate-scan" />
                </div>
              )}

              {/* Dynamic SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 250 200 Q 450 200 600 350" fill="none" stroke={activeNode ? "#D97736" : "#A6917A"} strokeWidth={activeNode ? "2" : "1"} strokeDasharray="6 6" opacity={activeNode ? "1" : "0.3"} className="transition-all duration-500" />
                <path d="M 600 350 Q 750 500 900 400" fill="none" stroke={activeNode ? "#D97736" : "#A6917A"} strokeWidth={activeNode ? "2" : "1"} strokeDasharray="6 6" opacity={activeNode ? "1" : "0.3"} className="transition-all duration-500" />
              </svg>

              {/* Node A */}
              <div 
                onMouseEnter={() => setActiveNode('A')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute top-[15%] left-[10%] w-[300px] bg-white border ${activeNode === 'A' ? 'border-[#D97736] shadow-[0_0_40px_rgba(217,119,54,0.2)] scale-105' : 'border-black/10 shadow-xl scale-100'} rounded-xl p-5 transition-all duration-300 cursor-crosshair z-10`}
              >
                {activeNode === 'A' && (
                  <>
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#D97736]" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#D97736]" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#D97736]" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#D97736]" />
                  </>
                )}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono font-bold text-[#6B4C7A] flex items-center gap-1.5 uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5"/> Question</span>
                  <span className="text-[10px] font-mono text-[#2C2A28]/40">01</span>
                </div>
                <h4 className="font-display text-xl leading-tight mb-2 text-[#2C2A28]">Did the deadline change?</h4>
                <p className="text-sm text-[#2C2A28]/70 leading-relaxed">The 2030 target was mentioned in 2025, but the 2026 report is missing the date entirely.</p>
              </div>

              {/* Node B */}
              <div 
                onMouseEnter={() => setActiveNode('B')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute top-[35%] left-[45%] w-[320px] bg-white border ${activeNode === 'B' ? 'border-[#2D6A65] shadow-[0_0_40px_rgba(45,106,101,0.2)] scale-105' : 'border-black/10 shadow-xl scale-100'} rounded-xl p-5 transition-all duration-300 cursor-crosshair z-20`}
              >
                {activeNode === 'B' && (
                  <>
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#2D6A65]" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#2D6A65]" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#2D6A65]" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#2D6A65]" />
                  </>
                )}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono font-bold text-[#2D6A65] flex items-center gap-1.5 uppercase tracking-widest"><FileText className="w-3.5 h-3.5"/> Evidence</span>
                  <span className="text-[10px] font-mono text-[#2C2A28]/40">02</span>
                </div>
                <h4 className="font-display text-xl leading-tight mb-2 text-[#2C2A28]">Harbour energy pledge</h4>
                <p className="text-sm text-[#2C2A28]/70 leading-relaxed">"By 2030, our harbour will run on clean energy, and every worker will be part of that future."</p>
                <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono bg-[#2D6A65]/10 text-[#2D6A65] px-2 py-1 rounded">Transcript</span>
                  <span className="text-[10px] font-mono text-[#2D6A65] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Verified</span>
                </div>
              </div>

              {/* Node C */}
              <div 
                onMouseEnter={() => setActiveNode('C')}
                onMouseLeave={() => setActiveNode(null)}
                className={`absolute bottom-[15%] right-[10%] w-[300px] bg-white border ${activeNode === 'C' ? 'border-[#6B4C7A] shadow-[0_0_40px_rgba(107,76,122,0.2)] scale-105' : 'border-black/10 shadow-xl scale-100'} rounded-xl p-5 transition-all duration-300 cursor-crosshair z-10`}
              >
                {activeNode === 'C' && (
                  <>
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#6B4C7A]" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#6B4C7A]" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#6B4C7A]" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#6B4C7A]" />
                  </>
                )}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono font-bold text-[#6B4C7A] flex items-center gap-1.5 uppercase tracking-widest"><Lightbulb className="w-3.5 h-3.5"/> Hypothesis</span>
                  <span className="text-[10px] font-mono text-[#2C2A28]/40">03</span>
                </div>
                <h4 className="font-display text-xl leading-tight mb-2 text-[#2C2A28]">Workers omitted for investors?</h4>
                <p className="text-sm text-[#2C2A28]/70 leading-relaxed">The speech to investors focused entirely on ROI and did not mention the worker pledge.</p>
              </div>

              {/* Floating Hover Prompt */}
              <div className="absolute top-6 right-6 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#2C2A28]/40 z-30">
                <Target className="w-4 h-4" /> Interactive Sandbox
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE AI TERMINAL */}
      <section 
        ref={revealSection4.ref}
        className={`relative z-10 py-32 px-6 bg-[#2C2A28] text-[#FCF8ED] transition-all duration-1000 delay-300 ease-out ${revealSection4.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-5xl md:text-7xl tracking-tight mb-6 text-white">
              Your personal<br/>
              <span className="italic text-[#D97736]">intelligence analyst.</span>
            </h2>
            <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-md">
              Don't just ask an AI to summarize. Give it five different articles and watch it map the political motives, the hidden incentives, and the "dog that didn't bark."
            </p>
            <ul className="space-y-4 font-mono text-sm text-white/70">
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#2D6A65]"/> Multi-source URL ingestion</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#2D6A65]"/> Entity & Fact extraction</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#2D6A65]"/> Strategic hypothesis generation</li>
              <li className="flex items-center gap-3"><ChevronRight className="w-5 h-5 text-[#2D6A65]"/> One-click canvas dispatch</li>
            </ul>
          </div>
          
          {/* Terminal Window */}
          <div className="bg-[#1A1817] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
            <div className="bg-white/5 border-b border-white/10 h-12 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              <span className="ml-4 text-[10px] font-mono text-white/40 tracking-widest uppercase">discourse-lab ~ /api/investigate</span>
            </div>
            
            <div className="p-6 font-mono text-sm text-[#2D6A65] min-h-[250px] whitespace-pre-wrap leading-relaxed">
              {typedText}
              {!showResults && <span className="animate-pulse inline-block w-2.5 h-5 bg-[#D97736] align-middle ml-1" />}
            </div>

            {/* AI Results Preview */}
            {showResults && (
              <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="border border-white/10 bg-white/5 p-5 rounded-lg relative overflow-hidden group cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D97736]" />
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-mono text-[#D97736] uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4"/> Hypothesis Found</span>
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
      <footer className="relative z-10 bg-[#FCF8ED] border-t border-[#2C2A28]/10 pt-24 pb-12 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
            <div className="max-w-md">
              <h3 className="font-display text-5xl italic mb-6 text-[#2C2A28]">threadwise</h3>
              <p className="text-sm text-[#2C2A28]/60 leading-relaxed">
                A spatial intelligence workbench for researchers, strategists, and complex thinkers. Built by Kennedy Shilongo.
              </p>
            </div>
            <div className="flex gap-16 font-mono text-[11px] uppercase tracking-widest text-[#2C2A28]/50">
              <div className="flex flex-col gap-4">
                <span className="text-[#2C2A28] font-bold mb-1">Product</span>
                <Link to="/" className="hover:text-[#D97736] transition-colors">Workspace</Link>
                <Link to="/welcome" className="hover:text-[#D97736] transition-colors">Landing</Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#2C2A28] font-bold mb-1">System</span>
                <a href="#" className="hover:text-[#2D6A65] transition-colors">TanStack Start</a>
                <a href="#" className="hover:text-[#2D6A65] transition-colors">DeepSeek V3</a>
              </div>
            </div>
          </div>
          
          {/* Massive Footer Typographic Watermark */}
          <div className="w-full border-t border-[#2C2A28]/10 pt-8 flex justify-between items-center">
            <span className="text-[10px] font-mono text-[#2C2A28]/40">© 2026 Threadwise Inc.</span>
            <span className="text-[10px] font-mono text-[#2C2A28]/40 uppercase tracking-[0.2em] flex items-center gap-2"><Activity className="w-3 h-3"/> See what connects.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}