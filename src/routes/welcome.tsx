import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, Sparkles, FileText, Lightbulb, 
  Activity, Cpu, Network, Layers, Target, 
  X, Users, TrendingUp, BookOpen, Sliders, 
  Calendar, FileCheck, PieChart, Map, GitMerge, 
  PenTool, MessageSquare, GitBranch, HelpCircle, LayoutTemplate
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

  // Colors from your palette
  const laptopYellow = "#FDF0B6"; 
  const laptopYellowDark = "#E3D398";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative flex flex-col">
      
      {/* CSS for Interactions */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>

      {/* ARTISTIC AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full opacity-20 blur-[150px]" style={{ backgroundColor: laptopYellow }} />
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#FBD0D4] opacity-10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#CBE6F9] opacity-10 blur-[100px]" />
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1A1A1A]">
            <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
            <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
            <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="font-display italic text-2xl tracking-tight font-medium text-[#1A1A1A]">threadwise</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/50 mr-4">
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#1A1A1A]"/> System Online</span>
            <span className="flex items-center gap-2"><Cpu className="w-3 h-3 text-[#1A1A1A]"/> DeepSeek v3</span>
          </div>
          
          <Link to="/login" className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
            Sign in
          </Link>
          <Link to="/" className="group flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors duration-300 font-mono text-xs uppercase tracking-widest shadow-xl rounded-full">
            Start Free <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      {/* HERO SECTION - THE GLASS LENSES */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-12 pb-24 flex flex-col items-center text-center flex-1">
        
        <div className="relative z-20 flex flex-col items-center mb-16 w-full max-w-5xl">
          
          <div className="relative flex justify-center items-center h-[350px] w-full">
            
            {/* Left Lens */}
            <div className="absolute top-0 left-[10%] md:left-[20%] w-[300px] h-[300px] md:w-[350px] md:h-[350px] rounded-full border-[3px] border-[#1A1A1A]/10 bg-white/40 backdrop-blur-md shadow-[inset_0_0_40px_rgba(0,0,0,0.05),0_20px_40px_rgba(0,0,0,0.05)]">
              {/* Inner reflection */}
              <div className="absolute top-[10%] left-[10%] w-[120px] h-[80px] rounded-full bg-white/60 blur-[10px] transform -rotate-45" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border border-[#1A1A1A]/5 border-dashed" />
            </div>

            {/* Right Lens */}
            <div className="absolute top-0 right-[10%] md:right-[20%] w-[300px] h-[300px] md:w-[350px] md:h-[350px] rounded-full border-[3px] border-[#1A1A1A]/10 bg-white/40 backdrop-blur-md shadow-[inset_0_0_40px_rgba(0,0,0,0.05),0_20px_40px_rgba(0,0,0,0.05)]">
               {/* Inner reflection */}
               <div className="absolute top-[15%] right-[15%] w-[100px] h-[60px] rounded-full bg-white/60 blur-[10px] transform rotate-45" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full border border-[#1A1A1A]/5 border-dashed" />
            </div>

            {/* Central Bridge/Text */}
            <div className="relative z-30 flex flex-col items-center">
              <h1 className="font-display text-[50px] md:text-[80px] lg:text-[100px] leading-[0.9] tracking-tighter text-[#1A1A1A]">
                See what <br />
                <span className="italic text-[#D96C39]">connects.</span>
              </h1>
            </div>

            {/* Decorative Pastel Dots floating in lenses */}
            <div className="absolute top-[20%] left-[25%] w-4 h-4 rounded-full bg-[#FDF0B6] shadow-sm animate-pulse" />
            <div className="absolute bottom-[20%] left-[35%] w-5 h-5 rounded-full bg-[#E8DAFB] shadow-sm animate-pulse delay-100" />
            <div className="absolute top-[30%] right-[25%] w-3 h-3 rounded-full bg-[#FBD0D4] shadow-sm animate-pulse delay-200" />
            <div className="absolute bottom-[25%] right-[30%] w-4 h-4 rounded-full bg-[#CBE6F9] shadow-sm animate-pulse delay-300" />
          </div>

          <p className="text-lg md:text-xl text-[#1A1A1A]/50 leading-relaxed max-w-xl font-light mt-8">
            Bring your sources, questions, and ideas together.
          </p>
        </div>

        {/* --- DO NOT TOUCH: THE YELLOW MACBOOK --- */}
        <div className="relative w-full max-w-[1100px] perspective-[2000px] group mt-4">
          <div 
            className="relative w-full rounded-t-2xl rounded-b-xl border-[12px] bg-[#2C2A28] overflow-hidden transition-all duration-300 ease-out"
            style={{ 
              borderColor: laptopYellow,
              boxShadow: `0 40px 100px -20px rgba(0,0,0,0.3), 0 0 80px -20px ${laptopYellow}`,
              transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(0.98)`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* MacBook Camera Notch (Yellow) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-xl z-50 flex items-center justify-center" style={{ backgroundColor: laptopYellow }}>
              <div className="w-2 h-2 rounded-full bg-black/20" />
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
            
            {/* MacBook Bottom Bezel (Yellow) */}
            <div className="h-6 flex items-center justify-center" style={{ backgroundColor: laptopYellow }}>
              <div className="w-16 h-1 rounded-full" style={{ backgroundColor: laptopYellowDark }} />
            </div>
          </div>
          
          {/* MacBook Base/Shadow (Yellow) */}
          <div className="relative h-6 rounded-b-[2rem] mx-auto w-[110%] -ml-[5%] z-[-1]" style={{ backgroundColor: laptopYellowDark, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)' }}>
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-b-lg" />
          </div>
        </div>
        {/* --- END OF LAPTOP --- */}

        {/* THE 3D WORK TABLE SECTION */}
        <section className="w-full max-w-[900px] mt-40 mb-16 relative">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl text-[#1A1A1A] mb-4">A desk for your thoughts.</h2>
            <p className="text-[#1A1A1A]/50">Organize your research. Connect the dots.</p>
          </div>

          <div className="relative flex justify-center items-end h-[350px] perspective-[1200px]">
            
            {/* The 3D Book Stack */}
            <div 
              className="relative flex flex-col items-center justify-end w-[350px] group transition-transform duration-500 hover:rotate-0"
              style={{ transform: 'rotateX(45deg) rotateZ(-30deg)', transformStyle: 'preserve-3d' }}
            >
              
              {/* Book 5 (Bottom) - Action */}
              <div className="relative w-[100%] h-[50px] bg-white border border-black/10 rounded-sm shadow-xl flex items-center px-6 transition-transform duration-300 group-hover:-translate-y-2 z-10" style={{ transform: 'translateZ(10px)' }}>
                {/* Pages Edge */}
                <div className="absolute right-0 top-[2px] bottom-[2px] w-4 bg-[#F8F6F0] border-l border-black/5" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)' }} />
                <div className="w-4 h-4 rounded-full bg-[#D8B4E2] mr-4 shadow-inner" />
                <span className="font-sans font-medium text-[#1A1A1A]/70 text-lg">Action</span>
              </div>
              
              {/* Book 4 - Insights */}
              <div className="relative w-[98%] h-[50px] bg-white border border-black/10 rounded-sm shadow-xl flex items-center px-6 -mt-[2px] transition-transform duration-300 group-hover:-translate-y-3 z-20" style={{ transform: 'translateZ(20px)' }}>
                <div className="absolute right-0 top-[2px] bottom-[2px] w-4 bg-[#F8F6F0] border-l border-black/5" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)' }} />
                <div className="w-4 h-4 rounded-full bg-[#B3DDF2] mr-4 shadow-inner" />
                <span className="font-sans font-medium text-[#1A1A1A]/70 text-lg">Insights</span>
              </div>

              {/* Book 3 - Connections */}
              <div className="relative w-[96%] h-[50px] bg-white border border-black/10 rounded-sm shadow-xl flex items-center px-6 -mt-[2px] transition-transform duration-300 group-hover:-translate-y-4 z-30" style={{ transform: 'translateZ(30px)' }}>
                <div className="absolute right-0 top-[2px] bottom-[2px] w-4 bg-[#F8F6F0] border-l border-black/5" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)' }} />
                <div className="w-4 h-4 rounded-full bg-[#C1E1C1] mr-4 shadow-inner" />
                <span className="font-sans font-medium text-[#1A1A1A]/70 text-lg">Connections</span>
              </div>

              {/* Book 2 - Evidence */}
              <div className="relative w-[94%] h-[50px] bg-white border border-black/10 rounded-sm shadow-xl flex items-center px-6 -mt-[2px] transition-transform duration-300 group-hover:-translate-y-5 z-40" style={{ transform: 'translateZ(40px)' }}>
                <div className="absolute right-0 top-[2px] bottom-[2px] w-4 bg-[#F8F6F0] border-l border-black/5" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)' }} />
                <div className="w-4 h-4 rounded-full bg-[#F8C8DC] mr-4 shadow-inner" />
                <span className="font-sans font-medium text-[#1A1A1A]/70 text-lg">Evidence</span>
              </div>

              {/* Book 1 (Top) - Ideas */}
              <div className="relative w-[92%] h-[50px] bg-[#FDFBF7] border border-black/10 rounded-sm shadow-2xl flex items-center px-6 -mt-[2px] transition-transform duration-300 group-hover:-translate-y-6 z-50" style={{ transform: 'translateZ(50px)' }}>
                <div className="absolute right-0 top-[2px] bottom-[2px] w-4 bg-[#F8F6F0] border-l border-black/5" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)' }} />
                <div className="w-4 h-4 rounded-full bg-[#FDF0B6] mr-4 shadow-inner" />
                <span className="font-sans font-medium text-[#1A1A1A] text-lg">Ideas</span>
              </div>
            </div>

            {/* The 3D Pen Cup */}
            <div className="relative ml-24 w-[120px] h-[180px] z-20" style={{ transform: 'translateZ(20px)' }}>
              
              {/* Pencils sticking out (Positioned behind the cup body) */}
              <div className="absolute bottom-[150px] left-[20px] w-[10px] h-[100px] bg-[#FDF0B6] rounded-t-sm transform -rotate-12 shadow-md border border-black/10 z-0">
                 <div className="absolute top-0 left-0 w-full h-[15px] bg-[#E3D398]" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
              </div>
              <div className="absolute bottom-[160px] left-[50px] w-[10px] h-[110px] bg-[#FBD0D4] rounded-t-sm transform rotate-6 shadow-md border border-black/10 z-10">
                 <div className="absolute top-0 left-0 w-full h-[15px] bg-[#E5B3B8]" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
              </div>
              <div className="absolute bottom-[130px] left-[80px] w-[10px] h-[80px] bg-[#1A1A1A] rounded-t-sm transform rotate-12 shadow-md border border-black/10 z-0">
                 <div className="absolute top-0 left-0 w-full h-[15px] bg-[#333]" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
              </div>

              {/* The Cup Body */}
              <div className="absolute bottom-0 w-full h-[140px] bg-[#F8F6F0] rounded-b-[40px] shadow-[20px_20px_40px_rgba(0,0,0,0.1),inset_-10px_0_20px_rgba(0,0,0,0.05)] border border-black/10 z-20">
                {/* Rim/Opening */}
                <div className="absolute top-0 w-full h-[20px] bg-[#FDFBF7] rounded-[50%] border border-black/10 shadow-inner" />
                {/* Decorative vertical lines */}
                <div className="absolute inset-0 flex justify-around px-4 opacity-20 pointer-events-none rounded-b-[40px] overflow-hidden">
                   <div className="w-px h-full bg-black/10" />
                   <div className="w-px h-full bg-black/10" />
                   <div className="w-px h-full bg-black/10" />
                   <div className="w-px h-full bg-black/10" />
                   <div className="w-px h-full bg-black/10" />
                </div>
              </div>
            </div>

            {/* Shadow beneath the desk items */}
            <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[600px] h-[60px] bg-black/5 blur-[20px] rounded-[100%]" />

          </div>
        </section>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="relative z-10 border-t border-[#1A1A1A]/10 py-8 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] font-mono text-[#1A1A1A]/40">© 2026 Threadwise Inc.</span>
          <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">
             <Link to="/" className="hover:text-[#1A1A1A] transition-colors">Workspace</Link>
             <a href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</a>
             <a href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}