import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, Sparkles, FileText, Lightbulb, 
  Activity, Cpu, Network, Layers, Target, Globe,
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

        /* NEW SIMPLE BOARD STYLES */
        .war-room-board {
          background-color: #1A1C1D;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          border: 8px solid ${laptopYellow};
          border-radius: 24px;
          box-shadow: inset 0 0 100px rgba(0,0,0,0.8), 0 40px 80px -20px rgba(0,0,0,0.5);
          position: relative;
          padding: 4px;
        }
        @media (min-width: 768px) {
          .war-room-board { border-width: 16px; padding: 8px; }
        }

        .evidence-card {
          background: #FDFBF7;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          box-shadow: 2px 4px 12px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.5);
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          cursor: pointer;
          z-index: 10;
        }
        .evidence-card:hover {
          transform: translateY(-8px) rotate(0deg) !important;
          box-shadow: 6px 12px 24px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.5);
          z-index: 50 !important;
        }
        
        .tape {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%) rotate(-2deg);
          width: 80px;
          height: 24px;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(2px);
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 20;
        }

        .push-pin {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #C24A35;
          box-shadow: inset -2px -2px 4px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.5);
          z-index: 30;
        }
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

        {/* THE WAR ROOM (SIMPLE STATIC BOARD) */}
        <section 
          id="features" 
          ref={commandCenterReveal.ref}
          className={`w-full max-w-[1200px] mt-24 md:mt-40 mb-24 relative flex flex-col items-center transition-all duration-1000 delay-300 ${commandCenterReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div className="text-center mb-10 md:mb-16 relative z-30 px-4">
            <h2 className="font-display text-3xl md:text-5xl text-[#1A1A1A] mb-2 md:mb-4">Find the hidden motive.</h2>
            <p className="text-[#1A1A1A]/50 text-sm md:text-lg">Cross-reference sources, expose contradictions, and map the truth.</p>
          </div>

          <div className="war-room-board w-full p-6 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 w-full max-w-4xl mx-auto">
              
              {/* Card 1: Source Snippet */}
              <div className="evidence-card relative p-5 md:p-6 transform -rotate-1 w-full">
                <div className="tape" />
                <div className="push-pin top-2 left-2" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FileText className="w-3 h-3 text-[#2D6A65]" /> Source Ingested</div>
                <p className="font-serif text-sm leading-relaxed text-[#1A1A1A]/80">
                  "You know what I said to him? <span className="bg-[#FDF0B6]/70 border-b border-[#E3D398] px-0.5">I said, you have three armies within 400 miles who can come take your gold.</span>"
                </p>
              </div>

              {/* Card 2: Narrative Radar */}
              <div className="evidence-card relative p-5 md:p-6 transform rotate-1 w-full flex flex-col items-center">
                <div className="tape" />
                <div className="push-pin top-2 right-2" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest mb-3 flex items-center gap-1.5 w-full"><Activity className="w-3 h-3 text-[#C24A35]" /> Narrative Radar</div>
                <svg viewBox="0 0 120 120" className="w-32 h-32 md:w-40 md:h-40 mt-2">
                  <polygon points="60,10 110,45 90,105 30,105 10,45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <polygon points="60,30 90,55 75,90 45,90 30,55" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <polygon points="60,5 105,45 80,110 40,110 15,45" fill="#C24A35" fillOpacity="0.15" stroke="#C24A35" strokeWidth="2" />
                  <text x="60" y="5" fill="#1A1A1A" fontSize="6" textAnchor="middle" fontFamily="monospace" fontWeight="bold">BIAS</text>
                  <text x="115" y="45" fill="#1A1A1A" fontSize="6" textAnchor="start" fontFamily="monospace" fontWeight="bold">OMISSION</text>
                  <text x="90" y="115" fill="#1A1A1A" fontSize="6" textAnchor="middle" fontFamily="monospace" fontWeight="bold">URGENCY</text>
                  <text x="30" y="115" fill="#1A1A1A" fontSize="6" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOTIVE</text>
                  <text x="5" y="45" fill="#1A1A1A" fontSize="6" textAnchor="end" fontFamily="monospace" fontWeight="bold">EVIDENCE</text>
                </svg>
              </div>

              {/* Card 3: Contradiction Gauge */}
              <div className="evidence-card relative p-5 md:p-6 transform rotate-1 w-full flex flex-col items-center">
                <div className="tape" />
                <div className="push-pin top-2 left-2" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest flex items-center gap-1.5 mb-4 w-full"><ShieldAlert className="w-3 h-3 text-[#C24A35]" /> Contradiction Index</div>
                <div className="relative w-full flex justify-center mt-2">
                   <svg viewBox="0 0 100 50" className="w-40 md:w-48 h-auto overflow-visible">
                      <path d="M 10 45 A 35 35 0 0 1 90 45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="10" strokeLinecap="round" />
                      <path d="M 10 45 A 35 35 0 0 1 75 18" fill="none" stroke="#C24A35" strokeWidth="10" strokeLinecap="round" />
                      <circle cx="50" cy="45" r="4" fill="#1A1A1A" />
                      <line x1="50" y1="45" x2="75" y2="18" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
                   </svg>
                   <div className="absolute -bottom-4 text-center bg-white px-3 py-1 rounded-full border border-black/5 shadow-sm">
                     <span className="font-display text-2xl md:text-3xl text-[#C24A35]">85</span>
                     <span className="text-xs text-muted-foreground">/100</span>
                   </div>
                </div>
              </div>

              {/* Card 4: Analyst Margin */}
              <div className="evidence-card relative p-5 md:p-6 transform -rotate-1 w-full">
                <div className="tape" />
                <div className="push-pin top-2 right-2" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Search className="w-3 h-3 text-[#6B4C7A]" /> Analyst Margin</div>
                <div className="space-y-3">
                  <div className="bg-[#FDFBF7] border-l-4 border-[#C24A35] border-y border-r border-black/5 p-3 rounded-r shadow-sm">
                    <span className="text-[8px] font-mono uppercase text-[#C24A35] block mb-1 font-bold">Contradiction</span>
                    <b className="text-[11px] font-display block mb-1">Rule of Law vs. Force</b>
                    <p className="text-[9px] text-muted-foreground leading-tight">Citing 'rule of law' alongside implicit military force reveals a protection-racket mentality.</p>
                  </div>
                  <div className="bg-[#FDFBF7] border-l-4 border-[#E3D398] border-y border-r border-black/5 p-3 rounded-r shadow-sm">
                    <span className="text-[8px] font-mono uppercase text-[#E3D398] block mb-1 font-bold">Fallacy</span>
                    <b className="text-[11px] font-display block mb-1">Appeal to Force</b>
                    <p className="text-[9px] text-muted-foreground leading-tight">Using the threat of the US military to persuade the country to leave its gold in New York.</p>
                  </div>
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