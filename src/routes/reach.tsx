import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { ReachCanvas } from "@/components/threadwise/ReachCanvas";

export const Route = createFileRoute("/reach")({
  head: () => ({
    meta: [
      { title: "The reach — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experiment in reading a paragraph that refuses to sit still.",
      },
    ],
  }),
  component: ReachPage,
});

function ReachPage() {
  const [held, setHeld] = useState(false);

  return (
    <div className="relative h-[100dvh] min-h-[640px] overflow-hidden bg-[#0B0C0E] text-[#F4EBDD] selection:bg-[#FF5A3C] selection:text-[#0B0C0E]">
      <ReachCanvas held={held} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,90,60,0.09),transparent_48%)]" />
      <div className="pointer-events-none absolute left-5 top-20 h-3 w-3 border-l border-t border-[#F4EBDD]/25 md:left-8" />
      <div className="pointer-events-none absolute right-5 top-20 h-3 w-3 border-r border-t border-[#F4EBDD]/25 md:right-8" />

      <header className="relative z-20 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none text-[#F4EBDD]">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F4EBDD]/45">
          <span className="hidden sm:inline">Experiment 08 / the reach</span>
          <Link to="/" className="border-b border-[#F4EBDD]/20 pb-0.5 hover:text-[#F4EBDD]">
            Close
          </Link>
        </div>
      </header>

      <main className="pointer-events-none relative z-10 flex h-[calc(100dvh-65px)] flex-col justify-between px-5 pb-5 pt-[5.5rem] md:px-8 md:pb-8 md:pt-24">
        <div className="max-w-[540px]">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#FF5A3C]">
            The read / IAEA–Iran
          </p>
          <h1 className="mt-2 max-w-[12ch] font-display text-[clamp(40px,5.6vw,76px)] leading-[0.92] tracking-[-0.04em]">
            The story hides when you reach for it.
          </h1>
          <p className="mt-4 max-w-[36ch] font-serif text-[14px] leading-[1.65] text-[#F4EBDD]/55 md:text-[15px]">
            Move the cursor. The words keep their distance. Click one to hold it, or hold the page.
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setHeld((current) => !current)}
              className="inline-flex items-center gap-2 border-b border-[#F4EBDD]/30 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#F4EBDD]/65 hover:text-[#F4EBDD]"
            >
              {held ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {held ? "Let it move" : "Hold the page"}
            </button>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#F4EBDD]/25">
              {held ? "Held still" : "Words move near your cursor"}
            </span>
          </div>
          <Link
            to="/read/$token"
            params={{ token: "mn4qvf4bhu" }}
            className="inline-flex items-center gap-2 border-b border-[#FF5A3C]/50 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#FF5A3C]"
          >
            Open the read <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </main>

      <p className="sr-only">
        The IAEA sent a confidential report to member states. The contents are unpublished.
        Inspectors have not been allowed back to the sites bombed in June 2025. The stockpile figure
        is unknown.
      </p>
    </div>
  );
}
