import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Activity, Cpu, Network, Layers, Target, 
  X, Users, TrendingUp, BookOpen, Sliders, 
  Calendar, FileCheck, PieChart, Map, GitMerge, 
  PenTool, MessageSquare, GitBranch, HelpCircle, LayoutTemplate,
  Mic, Terminal
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

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

function LandingPage() {
  const mouse = useMousePosition();
  const tiltX = (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 6;
  const tiltY = (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * -6;

  const laptopYellow = "#FDF0B6"; 
  const laptopYellowDark = "#E3D398";
  const boardMint = "#75F09A"; 

  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonth = monthNames[time.getMonth()];
  const currentDate = time.getDate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative flex flex-col">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        
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

        .board-container {
          background-color: #1a1c1d;
          border: 16px solid ${laptopYellow};
          border-radius: 24px;
          box-shadow: inset 0 0 0 2px rgba(255,255,255,0.1), 0 40px 80px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1);
          position: relative;
          padding: 8px;
        }

        .board-screen {
          background-color: ${boardMint};
          background-image: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.1) 100%), linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
          box-shadow: inset 0 0 80px rgba(0,0,0,0.1);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .data-stream-base { fill: none; stroke: rgba(255,255,255,0.4); stroke-width: 2; }
        .data-stream-pulse {
          fill: none; stroke: #ffffff; stroke-width: 3; stroke-dasharray: 20 250; animation: flow-data 3s linear infinite; filter: drop-shadow(0 0 10px #ffffff);
        }
        @keyframes flow-data { 0% { stroke-dashoffset: 270; } 100% { stroke-dashoffset: 0; } }

        .widget {
          background: rgba(253, 251, 247, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 15px 30px -10px rgba(0,0,0,0.15), inset 0 0 20px rgba(255,255,255,0.5); border-radius: 20px; transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer;
        }
        .widget:hover {
          transform: scale(1.15) translateY(-10px) !important; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3), 0 0 50px rgba(117, 240, 154, 0.4), inset 0 0 30px rgba(255,255,255,0.8); border-color: #ffffff; z-index: 100 !important;
        }

        .ai-core-container { position: relative; width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 50px rgba(0, 240, 255, 0.4)); }
        .ai-outer-socket { position: absolute; inset: 0; border-radius: 50%; background: linear-gradient(135deg, #2a2e33, #111, #333, #000); box-shadow: inset -8px -8px 20px rgba(0,0,0,0.9), inset 8px 8px 20px rgba(255,255,255,0.1), 0 15px 30px rgba(0,0,0,0.6); border: 2px solid #444; }
        .ai-mech-ring { position: absolute; inset: 25px; border-radius: 50%; border: 3px dashed rgba(0, 240, 255, 0.4); animation: spin 20s linear infinite; }
        .ai-blue-core { position: absolute; width: 100px; height: 100px; background: radial-gradient(circle at 40% 40%, #a6faff, #00f0ff, #004488, #000); border-radius: 50%; box-shadow: 0 0 60px #00f0ff, inset 0 0 20px #000; display: flex; align-items: center; justify-content: center; animation: pulse-blue 3s infinite alternate; z-index: 10; }
        .ai-lens-inner { width: 40px; height: 40px; background: #001a33; border-radius: 50%; border: 2px solid rgba(0, 240, 255, 0.8); box-shadow: inset 0 0 15px #000, 0 0 10px #00f0ff; position: relative; display: flex; align-items: center; justify-content: center; }
        .ai-lens-glint { width: 12px; height: 12px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff; position: absolute; top: 6px; left: 6px; }
        @keyframes pulse-blue { 0% { box-shadow: 0 0 40px #00f0ff, inset 0 0 20px #000; } 100% { box-shadow: 0 0 80px #00f0ff, inset 0 0 20px #000; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .digital-time { font-family: 'Courier New', Courier, monospace; color: #1A1A1A; letter-spacing: 0.1em; }
        .wave-bar { width: 4px; background-color: #C24A35; border-radius: 2px; animation: wave 1.2s ease-in-out infinite alternate; box-shadow: 0 0 8px rgba(194, 74, 53, 0.3); }
        @keyframes wave { 0% { height: 10%; } 100% { height: 100%; } }
        .terminal-scroll { animation: scroll-up 10s linear infinite; }
        @keyframes scroll-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
      `}</style>

      {/* ARTISTIC AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full opacity-20 blur-[150px]" style={{ backgroundColor: laptopYellow }} />
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#FBD0D4] opacity-10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#CBE6F9] opacity-10 blur-[100px]" />
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* NEW STICKY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-4 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#1A1A1A]/10">
        <Link to="/" className="flex items-center gap-3 group">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1A1A1A]">
            <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
            <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
            <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="font-display italic text-2xl tracking-tight font-medium text-[#1A1A1A] group-hover:opacity-70 transition-opacity">threadwise</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">
          <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#1A1A1A] transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-[#1A1A1A] transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/login" className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
            Sign in
          </Link>
          <Link to="/app" className="group flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors duration-300 font-mono text-[11px] uppercase tracking-widest shadow-lg rounded-full">
            Start Free <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      {/* Add padding to main to account for fixed header */}
      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center flex-1">
        
        <div className="relative z-20 flex flex-col items-center mb-16 w-full max-w-5xl">
          <div className="relative flex justify-center items-center h-[450px] w-full">
            
            <div className="relative flex items-center justify-center">
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-14 h-10 hinge-piece rounded-l-xl z-20 flex items-center justify-end pr-3">
                <div className="w-2 h-2 bg-black/10 rounded-full shadow-inner" />
              </div>

              <div className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px] rounded-full lens-frame z-10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 rounded-full lens-glass-pure-white" />
                <div className="absolute top-[5%] left-[10%] w-[200px] h-[120px] glass-reflection-1 transform -rotate-[35deg] opacity-80" />
                <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[100px] glass-reflection-2 transform rotate-[15deg] opacity-50" />
                <div className="absolute top-[20%] left-[25%] w-5 h-5 rounded-full bg-[#FDF0B6] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <div className="absolute bottom-[25%] left-[30%] w-5 h-5 rounded-full bg-[#E8DAFB] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <h1 className="font-display text-[55px] md:text-[70px] tracking-tight text-[#1A1A1A] z-20 relative drop-shadow-sm">See what</h1>
              </div>

              <div className="relative -mx-5 z-0 drop-shadow-sm">
                <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 50 Q 60 10 120 50" stroke={laptopYellowDark} strokeWidth="14" strokeLinecap="round" />
                  <path d="M 0 50 Q 60 10 120 50" stroke={laptopYellow} strokeWidth="12" strokeLinecap="round" />
                  <path d="M 0 50 Q 60 10 120 50" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                </svg>
              </div>

              <div className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px] rounded-full lens-frame z-10 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 rounded-full lens-glass-pure-white" />
                <div className="absolute top-[10%] right-[10%] w-[180px] h-[110px] glass-reflection-1 transform rotate-[25deg] opacity-80" />
                <div className="absolute bottom-[15%] left-[10%] w-[220px] h-[90px] glass-reflection-2 transform -rotate-[10deg] opacity-50" />
                <div className="absolute top-[25%] right-[30%] w-5 h-5 rounded-full bg-[#FBD0D4] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <div className="absolute bottom-[20%] right-[25%] w-5 h-5 rounded-full bg-[#CBE6F9] shadow-[0_4px_12px_rgba(0,0,0,0.08)] z-10 border border-black/5" />
                <h1 className="font-display text-[55px] md:text-[70px] tracking-tight text-[#8B5CF6] italic z-20 relative drop-shadow-sm">connects.</h1>
              </div>

              <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-14 h-10 hinge-piece rounded-r-xl z-20 flex items-center justify-start pl-3">
                <div className="w-2 h-2 bg-black/10 rounded-full shadow-inner" />
              </div>
            </div>
          </div>

          <p className="text-lg md:text-xl text-[#1A1A1A]/50 leading-relaxed max-w-xl font-light mt-6">
            Bring your sources, questions, and ideas together.
          </p>
        </div>

        {/* THE YELLOW MACBOOK */}
        <div className="relative w-full max-w-[1100px] perspective-[2000px] group mt-4">
          <div 
            className="relative w-full rounded-t-2xl rounded-b-xl border-[12px] bg-[#2C2A28] overflow-hidden transition-all duration-300 ease-out"
            style={{ borderColor: laptopYellow, boxShadow: `0 40px 100px -20px rgba(0,0,0,0.3), 0 0 80px -20px ${laptopYellow}`, transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(0.98)`, transformStyle: 'preserve-3d' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-xl z-50 flex items-center justify-center" style={{ backgroundColor: laptopYellow }}>
              <div className="w-2 h-2 rounded-full bg-black/20" />
            </div>

            <div className="relative bg-[#FDFBF7] aspect-[16/10] flex overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-[#FDFBF7]">
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(to right, #A6917A 1px, transparent 1px), linear-gradient(to bottom, #A6917A 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1A1A1A]">
                    <circle cx="6" cy="18" r="2.5" fill="currentColor"/><path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/><circle cx="18" cy="6" r="2.5" fill="currentColor"/><path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>
                  </svg>
                  <span className="font-display italic text-sm tracking-tight text-[#1A1A1A]">Threadwise</span>
                </div>
                <div className="absolute top-12 left-4 flex flex-col gap-2 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1A1A] text-white rounded-md text-[10px] font-mono tracking-widest uppercase cursor-pointer shadow-md"><Layers className="w-3 h-3" /> Studio</div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black/5 text-[#1A1A1A] rounded-md text-[10px] font-mono tracking-widest uppercase cursor-pointer shadow-sm"><LayoutTemplate className="w-3 h-3" /> Plan</div>
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
                    {[{ icon: Users, label: "Live room & audio" }, { icon: TrendingUp, label: "Risk simulation" }, { icon: BookOpen, label: "Discourse lab" }, { icon: Sliders, label: "Scenario stress-test" }, { icon: Calendar, label: "Resource & runway" }, { icon: FileCheck, label: "Executive dossier" }, { icon: PieChart, label: "Executive radar" }, { icon: Map, label: "Spatial narratives" }, { icon: GitMerge, label: "Contradiction engine" }, { icon: PenTool, label: "Field capture" }, { icon: MessageSquare, label: "Conversation to canvas" }, { icon: Network, label: "External bridge" }, { icon: GitBranch, label: "Branches & merges" }].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 cursor-pointer text-[#1A1A1A]/70 transition-colors"><item.icon className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">{item.label}</span></div>
                    ))}
                  </div>
                  <div className="flex-1 p-4 flex flex-col">
                    <h3 className="font-display text-lg mb-4 text-[#1A1A1A]">Document & evidence</h3>
                    <button className="flex items-center justify-center gap-2 w-full py-2 bg-[#1A1A1A] text-white rounded-md text-[10px] font-mono tracking-widest uppercase hover:bg-black transition-colors shadow-sm"><FileText className="w-3.5 h-3.5" /> Open evidence clipper</button>
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
            <div className="h-6 flex items-center justify-center" style={{ backgroundColor: laptopYellow }}><div className="w-16 h-1 rounded-full" style={{ backgroundColor: laptopYellowDark }} /></div>
          </div>
          <div className="relative h-6 rounded-b-[2rem] mx-auto w-[110%] -ml-[5%] z-[-1]" style={{ backgroundColor: laptopYellowDark, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)' }}><div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-b-lg" /></div>
        </div>

        {/* THE DETECTIVE'S COMMAND CENTER */}
        <section id="features" className="w-full max-w-[1200px] mt-40 mb-24 relative flex flex-col items-center">
          <div className="text-center mb-16 relative z-30">
            <h2 className="font-display text-4xl md:text-5xl text-[#1A1A1A] mb-4">Every story has a thread.</h2>
            <p className="text-[#1A1A1A]/50 text-lg">Connect the evidence. Find the hidden motive.</p>
          </div>

          <div className="board-container w-full h-[700px] p-2">
            <div className="board-screen w-full h-full">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 280 180 Q 400 200 600 350" className="data-stream-base" /><path d="M 280 180 Q 400 200 600 350" className="data-stream-pulse" />
                <path d="M 920 180 Q 800 200 600 350" className="data-stream-base" /><path d="M 920 180 Q 800 200 600 350" className="data-stream-pulse" style={{ animationDelay: '0.5s' }} />
                <path d="M 280 520 Q 400 500 600 350" className="data-stream-base" /><path d="M 280 520 Q 400 500 600 350" className="data-stream-pulse" style={{ animationDelay: '1s' }} />
                <path d="M 920 520 Q 800 500 600 350" className="data-stream-base" /><path d="M 920 520 Q 800 500 600 350" className="data-stream-pulse" style={{ animationDelay: '1.5s' }} />
              </svg>

              <div className="widget absolute top-[12%] left-[8%] w-64 h-36 p-6 flex flex-col items-center justify-center z-10">
                <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity className="w-3 h-3 text-[#C24A35]" /> Sys Time</div>
                <div className="digital-time text-4xl font-bold">{formatTime(time)}</div>
              </div>

              <div className="widget absolute top-[15%] right-[8%] w-60 h-64 z-10 flex flex-col items-center pt-8 rounded-b-xl">
                <div className="absolute top-0 left-1/4 -translate-y-1/2 w-4 h-8 rounded-full border-4 border-gray-400 bg-transparent" /><div className="absolute top-0 right-1/4 -translate-y-1/2 w-4 h-8 rounded-full border-4 border-gray-400 bg-transparent" />
                <div className="w-48 h-52 bg-white shadow-lg border border-black/5 flex flex-col rounded-sm overflow-hidden">
                  <div className="w-full h-12 bg-[#C24A35] text-white flex items-center justify-center font-mono text-lg tracking-[0.3em] uppercase">{currentMonth}</div>
                  <div className="flex-1 flex items-center justify-center font-display text-7xl text-[#1A1A1A]">{currentDate}</div>
                </div>
              </div>

              <div className="widget absolute bottom-[12%] left-[10%] w-72 h-56 p-4 flex flex-col z-10 overflow-hidden">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/10 text-[10px] font-mono text-black/50 uppercase tracking-widest"><Terminal className="w-3 h-3 text-[#2D6A65]" /> Live Feed</div>
                <div className="font-mono text-[10px] text-[#1A1A1A] leading-relaxed overflow-hidden h-full relative">
                  <div className="terminal-scroll space-y-2">
                    <p>&gt; INGESTING MIAMI HERALD...</p><p>&gt; EXTRACTING KEY ENTITIES...</p><p>&gt; ENTITY MATCH: EL SALVADOR</p><p>&gt; ANALYZING PENTAGON BRIEFING...</p><p>&gt; DETECTING SEMANTIC OMISSIONS...</p><p>&gt; MOTIVE SUSPECTED: ECONOMIC</p><p>&gt; CROSS-REFERENCING LOCATIONS...</p><p>&gt; INGESTING MIAMI HERALD...</p><p>&gt; EXTRACTING KEY ENTITIES...</p><p>&gt; ENTITY MATCH: EL SALVADOR</p>
                  </div>
                </div>
              </div>

              <div className="widget absolute bottom-[15%] right-[10%] w-72 h-48 p-6 flex flex-col z-10">
                <div className="flex justify-between items-center mb-6 border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-black/50 uppercase tracking-widest"><Mic className="w-4 h-4 text-[#6B4C7A]" /> Audio Log 04</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ff0000]" /><span className="text-[10px] font-mono text-red-500 tracking-widest font-bold">REC</span></div>
                </div>
                <div className="flex-1 flex items-end justify-between gap-1 h-14 pb-2 px-2">
                  {[...Array(16)].map((_, i) => (<div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />))}
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                <div className="ai-core-container">
                  <div className="ai-outer-socket" /><div className="ai-mech-ring" /><div className="ai-blue-core"><div className="ai-lens-inner"><div className="ai-lens-glint" /></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-30 border-t border-[#1A1A1A]/10 py-8 mt-auto bg-[#FDFBF7]/80 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[10px] font-mono text-[#1A1A1A]/40">© 2026 Threadwise Inc.</span>
          <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">
             <Link to="/app" className="hover:text-[#1A1A1A] transition-colors">Workspace</Link>
             <a href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</a>
             <a href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}