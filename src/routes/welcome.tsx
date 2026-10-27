import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Network, ShieldAlert, Sparkles, FileText, Check } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#111] font-sans selection:bg-black/10 overflow-hidden relative">
      
      {/* Subtle Grid Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Navigation */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Network className="w-6 h-6 text-black" />
          <span className="font-display text-2xl font-bold tracking-tight">Threadwise</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-black/60 hidden sm:block">The Spatial Workbench</span>
          <Link to="/" className="px-5 py-2.5 bg-black text-[#FAF9F5] rounded-full text-sm font-medium hover:bg-black/80 transition-colors">
            Enter Workspace
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center pt-24 pb-32 px-6 text-center">
        
        <div className="mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/10 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-black">Stop summarizing. Start investigating.</span>
        </div>

        <h1 className="font-display text-6xl md:text-8xl lg:text-[110px] leading-[0.95] text-[#111] mb-8 tracking-tighter max-w-5xl">
          Map the <br />
          <span className="italic text-black/70">unseen.</span>
        </h1>

        <p className="text-lg md:text-xl text-black/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Threadwise is a spatial intelligence workbench. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
        </p>

        <Link to="/" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#111] text-[#FAF9F5] rounded-full font-medium text-lg transition-all hover:scale-105 hover:bg-black hover:shadow-2xl">
          Start your first investigation
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>

      </main>

      {/* CINEMATIC 3D APP MOCKUP */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-32 perspective-[2000px]">
        <div 
          className="w-full bg-white border border-black/10 rounded-2xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.2)] overflow-hidden transition-transform duration-1000 ease-out hover:rotate-0"
          style={{ transform: 'rotateX(15deg) rotateY(-5deg) scale(0.95)' }}
        >
          {/* Mockup Toolbar */}
          <div className="h-12 border-b border-black/5 bg-[#FAF9F5] flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="mx-auto flex items-center gap-2 text-xs font-mono text-black/40">
              <Network className="w-3 h-3" /> My workspace · Haiti Investigation
            </div>
          </div>

          {/* Mockup Canvas Area */}
          <div className="relative h-[500px] bg-[#FAF9F5] p-12 overflow-hidden">
            {/* Grid inside mockup */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
              }}
            />

            {/* SVG Connections inside mockup */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M 250 200 Q 400 200 500 300" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M 500 300 Q 700 300 750 400" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" strokeDasharray="6 6" />
            </svg>

            {/* Node 1: Question */}
            <div className="absolute top-[20%] left-[10%] w-72 bg-white border border-black/10 rounded-xl shadow-lg z-10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-black/[0.02]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Question</span>
                <span className="text-[10px] font-mono text-muted-foreground">UNKNOWN</span>
              </div>
              <div className="p-4">
                <h4 className="font-display text-lg leading-tight text-black mb-2">What is the real motive?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
              </div>
            </div>

            {/* Node 2: Evidence */}
            <div className="absolute top-[50%] left-[35%] w-80 bg-white border border-black/10 rounded-xl shadow-lg z-10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-black/[0.02]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 flex items-center gap-1"><FileText className="w-3 h-3"/> Evidence</span>
                <span className="text-[10px] font-mono text-muted-foreground">FACT</span>
              </div>
              <div className="p-4">
                <h4 className="font-display text-lg leading-tight text-black mb-2">El Salvador sends troops</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
                <div className="mt-3 pt-3 border-t border-black/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono bg-black/5 px-2 py-1 rounded">Miami Herald</span>
                  <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3"/> Verified</span>
                </div>
              </div>
            </div>

            {/* Node 3: Hypothesis */}
            <div className="absolute bottom-[15%] right-[15%] w-64 bg-white border border-black/10 rounded-xl shadow-lg z-10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-black/5 bg-black/[0.02]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-600 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Hypothesis</span>
              </div>
              <div className="p-4">
                <h4 className="font-display text-lg leading-tight text-black mb-2">Securing US Favor</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}