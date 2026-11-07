import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowUpRight, ArrowRight, FileText, Activity, ShieldAlert, 
  FileWarning, Search
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLockup } from "@/components/threadwise/BrandLockup";
import { RedactedWord } from "@/components/landing/RedactedWord";

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
    
      { property: "og:image", content: "https://threadwise-beta.vercel.app/og-canvas.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://threadwise-beta.vercel.app/og-canvas.jpg" },
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

        /* the headline arrives the way the product works: hidden, then revealed */
        .tw-letter {
          display: inline-block;
          opacity: 0;
          animation: tw-letter-in .78s cubic-bezier(.16, .84, .24, 1) forwards;
          animation-delay: calc(var(--i) * 26ms);
        }
        @keyframes tw-letter-in {
          from { opacity: 0; transform: translateY(.16em); filter: blur(12px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tw-letter { animation: none; opacity: 1; transform: none; filter: none; }
          .tw-redact::after { animation: none; opacity: 0; }
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
          <Link to="/analyst" className="text-[#1A4BFF] transition-colors hover:text-[#1A1A1A]">The analyst</Link>
          <a href="#demo" className="hover:text-[#1A1A1A] transition-colors">The canvas</a>
          <a href="#features" className="hover:text-[#1A1A1A] transition-colors">The dossier</a>
          <Link to="/digest" className="hover:text-[#1A1A1A] transition-colors">Record</Link>
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
          className={`relative z-20 mb-10 w-full transition-all duration-1000 ${heroReveal.isVisible ? 'reveal-visible' : 'reveal-hidden'}`}
        >
          {/* HERO — the type fills the page, the actions sit on the baseline */}
          <div className="flex w-full flex-col items-start text-left">
            <div className="mb-5 flex items-center gap-4">
              <div className="h-px w-12 bg-[#1A4BFF]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#1A4BFF]">
                Forensic Intelligence OS
              </span>
            </div>

            <h1 className="w-full font-display text-[clamp(64px,10.2vw,158px)] leading-[0.84] tracking-[-0.035em] text-[#1A1A1A]">
              <span className="sr-only">See what hides.</span>
              <span aria-hidden className="whitespace-nowrap">
                {letters("See what", 0)}
              </span>{" "}
              <span
                aria-hidden
                className="whitespace-nowrap text-[#1A4BFF]"
                style={{ fontStyle: "normal", fontWeight: 600, letterSpacing: "-0.025em" }}
              >
                <RedactedWord>hides.</RedactedWord>
              </span>
            </h1>

            <div className="mt-8 grid w-full grid-cols-1 gap-8 border-t border-[#1A1A1A]/15 pt-6 md:mt-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-16">
              <p className="max-w-[52ch] text-[17px] font-light leading-[1.55] text-[#1A1A1A]/70 md:text-[21px]">
                A workbench for sources that are arguing with you. The lab marks the framing, the
                omissions and the claims it cannot support — then you map the reasoning and keep score.
              </p>

              <div className="flex flex-col items-start gap-3 md:items-end">
                <Link
                  to="/app"
                  className="inline-flex items-center gap-2.5 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-7 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
                >
                  Start an investigation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/analyst"
                  className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
                >
                  Ask the analyst
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/analyst"
                  className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A1A1A]/65 underline decoration-[#1A1A1A]/20 underline-offset-4 transition-colors hover:text-[#1A1A1A]"
                >
                  Ask the analyst
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
                </Link>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 md:text-right">
                  Any move, read properly
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* PLATE 01 — the instrument, printed rather than mocked up */}
        <div
          id="demo"
          ref={laptopReveal.ref}
          className={`relative z-30 mx-auto mt-10 w-full max-w-[1200px] transition-all duration-1000 delay-200 md:mt-12 ${laptopReveal.isVisible ? "reveal-visible" : "reveal-hidden"}`}
        >
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.26em]">
              Plate 01 — the workbench
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
              One source, dissected
            </span>
          </div>

          {/* the bezel returns; the screen holds a real capture, and clicks through to the live app */}
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-t-[10px] border-[10px] border-[#1A1A1A] bg-[#1A1A1A]"
              style={{ boxShadow: "0 40px 80px -32px rgba(26,26,26,.45)" }}
            >
              <div className="absolute left-1/2 top-0 z-20 hidden h-5 w-28 -translate-x-1/2 items-center justify-center rounded-b-lg bg-[#1A1A1A] md:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-black/60" />
              </div>

              <div className="relative aspect-[2400/1207] w-full overflow-hidden bg-[#FDFBF7]">
                <CanvasShot />

                <Link
                  to="/app"
                  className="group absolute inset-0 flex items-end justify-end p-4 md:p-6"
                  aria-label="Open the workspace"
                >
                  <span className="border-2 border-[#1A1A1A] bg-[#FDFBF7] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] shadow-[4px_4px_0_0_#1A1A1A] transition-all md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
                    Open the workspace →
                  </span>
                </Link>
              </div>
            </div>

            {/* hinge + base */}
            <div className="h-5 rounded-b-[14px] bg-[#1A1A1A]">
              <div className="mx-auto h-1 w-24 rounded-full bg-black/60" />
            </div>
            <div className="mx-auto h-2 w-[104%] -translate-x-[2%] rounded-b-[16px] bg-[#0A0A0A]/85" />
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">
            Fig. 1 — one source, dissected · the real canvas
          </p>
        </div>

        {/* THE ANALYST — the thing you come back for */}
        <section className="relative z-10 mx-auto mt-24 w-full max-w-[1200px] px-6 md:px-12">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 border-[#1A1A1A] pb-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.26em]">The analyst</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">any move, any hour</span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_auto] md:items-end">
            <div>
              <h2 className="max-w-[20ch] font-display text-[30px] leading-[1.0] md:text-[42px]">
                Something happened. Bring it here.
              </h2>
              <p className="mt-3 max-w-[52ch] font-serif text-[15px] leading-relaxed text-[#1A1A1A]/70">
                Paste the post or drop a screenshot. You get the read: what it is, why now, who it costs,
                what it echoes, what would prove it wrong — and you can argue with it afterwards.
              </p>
            </div>
            <Link
              to="/analyst"
              className="inline-flex shrink-0 items-center gap-2 border-2 border-[#1A1A1A] bg-[#1A1A1A] px-6 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#FDFBF7] transition-colors hover:border-[#1A4BFF] hover:bg-[#1A4BFF]"
            >
              Ask the analyst
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

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

            {/* Card 2: Omission ledger (Span 5) */}
            <div className="col-span-1 md:col-span-5 dossier-card flex flex-col p-8">
              <div className="mb-5 flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
                  <FileWarning className="h-3.5 w-3.5 text-[#1A4BFF]" /> Omission ledger
                </div>
                <div className="font-mono text-[10px] text-[#1A1A1A]/65">DOC-892A</div>
              </div>

              <ol className="flex-1 space-y-4">
                {[
                  { line: "“Three armies within 400 miles.”", state: "quoted" },
                  { line: "“The gold is protected by the Atlantic.”", state: "quoted" },
                  { line: "Who commands those armies.", state: "withheld" },
                ].map((row) => (
                  <li key={row.line} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 ${
                        row.state === "withheld" ? "bg-[#C1121F]" : "bg-[#1A1A1A]"
                      }`}
                    />
                    <span
                      className={`font-serif text-[15px] leading-snug ${
                        row.state === "withheld"
                          ? "text-[#C1121F]/70 line-through decoration-[#C1121F]/40"
                          : "text-[#1A1A1A]/85"
                      }`}
                    >
                      {row.line}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="mt-5 border-t border-dashed border-[#1A1A1A]/20 pt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-[#1A1A1A]/65">
                What the sentence never says · the source names the threat four times and none of them
                is a country.
              </p>
            </div>

            {/* Card 3: Claim audit (Span 4) */}
            <div className="col-span-1 md:col-span-4 dossier-card flex flex-col justify-between p-8">
              <div>
                <div className="mb-5 flex items-center justify-between border-b border-[#1A1A1A]/10 pb-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]">
                    <ShieldAlert className="h-3.5 w-3.5 text-[#1A4BFF]" /> Claim audit
                  </div>
                  <div className="font-mono text-[10px] text-[#1A1A1A]/65">C-07</div>
                </div>

                <p className="font-serif text-[15px] leading-snug text-[#1A1A1A]/85">
                  “That gold is protected by the United States military.”
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/65">
                  Claimed as fact, supported by nothing in the text.
                </p>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <span className="tw-stamp is-contradicted">Unsupported</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1A1A1A]/65">
                  ¶ 4
                </span>
              </div>
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

        {/* THE DESK — a human moment, in the product's own palette */}
        <section className="relative z-10 mx-auto mt-32 w-full max-w-[1200px] px-6 md:px-12">
          <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-[1fr_1.05fr] md:gap-12">
            <div className="pb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.26em] text-[#1A4BFF]">
                The desk
              </span>
              <h2 className="mt-3 max-w-[16ch] font-display text-[34px] leading-[0.98] tracking-tight md:text-[52px]">
                Not a portal. A workbench.
              </h2>
              <p className="mt-4 max-w-[44ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/75">
                A chat window hides the work: you ask, something answers, you nod. Threadwise puts the
                source on the desk beside what you already believe, and makes the thread between them
                visible — long enough to argue with.
              </p>
              <p className="mt-4 max-w-[44ch] font-serif text-[15px] leading-[1.7] text-[#1A1A1A]/75">
                Evidence, analysis, patterns, strategy. Four things a desk should hold, and the only
                four this one does.
              </p>
            </div>

            <figure className="relative">
              <div
                className="overflow-hidden border-2 border-[#1A1A1A] bg-[#FDFBF7]"
                style={{ boxShadow: "10px 10px 0 0 rgba(26,26,26,.10)" }}
              >
                <img
                  src="/desk.webp"
                  alt="A desk lamp, a laptop marked with the Threadwise tag, and four bound volumes labelled evidence, analysis, patterns and strategy."
                  width={970}
                  height={772}
                  loading="lazy"
                  decoding="async"
                  className="block h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                Fig. 2 — the desk, not the oracle
              </figcaption>
            </figure>
          </div>
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
                to="/analyst"
                className="group inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1A4BFF] underline decoration-[#1A4BFF]/30 underline-offset-4 transition-colors hover:decoration-[#1A4BFF]"
              >
                Ask the analyst
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
                <Link to="/analyst" className="hover:text-[#1A1A1A] transition-colors">The analyst</Link>
                <Link to="/app" className="hover:text-[#1A1A1A] transition-colors">Workspace</Link>
                <a href="#features" className="hover:text-[#1A1A1A] transition-colors">Features</a>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Read</span>
                <a href="#demo" className="hover:text-[#1A1A1A] transition-colors">How it works</a>
                <Link to="/digest" className="hover:text-[#1A1A1A] transition-colors">The record</Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-[#1A1A1A] font-bold mb-1">Legal</span>
                <Link to="/terms" className="hover:text-[#1A1A1A] transition-colors">Terms</Link>
                <Link to="/privacy" className="hover:text-[#1A1A1A] transition-colors">Privacy</Link>
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
 * The screen's contents: a real capture of the canvas. It is lazy, sized to
 * avoid layout shift, and falls back to a plain note if the file is missing.
 */
function CanvasShot() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FDFBF7] px-6 text-center">
        <p className="max-w-[40ch] font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-[#1A1A1A]/60">
          Capture pending — drop the canvas screenshot at <code>/canvas-shot.webp</code>
        </p>
      </div>
    );
  }

  return (
    <img
      src="/canvas-shot.webp"
      alt="The Threadwise canvas: four cards connected by tagged cords."
      width={2400}
      height={1207}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}


/** Splits a line into per-letter spans so it can assemble itself. */
function letters(text: string, start: number) {
  return text.split("").map((char, index) => (
    <span
      key={`${char}-${index}`}
      className="tw-letter"
      style={{ ["--i" as string]: start + index }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));
}
