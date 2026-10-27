import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, FileText, Lightbulb, Network, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringBtn, setIsHoveringBtn] = useState(false);
  const [btnPos, setBtnPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLAnchorElement>(null);

  // Spotlight effect tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Magnetic button effect
  const handleBtnMouseMove = (e: React.MouseEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setBtnPos({ x: x * 0.2, y: y * 0.2 }); // subtle pull
  };

  const handleBtnMouseLeave = () => {
    setIsHoveringBtn(false);
    setBtnPos({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1a1a1a] font-sans selection:bg-black/20 overflow-hidden relative">
      
      {/* Film Grain Overlay for tactile feel */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* Dynamic Cursor Spotlight */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.4), transparent 60%)`,
        }}
      />

      {/* Infinite Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.3]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Top Navigation */}
      <nav className="relative z-20 flex justify-between items-center px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="text-[#c2410c] flex items-center transform group-hover:rotate-12 transition-transform duration-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
              <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
              <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
              <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-3xl italic tracking-tight font-medium">Threadwise</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-black/50 hidden md:block">The Spatial Workbench</span>
          <Link to="/" className="px-6 py-2.5 bg-[#1a1a1a] text-[#f4f1ea] rounded-full text-sm font-medium hover:bg-black transition-all hover:scale-105 shadow-xl shadow-black/10">
            Enter Studio
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-20 flex flex-col items-center pt-24 pb-32 px-6 text-center max-w-[1400px] mx-auto">
        
        <div className="mb-10 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-black/10 bg-white/50 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/70">Stop summarizing. Start investigating.</span>
        </div>

        <h1 className="font-display text-[64px] md:text-[100px] lg:text-[130px] leading-[0.9] text-[#1a1a1a] mb-8 tracking-tighter mix-blend-multiply">
          Map the <br />
          <span className="italic text-black/40">unseen.</span>
        </h1>

        <p className="text-lg md:text-xl text-black/60 max-w-xl mx-auto mb-12 leading-relaxed font-light">
          Threadwise is a spatial intelligence workbench. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
        </p>

        {/* Magnetic CTA Button */}
        <Link 
          to="/" 
          ref={btnRef}
          onMouseEnter={() => setIsHoveringBtn(true)}
          onMouseLeave={handleBtnMouseLeave}
          onMouseMove={handleBtnMouseMove}
          style={{ transform: `translate(${btnPos.x}px, ${btnPos.y}px)` }}
          className={`group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#1a1a1a] text-[#f4f1ea] rounded-full font-medium text-lg transition-all duration-300 ease-out hover:bg-black hover:shadow-2xl hover:shadow-black/20 ${isHoveringBtn ? 'scale-105' : ''}`}
        >
          Start your first investigation
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>

      </main>

      {/* THE CINEMATIC 3D MOCKUP */}
      <div className="relative z-20 max-w-[1200px] mx-auto px-4 pb-40 perspective-[2000px]">
        <div 
          className="w-full bg-[#f4f1ea] border border-black/10 rounded-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] overflow-hidden transition-transform duration-1000 ease-out hover:rotate-0"
          style={{ transform: 'rotateX(10deg) rotateY(-3deg) scale(0.96)' }}
        >
          {/* Browser Toolbar */}
          <div className="h-12 border-b border-black/10 bg-[#ebe7db] flex items-center px-6 gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-black/10" />
              <div className="w-3 h-3 rounded-full bg-black/10" />
              <div className="w-3 h-3 rounded-full bg-black/10" />
            </div>
            <div className="mx-auto flex items-center gap-2 text-[11px] font-mono text-black/40 bg-white/50 px-4 py-1 rounded-md border border-black/5">
              <Network className="w-3.5 h-3.5" /> threadwise.app / workspace / haiti-investigation
            </div>
          </div>

          {/* Canvas Area */}
          <div className="relative h-[550px] bg-[#f4f1ea] p-12 overflow-hidden">
            
            {/* Grid inside canvas */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.4]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '30px 30px',
              }}
            />

            {/* Animated SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M 320 200 Q 500 180 600 300" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M 600 300 Q 750 400 850 350" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" strokeDasharray="6 6" />
            </svg>

            {/* Node 1: Question */}
            <div className="absolute top-[20%] left-[12%] w-[320px] bg-white/90 backdrop-blur-md border border-black/10 rounded-xl shadow-2xl shadow-black/5 z-10 transform transition-transform hover:-translate-y-1 hover:shadow-black/10">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-black/5 bg-black/[0.02] rounded-t-xl">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> Question</span>
                <span className="text-[10px] font-mono text-black/40">UNKNOWN</span>
              </div>
              <div className="p-5">
                <h4 className="font-display text-xl leading-tight text-black mb-2">What is the real motive?</h4>
                <p className="text-[13px] text-black/60 leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
              </div>
            </div>

            {/* Node 2: Evidence */}
            <div className="absolute top-[45%] left-[35%] w-[360px] bg-white/90 backdrop-blur-md border border-black/10 rounded-xl shadow-2xl shadow-black/5 z-10 transform transition-transform hover:-translate-y-1 hover:shadow-black/10">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-black/5 bg-black/[0.02] rounded-t-xl">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> Evidence</span>
                <span className="text-[10px] font-mono text-black/40">FACT</span>
              </div>
              <div className="p-5">
                <h4 className="font-display text-xl leading-tight text-black mb-2">El Salvador sends troops</h4>
                <p className="text-[13px] text-black/60 leading-relaxed">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
                <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono bg-black/5 border border-black/5 px-2.5 py-1 rounded">Miami Herald</span>
                  <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5"/> Verified</span>
                </div>
              </div>
            </div>

            {/* Node 3: Hypothesis */}
            <div className="absolute bottom-[20%] right-[15%] w-[300px] bg-white/90 backdrop-blur-md border border-black/10 rounded-xl shadow-2xl shadow-black/5 z-10 transform transition-transform hover:-translate-y-1 hover:shadow-black/10">
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-black/5 bg-black/[0.02] rounded-t-xl">
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-600 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5"/> Hypothesis</span>
              </div>
              <div className="p-5">
                <h4 className="font-display text-xl leading-tight text-black mb-2">Securing US Favor</h4>
                <p className="text-[13px] text-black/60 leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}