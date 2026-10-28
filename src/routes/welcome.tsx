import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Terminal, CheckCircle2, ChevronRight, Activity, Cpu, 
  Network, Layers, Target, Zap, X, Users, TrendingUp, 
  BookOpen, Sliders, Calendar, FileCheck, PieChart, 
  Map, GitMerge, PenTool, MessageSquare, GitBranch, 
  Command, Play, HelpCircle, Undo, Plus, Search, FolderOpen, LayoutTemplate
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
  const revealSection4 = useScrollReveal();

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

  // 3D Tilt for the MacBook
  const tiltX = (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 6;
  const tiltY = (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * -6;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative">
      
      {/* ARTISTIC AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#FDF0B6] opacity-30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#E8DAFB] opacity-20 blur-[150px]" />
        <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#CBE6F9] opacity-20 blur-[120px]" />
      </div>

      {/* Subtle Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
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

      {/* HERO SECTION */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-16 pb-32 flex flex-col items-center text-center">
        
        {/* Typography */}
        <div className="relative z-20 flex flex-col items-center mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-[#D96C39]" />
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#D96C39] font-bold">For the naturally curious</span>
            <span className="h-px w-8 bg-[#D96C39]" />
          </div>

          <h1 className="font-display text-[60px] md:text-[90px] lg:text-[110px] leading-[0.9] tracking-tighter mb-8 text-[#1A1A1A]">
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

        {/* THE NEON MACBOOK MOCKUP */}
        <div className="relative w-full max-w-[1100px] perspective-[2000px] mt-8">
          <div 
            className="relative w-full rounded-t-2xl rounded-b-xl border-[14px] border-[#8B5CF6] bg-[#8B5CF6] shadow-[0_30px_100px_-20px_rgba(139,92,246,0.5)] overflow-hidden transition-transform duration-200 ease-out"
            style={{ 
              transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(0.98)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* MacBook Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#8B5CF6] rounded-b-xl z-50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-black/50" />
            </div>

            {/* Screen Area */}
            <div className="relative bg-[#FDFBF7] aspect-[16/10] flex overflow-hidden rounded-lg">
              
              {/* Canvas Background (Inside Screen) */}
              <div className="absolute inset-0 bg-[#FDFBF7]">
                {/* Grid */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #A6917A 1px, transparent 1px),
                      linear-gradient(to bottom, #A6917A 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                  }}
                />

                {/* Top Left Logo */}
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1A1A1A]">
                    <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
                    <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
                    <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
                    <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
                  </svg>
                  <span className="font-display italic text-sm tracking-tight text-[#1A1A1A]">Threadwise</span>
                </div>

                {/* Top Left Sidebar Buttons */}
                <div className="absolute top-12 left-4 flex flex-col gap-2 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] text-white rounded-md text-[10px] font-mono tracking-widest uppercase cursor-pointer shadow-md">
                    <Layers className="w-3 h-3" /> Studio
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black/5 text-[#1A1A1A] rounded-md text-[10px] font-mono tracking-widest uppercase cursor-pointer shadow-sm">
                    <LayoutTemplate className="w-3 h-3" /> Plan
                  </div>
                </div>

                {/* Nodes */}
                {/* Node 1: UN Report (Blue) */}
                <div className="absolute top-[20%] left-[25%] w-[110px] bg-[#CBE6F9] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">UN Report on Organized Crime</h4>
                </div>

                {/* Node 2: Does the... (Pink) */}
                <div className="absolute top-[16%] left-[40%] w-[100px] bg-[#FBD0D4] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Question</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Does the policy work?</h4>
                </div>

                {/* Node 3: Why has... (Purple) */}
                <div className="absolute top-[25%] left-[50%] w-[100px] bg-[#E8DAFB] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Question</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Why has violence increased?</h4>
                </div>

                {/* Node 4: US Occurrence (Green) */}
                <div className="absolute top-[35%] left-[35%] w-[110px] bg-[#C9E8C7] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">U.S. Occurrence and Trends</h4>
                </div>

                {/* Node 5: UN Security (Blue) */}
                <div className="absolute top-[45%] left-[38%] w-[110px] bg-[#CBE6F9] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">UN Security Council</h4>
                </div>

                {/* Node 6: Gang Violence (Yellow) */}
                <div className="absolute top-[45%] left-[20%] w-[100px] bg-[#FDF0B6] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Raw</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Gang Violence</h4>
                </div>

                {/* Node 7: Test whether (Green) */}
                <div className="absolute top-[50%] left-[30%] w-[90px] bg-[#C9E8C7] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Planned</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Test whether</h4>
                </div>

                {/* Node 8: Trump A... (Pink) */}
                <div className="absolute top-[58%] left-[40%] w-[90px] bg-[#FBD0D4] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Trump A...</h4>
                </div>

                {/* Node 9: U.S. Mig... (Purple) */}
                <div className="absolute top-[40%] left-[55%] w-[90px] bg-[#E8DAFB] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Raw</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">U.S. Mig...</h4>
                </div>
                
                {/* Node 10: Compare (Green) */}
                <div className="absolute top-[40%] right-[10%] w-[90px] bg-[#C9E8C7] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Planned</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Compare with...</h4>
                </div>
              </div>

              {/* SVG Connections (Z-0) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 280 150 L 350 120" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 380 150 L 410 180" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 400 200 L 420 250" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 420 280 L 420 320" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 400 350 L 300 350" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 450 350 L 480 400" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 500 350 L 550 350" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 550 300 L 650 300" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              </svg>

              {/* THE CANVAS STUDIO MODAL */}
              <div className="absolute top-[10%] bottom-[10%] right-[5%] w-[55%] bg-white rounded-xl shadow-2xl flex flex-col z-30 border border-black/5 overflow-hidden">
                {/* Modal Header */}
                <div className="p-4 border-b border-black/5 flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono tracking-widest uppercase text-[#1A1A1A]/40 mb-1 block">The Workbench</span>
                    <h2 className="font-display text-xl text-[#1A1A1A]">Canvas studio</h2>
                  </div>
                  <div className="p-1 hover:bg-black/5 rounded-md cursor-pointer transition-colors">
                    <X className="w-4 h-4 text-[#1A1A1A]/40" />
                  </div>
                </div>
                
                {/* Modal Body */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Left Sidebar (Tools) */}
                  <div className="w-[45%] border-r border-black/5 p-2 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
                    {[
                      { icon: Users, label: "Live room & audio" },
                      { icon: TrendingUp, label: "Risk simulation" },
                      { icon: BookOpen, label: "Discourse lab" },
                      { icon: Sliders, label: "Scenario stress-test" },
                      { icon: Calendar, label: "Resource & runway" },
                      { icon: FileCheck, label: "Executive dossier" },
                      { icon: PieChart, label: "Executive radar" },
                      { icon: Map, label: "Spatial narratives" },
                      { icon: GitMerge, label: "Contradiction engine" },
                      { icon: PenTool, label: "Field capture" },
                      { icon: MessageSquare, label: "Conversation to canvas" },
                      { icon: Network, label: "External bridge" },
                      { icon: GitBranch, label: "Branches & merges" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 cursor-pointer text-[#1A1A1A]/70 transition-colors">
                        <item.icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Right Content Area */}
                  <div className="flex-1 p-4 flex flex-col">
                    <h3 className="font-display text-lg mb-4 text-[#1A1A1A]">Document & evidence</h3>
                    <button className="flex items-center justify-center gap-2 w-full py-2 bg-[#1A1A1A] text-white rounded-md text-[10px] font-mono tracking-widest uppercase hover:bg-black transition-colors shadow-sm">
                      <FileText className="w-3.5 h-3.5" /> Open evidence clipper
                    </button>
                  </div>
                </div>
              </div>

              {/* BOTTOM TOOLBAR */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A1A] rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl z-40">
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer">
                   <Lightbulb className="w-3 h-3 text-[#FDF0B6]" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Idea <span className="text-[#FDFBF7]/40 ml-1">1</span></span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer">
                   <FileText className="w-3 h-3 text-[#CBE6F9]" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Note <span className="text-[#FDFBF7]/40 ml-1">2</span></span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer">
                   <HelpCircle className="w-3 h-3 text-[#FBD0D4]" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Question <span className="text-[#FDFBF7]/40 ml-1">3</span></span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer">
                   <Target className="w-3 h-3 text-[#C9E8C7]" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Experiment <span className="text-[#FDFBF7]/40 ml-1">4</span></span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer">
                   <Zap className="w-3 h-3 text-[#E8DAFB]" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Action <span className="text-[#FDFBF7]/40 ml-1">5</span></span>
                 </div>
                 
                 <div className="w-px h-4 bg-white/20 mx-1" />
                 
                 <div className="flex items-center gap-1.5 text-[#D96C39] cursor-pointer">
                   <Sparkles className="w-3 h-3" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Explore</span>
                 </div>
                 <div className="flex items-center gap-1 text-[#FDFBF7]/40">
                   <X className="w-3 h-3 cursor-pointer hover:text-white" />
                 </div>
              </div>

            </div>
            
            {/* MacBook Bottom Bezel */}
            <div className="h-6 bg-[#8B5CF6] flex items-center justify-center">
              <div className="w-16 h-1 bg-black/20 rounded-full" />
            </div>
          </div>
          
          {/* MacBook Base/Shadow */}
          <div className="relative h-8 bg-[#7C3AED] rounded-b-[2rem] shadow-[0_30px_60px_-15px_rgba(124,58,237,0.6)] mx-auto w-[110%] -ml-[5%] z-[-1]">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-black/30 rounded-b-lg" />
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

      {/* SECTION 3: THE AI TERMINAL */}
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