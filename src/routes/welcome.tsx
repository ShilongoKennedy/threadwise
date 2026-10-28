import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Activity, Cpu, Network, Layers, Target, 
  X, Users, TrendingUp, BookOpen, Sliders, 
  Calendar, FileCheck, PieChart, Map, GitMerge, 
  PenTool, MessageSquare, GitBranch, HelpCircle, LayoutTemplate,
  Paperclip, CheckCircle2
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

  // Colors
  const laptopYellow = "#FDF0B6"; 
  const laptopYellowDark = "#E3D398";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative flex flex-col">
      
      {/* CSS for Interactions, Glasses, and Investigation Board */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        
        /* Optical Glasses */
        .lens-frame {
          border: 14px solid ${laptopYellow};
          box-shadow: inset 0 0 8px rgba(0,0,0,0.15), 0 20px 40px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05);
        }
        .lens-glass-pure-white {
          background: #FFFFFF;
          backdrop-filter: blur(2px);
          box-shadow: inset 0 20px 40px rgba(0,0,0,0.03), inset 0 -20px 40px rgba(0,0,0,0.02), inset 0 0 10px rgba(0,0,0,0.05);
        }
        .glass-reflection-1 { background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 60%); border-radius: 50%; filter: blur(1px); }
        .glass-reflection-2 { background: linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%); border-radius: 50%; filter: blur(4px); }
        .hinge-piece { background: ${laptopYellow}; box-shadow: inset 0 0 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05); }

        /* --- THE PREMIUM INVESTIGATION BOARD --- */
        
        .board-container {
          background-color: #1C1E21; /* Deep charcoal/blue felt */
          background-image: 
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E"),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 80%);
          box-shadow: 
            inset 0 0 80px rgba(0,0,0,0.8),
            0 30px 60px -15px rgba(0,0,0,0.3);
          border: 4px solid #2A2C30;
          border-radius: 8px;
        }
        
        /* The String Path Base */
        .string-base {
          fill: none;
          stroke: #8C2B2B; /* Deep blood red */
          stroke-width: 2.5;
          filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.6));
        }
        
        /* The Animated Data Pulse traveling down the string */
        .string-pulse {
          fill: none;
          stroke: #FF5A5A;
          stroke-width: 2.5;
          stroke-dasharray: 20 200;
          animation: flow-pulse 3s linear infinite;
          filter: drop-shadow(0px 0px 4px rgba(255,90,90,0.8));
        }
        
        @keyframes flow-pulse {
          0% { stroke-dashoffset: 220; }
          100% { stroke-dashoffset: 0; }
        }

        /* Floating Paper Cards */
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) rotate(3deg); }
          50% { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) rotate(2deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-12px) rotate(-2deg); }
        }

        .animate-float-1 { animation: float-1 7s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 9s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 6s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 8s ease-in-out infinite; }

        .paper-card {
          background-color: #FCFAF8;
          box-shadow: 
            0 15px 30px -5px rgba(0,0,0,0.4),
            0 5px 15px -2px rgba(0,0,0,0.2),
            inset 0 0 20px rgba(255,255,255,0.5);
          border: 1px solid rgba(0,0,0,0.05);
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .paper-card:hover {
          animation-play-state: paused;
          transform: scale(1.05) rotate(0deg) !important;
          box-shadow: 0 25px 50px -10px rgba(0,0,0,0.6);
          z-index: 50 !important;
        }

        /* 3D Realistic Map Pin */
        .map-pin {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pin-head {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #ff6b6b, #b30000);
          box-shadow: 
            inset -2px -2px 4px rgba(0,0,0,0.5),
            inset 2px 2px 4px rgba(255,255,255,0.6),
            0 4px 6px rgba(0,0,0,0.4);
          position: relative;
        }
        .pin-needle {
          width: 2px;
          height: 12px;
          background: linear-gradient(to right, #888, #fff, #666);
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
          margin-top: -2px;
        }

        /* Center Dossier Styling */
        .dossier-paper {
          background-color: #F2EFE9;
          background-image: repeating-linear-gradient(to bottom, transparent, transparent 28px, rgba(0,0,0,0.03) 28px, rgba(0,0,0,0.03) 29px);
          box-shadow: 
            0 30px 60px -10px rgba(0,0,0,0.5),
            inset 0 0 40px rgba(0,0,0,0.05);
          border-radius: 2px;
        }
        .stamp {
          border: 3px solid #C24A35;
          color: #C24A35;
          opacity: 0.8;
          transform: rotate(-15deg);
          mix-blend-mode: multiply;
          font-family: monospace;
          font-weight: bold;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          box-shadow: inset 0 0 0 1px rgba(194, 74, 53, 0.2);
        }
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

      {/* HERO SECTION - THE PURE WHITE OPTICAL GLASSES */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-12 pb-24 flex flex-col items-center text-center flex-1">
        
        <div className="relative z-20 flex flex-col items-center mb-16 w-full max-w-5xl">
          
          <div className="relative flex justify-center items-center h-[450px] w-full">
            
            {/* The Glasses Frame Container */}
            <div className="relative flex items-center justify-center">
              
              {/* Left Hinge (Endpiece) */}
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-14 h-10 hinge-piece rounded-l-xl z-20 flex items-center justify-end pr-3">
                <div className="w-2 h-2 bg-black/10 rounded-full shadow-inner" />
              </div>

              {/* Left Lens */}
              <div className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px] rounded-full lens-frame z-10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 rounded-full lens-glass-pure-white" />
                <div className="absolute top-[5%] left-[10%] w-[200px] h-[120px] glass-reflection-1 transform -rotate-[35deg] opacity-80" />
                <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[100px] glass-reflection-2 transform rotate-[15deg] opacity-50" />
                <div className="absolute top-[20%] left-[25%] w-5 h-5 rounded-full bg-[#FDF0B6] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <div className="absolute bottom-[25%] left-[30%] w-5 h-5 rounded-full bg-[#E8DAFB] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <h1 className="font-display text-[55px] md:text-[70px] tracking-tight text-[#1A1A1A] z-20 relative drop-shadow-sm">
                  See what
                </h1>
              </div>

              {/* The Bridge */}
              <div className="relative -mx-5 z-0 drop-shadow-sm">
                <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 50 Q 60 10 120 50" stroke={laptopYellowDark} strokeWidth="14" strokeLinecap="round" />
                  <path d="M 0 50 Q 60 10 120 50" stroke={laptopYellow} strokeWidth="12" strokeLinecap="round" />
                  <path d="M 0 50 Q 60 10 120 50" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                </svg>
              </div>

              {/* Right Lens */}
              <div className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px] rounded-full lens-frame z-10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 rounded-full lens-glass-pure-white" />
                <div className="absolute top-[10%] right-[10%] w-[180px] h-[110px] glass-reflection-1 transform rotate-[25deg] opacity-80" />
                <div className="absolute bottom-[15%] left-[10%] w-[220px] h-[90px] glass-reflection-2 transform -rotate-[10deg] opacity-50" />
                <div className="absolute top-[25%] right-[30%] w-5 h-5 rounded-full bg-[#FBD0D4] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <div className="absolute bottom-[20%] right-[25%] w-5 h-5 rounded-full bg-[#CBE6F9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <h1 className="font-display text-[55px] md:text-[70px] tracking-tight text-[#8B5CF6] italic z-20 relative drop-shadow-sm">
                  connects.
                </h1>
              </div>

              {/* Right Hinge (Endpiece) */}
              <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-14 h-10 hinge-piece rounded-r-xl z-20 flex items-center justify-start pl-3">
                <div className="w-2 h-2 bg-black/10 rounded-full shadow-inner" />
              </div>

            </div>
          </div>

          <p className="text-lg md:text-xl text-[#1A1A1A]/50 leading-relaxed max-w-xl font-light mt-6">
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
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{ backgroundImage: `linear-gradient(to right, #A6917A 1px, transparent 1px), linear-gradient(to bottom, #A6917A 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
                />

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

                <div className="absolute top-12 left-4 flex flex-col gap-2 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] text-white rounded-md text-[10px] font-mono tracking-widest uppercase cursor-pointer shadow-md">
                    <Layers className="w-3 h-3" /> Studio
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black/5 text-[#1A1A1A] rounded-md text-[10px] font-mono tracking-widest uppercase cursor-pointer shadow-sm">
                    <LayoutTemplate className="w-3 h-3" /> Plan
                  </div>
                </div>

                <div className="absolute top-[20%] left-[25%] w-[110px] bg-[#CBE6F9] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span></div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">UN Report on Organized Crime</h4>
                </div>
                <div className="absolute top-[16%] left-[40%] w-[100px] bg-[#FBD0D4] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Question</span></div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Does the policy work?</h4>
                </div>
                <div className="absolute top-[25%] left-[50%] w-[100px] bg-[#E8DAFB] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Question</span></div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Why has violence increased?</h4>
                </div>
                <div className="absolute top-[35%] left-[35%] w-[110px] bg-[#C9E8C7] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Evidence</span></div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">U.S. Occurrence and Trends</h4>
                </div>
                <div className="absolute top-[45%] left-[20%] w-[100px] bg-[#FDF0B6] border border-black/5 shadow-md rounded-md p-2 z-10">
                  <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-mono font-bold text-[#1A1A1A]/60 uppercase tracking-widest">Raw</span></div>
                  <h4 className="font-display text-[10px] leading-tight text-[#1A1A1A]">Gang Violence</h4>
                </div>
              </div>

              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 280 150 L 350 120" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 380 150 L 410 180" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 400 200 L 420 250" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 420 280 L 420 320" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                <path d="M 400 350 L 300 350" fill="none" stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              </svg>

              <div className="absolute top-[10%] bottom-[10%] right-[5%] w-[55%] bg-white rounded-xl shadow-2xl flex flex-col z-30 border border-black/5 overflow-hidden">
                <div className="p-4 border-b border-black/5 flex justify-between items-start">
                  <div>
                    <span className="text-[8px] font-mono tracking-widest uppercase text-[#1A1A1A]/40 mb-1 block">The Workbench</span>
                    <h2 className="font-display text-xl text-[#1A1A1A]">Canvas studio</h2>
                  </div>
                  <div className="p-1 hover:bg-black/5 rounded-md cursor-pointer transition-colors"><X className="w-4 h-4 text-[#1A1A1A]/40" /></div>
                </div>
                <div className="flex flex-1 overflow-hidden">
                  <div className="w-[45%] border-r border-black/5 p-2 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
                    {[
                      { icon: Users, label: "Live room & audio" }, { icon: TrendingUp, label: "Risk simulation" }, { icon: BookOpen, label: "Discourse lab" },
                      { icon: Sliders, label: "Scenario stress-test" }, { icon: Calendar, label: "Resource & runway" }, { icon: FileCheck, label: "Executive dossier" },
                      { icon: PieChart, label: "Executive radar" }, { icon: Map, label: "Spatial narratives" }, { icon: GitMerge, label: "Contradiction engine" },
                      { icon: PenTool, label: "Field capture" }, { icon: MessageSquare, label: "Conversation to canvas" }, { icon: Network, label: "External bridge" },
                      { icon: GitBranch, label: "Branches & merges" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 cursor-pointer text-[#1A1A1A]/70 transition-colors">
                        <item.icon className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">{item.label}</span>
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

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1A1A1A] rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl z-40">
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer"><Lightbulb className="w-3 h-3 text-[#FDF0B6]" /><span className="text-[9px] font-mono uppercase tracking-wider">Idea</span></div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer"><FileText className="w-3 h-3 text-[#CBE6F9]" /><span className="text-[9px] font-mono uppercase tracking-wider">Note</span></div>
                 <div className="flex items-center gap-1.5 text-[#FDFBF7]/70 cursor-pointer"><HelpCircle className="w-3 h-3 text-[#FBD0D4]" /><span className="text-[9px] font-mono uppercase tracking-wider">Question</span></div>
                 <div className="w-px h-4 bg-white/20 mx-1" />
                 <div className="flex items-center gap-1.5 text-[#D96C39] cursor-pointer"><Sparkles className="w-3 h-3" /><span className="text-[9px] font-mono uppercase tracking-wider">Explore</span></div>
              </div>
            </div>
            
            <div className="h-6 flex items-center justify-center" style={{ backgroundColor: laptopYellow }}>
              <div className="w-16 h-1 rounded-full" style={{ backgroundColor: laptopYellowDark }} />
            </div>
          </div>
          
          <div className="relative h-6 rounded-b-[2rem] mx-auto w-[110%] -ml-[5%] z-[-1]" style={{ backgroundColor: laptopYellowDark, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)' }}>
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-b-lg" />
          </div>
        </div>
        {/* --- END OF LAPTOP --- */}


        {/* THE PREMIUM LIVING INVESTIGATION BOARD */}
        <section className="w-full max-w-[1200px] mt-40 mb-24 relative flex flex-col items-center">
          <div className="text-center mb-16 relative z-30">
            <h2 className="font-display text-4xl md:text-5xl text-[#1A1A1A] mb-4">Every story has a thread.</h2>
            <p className="text-[#1A1A1A]/50 text-lg">Connect the evidence. Find the hidden motive.</p>
          </div>

          <div className="board-container relative w-full rounded-lg overflow-hidden h-[650px] flex items-center justify-center p-8">
            
            {/* The Animated Red Strings */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* Top Left Connection */}
              <path d="M 600 325 Q 400 150 250 200" className="string-base" />
              <path d="M 600 325 Q 400 150 250 200" className="string-pulse" />
              
              {/* Top Right Connection */}
              <path d="M 600 325 Q 800 150 950 200" className="string-base" />
              <path d="M 600 325 Q 800 150 950 200" className="string-pulse" style={{ animationDelay: '0.5s' }} />
              
              {/* Bottom Left Connection */}
              <path d="M 600 325 Q 400 500 250 450" className="string-base" />
              <path d="M 600 325 Q 400 500 250 450" className="string-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Bottom Right Connection */}
              <path d="M 600 325 Q 800 500 950 450" className="string-base" />
              <path d="M 600 325 Q 800 500 950 450" className="string-pulse" style={{ animationDelay: '1.5s' }} />
            </svg>

            {/* Evidence Cards */}
            
            {/* Card 1: Top Left (Article) */}
            <div className="paper-card animate-float-1 absolute top-[15%] left-[8%] w-60 p-5 rounded-sm z-10">
              <div className="map-pin"><div className="pin-head" /><div className="pin-needle" /></div>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-[#C24A35] uppercase tracking-widest border-b border-black/10 pb-2">
                <Network className="w-3 h-3" /> Article Source
              </div>
              <p className="text-[15px] font-display leading-tight text-black mb-3">"El Salvador sends special forces to Haiti."</p>
              <p className="text-[10px] font-mono text-black/50">Miami Herald · 2026</p>
            </div>

            {/* Card 2: Top Right (Quote) */}
            <div className="paper-card animate-float-2 absolute top-[20%] right-[8%] w-64 p-5 rounded-sm z-10">
              <div className="map-pin"><div className="pin-head" /><div className="pin-needle" /></div>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-[#5B456B] uppercase tracking-widest border-b border-black/10 pb-2">
                <MessageSquare className="w-3 h-3" /> Official Statement
              </div>
              <p className="text-sm font-sans italic text-black/80 leading-relaxed mb-3">"We are there to support our allies and maintain regional stability."</p>
              <p className="text-[10px] font-mono text-black/50">Pentagon Briefing</p>
            </div>

            {/* Card 3: Bottom Left (Map/Image) */}
            <div className="paper-card animate-float-3 absolute bottom-[12%] left-[12%] w-56 p-4 rounded-sm z-10">
              <div className="map-pin"><div className="pin-head" /><div className="pin-needle" /></div>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-[#2D6A65] uppercase tracking-widest border-b border-black/10 pb-2">
                <Map className="w-3 h-3" /> Location
              </div>
              <div className="w-full h-28 bg-[#E5E5E5] rounded mb-3 flex items-center justify-center relative overflow-hidden border border-black/5">
                <Map className="w-10 h-10 text-black/20" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-multiply" />
              </div>
              <p className="text-[10px] font-mono text-black/50 text-center uppercase tracking-widest">Port-au-Prince</p>
            </div>

            {/* Card 4: Bottom Right (Question) */}
            <div className="paper-card animate-float-4 absolute bottom-[18%] right-[12%] w-60 p-5 rounded-sm z-10 bg-[#FBD0D4]/40">
              <div className="map-pin"><div className="pin-head" /><div className="pin-needle" /></div>
              <div className="flex items-center gap-2 mb-3 text-[10px] font-mono font-bold text-[#C24A35] uppercase tracking-widest border-b border-[#C24A35]/20 pb-2">
                <Sparkles className="w-3 h-3" /> Hypothesis
              </div>
              <p className="text-[15px] font-display leading-tight text-black">Is this actually about securing US economic aid?</p>
            </div>

            {/* Center Dossier */}
            <div className="dossier-paper absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] p-8 rounded-sm z-20">
              <div className="map-pin" style={{ top: '-10px' }}><div className="pin-head bg-gradient-to-br from-yellow-400 to-orange-500" /><div className="pin-needle" /></div>
              
              {/* Paperclip */}
              <div className="absolute top-4 right-6 text-black/20 rotate-12">
                <Paperclip className="w-8 h-8" />
              </div>

              {/* Top Secret Stamp */}
              <div className="stamp absolute top-8 right-8 text-[12px] px-3 py-1 rotate-12">
                Declassified
              </div>

              <div className="flex items-center gap-2 mb-4 text-[10px] font-mono uppercase tracking-widest text-[#C24A35] border-b border-black/10 pb-3">
                <Target className="w-4 h-4" /> The Bigger Picture
              </div>
              <h3 className="font-display text-3xl leading-tight mb-4 text-[#1A1A1A]">Strategic Bargaining Chip</h3>
              <p className="text-sm font-sans text-black/60 leading-relaxed mb-6">
                The disproportionate military response reveals a deeper motive: El Salvador is leveraging the deployment to secure diplomatic favor and financial backing from the United States.
              </p>
              
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#2D6A65] bg-[#C9E8C7]/40 p-2 rounded">
                <CheckCircle2 className="w-4 h-4" /> Conclusion Verified
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="relative z-30 border-t border-[#1A1A1A]/10 py-8 mt-auto bg-[#FDFBF7]/80 backdrop-blur-md">
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