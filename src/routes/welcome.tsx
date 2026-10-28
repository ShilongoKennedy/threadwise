import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Activity, Cpu, Network, Layers, Target, Zap, X, Users, 
  TrendingUp, BookOpen, Sliders, Calendar, FileCheck, 
  PieChart, Map, GitMerge, PenTool, MessageSquare, GitBranch, 
  HelpCircle, LayoutTemplate, Search, FolderOpen
} from "lucide-react";
import { useEffect, useState } from "react";

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

// --- MAIN COMPONENT ---
function WelcomePage() {
  const mouse = useMousePosition();

  // 3D Tilt for the MacBook
  const tiltX = (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 6;
  const tiltY = (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * -6;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative flex flex-col">
      
      {/* ARTISTIC AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#FDF0B6] opacity-20 blur-[120px]" />
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
      <header className="relative z-30 flex justify-between items-center px-6 md:px-12 py-6 max-w-[1400px] mx-auto w-full">
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
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mr-4">
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#D96C39]"/> System Online</span>
            <span className="flex items-center gap-2"><Cpu className="w-3 h-3"/> DeepSeek v3</span>
          </div>
          
          {/* Sign In / Auth Buttons */}
          <Link to="/login" className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
            Sign in
          </Link>
          <Link to="/" className="group flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#D96C39] transition-colors duration-300 font-mono text-xs uppercase tracking-widest shadow-xl rounded-full">
            Start Free <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION - FOCUS ON THE LAPTOP */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-12 pb-24 flex flex-col items-center text-center flex-1">
        
        {/* Minimal Typography */}
        <div className="relative z-20 flex flex-col items-center mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-[#D96C39]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#D96C39] font-bold">The Spatial Workbench</span>
            <span className="h-px w-8 bg-[#D96C39]" />
          </div>

          <h1 className="font-display text-[50px] md:text-[80px] lg:text-[100px] leading-[0.9] tracking-tighter mb-6 text-[#1A1A1A]">
            See what <span className="italic text-[#D96C39]">connects.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#1A1A1A]/60 leading-relaxed max-w-xl font-light">
            Bring your sources, questions, and ideas together.
          </p>
        </div>

        {/* THE INTERACTIVE CHARCOAL MACBOOK */}
        <div className="relative w-full max-w-[1100px] perspective-[2000px] mt-4 group">
          <div 
            className="relative w-full rounded-t-2xl rounded-b-xl border-[12px] border-[#2C2A28] bg-[#2C2A28] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 ease-out group-hover:shadow-[0_50px_120px_-20px_rgba(217,108,57,0.15)]"
            style={{ 
              transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(0.98)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* MacBook Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2C2A28] rounded-b-xl z-50 flex items-center justify-center">
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

                {/* Nodes (Pastel Colors) */}
                <div className="absolute top-[20%] left-[25%] w-[110px] bg-[#CBE6F9] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">UN Report on Organized Crime</h4>
                </div>

                <div className="absolute top-[16%] left-[40%] w-[100px] bg-[#FBD0D4] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Question</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Does the policy work?</h4>
                </div>

                <div className="absolute top-[25%] left-[50%] w-[100px] bg-[#E8DAFB] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Question</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Why has violence increased?</h4>
                </div>

                <div className="absolute top-[35%] left-[35%] w-[110px] bg-[#C9E8C7] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">U.S. Occurrence and Trends</h4>
                </div>

                <div className="absolute top-[45%] left-[20%] w-[100px] bg-[#FDF0B6] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Raw</span>
                  </div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Gang Violence</h4>
                </div>
              </div>

              {/* SVG Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 280 150 L 350 120" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 380 150 L 410 180" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 400 200 L 420 250" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 420 280 L 420 320" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 400 350 L 300 350" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              </svg>

              {/* THE CANVAS STUDIO MODAL */}
              <div className="absolute top-[10%] bottom-[10%] right-[5%] w-[55%] bg-white rounded-xl shadow-2xl flex flex-col z-30 border border-black/5 overflow-hidden">
                <div className="p-4 border-b border-black/5 flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono tracking-widest uppercase text-[#1A1A1A]/40 mb-1 block">The Workbench</span>
                    <h2 className="font-display text-xl text-[#1A1A1A]">Canvas studio</h2>
                  </div>
                  <div className="p-1 hover:bg-black/5 rounded-md cursor-pointer transition-colors">
                    <X className="w-4 h-4 text-[#1A1A1A]/40" />
                  </div>
                </div>
                
                <div className="flex flex-1 overflow-hidden">
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
                   <span className="text-[9px] font-mono uppercase tracking-wider">Idea</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer">
                   <FileText className="w-3 h-3 text-[#CBE6F9]" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Note</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer">
                   <HelpCircle className="w-3 h-3 text-[#FBD0D4]" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Question</span>
                 </div>
                 <div className="w-px h-4 bg-white/20 mx-1" />
                 <div className="flex items-center gap-1.5 text-[#D96C39] cursor-pointer">
                   <Sparkles className="w-3 h-3" />
                   <span className="text-[9px] font-mono uppercase tracking-wider">Explore</span>
                 </div>
              </div>

            </div>
            
            {/* MacBook Bottom Bezel */}
            <div className="h-6 bg-[#2C2A28] flex items-center justify-center">
              <div className="w-16 h-1 bg-black/30 rounded-full" />
            </div>
          </div>
          
          {/* MacBook Base/Shadow */}
          <div className="relative h-6 bg-[#1A1A1A] rounded-b-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] mx-auto w-[110%] -ml-[5%] z-[-1]">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/50 rounded-b-lg" />
          </div>
        </div>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="relative z-10 border-t border-[#1A1A1A]/10 py-8 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] font-mono text-[#1A1A1A]/40">© 2026 Threadwise Inc.</span>
          <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">
             <Link to="/" className="hover:text-[#D96C39] transition-colors">Workspace</Link>
             <a href="#" className="hover:text-[#D96C39] transition-colors">Privacy</a>
             <a href="#" className="hover:text-[#D96C39] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}