import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Activity, Cpu, Network, Layers, Target, 
  X, Users, TrendingUp, BookOpen, Sliders, 
  Calendar, FileCheck, PieChart, Map, GitMerge, 
  PenTool, MessageSquare, GitBranch, HelpCircle, LayoutTemplate,
  Mic
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
  const boardMint = "#75F09A"; 

  // Real-Time Clock State
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsDegrees = time.getSeconds() * 6;
  const minutesDegrees = time.getMinutes() * 6 + time.getSeconds() * 0.1;
  const hoursDegrees = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5;

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonth = monthNames[time.getMonth()];
  const currentDate = time.getDate();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative flex flex-col">
      
      {/* CSS for Interactions, Glasses, and Command Center */}
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

        /* --- THE PREMIUM COMMAND CENTER --- */
        
        .board-container {
          background-color: #1a1c1d;
          border: 16px solid ${laptopYellow};
          border-radius: 24px;
          box-shadow: 
            inset 0 0 0 2px rgba(255,255,255,0.1),
            0 40px 80px -20px rgba(0,0,0,0.4),
            0 0 0 1px rgba(0,0,0,0.1);
          position: relative;
          padding: 8px;
        }

        .board-screen {
          background-color: ${boardMint};
          background-image: 
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.2) 100%),
            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
          box-shadow: inset 0 0 80px rgba(0,0,0,0.2);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        /* Glowing Data Streams */
        .data-stream-base {
          fill: none;
          stroke: rgba(255,255,255,0.5);
          stroke-width: 2;
        }
        .data-stream-pulse {
          fill: none;
          stroke: #00f0ff;
          stroke-width: 3;
          stroke-dasharray: 20 250;
          animation: flow-data 3s linear infinite;
          filter: drop-shadow(0 0 10px #00f0ff);
        }
        @keyframes flow-data {
          0% { stroke-dashoffset: 270; }
          100% { stroke-dashoffset: 0; }
        }

        /* Floating Tools */
        .tool-card {
          background: #F9F7F1;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 
            0 20px 40px -10px rgba(0,0,0,0.25),
            inset 0 0 10px rgba(255,255,255,0.8);
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          cursor: pointer;
          border-radius: 12px;
        }
        
        .tool-card:hover {
          transform: scale(1.05) translateY(-5px) !important;
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.4);
          z-index: 50 !important;
        }

        @keyframes float-1 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes float-3 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes float-4 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }

        .animate-float-1 { animation: float-1 8s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 10s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 9s ease-in-out infinite; }
        .animate-float-4 { animation: float-4 11s ease-in-out infinite; }

        /* Blue AI Core */
        .ai-core-container {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 40px rgba(0, 240, 255, 0.4));
        }
        
        .ai-outer-socket {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a2e33, #111, #333, #000);
          box-shadow: 
            inset -5px -5px 15px rgba(0,0,0,0.9),
            inset 5px 5px 15px rgba(255,255,255,0.1),
            0 15px 30px rgba(0,0,0,0.6);
          border: 2px solid #444;
        }
        
        .ai-mech-ring {
          position: absolute;
          inset: 20px;
          border-radius: 50%;
          border: 3px dashed rgba(0, 240, 255, 0.4);
          animation: spin 15s linear infinite;
        }
        
        .ai-blue-core {
          position: absolute;
          width: 90px;
          height: 90px;
          background: radial-gradient(circle at 40% 40%, #a6faff, #00f0ff, #004488, #000);
          border-radius: 50%;
          box-shadow: 
            0 0 50px #00f0ff,
            inset 0 0 20px #000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse-blue 2s infinite alternate;
          z-index: 10;
        }
        
        .ai-lens-inner {
          width: 35px;
          height: 35px;
          background: #001a33;
          border-radius: 50%;
          border: 2px solid rgba(0, 240, 255, 0.8);
          box-shadow: inset 0 0 15px #000, 0 0 10px #00f0ff;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ai-lens-glint {
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 10px #fff;
          position: absolute;
          top: 5px;
          left: 5px;
        }

        @keyframes pulse-blue {
          0% { box-shadow: 0 0 30px #00f0ff, inset 0 0 20px #000; }
          100% { box-shadow: 0 0 70px #00f0ff, inset 0 0 20px #000; }
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        /* Clock Details */
        .clock-tick {
          position: absolute;
          width: 2px;
          height: 8px;
          background: #333;
          top: 6px;
          left: 50%;
          transform-origin: 50% 72px; /* Adjust based on clock size */
        }

        /* Magnifying Glass */
        .magnifier-lens {
          position: absolute;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 6px solid #555;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(2px) contrast(1.2);
          box-shadow: 
            inset 0 0 20px rgba(255,255,255,0.4),
            inset 5px 5px 15px rgba(0,0,0,0.1),
            0 10px 20px rgba(0,0,0,0.3);
          z-index: 20;
          animation: scan-magnify 8s ease-in-out infinite alternate;
        }
        
        .magnifier-handle {
          position: absolute;
          bottom: -30px;
          right: -15px;
          width: 14px;
          height: 50px;
          background: linear-gradient(to right, #4a2c11, #8b5a2b, #4a2c11);
          border-radius: 7px;
          transform: rotate(45deg);
          z-index: 19;
          box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
        }

        @keyframes scan-magnify {
          0% { transform: translate(-20px, 20px) rotate(-15deg); }
          100% { transform: translate(40px, -20px) rotate(15deg); }
        }

        /* Waveform Animation */
        .wave-bar {
          width: 4px;
          background-color: #4ade80;
          border-radius: 2px;
          animation: wave 1.2s ease-in-out infinite alternate;
          box-shadow: 0 0 5px #4ade80;
        }
        @keyframes wave {
          0% { height: 10%; }
          100% { height: 100%; }
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


        {/* THE DETECTIVE'S COMMAND CENTER */}
        <section className="w-full max-w-[1200px] mt-40 mb-24 relative flex flex-col items-center">
          <div className="text-center mb-16 relative z-30">
            <h2 className="font-display text-4xl md:text-5xl text-[#1A1A1A] mb-4">Every story has a thread.</h2>
            <p className="text-[#1A1A1A]/50 text-lg">Connect the evidence. Find the hidden motive.</p>
          </div>

          <div className="board-container w-full h-[700px] p-2">
            <div className="board-screen w-full h-full">
              
              {/* The Animated Data Streams */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 280 180 Q 400 200 600 350" className="data-stream-base" />
                <path d="M 280 180 Q 400 200 600 350" className="data-stream-pulse" />
                
                <path d="M 920 180 Q 800 200 600 350" className="data-stream-base" />
                <path d="M 920 180 Q 800 200 600 350" className="data-stream-pulse" style={{ animationDelay: '0.5s' }} />
                
                <path d="M 280 520 Q 400 500 600 350" className="data-stream-base" />
                <path d="M 280 520 Q 400 500 600 350" className="data-stream-pulse" style={{ animationDelay: '1s' }} />
                
                <path d="M 920 520 Q 800 500 600 350" className="data-stream-base" />
                <path d="M 920 520 Q 800 500 600 350" className="data-stream-pulse" style={{ animationDelay: '1.5s' }} />
              </svg>

              {/* Tool 1: Working Analog Clock */}
              <div className="tool-card animate-float-1 absolute top-[12%] left-[10%] w-52 h-52 rounded-full z-10 flex items-center justify-center border-8 border-[#D1C7B7] bg-[#FDFBF7] shadow-2xl">
                <div className="relative w-40 h-40 rounded-full bg-[#FCFAF8] shadow-inner flex items-center justify-center border border-black/10">
                  {/* Tick Marks */}
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-3 bg-black/60 top-2 left-1/2 -translate-x-1/2" style={{ transform: `rotate(${i * 30}deg) translateY(-60px)` }} />
                  ))}
                  {/* Hands */}
                  <div className="clock-hand w-2 h-12 bg-black z-20 rounded-full" style={{ transform: `rotate(${hoursDegrees}deg)` }} />
                  <div className="clock-hand w-1.5 h-16 bg-black/80 z-20 rounded-full" style={{ transform: `rotate(${minutesDegrees}deg)` }} />
                  <div className="clock-hand w-1 h-16 bg-[#C22B2B] z-30 rounded-full" style={{ transform: `rotate(${secondsDegrees}deg)` }} />
                  {/* Center Pin */}
                  <div className="absolute w-4 h-4 bg-black rounded-full z-40 border-2 border-white/50" />
                </div>
              </div>

              {/* Tool 2: Desk Flip Calendar */}
              <div className="tool-card animate-float-2 absolute top-[15%] right-[10%] w-60 h-72 z-10 flex flex-col items-center pt-8 bg-[#F9F7F1] border border-black/10 rounded-b-xl shadow-2xl">
                {/* Metal Spirals */}
                <div className="absolute top-0 left-1/4 -translate-y-1/2 w-4 h-8 rounded-full border-4 border-gray-400 bg-transparent" />
                <div className="absolute top-0 right-1/4 -translate-y-1/2 w-4 h-8 rounded-full border-4 border-gray-400 bg-transparent" />
                
                {/* Calendar Body */}
                <div className="w-48 h-56 bg-white shadow-lg border border-black/5 flex flex-col rounded-sm overflow-hidden">
                  <div className="w-full h-14 bg-[#C22B2B] text-white flex items-center justify-center font-mono text-xl tracking-[0.3em] uppercase">
                    {currentMonth}
                  </div>
                  <div className="flex-1 flex items-center justify-center font-display text-8xl text-[#1A1A1A]">
                    {currentDate}
                  </div>
                </div>
              </div>

              {/* Tool 3: Redacted Document & Magnifier */}
              <div className="tool-card animate-float-3 absolute bottom-[12%] left-[12%] w-72 h-80 z-10 p-6 bg-[#F4EFE6] border border-[#D1C7B7] rotate-[-3deg] shadow-2xl">
                {/* Top Secret Stamp */}
                <div className="absolute top-6 right-6 border-4 border-[#C22B2B] text-[#C22B2B] text-xs font-mono px-3 py-1 rotate-12 opacity-80 uppercase font-bold tracking-widest rounded-sm">
                  Top Secret
                </div>
                
                <div className="flex flex-col gap-3 mt-8">
                  <div className="h-3 w-full bg-black/90 rounded-sm" />
                  <div className="h-3 w-5/6 bg-black/90 rounded-sm" />
                  <div className="h-3 w-full bg-black/90 rounded-sm" />
                  <div className="h-3 w-3/4 bg-black/90 rounded-sm" />
                  <div className="h-3 w-full bg-black/90 rounded-sm" />
                  <div className="h-3 w-4/5 bg-black/90 rounded-sm" />
                </div>

                {/* Magnifying Glass overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="magnifier-lens">
                    <div className="magnifier-handle" />
                  </div>
                </div>
              </div>

              {/* Tool 4: Voice Recorder */}
              <div className="tool-card animate-float-4 absolute bottom-[15%] right-[12%] w-72 h-52 z-10 p-6 bg-[#2C2A28] border border-[#444] rounded-xl flex flex-col shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/50 uppercase tracking-widest">
                    <Mic className="w-4 h-4 text-[#00f0ff]" /> Audio Log 04
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ff0000]" />
                    <span className="text-[10px] font-mono text-red-500 tracking-widest">REC</span>
                  </div>
                </div>

                {/* Tape Spools & Waveform */}
                <div className="flex items-center gap-6 h-full">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-full border-[6px] border-dashed border-gray-500 animate-spin bg-black/40" style={{ animationDuration: '6s' }} />
                    <div className="w-14 h-14 rounded-full border-[6px] border-dashed border-gray-500 animate-spin bg-black/40" style={{ animationDuration: '6s' }} />
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-1 h-14 pb-2">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Center: The Blue AI Core */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                <div className="ai-core-container">
                  <div className="ai-outer-socket" />
                  <div className="ai-mech-ring" />
                  <div className="ai-blue-core">
                    <div className="ai-lens-inner">
                      <div className="ai-lens-glint" />
                    </div>
                  </div>
                </div>
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