import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowRight, Quote, MapPin, Edit3, Circle } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1A1A1A] font-sans selection:bg-[#C24A35] selection:text-white">
      
      {/* Top Navigation */}
      <header className="flex justify-between items-center px-6 md:px-12 py-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#C24A35]">
            <circle cx="6" cy="18" r="2.5" fill="currentColor"/>
            <path d="M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
            <circle cx="18" cy="6" r="2.5" fill="currentColor"/>
            <path d="M18 6L12 12" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
          </svg>
          <span className="font-display italic text-2xl tracking-tight font-medium">threadwise</span>
        </div>
        
        {/* This link goes to your main app (which is currently at /) */}
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity">
          Open workspace <ArrowUpRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-[1400px] mx-auto w-full px-6 md:px-12 pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Typography */}
          <div className="flex flex-col max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C24A35]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-medium">For the naturally curious</span>
            </div>

            <h1 className="font-display text-6xl md:text-[80px] leading-[0.95] tracking-tight mb-8">
              Threadwise.<br />
              See what <span className="text-[#C24A35] italic">connects.</span>
            </h1>

            <div className="text-lg md:text-xl text-[#1A1A1A]/70 leading-relaxed mb-10 space-y-2">
              <p>Bring your sources, questions and ideas together.</p>
              <p>Find the evidence. Test the explanation.</p>
              <p>Decide what comes next.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
              <Link 
                to="/" 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C24A35] text-white hover:bg-[#A33C2A] transition-colors text-sm font-medium"
              >
                Start your canvas <ArrowUpRight className="w-4 h-4" />
              </Link>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 text-[#1A1A1A] hover:bg-black/5 transition-colors text-sm font-medium">
                Explore an example <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#1A1A1A]/40">
              Your thinking. A little more connected.
            </p>
          </div>

          {/* Right Column: Image */}
          <div className="relative w-full h-[500px] lg:h-[700px] rounded-2xl overflow-hidden shadow-2xl shadow-black/5 border border-black/5 bg-[#e8e6e1]">
            {/* 
              IMPORTANT: Save the image you uploaded to your project as `public/hero-bg.jpg` 
            */}
            <img 
              src="/hero-bg.jpg" 
              alt="Investigative corkboard with red string" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
          </div>

        </div>
      </main>

      {/* The Example Section */}
      <section className="bg-white border-t border-black/5 py-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <h2 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
              The story changes.<br />
              <span className="italic text-[#1A1A1A]/60">What changed behind it?</span>
            </h2>
            <div className="flex items-center">
              <p className="text-lg text-[#1A1A1A]/60 leading-relaxed max-w-md">
                A promise to the public. A speech to investors. A missing timetable. Read them separately and you have three sources. Put them together and you have a better question.
              </p>
            </div>
          </div>

          {/* The Interactive Canvas Mockup */}
          <div className="border border-black/10 rounded-xl overflow-hidden bg-[#FAF9F5] flex flex-col md:flex-row h-auto md:h-[500px]">
            
            {/* Left Sidebar (Sources) */}
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-black/10 p-6 flex flex-col gap-2">
              
              {/* Source 1 */}
              <div className="group relative p-4 bg-black/5 border-l-2 border-[#C24A35] cursor-pointer">
                <div className="flex justify-between text-[10px] font-mono tracking-widest text-[#C24A35] mb-2 uppercase">
                  <span>01 Public Address</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
                <h3 className="font-display text-xl leading-tight mb-4">A promise to the coast</h3>
                <span className="text-[10px] font-mono text-black/40">12 Mar 2025</span>
              </div>

              {/* Source 2 */}
              <div className="group relative p-4 border-l-2 border-transparent hover:bg-black/5 cursor-pointer">
                <div className="flex justify-between text-[10px] font-mono tracking-widest text-black/40 mb-2 uppercase">
                  <span>02 Investor Address</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
                <h3 className="font-display text-xl leading-tight mb-4 text-black/70">A different room. A different emphasis.</h3>
                <span className="text-[10px] font-mono text-black/40">04 Feb 2026</span>
              </div>

              {/* Source 3 */}
              <div className="group relative p-4 border-l-2 border-transparent hover:bg-black/5 cursor-pointer">
                <div className="flex justify-between text-[10px] font-mono tracking-widest text-black/40 mb-2 uppercase">
                  <span>03 Local Reporting</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
                <h3 className="font-display text-xl leading-tight mb-4 text-black/70">The question still on the table</h3>
                <span className="text-[10px] font-mono text-black/40">06 Feb 2026</span>
              </div>

              <div className="mt-auto pt-8">
                <div className="flex items-center gap-3 text-sm text-black/50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  <span className="font-mono text-xs uppercase tracking-widest">Three sources.<br/>One connected investigation.</span>
                </div>
              </div>
            </div>

            {/* Right Content (Quote) */}
            <div className="w-full md:w-2/3 p-8 md:p-12 relative flex flex-col justify-center">
              
              <div className="flex justify-between text-[10px] font-mono tracking-widest text-black/40 mb-12 uppercase">
                <span>01 / Public Address</span>
                <span className="flex items-center gap-1"><Circle className="w-2 h-2 fill-current" /> Source evidence</span>
              </div>

              <Quote className="w-10 h-10 text-[#C24A35] mb-6 opacity-30" />
              
              <blockquote className="font-display text-3xl md:text-4xl leading-[1.2] mb-8">
                “By 2030, our harbour will run on clean energy, and every worker in this port will be part of that future.”
              </blockquote>

              <div className="mb-12">
                <p className="text-sm font-medium">Minister A. Varela · Policy launch</p>
                <p className="text-xs font-mono text-black/40 mt-1">12 MAR 2025 · Fictional source</p>
              </div>

              <div className="pt-6 border-t border-black/10">
                <p className="text-[10px] font-mono tracking-widest text-black/40 mb-3 uppercase">What this establishes</p>
                <p className="text-lg">A public deadline, with workers placed at the centre of the promise.</p>
              </div>

              {/* Floating Toolbar */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-xl border border-black/5">
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors"><MapPin className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors font-serif font-bold text-lg leading-none">T</button>
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors"><Edit3 className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors"><Circle className="w-4 h-4" /></button>
              </div>

            </div>
          </div>

        </div>
      </section>

    </div>
  );
}