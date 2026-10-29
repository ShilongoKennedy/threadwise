import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Activity, Cpu, Network, Layers, Target, 
  X, Users, TrendingUp, BookOpen, Sliders, 
  Calendar, FileCheck, PieChart, Map, GitMerge, 
  PenTool, MessageSquare, GitBranch, HelpCircle, LayoutTemplate,
  Mic, Terminal, Github, Twitter, Search, Fingerprint, ShieldAlert, FileWarning
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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

function useScrollReveal() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return { ref, isVisible };
}

function LandingPage() {
  const mouse = useMousePosition();
  
  // Auth State
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Disable tilt on small screens
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const tiltX = isMobile ? 0 : (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 6;
  const tiltY = isMobile ? 0 : (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * -6;

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

  const heroReveal = useScrollReveal();
  const laptopReveal = useScrollReveal();
  const commandCenterReveal = useScrollReveal();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#FBD0D4] selection:text-[#1A1A1A] overflow-hidden relative flex flex-col">
      
      <style>{`
        .reveal-hidden { opacity: 0; transform: translateY(40px); }
        .reveal-visible { opacity: 1; transform: translateY(0); transition: opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1s cubic-bezier(0.2, 0.8, 0.2, 1); }

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
          border: 8px solid ${laptopYellow};
          border-radius: 24px;
          box-shadow: inset 0 0 0 2px rgba(255,255,255,0.1), 0 40px 80px -20px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1);
          position: relative;
          padding: 4px;
        }
        @media (min-width: 768px) {
          .board-container { border-width: 16px; padding: 8px; }
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
          transform: scale(1.05) translateY(-5px) !important; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.3), 0 0 50px rgba(117, 240, 154, 0.4), inset 0 0 30px rgba(255,255,255,0.8); border-color: #ffffff; z-index: 100 !important;
        }
        @media (min-width: 768px) {
          .widget:hover { transform: scale(1.15) translateY(-10px) !important; }
        }

        .ai-core-container { position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.4)); }
        @media (min-width: 768px) { .ai-core-container { width: 220px; height: 220px; } }

        .ai-outer-socket { position: absolute; inset: 0; border-radius: 50%; background: linear-gradient(135deg, #2a2e33, #111, #333, #000); box-shadow: inset -8px -8px 20px rgba(0,0,0,0.9), inset 8px 8px 20px rgba(255,255,255,0.1), 0 15px 30px rgba(0,0,0,0.6); border: 2px solid #444; }
        .ai-mech-ring { position: absolute; inset: 15px; border-radius: 50%; border: 2px dashed rgba(0, 240, 255, 0.4); animation: spin 20s linear infinite; }
        @media (min-width: 768px) { .ai-mech-ring { inset: 25px; border-width: 3px; } }

        .ai-blue-core { position: absolute; width: 60px; height: 60px; background: radial-gradient(circle at 40% 40%, #a6faff, #00f0ff, #004488, #000); border-radius: 50%; box-shadow: 0 0 30px #00f0ff, inset 0 0 10px #000; display: flex; align-items: center; justify-content: center; animation: pulse-blue 3s infinite alternate; z-index: 10; }
        @media (min-width: 768px) { .ai-blue-core { width: 100px; height: 100px; box-shadow: 0 0 60px #00f0ff, inset 0 0 20px #000; } }

        .ai-lens-inner { width: 24px; height: 24px; background: #001a33; border-radius: 50%; border: 1px solid rgba(0, 240, 255, 0.8); box-shadow: inset 0 0 8px #000, 0 0 5px #00f0ff; position: relative; display: flex; align-items: center; justify-content: center; }
        @media (min-width: 768px) { .ai-lens-inner { width: 40px; height: 40px; border-width: 2px; box-shadow: inset 0 0 15px #000, 0 0 10px #00f0ff; } }

        .ai-lens-glint { width: 6px; height: 6px; background: #fff; border-radius: 50%; box-shadow: 0 0 5px #fff; position: absolute; top: 3px; left: 3px; }
        @media (min-width: 768px) { .ai-lens-glint { width: 12px; height: 12px; top: 6px; left: 6px; box-shadow: 0 0 10px #fff; } }

        @keyframes pulse-blue { 0% { box-shadow: 0 0 20px #00f0ff, inset 0 0 10px #000; } 100% { box-shadow: 0 0 50px #00f0ff, inset 0 0 10px #000; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .digital-time { font-family: 'Courier New', Courier, monospace; color: #1A1A1A; letter-spacing: 0.1em; }
        .wave-bar { width: 3px; background-color: #C24A35; border-radius: 2px; animation: wave 1.2s ease-in-out infinite alternate; box-shadow: 0 0 8px rgba(194, 74, 53, 0.3); }
        @media (min-width: 768px) { .wave-bar { width: 4px; } }
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

      {/* STICKY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-12 py-4 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#1A1A1A]/10">
        <Link to="/" className="flex items-center gap-2 md:gap-3 group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1A1A1A] md:w-7 md:h-7">
            <circle cx="6" cy="18" r="2.5" fill="currentColor"/><path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/><circle cx="18" cy="6" r="2.5" fill="currentColor"/><path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="font-display italic text-xl md:text-2xl tracking-tight font-medium text-[#1A1A1A] group-hover:opacity-70 transition-opacity">threadwise</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">
          <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#1A1A1A] transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-[#1A1A1A] transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3 md:gap-6">
          {session ? (
            <Link to="/app" className="group flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors duration-300 font-mono text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg rounded-full">
              Go to Workspace <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
                Sign in
              </Link>
              <Link to="/login" className="group flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors duration-300 font-mono text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg rounded-full">
                Start an Investigation <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-28 md:pt-32 pb-24 flex flex-col items-center text-center flex-1">
        
        {/* HERO SECTION - GLASSES */}
        <div 
          ref={heroReveal.ref}
          className={`relative z-20 flex flex-col items-center mb-16 w-full max-w-5xl transition-all duration-1000 ${heroReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div className="relative flex justify-center items-center h-[300px] md:h-[450px] w-full scale-[0.6] md:scale-100 origin-top">
            
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
                <h1 className="font-display text-[55px] md:text-[70px] tracking-tight text-[#8B5CF6] italic z-20 relative drop-shadow-sm">hides.</h1>
              </div>

              <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-14 h-10 hinge-piece rounded-r-xl z-20 flex items-center justify-start pl-3">
                <div className="w-2 h-2 bg-black/10 rounded-full shadow-inner" />
              </div>
            </div>
          </div>

          <p className="text-base md:text-xl text-[#1A1A1A]/50 leading-relaxed max-w-xl font-light mt-2 md:mt-6 px-4">
            Paste a speech. Uncover the hidden motives, contradictions, and strategic blind spots in seconds.
          </p>
        </div>

        {/* THE YELLOW MACBOOK */}
        <div 
          ref={laptopReveal.ref}
          className={`relative w-full max-w-[1100px] perspective-[2000px] group mt-4 transition-all duration-1000 delay-200 ${laptopReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div 
            className="relative w-full rounded-t-2xl rounded-b-xl border-8 md:border-[12px] bg-[#2C2A28] overflow-hidden transition-all duration-300 ease-out"
            style={{ borderColor: laptopYellow, boxShadow: `0 40px 100px -20px rgba(0,0,0,0.3), 0 0 80px -20px ${laptopYellow}`, transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(0.98)`, transformStyle: 'preserve-3d' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-4 md:h-6 rounded-b-xl z-50 flex items-center justify-center" style={{ backgroundColor: laptopYellow }}>
              <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-black/20" />
            </div>

            <div className="relative bg-[#FDFBF7] aspect-[16/10] flex overflow-hidden rounded-md md:rounded-lg">
              
              {/* FULL DASHBOARD MOCKUP INSIDE LAPTOP */}
              <div className="absolute inset-0 flex bg-[#FDFBF7]">
                
                {/* 1. Tiny Left Sidebar */}
                <div className="w-[18%] h-full border-r border-black/5 p-2 md:p-3 flex flex-col bg-[#FDFBF7]">
                  <div className="text-[6px] md:text-[8px] font-mono tracking-widest uppercase text-muted-foreground mb-2">Corpus · 3</div>
                  <div className="space-y-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col gap-0.5 p-1 rounded bg-black/5 border border-black/5">
                        <span className="text-[5px] md:text-[6px] text-muted-foreground font-mono">Oct 2026</span>
                        <span className="text-[6px] md:text-[7px] font-medium text-[#1A1A1A] truncate">Al Jazeera {i}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Main Content Area */}
                <div className="w-[82%] h-full flex flex-col">
                  
                  {/* Top Navigation Tabs */}
                  <div className="h-6 md:h-8 border-b border-black/5 flex items-center px-2 gap-1 md:gap-2 shrink-0">
                    <span className="text-[5px] md:text-[7px] font-mono tracking-wider uppercase text-[#1A1A1A] font-bold border-b-2 border-[#1A1A1A] py-1 px-1">Forensic Workbench</span>
                    <span className="text-[5px] md:text-[7px] font-mono tracking-wider uppercase text-muted-foreground py-1 px-1">Cross-Source</span>
                    <span className="text-[5px] md:text-[7px] font-mono tracking-wider uppercase text-muted-foreground py-1 px-1">Text Diff</span>
                  </div>

                  {/* Dashboard Body */}
                  <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left: Speech Text */}
                    <div className="w-1/2 h-full border-r border-black/5 p-2 md:p-4 overflow-hidden relative">
                      <div className="flex items-center gap-1 mb-2 md:mb-3">
                        <span className="text-[6px] md:text-[8px] font-mono tracking-widest uppercase text-[#C24A35]">Forensic Workbench</span>
                      </div>
                      <div className="font-serif text-[6px] md:text-[9px] leading-relaxed text-[#1A1A1A]/80">
                        <p className="mb-1.5">
                          "I was in a country somewhere in the Middle East... and the people said, we took our gold out of the vaults in New York City. You know what I said to him? <span className="bg-[#FDF0B6]/70 border-b border-[#E3D398] px-0.5 rounded-sm">I said, you have three armies within 400 miles who can come take your gold.</span>"
                        </p>
                        <p className="mb-1.5">
                          "That’s the real world. You’re not thinking clearly about safety. <span className="bg-[#FBD0D4]/60 border-b border-[#C24A35] px-0.5 rounded-sm">That gold is protected by the Atlantic, the Pacific, the United States military, the rule of law.</span>"
                        </p>
                      </div>
                    </div>

                    {/* Right: Analyst Margin */}
                    <div className="w-1/2 h-full p-2 md:p-4 flex flex-col gap-2 md:gap-3 overflow-hidden relative">
                      
                      {/* Top Metrics Row (Radar & Gauge) */}
                      <div className="flex gap-2">
                        <div className="flex-1 rounded border border-black/5 bg-white p-1.5 flex flex-col items-center">
                          <span className="text-[5px] md:text-[6px] font-mono uppercase text-muted-foreground self-start mb-1">Radar</span>
                          <svg viewBox="0 0 100 100" className="w-10 h-10 md:w-12 md:h-12">
                            <polygon points="50,10 90,40 75,85 25,85 10,40" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                            <polygon points="50,25 75,45 65,75 35,75 25,45" fill="none" stroke="#E5E5E5" strokeWidth="1" />
                            <polygon points="50,30 70,45 60,65 40,65 30,45" fill="#C24A35" fillOpacity="0.2" stroke="#C24A35" strokeWidth="2" />
                          </svg>
                        </div>
                        <div className="flex-1 rounded border border-black/5 bg-white p-1.5 flex flex-col items-center justify-center relative">
                          <span className="text-[5px] md:text-[6px] font-mono uppercase text-muted-foreground self-start absolute top-1.5 left-1.5">Friction</span>
                          <div className="text-[10px] md:text-[14px] font-display text-[#C24A35] mt-2">85<span className="text-[5px] md:text-[6px] text-muted-foreground">/100</span></div>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div className="bg-[#FDFBF7] border-l-2 border-[#C24A35] p-1.5 rounded-r shadow-sm">
                        <span className="text-[5px] md:text-[6px] font-mono uppercase text-[#C24A35] block mb-0.5">Executive Summary</span>
                        <p className="text-[6px] md:text-[7px] leading-tight text-[#1A1A1A] font-medium line-clamp-2">The speaker is using implicit threats of military force to reassure foreign investors, revealing a systemic fragility in dollar hegemony.</p>
                      </div>

                      {/* Margin Notes */}
                      <div className="space-y-1.5">
                        <div className="bg-white border border-black/10 rounded-lg p-1.5 md:p-2 shadow-sm">
                          <div className="flex items-center gap-1 mb-0.5">
                            <ShieldAlert className="w-2 h-2 md:w-2.5 md:h-2.5 text-[#C24A35]" />
                            <span className="text-[5px] md:text-[6px] font-bold font-mono uppercase text-muted-foreground">Contradiction</span>
                          </div>
                          <b className="block text-[6px] md:text-[7px] font-display mb-0.5">Rule of Law vs. Force</b>
                          <p className="text-[5px] md:text-[6px] text-muted-foreground leading-tight">Citing 'rule of law' alongside implicit military force reveals a protection-racket mentality.</p>
                        </div>

                        <div className="bg-white border border-black/10 rounded-lg p-1.5 md:p-2 shadow-sm">
                          <div className="flex items-center gap-1 mb-0.5">
                            <FileWarning className="w-2 h-2 md:w-2.5 md:h-2.5 text-[#E3D398]" />
                            <span className="text-[5px] md:text-[6px] font-bold font-mono uppercase text-muted-foreground">Fallacy</span>
                          </div>
                          <b className="block text-[6px] md:text-[7px] font-display mb-0.5">Appeal to Force</b>
                          <p className="text-[5px] md:text-[6px] text-muted-foreground leading-tight">Using the threat of the US military to persuade the country to leave its gold in New York.</p>
                        </div>
                      </div>

                      {/* Fade out bottom */}
                      <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-[#FDFBF7] to-transparent z-10" />
                    </div>

                  </div>
                </div>
              </div>

            </div>
            <div className="h-4 md:h-6 flex items-center justify-center" style={{ backgroundColor: laptopYellow }}><div className="w-12 md:w-16 h-1 rounded-full" style={{ backgroundColor: laptopYellowDark }} /></div>
          </div>
          <div className="relative h-4 md:h-6 rounded-b-[1rem] md:rounded-b-[2rem] mx-auto w-[105%] md:w-[110%] -ml-[2.5%] md:-ml-[5%] z-[-1]" style={{ backgroundColor: laptopYellowDark, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)' }}><div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-1 md:h-1.5 bg-black/10 rounded-b-lg" /></div>
        </div>

        {/* THE DETECTIVE'S COMMAND CENTER */}
        <section 
          id="features" 
          ref={commandCenterReveal.ref}
          className={`w-full max-w-[1200px] mt-24 md:mt-40 mb-24 relative flex flex-col items-center transition-all duration-1000 delay-300 ${commandCenterReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div className="text-center mb-10 md:mb-16 relative z-30 px-4">
            <h2 className="font-display text-3xl md:text-5xl text-[#1A1A1A] mb-2 md:mb-4">Find the hidden motive.</h2>
            <p className="text-[#1A1A1A]/50 text-sm md:text-lg">Cross-reference sources, expose contradictions, and map the truth.</p>
          </div>

          <div className="board-container w-full h-auto md:h-[700px] p-2">
            <div className="board-screen w-full h-full p-4 md:p-0 flex flex-col md:block gap-6 md:gap-0">
              
              <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0">
                <path d="M 280 180 Q 400 200 600 350" className="data-stream-base" /><path d="M 280 180 Q 400 200 600 350" className="data-stream-pulse" />
                <path d="M 920 180 Q 800 200 600 350" className="data-stream-base" /><path d="M 920 180 Q 800 200 600 350" className="data-stream-pulse" style={{ animationDelay: '0.5s' }} />
                <path d="M 280 520 Q 400 500 600 350" className="data-stream-base" /><path d="M 280 520 Q 400 500 600 350" className="data-stream-pulse" style={{ animationDelay: '1s' }} />
                <path d="M 920 520 Q 800 500 600 350" className="data-stream-base" /><path d="M 920 520 Q 800 500 600 350" className="data-stream-pulse" style={{ animationDelay: '1.5s' }} />
              </svg>

              <div className="relative md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 flex flex-col items-center z-20 order-1 md:order-none my-6 md:my-0">
                <div className="ai-core-container">
                  <div className="ai-outer-socket" /><div className="ai-mech-ring" /><div className="ai-blue-core"><div className="ai-lens-inner"><div className="ai-lens-glint" /></div></div>
                </div>
              </div>

              <div className="widget relative md:absolute md:top-[12%] md:left-[8%] w-full md:w-64 h-28 md:h-36 p-4 md:p-6 flex flex-col items-center justify-center z-10 order-2 md:order-none">
                <div className="text-[9px] md:text-[10px] font-mono text-black/40 uppercase tracking-widest mb-1 md:mb-2 flex items-center gap-1.5 md:gap-2"><Activity className="w-3 h-3 text-[#C24A35]" /> Sys Time</div>
                <div className="digital-time text-3xl md:text-4xl font-bold">{formatTime(time)}</div>
              </div>

              <div className="widget relative md:absolute md:top-[15%] md:right-[8%] w-full md:w-60 h-auto md:h-64 z-10 flex flex-col items-center py-4 md:pt-8 md:pb-0 rounded-xl md:rounded-b-xl order-3 md:order-none">
                <div className="hidden md:block absolute top-0 left-1/4 -translate-y-1/2 w-4 h-8 rounded-full border-4 border-gray-400 bg-transparent" /><div className="hidden md:block absolute top-0 right-1/4 -translate-y-1/2 w-4 h-8 rounded-full border-4 border-gray-400 bg-transparent" />
                <div className="w-40 md:w-48 h-36 md:h-52 bg-white shadow-lg border border-black/5 flex flex-col rounded-sm overflow-hidden">
                  <div className="w-full h-8 md:h-12 bg-[#C24A35] text-white flex items-center justify-center font-mono text-sm md:text-lg tracking-[0.3em] uppercase">{currentMonth}</div>
                  <div className="flex-1 flex items-center justify-center font-display text-5xl md:text-7xl text-[#1A1A1A]">{currentDate}</div>
                </div>
              </div>

              <div className="widget relative md:absolute md:bottom-[12%] md:left-[10%] w-full md:w-72 h-40 md:h-56 p-3 md:p-4 flex flex-col z-10 overflow-hidden order-4 md:order-none">
                <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3 pb-1.5 md:pb-2 border-b border-black/10 text-[9px] md:text-[10px] font-mono text-black/50 uppercase tracking-widest"><Terminal className="w-3 h-3 text-[#2D6A65]" /> OSINT Feed</div>
                <div className="font-mono text-[9px] md:text-[10px] text-[#1A1A1A] leading-relaxed overflow-hidden h-full relative">
                  <div className="terminal-scroll space-y-1.5 md:space-y-2">
                    <p>&gt; INGESTING SPEECH...</p><p>&gt; EXTRACTING ENTITIES...</p><p>&gt; MAPPING FALLACIES...</p><p>&gt; CONTRADICTION DETECTED</p><p>&gt; HIDDEN MOTIVE SUSPECTED</p><p>&gt; CROSS-REFERENCING NEWS...</p><p>&gt; INGESTING NEWS...</p><p>&gt; DRAFTING DOSSIER...</p>
                  </div>
                </div>
              </div>

              <div className="widget relative md:absolute md:bottom-[15%] md:right-[10%] w-full md:w-72 h-36 md:h-48 p-4 md:p-6 flex flex-col z-10 order-5 md:order-none">
                <div className="flex justify-between items-center mb-3 md:mb-6 border-b border-black/10 pb-2 md:pb-3">
                  <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-mono text-black/50 uppercase tracking-widest"><Mic className="w-3 h-3 md:w-4 md:h-4 text-[#6B4C7A]" /> Audio Intercept</div>
                  <div className="flex items-center gap-1.5 md:gap-2"><div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ff0000]" /><span className="text-[9px] md:text-[10px] font-mono text-red-500 tracking-widest font-bold">REC</span></div>
                </div>
                <div className="flex-1 flex items-end justify-between gap-1 h-10 md:h-14 pb-1 md:pb-2 px-1 md:px-2">
                  {[...Array(16)].map((_, i) => (<div key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />))}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* UPGRADED EDITORIAL FOOTER */}
      <footer className="relative z-30 border-t border-[#1A1A1A]/10 bg-[#FDFBF7]/80 backdrop-blur-md pt-16 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
            <div className="max-w-sm">
              <Link to="/" className="flex items-center gap-3 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1A1A1A]">
                  <circle cx="6" cy="18" r="2.5" fill="currentColor"/><path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/><circle cx="18" cy="6" r="2.5" fill="currentColor"/><path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>
                </svg>
                <span className="font-display italic text-2xl tracking-tight font-medium text-[#1A1A1A]">threadwise</span>
              </Link>
              <p className="text-sm text-[#1A1A1A]/50 leading-relaxed">
                A spatial intelligence workbench for researchers, strategists, and complex thinkers.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-12 md:gap-24 font-mono text-[11px] uppercase tracking-widest text-[#1A1A1A]/50">
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Product</span>
                <Link to="/app" className="hover:text-[#1A1A1A] transition-colors">Workspace</Link>
                <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
                <a href="#" className="hover:text-[#1A1A1A] transition-colors">Pricing</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Company</span>
                <a href="#" className="hover:text-[#1A1A1A] transition-colors">About</a>
                <a href="#" className="hover:text-[#1A1A1A] transition-colors">Blog</a>
                <a href="#" className="hover:text-[#1A1A1A] transition-colors">Contact</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Legal</span>
                <a href="#" className="hover:text-[#1A1A1A] transition-colors">Privacy</a>
                <a href="#" className="hover:text-[#1A1A1A] transition-colors">Terms</a>
                <a href="#" className="hover:text-[#1A1A1A] transition-colors">Security</a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1A1A1A]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] font-mono text-[#1A1A1A]/40 uppercase tracking-widest">© 2026 Threadwise Inc. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}