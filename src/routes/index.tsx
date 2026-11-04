import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, FileText, Activity, ShieldAlert, 
  FileWarning, Search, Crosshair
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/threadwise/BrandLockup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Threadwise — See what hides" },
      { name: "description", content: "Threadwise is a forensic intelligence workspace: paste a source, expose its framing, omissions and contradictions, and map what you actually know against what you are assuming." },
      { property: "og:title", content: "Threadwise — See what hides" },
      { property: "og:description", content: "Threadwise is a forensic intelligence workspace: paste a source, expose its framing, omissions and contradictions, and map what you actually know against what you are assuming." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Threadwise — See what hides" },
      { name: "twitter:description", content: "Threadwise is a forensic intelligence workspace: paste a source, expose its framing, omissions and contradictions, and map what you actually know against what you are assuming." },
    
      { property: "og:image", content: "https://threadwise-beta.vercel.app/og.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://threadwise-beta.vercel.app/og.png" },
    ],
  }),
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
        if (entry?.isIntersecting) setIsVisible(true);
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

  const heroReveal = useScrollReveal();
  const laptopReveal = useScrollReveal();
  const commandCenterReveal = useScrollReveal();

  return (
    <div className="min-h-[100dvh] bg-[#FDFBF7] text-[#1A1A1A] font-sans selection:bg-[#1A4BFF] selection:text-white overflow-hidden relative flex flex-col">
      
      <style>{`
        .reveal-hidden { opacity: 0; transform: translateY(30px); }
        .reveal-visible { opacity: 1; transform: translateY(0); transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1); }

        .editorial-line {
          height: 1px;
          background: #1A1A1A;
          opacity: 0.1;
        }

        .dossier-card {
          background: #FFFFFF;
          border: 2px solid #1A1A1A;
          border-radius: 2px;
          box-shadow: 6px 6px 0px rgba(26,26,26,0.1);
          position: relative;
        }

        .stamp {
          border: 2px solid #1A4BFF;
          color: #1A4BFF;
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
        <BrandLockup size="md" asLink />
        
        <nav className="hidden md:flex items-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/65">
          <a href="#demo" className="hover:text-[#1A1A1A] transition-colors">How it works</a>
          <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
          <Link to="/briefs" className="hover:text-[#1A1A1A] transition-colors">Briefs</Link>
        </nav>

        <div className="flex items-center gap-3 md:gap-6">
          {session ? (
            <Link to="/app" className="group flex shrink-0 items-center gap-1.5 rounded-sm bg-[#1A1A1A] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white shadow-sm transition-colors duration-300 hover:bg-[#1A4BFF] md:gap-2 md:px-5 md:py-2.5 md:text-[12px]">
              Go to Workspace <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
                Sign in
              </Link>
              <Link to="/login" className="group flex shrink-0 items-center gap-1.5 rounded-sm bg-[#1A1A1A] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white shadow-sm transition-colors duration-300 hover:bg-[#1A4BFF] md:gap-2 md:px-5 md:py-2.5 md:text-[12px]">
                Start<span className="hidden sm:inline"> Investigation</span>
                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:w-3.5 md:h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      <main id="main" className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-32 md:pt-48 pb-24 flex-1">
        
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
            
            <h1 className="font-display text-[54px] sm:text-[72px] md:text-[120px] lg:text-[150px] tracking-tighter text-[#1A1A1A] leading-[0.85] mb-8">
              See what <br />
              <span className="text-[#1A4BFF] pr-4 tracking-normal" style={{ fontFamily: "Fraunces, serif", fontStyle: "normal", fontWeight: 600 }}>hides.</span>
            </h1>

            <p className="max-w-xl text-lg font-light leading-relaxed text-[#1A1A1A]/70 md:text-2xl">
              A workbench for sources that are arguing with you. The lab marks the framing, the
              omissions and the claims it cannot support — then you map the reasoning and keep score.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
              >
                Start an investigation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/briefing"
                className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
              >
                Read today&rsquo;s brief
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
              </Link>
            </div>
            <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
              One story, dissected daily by the autonomous agent
            </span>
          </div>

          {/* Right Side: Technical Annotations */}
          <div className="md:col-span-4 hidden md:flex flex-col justify-end pb-8 border-l border-[#1A1A1A]/10 pl-8">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/65 space-y-4">
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

        {/* PLATE 01 — the instrument, printed rather than mocked up */}
        <div
          id="demo"
          ref={laptopReveal.ref}
          className={`relative z-30 mx-auto mt-20 w-full max-w-[1200px] transition-all duration-1000 delay-200 md:mt-24 ${laptopReveal.isVisible ? "reveal-visible" : "reveal-hidden"}`}
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.26em]">
              Plate 01 — the workbench
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
              One source, dissected
            </span>
          </div>

          <div
            className="relative overflow-hidden border-2 border-[#1A1A1A] bg-white"
            style={{ boxShadow: "10px 10px 0 0 rgba(26,26,26,.10)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
              <div className="border-b-2 border-[#1A1A1A] p-6 md:border-b-0 md:border-r-2 md:p-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#1A4BFF]">
                  Nothing here is a screenshot
                </p>
                <h3 className="mt-3 max-w-[20ch] font-display text-[30px] leading-[1.02] md:text-[38px]">
                  Open the canvas and pull a cord.
                </h3>
                <p className="mt-3 max-w-[42ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/70">
                  The demo is the product: five cards of one source, the cords between them, and a
                  tag on every cord. Drag a card. Press O. Nothing is a mock-up.
                </p>
                <Link
                  to="/demo"
                  className="mt-5 inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
                >
                  Open the live canvas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <ul className="divide-y divide-[#1A1A1A]/12">
                {[
                  ["Cards", "Every claim is a card with a status, a source and a spine that names its type."],
                  ["Cords", "Relations are physical: they sag, they carry a tag, they break when the evidence does."],
                  ["Marks", "Risks and blind spots are the only red in the product — one meaning, never decoration."],
                ].map(([title, body]) => (
                  <li key={title} className="px-6 py-5 md:px-8">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/60">
                      {title}
                    </span>
                    <p className="mt-1.5 max-w-[36ch] font-serif text-[13.5px] leading-relaxed text-[#1A1A1A]/70">
                      {body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
            Fig. 1 — the canvas runs live, seeded with one source
          </p>
        </div>

        {/* TODAY'S BRIEF — the product proving itself, every day */}
        <TodaysBrief />

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
              <p className="text-[#1A1A1A]/65 text-base md:text-lg mt-4">Cross-reference sources, expose contradictions, and map the truth on a structured forensic board.</p>
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
                <div className="font-mono text-[10px] text-[#1A1A1A]/65">DOC-892A</div>
              </div>
              <p className="font-serif text-xl md:text-2xl leading-relaxed text-[#1A1A1A]">
                "You know what I said to him? <span className="bg-[#1A4BFF]/10 border-b-2 border-[#1A4BFF] px-1 py-0.5 font-medium">I said, you have three armies within 400 miles who can come take your gold.</span>"
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-dashed border-[#1A1A1A]/20 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/65">Tags</span>
                {["Threat", "Military"].map((tag) => (
                  <span key={tag} className="border border-[#1A1A1A]/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 2: Contradiction Gauge (Span 5) */}
            <div className="col-span-1 md:col-span-5 dossier-card p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4 mb-4">
                <div className="text-[10px] font-mono text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#1A4BFF]" /> Contradiction Index
                </div>
                <div className="font-mono text-[10px] text-[#1A1A1A]/65">METRIC-04</div>
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
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-[#1A1A1A]/65 mt-8">
                High friction detected
              </p>
            </div>

            {/* Card 3: Narrative Radar (Span 4) */}
            <div className="col-span-1 md:col-span-4 dossier-card p-8 flex flex-col items-center">
              <div className="text-[10px] font-mono text-[#1A1A1A] uppercase tracking-widest mb-4 flex items-center justify-between w-full border-b border-[#1A1A1A]/10 pb-4 font-bold">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#1A4BFF]" /> Profile
                </div>
                <div className="font-mono text-[10px] text-[#1A1A1A]/65">NAR-01</div>
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
                <div className="font-mono text-[10px] text-[#1A1A1A]/65">NOTES-09</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border border-[#1A1A1A]/20 border-l-4 border-l-[#1A4BFF] bg-white p-5">
                  <span className="text-[10px] font-mono uppercase text-[#1A4BFF] block mb-2 font-bold tracking-widest">Contradiction</span>
                  <b className="text-[15px] font-display block mb-2">Rule of Law vs. Force</b>
                  <p className="text-[12px] text-[#1A1A1A]/65 leading-relaxed">Citing 'rule of law' alongside implicit military force reveals a protection-racket mentality.</p>
                </div>
                <div className="border border-[#1A1A1A]/20 border-l-4 border-l-[#1A1A1A] bg-white p-5">
                  <span className="text-[10px] font-mono uppercase text-[#1A1A1A]/65 block mb-2 font-bold tracking-widest">Fallacy</span>
                  <b className="text-[15px] font-display block mb-2">Appeal to Force</b>
                  <p className="text-[12px] text-[#1A1A1A]/65 leading-relaxed">Using the threat of the US military to persuade the country to leave its gold in New York.</p>
                </div>
              </div>
            </div>

          </div>
        </section>
        {/* HOW IT WORKS — the loop, stated plainly */}
        <section className="relative z-10 mx-auto mt-32 w-full max-w-[1200px] px-6 md:px-12">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#1A1A1A] pb-3">
            <h2 className="font-display text-[30px] leading-none md:text-[42px]">
              Three moves, repeated.
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
              read · map · check
            </span>
          </div>

          <ol className="grid grid-cols-1 border-b border-[#1A1A1A]/15 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Clip a source",
                body: "An article, a speech, a transcript. The lab reads what it argues — framing, omissions, the dog that didn't bark — not just what it says.",
              },
              {
                n: "02",
                title: "Map the reasoning",
                body: "What you know sits on the floor; what you assume floats above it. Every card is tied to its evidence by a cord, and the unsupported ones hang in red.",
              },
              {
                n: "03",
                title: "Keep score",
                body: "The agent files a brief every morning and checks the dated claims you filed. You find out whether the reporting was right, in public, on a record.",
              },
            ].map((step, index) => (
              <li
                key={step.n}
                className={`px-1 py-7 ${index > 0 ? "border-t border-[#1A1A1A]/15 md:border-t-0 md:border-l md:pl-6" : ""}`}
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]">
                  {step.n}
                </span>
                <h3 className="mt-3 font-display text-[22px] leading-tight">{step.title}</h3>
                <p className="mt-2 max-w-[38ch] text-[14px] leading-relaxed text-[#1A1A1A]/70">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* CLOSING */}
        <section className="relative z-10 mx-auto mt-32 mb-24 w-full max-w-[1200px] px-6 md:px-12">
          <div className="border-2 border-[#1A1A1A] bg-white px-6 py-12 md:px-12 md:py-16">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
              Nothing here is generated for you to nod at
            </span>
            <h2 className="mt-4 max-w-[18ch] font-display text-[38px] leading-[0.95] tracking-tight md:text-[64px]">
              Read one article properly.
            </h2>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[#1A1A1A]/70">
              Ten minutes with a source you already distrust will teach you more than a month of
              summaries. Start with the one you have open in another tab.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
              >
                Start an investigation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/briefing"
                className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
              >
                Read today&rsquo;s brief
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
              Free while in beta · sign in with Google · your work stays yours
            </p>
          </div>
        </section>

      </main>

      {/* EDITORIAL FOOTER */}
      <footer className="relative z-30 border-t-2 border-[#1A1A1A] bg-[#FDFBF7] pt-16 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-16">
            <div className="max-w-sm">
              <BrandLockup size="lg" asLink className="mb-4" />
              <p className="text-sm text-[#1A1A1A]/65 leading-relaxed">
                A spatial intelligence workbench for researchers, strategists, and complex thinkers.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-12 md:gap-24 font-mono text-[12px] uppercase tracking-widest text-[#1A1A1A]/65">
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Product</span>
                <Link to="/app" className="hover:text-[#1A1A1A] transition-colors">Workspace</Link>
                <Link to="/briefs" className="hover:text-[#1A1A1A] transition-colors">Morning briefs</Link>
                <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Read</span>
                <a href="#demo" className="hover:text-[#1A1A1A] transition-colors">How it works</a>
                <Link to="/briefs" className="hover:text-[#1A1A1A] transition-colors">Archive</Link>
                <span className="text-[#1A1A1A]/65">More soon</span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1A1A1A]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <span className="text-[10px] font-mono text-[#1A1A1A]/65 uppercase tracking-widest">© 2026 Threadwise Inc. All rights reserved.</span>
            <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/65">
              <span>Built for people who check.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
/**
 * The landing page proves itself: it renders the most recent brief rather than
 * describing one. Signed-out readers get it because 0008 opened the read policy.
 */
function TodaysBrief() {
  const [brief, setBrief] = useState<{
    headline: string;
    bluf: string;
    threat_level: string | null;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void supabase
      .from("news_briefs")
      .select("headline, bluf, threat_level, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setBrief(data);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!brief) {
    return (
      <section className="relative z-10 mx-auto mt-24 w-full max-w-[1200px] px-6 md:px-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.26em]">
            Today&rsquo;s brief
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
            filed every morning
          </span>
        </div>
        <div className="border-2 border-dashed border-[#1A1A1A]/25 px-6 py-10 text-center">
          <p className="font-display text-[22px] leading-tight">The agent is still reading.</p>
          <p className="mx-auto mt-2 max-w-[46ch] font-serif text-[14px] leading-relaxed text-[#1A1A1A]/65">
            One story, dissected every morning: what it says, how it frames it, and what it leaves
            out. Yesterday&rsquo;s editions are in the archive.
          </p>
          <Link
            to="/briefs"
            className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4"
          >
            Read the archive <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  const opening = (brief.bluf ?? "").split(/\n\s*\n/)[0] ?? "";
  const level = (brief.threat_level ?? "MODERATE").toUpperCase();
  const filed = new Date(brief.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="relative z-10 mx-auto mt-24 w-full max-w-[1200px] px-6 md:px-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.26em]">
          Today&rsquo;s brief
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
          {filed} · one story, dissected
        </span>
      </div>

      <article className="tw-sheet grid grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col justify-between gap-4 border-b-2 border-[#1A1A1A] p-4 lg:border-b-0 lg:border-r-2">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/65">
              Threat level
            </div>
            <div
              className="mt-1 inline-block px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white"
              style={{ backgroundColor: level === "CRITICAL" || level === "ELEVATED" ? "#C1121F" : "#1A1A1A" }}
            >
              {level}
            </div>
          </div>
          <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.16em] text-[#1A1A1A]/65">
            Machine assessment · verify before action
          </p>
        </div>

        <div className="p-5 md:p-7">
          <h2 className="max-w-[24ch] font-display text-[26px] leading-[1.05] md:text-[38px]">
            {brief.headline}
          </h2>
          <p className="mt-3 max-w-[62ch] font-serif text-[15px] leading-[1.6] text-[#1A1A1A]/80">
            {opening}
          </p>
          <Link
            to="/briefing"
            className="group mt-5 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
          >
            Read the full brief
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </article>
    </section>
  );
}
