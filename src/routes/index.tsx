import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, FileText, Activity, ShieldAlert, 
  FileWarning, Search, Github, Twitter, Crosshair
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
  const tiltX = isMobile ? 0 : (mouse.y / (typeof window !== 'undefined' ? window.innerHeight : 800) - 0.5) * 3;
  const tiltY = isMobile ? 0 : (mouse.x / (typeof window !== 'undefined' ? window.innerWidth : 1200) - 0.5) * -3;

  const heroReveal = useScrollReveal();
  const laptopReveal = useScrollReveal();
  const commandCenterReveal = useScrollReveal();

  const accentBlue = "#1A4BFF";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#1A4BFF] selection:text-white overflow-hidden relative flex flex-col">
      
      <style>{`
        .reveal-hidden { opacity: 0; transform: translateY(30px); }
        .reveal-visible { opacity: 1; transform: translateY(0); transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1); }

        .laptop-bezel {
          background: #0A0A0A;
          border: 12px solid #1A1A1A;
          box-shadow: 
            0 60px 120px -20px rgba(0,0,0,0.8),
            0 0 0 1px rgba(255,255,255,0.05) inset,
            inset 0 0 40px rgba(0,0,0,1);
          border-radius: 12px 12px 4px 4px;
        }
        
        .editorial-line {
          height: 1px;
          background: #1A1A1A;
          opacity: 0.1;
        }

        .dossier-card {
          background: #FFFFFF;
          border: 1px solid #1A1A1A;
          box-shadow: 4px 4px 0px rgba(26,26,26,0.05);
          position: relative;
        }

        .stamp {
          border: 2px solid #C24A35;
          color: #C24A35;
          padding: 2px 8px;
          font-family: monospace;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          transform: rotate(-4deg);
          display: inline-block;
        }
      `}</style>

      {/* SUBTLE GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `linear-gradient(to right, #1A1A1A 1px, transparent 1px), linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      {/* TARGETING CROSSHAIRS IN CORNERS */}
      <div className="absolute top-20 left-6 w-4 h-4 border-t border-l border-[#1A1A1A]/20 pointer-events-none" />
      <div className="absolute top-20 right-6 w-4 h-4 border-t border-r border-[#1A1A1A]/20 pointer-events-none" />
      <div className="absolute bottom-20 left-6 w-4 h-4 border-b border-l border-[#1A1A1A]/20 pointer-events-none" />
      <div className="absolute bottom-20 right-6 w-4 h-4 border-b border-r border-[#1A1A1A]/20 pointer-events-none" />

      {/* STICKY HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-12 py-4 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#1A1A1A]/10">
        <Link to="/" className="flex items-center gap-2 md:gap-3 group">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1A1A1A] md:w-6 md:h-6">
            <circle cx="6" cy="18" r="2.5" fill="currentColor"/><path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/><circle cx="18" cy="6" r="2.5" fill="currentColor"/><path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="font-display italic text-xl tracking-tight font-medium text-[#1A1A1A] group-hover:text-[#1A4BFF] transition-colors">threadwise</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">
          <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#1A1A1A] transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-[#1A1A1A] transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3 md:gap-6">
          {session ? (
            <Link to="/app" className="group flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#1A1A1A] text-white hover:bg-[#1A4BFF] transition-colors duration-300 font-mono text-[10px] md:text-[11px] uppercase tracking-widest shadow-sm rounded-sm">
              Go to Workspace <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
                Sign in
              </Link>
              <Link to="/login" className="group flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#1A1A1A] text-white hover:bg-[#1A4BFF] transition-colors duration-300 font-mono text-[10px] md:text-[11px] uppercase tracking-widest shadow-sm rounded-sm">
                Start Investigation <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-32 md:pt-48 pb-24 flex-1">
        
        {/* HERO SECTION - ASYMMETRICAL EDITORIAL */}
        <div 
          ref={heroReveal.ref}
          className={`relative z-20 grid grid-cols-1 md:grid-cols-12 gap-8 mb-24 w-full transition-all duration-1000 ${heroReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          {/* Left Side: Massive Typography */}
          <div className="md:col-span-8 flex flex-col items-start text-left">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-[1px] bg-[#1A4BFF]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A4BFF] font-bold">Forensic Intelligence OS</span>
            </div>
            
            <h1 className="font-display text-[72px] md:text-[120px] lg:text-[150px] tracking-tighter text-[#1A1A1A] leading-[0.85] mb-8">
              See what <br />
              <span className="text-[#1A4BFF] pr-4 tracking-normal" style={{ fontFamily: "Fraunces, serif", fontStyle: "normal", fontWeight: 600 }}>hides.</span>
            </h1>

            <p className="text-lg md:text-2xl text-[#1A1A1A]/60 leading-relaxed max-w-xl font-light">
              Paste a speech. Uncover the hidden motives, contradictions, and strategic blind spots in seconds.
            </p>
          </div>

          {/* Right Side: Technical Annotations */}
          <div className="md:col-span-4 hidden md:flex flex-col justify-end pb-8 border-l border-[#1A1A1A]/10 pl-8">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 space-y-4">
              <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-2">
                <span>Status</span>
                <span className="text-[#1A4BFF]">Ready</span>
              </div>
              <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-2">
                <span>AI Models</span>
                <span>DeepSeek / OpenAI</span>
              </div>
              <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-2">
                <span>Latency</span>
                <span>&lt; 2.4s</span>
              </div>
              <div className="flex justify-between pb-2">
                <span>Clearance</span>
                <span>Level 4</span>
              </div>
            </div>
            <Crosshair className="w-8 h-8 text-[#1A1A1A]/10 mt-8 self-end" />
          </div>
        </div>

        {/* THE DARK LAPTOP (BREAKING THE GRID) */}
        <div 
          ref={laptopReveal.ref}
          className={`relative w-full max-w-[1200px] mx-auto perspective-[2000px] group transition-all duration-1000 delay-200 -mt-12 md:-mt-24 z-30 ${laptopReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div 
            className="relative w-full overflow-hidden transition-all duration-300 ease-out laptop-bezel"
            style={{ transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1)`, transformStyle: 'preserve-3d' }}
          >
            {/* Laptop Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-xl z-50 flex items-center justify-center bg-[#1A1A1A]">
              <div className="w-2 h-2 rounded-full bg-black/60 shadow-inner" />
            </div>

            <div className="relative bg-[#FDFBF7] aspect-[16/10] flex overflow-hidden rounded-t-md">
              
              {/* FULL DASHBOARD MOCKUP INSIDE LAPTOP */}
              <div className="absolute inset-0 flex bg-[#FDFBF7]">
                
                {/* 1. Tiny Left Sidebar */}
                <div className="w-[16%] h-full border-r border-black/5 p-3 flex flex-col bg-[#FDFBF7]">
                  <div className="text-[8px] font-mono tracking-widest uppercase text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#1A4BFF]" />
                    Corpus · 3
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col gap-0.5 p-1.5 rounded-sm bg-black/5 border border-black/5">
                        <span className="text-[6px] text-muted-foreground font-mono">Oct 2026</span>
                        <span className="text-[8px] font-medium text-[#1A1A1A] truncate">Al Jazeera {i}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Main Content Area */}
                <div className="w-[84%] h-full flex flex-col">
                  
                  {/* Top Navigation Tabs */}
                  <div className="h-10 border-b border-black/5 flex items-center px-4 gap-4 shrink-0 bg-white">
                    <span className="text-[8px] font-mono tracking-wider uppercase text-[#1A1A1A] font-bold border-b-2 border-[#1A4BFF] py-2.5 px-1">Forensic Workbench</span>
                    <span className="text-[8px] font-mono tracking-wider uppercase text-muted-foreground py-2.5 px-1">Cross-Source</span>
                    <span className="text-[8px] font-mono tracking-wider uppercase text-muted-foreground py-2.5 px-1">Text Diff</span>
                  </div>

                  {/* Dashboard Body */}
                  <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left: Speech Text */}
                    <div className="w-1/2 h-full border-r border-black/5 p-6 overflow-hidden relative bg-[#FDFBF7]">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-[8px] font-mono tracking-widest uppercase text-[#1A4BFF] font-bold">Forensic Workbench</span>
                      </div>
                      <div className="font-serif text-[11px] leading-relaxed text-[#1A1A1A]/80">
                        <p className="mb-3">
                          "I was in a country somewhere in the Middle East... and the people said, we took our gold out of the vaults in New York City. You know what I said to him? <span className="bg-[#1A4BFF]/10 border-b border-[#1A4BFF] px-1 py-0.5 rounded-sm">I said, you have three armies within 400 miles who can come take your gold.</span>"
                        </p>
                        <p className="mb-3">
                          "That’s the real world. You’re not thinking clearly about safety. <span className="bg-[#1A4BFF]/10 border-b border-[#1A4BFF] px-1 py-0.5 rounded-sm">That gold is protected by the Atlantic, the Pacific, the United States military, the rule of law.</span>"
                        </p>
                      </div>
                    </div>

                    {/* Right: Analyst Margin */}
                    <div className="w-1/2 h-full p-6 flex flex-col gap-4 overflow-hidden relative bg-white">
                      
                      {/* Top Metrics Row (Radar & Gauge) */}
                      <div className="flex gap-3">
                        <div className="flex-1 rounded-sm border border-black/10 bg-[#FDFBF7] p-2 flex flex-col items-center">
                          <span className="text-[7px] font-mono uppercase text-muted-foreground self-start mb-1">Radar</span>
                          <svg viewBox="0 0 100 100" className="w-14 h-14">
                            <polygon points="50,10 90,40 75,85 25,85 10,40" fill="none" stroke="#E5E5E5" strokeWidth="2" />
                            <polygon points="50,25 75,45 65,75 35,75 25,45" fill="none" stroke="#E5E5E5" strokeWidth="1" />
                            <polygon points="50,30 70,45 60,65 40,65 30,45" fill="#1A4BFF" fillOpacity="0.15" stroke="#1A4BFF" strokeWidth="2" />
                          </svg>
                        </div>
                        <div className="flex-1 rounded-sm border border-black/10 bg-[#FDFBF7] p-2 flex flex-col items-center justify-center relative">
                          <span className="text-[7px] font-mono uppercase text-muted-foreground self-start absolute top-2 left-2">Friction</span>
                          <div className="text-[18px] font-display text-[#1A4BFF] mt-2">85<span className="text-[8px] text-muted-foreground">/100</span></div>
                        </div>
                      </div>

                      {/* Executive Summary */}
                      <div className="bg-[#FDFBF7] border-l-4 border-[#1A4BFF] p-2 rounded-r shadow-sm">
                        <span className="text-[7px] font-mono uppercase text-[#1A4BFF] block mb-1 font-bold">Executive Summary</span>
                        <p className="text-[9px] leading-tight text-[#1A1A1A] font-medium line-clamp-2">The speaker is using implicit threats of military force to reassure foreign investors, revealing a systemic fragility in dollar hegemony.</p>
                      </div>

                      {/* Margin Notes */}
                      <div className="space-y-2">
                        <div className="bg-white border border-black/10 rounded-sm p-2 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert className="w-3 h-3 text-[#1A4BFF]" />
                            <span className="text-[7px] font-bold font-mono uppercase text-muted-foreground">Contradiction</span>
                          </div>
                          <b className="block text-[9px] font-display mb-1">Rule of Law vs. Force</b>
                          <p className="text-[8px] text-muted-foreground leading-tight">Citing 'rule of law' alongside implicit military force reveals a protection-racket mentality.</p>
                        </div>

                        <div className="bg-white border border-black/10 rounded-sm p-2 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <FileWarning className="w-3 h-3 text-[#E3D398]" />
                            <span className="text-[7px] font-bold font-mono uppercase text-muted-foreground">Fallacy</span>
                          </div>
                          <b className="block text-[9px] font-display mb-1">Appeal to Force</b>
                          <p className="text-[8px] text-muted-foreground leading-tight">Using the threat of the US military to persuade the country to leave its gold in New York.</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
            {/* Laptop Base/Hinge */}
            <div className="h-6 flex items-center justify-center bg-[#1A1A1A]"><div className="w-16 h-1 rounded-full bg-black/60" /></div>
          </div>
          {/* Laptop Shadow Base */}
          <div className="relative h-6 rounded-b-[1.5rem] mx-auto w-[105%] -ml-[2.5%] z-[-1] bg-[#0A0A0A]" style={{ boxShadow: '0 60px 120px -20px rgba(0,0,0,0.8)' }}><div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/60 rounded-b-lg" /></div>
        </div>

        {/* THE DOSSIER SECTION (BRUTALIST EDITORIAL) */}
        <section 
          id="features" 
          ref={commandCenterReveal.ref}
          className={`w-full max-w-[1200px] mx-auto mt-48 mb-24 relative transition-all duration-1000 delay-300 ${commandCenterReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b-2 border-[#1A1A1A] pb-6">
            <div className="max-w-2xl">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#1A4BFF] font-bold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Case File 092-A
              </div>
              <h2 className="font-display text-4xl md:text-6xl text-[#1A1A1A] leading-none tracking-tight">The Dossier.</h2>
              <p className="text-[#1A1A1A]/60 text-base md:text-lg mt-4">Cross-reference sources, expose contradictions, and map the truth on a structured forensic board.</p>
            </div>
            <div className="mt-6 md:mt-0">
              <span className="stamp text-xs">Classified</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Card 1: Source Snippet (Span 7) */}
            <div className="col-span-1 md:col-span-7 dossier-card p-8">
              <div className="flex items-center justify-between mb-6 border-b border-[#1A1A1A]/10 pb-4">
                <div className="text-[10px] font-mono text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2 font-bold">
                  <FileText className="w-3.5 h-3.5 text-[#1A4BFF]" /> Source Ingested
                </div>
                <div className="font-mono text-[9px] text-[#1A1A1A]/40">DOC-892A</div>
              </div>
              <p className="font-serif text-xl md:text-2xl leading-relaxed text-[#1A1A1A]">
                "You know what I said to him? <span className="bg-[#1A4BFF]/10 border-b-2 border-[#1A4BFF] px-1 py-0.5 font-medium">I said, you have three armies within 400 miles who can come take your gold.</span>"
              </p>
              <div className="mt-8 pt-4 border-t border-dashed border-[#1A1A1A]/20 flex gap-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/40">Tags:</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A] font-bold">Threat</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A] font-bold">Military</span>
              </div>
            </div>

            {/* Card 2: Contradiction Gauge (Span 5) */}
            <div className="col-span-1 md:col-span-5 dossier-card p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4 mb-4">
                <div className="text-[10px] font-mono text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#1A4BFF]" /> Contradiction Index
                </div>
                <div className="font-mono text-[9px] text-[#1A1A1A]/40">METRIC-04</div>
              </div>
              <div className="relative flex justify-center my-4">
                 <svg viewBox="0 0 100 50" className="w-56 h-auto overflow-visible">
                    <path d="M 10 45 A 35 35 0 0 1 90 45" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="12" strokeLinecap="square" />
                    <path d="M 10 45 A 35 35 0 0 1 75 18" fill="none" stroke="#1A4BFF" strokeWidth="12" strokeLinecap="square" />
                    <circle cx="50" cy="45" r="4" fill="#1A1A1A" />
                    <line x1="50" y1="45" x2="75" y2="18" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="square" />
                 </svg>
                 <div className="absolute -bottom-6 text-center bg-white px-2">
                   <span className="font-display text-4xl text-[#1A4BFF]">85</span>
                   <span className="text-sm text-muted-foreground">/100</span>
                 </div>
              </div>
              <p className="text-center font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]/50 mt-8">
                High friction detected
              </p>
            </div>

            {/* Card 3: Narrative Radar (Span 4) */}
            <div className="col-span-1 md:col-span-4 dossier-card p-8 flex flex-col items-center">
              <div className="text-[10px] font-mono text-[#1A1A1A] uppercase tracking-widest mb-4 flex items-center justify-between w-full border-b border-[#1A1A1A]/10 pb-4 font-bold">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#1A4BFF]" /> Profile
                </div>
                <div className="font-mono text-[9px] text-[#1A1A1A]/40">NAR-01</div>
              </div>
              <svg viewBox="0 0 120 120" className="w-48 h-48 mt-2">
                <polygon points="60,10 110,45 90,105 30,105 10,45" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                <polygon points="60,30 90,55 75,90 45,90 30,55" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                <polygon points="60,5 105,45 80,110 40,110 15,45" fill="#1A4BFF" fillOpacity="0.1" stroke="#1A4BFF" strokeWidth="2" />
                <text x="60" y="5" fill="#1A1A1A" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">BIAS</text>
                <text x="115" y="45" fill="#1A1A1A" fontSize="7" textAnchor="start" fontFamily="monospace" fontWeight="bold">OMISSION</text>
                <text x="90" y="115" fill="#1A1A1A" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">URGENCY</text>
                <text x="30" y="115" fill="#1A1A1A" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">MOTIVE</text>
                <text x="5" y="45" fill="#1A1A1A" fontSize="7" textAnchor="end" fontFamily="monospace" fontWeight="bold">EVIDENCE</text>
              </svg>
            </div>

            {/* Card 4: Analyst Margin (Span 8) */}
            <div className="col-span-1 md:col-span-8 dossier-card p-8">
              <div className="text-[10px] font-mono text-[#1A1A1A] uppercase tracking-widest mb-6 flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4 font-bold">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-[#1A4BFF]" /> Analyst Margin
                </div>
                <div className="font-mono text-[9px] text-[#1A1A1A]/40">NOTES-09</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#FDFBF7] border border-[#1A1A1A]/10 p-5 rounded-sm shadow-sm border-l-4 border-l-[#1A4BFF]">
                  <span className="text-[9px] font-mono uppercase text-[#1A4BFF] block mb-2 font-bold tracking-widest">Contradiction</span>
                  <b className="text-[15px] font-display block mb-2">Rule of Law vs. Force</b>
                  <p className="text-[12px] text-[#1A1A1A]/60 leading-relaxed">Citing 'rule of law' alongside implicit military force reveals a protection-racket mentality.</p>
                </div>
                <div className="bg-[#FDFBF7] border border-[#1A1A1A]/10 p-5 rounded-sm shadow-sm border-l-4 border-l-[#E3D398]">
                  <span className="text-[9px] font-mono uppercase text-[#E3D398] block mb-2 font-bold tracking-widest">Fallacy</span>
                  <b className="text-[15px] font-display block mb-2">Appeal to Force</b>
                  <p className="text-[12px] text-[#1A1A1A]/60 leading-relaxed">Using the threat of the US military to persuade the country to leave its gold in New York.</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      {/* EDITORIAL FOOTER */}
      <footer className="relative z-30 border-t-2 border-[#1A1A1A] bg-[#FDFBF7] pt-16 pb-8">
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