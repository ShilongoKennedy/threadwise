import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, FileText, Lightbulb, GitBranch } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#fbf9ed] text-[#1a1a1a] font-sans selection:bg-black/10 overflow-hidden relative">
      
      {/* Ambient Color Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none" />
      
      {/* The Canvas Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Navigation - Matches App Logo */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Exact Logo from your app */}
          <div className="text-[#c2410c] flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="18" r="2" fill="currentColor"/>
              <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="18" cy="6" r="2" fill="currentColor"/>
              <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-display text-3xl italic tracking-tight font-medium group-hover:opacity-80 transition-opacity">Threadwise</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hidden sm:block">The Spatial Workbench</span>
          <Link to="/" className="px-5 py-2.5 bg-[#1a1a1a] text-[#fbf9ed] rounded-full text-sm font-medium hover:bg-black transition-colors shadow-lg shadow-black/10">
            Enter Workspace
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center pt-20 pb-20 px-6 text-center">
        
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Stop summarizing. Start investigating.</span>
        </div>

        <h1 className="font-display text-6xl md:text-8xl lg:text-[100px] leading-[1.05] text-[#1a1a1a] mb-6 tracking-tight max-w-5xl">
          Map the <br />
          <span className="italic text-black/60">unseen.</span>
        </h1>

        <p className="text-lg md:text-xl text-[#1a1a1a]/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Threadwise is a spatial intelligence workbench. Connect the dots, separate hard evidence from strategic hypotheses, and map the bigger picture.
        </p>

        <Link to="/" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a1a] text-[#fbf9ed] rounded-full font-medium text-lg transition-all hover:scale-105 hover:bg-black hover:shadow-2xl hover:shadow-black/20">
          Start your first investigation
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>

      </main>

      {/* CINEMATIC 3D APP MOCKUP - Featuring your actual colors */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-32 perspective-[2000px]">
        <div 
          className="w-full bg-[#fbf9ed] border border-black/10 rounded-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden transition-transform duration-1000 ease-out hover:rotate-0"
          style={{ transform: 'rotateX(12deg) rotateY(-4deg) scale(0.95)' }}
        >
          {/* Mockup Toolbar */}
          <div className="h-10 border-b border-black/5 bg-[#f5f2db] flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="mx-auto flex items-center gap-2 text-xs font-mono text-black/40">
              <GitBranch className="w-3 h-3" /> My workspace · Haiti Investigation
            </div>
          </div>

          {/* Mockup Canvas Area */}
          <div className="relative h-[450px] bg-[#fbf9ed] p-12 overflow-hidden">
            {/* Grid inside mockup */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-50"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '25px 25px',
              }}
            />

            {/* SVG Connections inside mockup */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M 280 180 Q 450 150 550 250" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M 550 250 Q 700 350 800 300" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>

            {/* Node 1: Question (Purple) */}
            <div className="absolute top-[15%] left-[10%] w-72 bg-white/90 backdrop-blur-sm border border-purple-200 rounded-xl shadow-xl shadow-purple-900/5 z-10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-purple-100 bg-purple-50/50 rounded-t-xl">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-700 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Question</span>
                <span className="text-[10px] font-mono text-purple-400">UNKNOWN</span>
              </div>
              <div className="p-4">
                <h4 className="font-display text-lg leading-tight text-black mb-2">What is the real motive?</h4>
                <p className="text-xs text-black/60 leading-relaxed">If the deployment is about security, why send special forces to find four soldiers instead of humanitarian aid?</p>
              </div>
            </div>

            {/* Node 2: Evidence (Emerald) */}
            <div className="absolute top-[45%] left-[30%] w-80 bg-white/90 backdrop-blur-sm border border-emerald-200 rounded-xl shadow-xl shadow-emerald-900/5 z-10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-100 bg-emerald-50/50 rounded-t-xl">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 flex items-center gap-1"><FileText className="w-3 h-3"/> Evidence</span>
                <span className="text-[10px] font-mono text-emerald-600">FACT</span>
              </div>
              <div className="p-4">
                <h4 className="font-display text-lg leading-tight text-black mb-2">El Salvador sends troops</h4>
                <p className="text-xs text-black/60 leading-relaxed">Salvadoran troops land in Haiti aboard a Pentagon plane amid crisis over ambushed soldiers.</p>
                <div className="mt-3 pt-3 border-t border-black/5 flex justify-between items-center">
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">Miami Herald</span>
                </div>
              </div>
            </div>

            {/* Node 3: Hypothesis (Amber) */}
            <div className="absolute bottom-[20%] right-[15%] w-72 bg-white/90 backdrop-blur-sm border border-amber-200 rounded-xl shadow-xl shadow-amber-900/5 z-10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-amber-100 bg-amber-50/50 rounded-t-xl">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 flex items-center gap-1"><Lightbulb className="w-3 h-3"/> Hypothesis</span>
              </div>
              <div className="p-4">
                <h4 className="font-display text-lg leading-tight text-black mb-2">Securing US Favor</h4>
                <p className="text-xs text-black/60 leading-relaxed">Bukele is using the Haiti deployment as a bargaining chip for US economic aid.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}