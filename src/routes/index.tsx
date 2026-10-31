import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, FileText, Activity, ShieldAlert, 
  FileWarning, Search, Github, Twitter
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
  const tiltX = isMobile ? 0 : (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 4;
  const tiltY = isMobile ? 0 : (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * -4;

  const heroReveal = useScrollReveal();
  const laptopReveal = useScrollReveal();
  const commandCenterReveal = useScrollReveal();

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#C24A35] selection:text-white overflow-hidden relative flex flex-col">
      
      <style>{`
        .reveal-hidden { opacity: 0; transform: translateY(40px); }
        .reveal-visible { opacity: 1; transform: translateY(0); transition: opacity 1.2s cubic-bezier(0.2, 0.8, 0.2, 1), transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1); }

        .glass-text {
          text-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        /* THE DARK WAR ROOM BOARD */
        .war-room-board {
          background-color: #121212;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          border: 12px solid #2A2A2A;
          border-radius: 16px;
          box-shadow: 
            inset 0 0 80px rgba(0,0,0,0.9), 
            0 40px 80px -20px rgba(0,0,0,0.4),
            0 0 0 1px rgba(0,0,0,0.8);
          position: relative;
          padding: 4px;
        }

        .evidence-card {
          background: #FDFBF7;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px;
          box-shadow: 2px 4px 12px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.5);
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          cursor: default;
          z-index: 10;
        }
        
        .tape {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%) rotate(-1deg);
          width: 90px;
          height: 28px;
          background: rgba(255,255,255,0.4);
          backdrop-filter: blur(2px);
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          z-index: 20;
        }

        .push-pin {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #C24A35;
          box-shadow: inset -1px -1px 3px rgba(0,0,0,0.5), inset 1px 1px 3px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.6);
          z-index: 30;
        }

        .laptop-bezel {
          background: #1A1A1A;
          border: 8px solid #2A2A2A;
          box-shadow: 
            0 40px 100px -20px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.1) inset,
            inset 0 0 20px rgba(0,0,0,0.8);
        }
      `}</style>

      {/* ARTISTIC AMBIENT BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full opacity-10 blur-[150px] bg-[#C24A35]" />
      </div>

      {/* SUBTLE GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

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
            <Link to="/app" className="group flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#1A1A1A] text-white hover:bg-[#C24A35] transition-colors duration-300 font-mono text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg rounded-full">
              Go to Workspace <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
                Sign in
              </Link>
              <Link to="/login" className="group flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#1A1A1A] text-white hover:bg-[#C24A35] transition-colors duration-300 font-mono text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg rounded-full">
                Start Investigation <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-4 md:px-6 pt-32 md:pt-40 pb-24 flex flex-col items-center text-center flex-1">
        
        {/* HERO SECTION - EDITORIAL TYPOGRAPHY */}
        <div 
          ref={heroReveal.ref}
          className={`relative z-20 flex flex-col items-center mb-16 w-full max-w-4xl transition-all duration-1000 ${heroReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          {/* Decorative Glasses Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[300px] pointer-events-none opacity-[0.03] z-0 flex items-center justify-center gap-4">
            <div className="w-[500px] h-[500px] rounded-full border-[20px] border-[#1A1A1A]" />
            <div className="w-[200px] h-[40px] border-y-[20px] border-[#1A1A1A]" />
            <div className="w-[500px] h-[500px] rounded-full border-[20px] border-[#1A1A1A]" />
          </div>

          <h1 className="relative z-10 font-display text-5xl md:text-7xl lg:text-8xl tracking-tight text-[#1A1A1A] leading-[1.05] mb-6">
            See what <br />
            <span className="italic text-[#C24A35] pr-2">hides.</span>
          </h1>

          <p className="relative z-10 text-lg md:text-xl text-[#1A1A1A]/60 leading-relaxed max-w-xl font-light mt-2 px-4">
            Paste a speech. Uncover the hidden motives, contradictions, and strategic blind spots in seconds.
          </p>
        </div>

        {/* THE DARK LAPTOP */}
        <div 
          ref={laptopReveal.ref}
          className={`relative w-full max-w-[1100px] perspective-[2000px] group mt-4 transition-all duration-1000 delay-200 ${laptopReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div 
            className="relative w-full rounded-t-2xl rounded-b-xl overflow-hidden transition-all duration-300 ease-out laptop-bezel"
            style={{ transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(0.98)`, transformStyle: 'preserve-3d' }}
          >
            {/* Laptop Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-4 md:h-6 rounded-b-xl z-50 flex items-center justify-center bg-[#2A2A2A]">
              <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-black/50 shadow-inner" />
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
                    <span className="text-[5px] md:text-[7px] font-mono tracking-wider uppercase text-[#1A1A1A] font-bold border-b-2 border-[#C24A35] py-1 px-1">Forensic Workbench</span>
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
            {/* Laptop Base/Hinge */}
            <div className="h-4 md:h-6 flex items-center justify-center bg-[#2A2A2A]"><div className="w-12 md:w-16 h-1 rounded-full bg-black/50" /></div>
          </div>
          {/* Laptop Shadow Base */}
          <div className="relative h-4 md:h-6 rounded-b-[1rem] md:rounded-b-[2rem] mx-auto w-[105%] md:w-[110%] -ml-[2.5%] md:-ml-[5%] z-[-1] bg-[#1A1A1A]" style={{ boxShadow: '0 40px 80px -15px rgba(0,0,0,0.6)' }}><div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-1 md:h-1.5 bg-black/50 rounded-b-lg" /></div>
        </div>

        {/* THE WAR ROOM (DARK TABLE) */}
        <section 
          id="features" 
          ref={commandCenterReveal.ref}
          className={`w-full max-w-[1200px] mt-32 md:mt-48 mb-24 relative flex flex-col items-center transition-all duration-1000 delay-300 ${commandCenterReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div className="text-center mb-10 md:mb-16 relative z-30 px-4">
            <h2 className="font-display text-4xl md:text-6xl text-[#1A1A1A] mb-3 md:mb-5 tracking-tight">Find the hidden motive.</h2>
            <p className="text-[#1A1A1A]/50 text-sm md:text-lg max-w-2xl mx-auto">Cross-reference sources, expose contradictions, and map the truth on a physical intelligence board.</p>
          </div>

          <div className="war-room-board w-full p-6 md:p-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-4xl mx-auto">
              
              {/* Card 1: Source Snippet */}
              <div className="evidence-card relative p-5 md:p-7 transform -rotate-1 w-full">
                <div className="tape" />
                <div className="push-pin top-3 left-3" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-[#2D6A65]" /> Source Ingested</div>
                <p className="font-serif text-[15px] md:text-lg leading-relaxed text-[#1A1A1A]/90">
                  "You know what I said to him? <span className="bg-[#FDF0B6]/70 border-b-2 border-[#E3D398] px-1 py-0.5 font-medium">I said, you have three armies within 400 miles who can come take your gold.</span>"
                </p>
              </div>

              {/* Card 2: Narrative Radar */}
              <div className="evidence-card relative p-5 md:p-7 transform rotate-1 w-full flex flex-col items-center">
                <div className="tape" />
                <div className="push-pin top-3 right-3" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest mb-3 flex items-center gap-2 w-full"><Activity className="w-3.5 h-3.5 text-[#C24A35]" /> Narrative Radar</div>
                <svg viewBox="0 0 120 120" className="w-40 h-40 md:w-48 md:h-48 mt-2">
                  <polygon points="60,10 110,45 90,105 30,105 10,45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <polygon points="60,30 90,55 75,90 45,90 30,55" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                  <polygon points="60,5 105,45 80,110 40,110 15,45" fill="#C24A35" fillOpacity="0.15" stroke="#C24A35" strokeWidth="2.5" />
                  <text x="60" y="5" fill="#1A1A1A" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">BIAS</text>
                  <text x="115" y="45" fill="#1A1A1A" fontSize="7" textAnchor="start" fontFamily="monospace" fontWeight="bold">OMISSION</text>
                  <text x="90" y="115" fill="#1A1A1A" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">URGENCY</text>
                  <text x="30" y="115" fill="#1A1A1A" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOTIVE</text>
                  <text x="5" y="45" fill="#1A1A1A" fontSize="7" textAnchor="end" fontFamily="monospace" fontWeight="bold">EVIDENCE</text>
                </svg>
              </div>

              {/* Card 3: Contradiction Gauge */}
              <div className="evidence-card relative p-5 md:p-7 transform rotate-1 w-full flex flex-col items-center">
                <div className="tape" />
                <div className="push-pin top-3 left-3" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest flex items-center gap-2 mb-6 w-full"><ShieldAlert className="w-3.5 h-3.5 text-[#C24A35]" /> Contradiction Index</div>
                <div className="relative w-full flex justify-center mt-2">
                   <svg viewBox="0 0 100 50" className="w-48 md:w-56 h-auto overflow-visible">
                      <path d="M 10 45 A 35 35 0 0 1 90 45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 10 45 A 35 35 0 0 1 75 18" fill="none" stroke="#C24A35" strokeWidth="12" strokeLinecap="round" />
                      <circle cx="50" cy="45" r="5" fill="#1A1A1A" />
                      <line x1="50" y1="45" x2="75" y2="18" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
                   </svg>
                   <div className="absolute -bottom-5 text-center bg-white px-4 py-1.5 rounded-full border border-black/10 shadow-md">
                     <span className="font-display text-3xl md:text-4xl text-[#C24A35]">85</span>
                     <span className="text-sm text-muted-foreground ml-1">/100</span>
                   </div>
                </div>
              </div>

              {/* Card 4: Analyst Margin */}
              <div className="evidence-card relative p-5 md:p-7 transform -rotate-1 w-full">
                <div className="tape" />
                <div className="push-pin top-3 right-3" />
                <div className="text-[10px] font-mono text-[#1A1A1A]/50 uppercase tracking-widest mb-4 flex items-center gap-2"><Search className="w-3.5 h-3.5 text-[#6B4C7A]" /> Analyst Margin</div>
                <div className="space-y-4">
                  <div className="bg-[#FDFBF7] border-l-4 border-[#C24A35] border-y border-r border-black/5 p-4 rounded-r shadow-sm">
                    <span className="text-[9px] font-mono uppercase text-[#C24A35] block mb-1 font-bold">Contradiction</span>
                    <b className="text-[13px] font-display block mb-1">Rule of Law vs. Force</b>
                    <p className="text-[11px] text-muted-foreground leading-tight">Citing 'rule of law' alongside implicit military force reveals a protection-racket mentality.</p>
                  </div>
                  <div className="bg-[#FDFBF7] border-l-4 border-[#E3D398] border-y border-r border-black/5 p-4 rounded-r shadow-sm">
                    <span className="text-[9px] font-mono uppercase text-[#E3D398] block mb-1 font-bold">Fallacy</span>
                    <b className="text-[13px] font-display block mb-1">Appeal to Force</b>
                    <p className="text-[11px] text-muted-foreground leading-tight">Using the threat of the US military to persuade the country to leave its gold in New York.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* EDITORIAL FOOTER */}
      <footer className="relative z-30 border-t border-[#1A1A1A]/10 bg-[#FDFBF7] pt-16 pb-8">
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