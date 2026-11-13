import { createFileRoute, Link } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, GripVertical } from "lucide-react";
import { RecordEye } from "@/components/record/RecordEye";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "The record — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "One record, torn open. The eye looks through; the margin keeps the missing fact attached.",
      },
    ],
  }),
  component: RecordPage,
});

const EDGE =
  "polygon(0 0, 99.4% 0, 100% 3%, 99.1% 7%, 100% 11%, 98.8% 16%, 100% 21%, 99.4% 26%, 100% 31%, 98.9% 36%, 100% 41%, 99.5% 46%, 100% 51%, 98.8% 56%, 100% 61%, 99.4% 66%, 100% 71%, 99.1% 76%, 100% 81%, 99.6% 86%, 100% 91%, 99.2% 96%, 100% 100%, 0.4% 100%, 0 96%, 0.8% 91%, 0 86%, 0.5% 81%, 0 76%, 1% 71%, 0 66%, 0.4% 61%, 0 56%, 0.8% 51%, 0 46%, 0.5% 41%, 0 36%, 1.1% 31%, 0 26%, 0.4% 21%, 0 16%, 0.7% 11%, 0 7%, 0.3% 3%)";

function RecordPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; width: number } | null>(null);
  const [band, setBand] = useState(42);
  const [thread, setThread] = useState<string | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const page = pageRef.current;
      const bandEl = bandRef.current;
      const note = noteRef.current;
      if (!page || !bandEl || !note || window.innerWidth < 640) {
        setThread(null);
        return;
      }
      const p = page.getBoundingClientRect();
      const b = bandEl.getBoundingClientRect();
      const n = note.getBoundingClientRect();
      const x1 = b.left + b.width * 0.62 - p.left;
      const y1 = b.top + b.height * 0.45 - p.top;
      const x2 = n.left - p.left;
      const y2 = n.top + 46 - p.top;
      setThread(`M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + 70).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - 70).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [band]);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setBand(Math.max(34, Math.min(48, drag.width + (event.clientX - drag.x) * 0.055)));
  };

  const stop = () => { dragRef.current = null; };

  return (
    <div ref={pageRef} className="relative flex min-h-[100dvh] flex-col bg-[#F1E9D8] text-[#11110F]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,#11110F_5px,#11110F_6px)]" />

      <header className="relative z-40 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[22px] italic leading-none md:text-[23px]">threadwise</Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/40">
          <span className="hidden sm:inline">Experiment 11 / the record</span>
          <Link to="/" className="border-b border-[#11110F]/20 pb-0.5 hover:text-[#11110F]">Close</Link>
        </div>
      </header>

      <main
        className="record-grid relative z-10 flex-1"
        style={{ "--band": `${band}%` } as React.CSSProperties}
      >
        <div className="record-left relative z-20 px-5 pb-8 pt-4 md:flex md:flex-col md:justify-center md:px-8 md:py-10">
          <div className="max-w-[520px]">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#1737E8]">The record / IAEA–Iran / 09 Nov 2026</p>
            <h1 className="mt-3 max-w-[11ch] font-display text-[clamp(38px,4.8vw,76px)] leading-[0.88] tracking-[-0.045em]">See what the story hides.</h1>
            <p className="mt-4 max-w-[34ch] font-serif text-[14px] leading-[1.65] text-[#11110F]/60 md:text-[15px]">One record, torn open. The eye looks through. The margin keeps the missing fact attached.</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="inline-flex items-center gap-2 border-b border-[#11110F] pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">Open the full IAEA read <ArrowUpRight className="h-3 w-3" /></Link>
              <span className="rotate-[-5deg] border border-[#C1121F] px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em] text-[#C1121F]">Partially redacted</span>
            </div>
          </div>
        </div>

        <div ref={bandRef} className="record-band relative z-10 overflow-hidden drop-shadow-[10px_0_18px_rgba(17,17,15,0.10)]" style={{ clipPath: EDGE, WebkitClipPath: EDGE }}>
          <div className="absolute inset-0 bg-[#FF4B2E]" />
          <div className="absolute inset-0 bg-[#1C3BFF]" style={{ clipPath: "inset(0 0 0 50%)" }} />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,#F1E9D8_5px,#F1E9D8_6px)]" />

          <div className="absolute left-1/2 top-[45%] z-10 w-[78%] max-w-[300px] -translate-x-1/2 -translate-y-1/2">
            <RecordEye />
          </div>

          <div
            role="slider"
            aria-label="Open or close the tear"
            aria-valuemin={34}
            aria-valuemax={48}
            aria-valuenow={Math.round(band)}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") { event.preventDefault(); setBand((value) => Math.max(34, value - 1)); }
              if (event.key === "ArrowRight") { event.preventDefault(); setBand((value) => Math.min(48, value + 1)); }
              if (event.key === "Home") { event.preventDefault(); setBand(34); }
              if (event.key === "End") { event.preventDefault(); setBand(48); }
            }}
            onPointerDown={(event) => {
              dragRef.current = { x: event.clientX, width: band };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={move}
            onPointerUp={stop}
            onPointerCancel={stop}
            className="absolute bottom-[7%] left-1/2 z-30 hidden -translate-x-1/2 cursor-ew-resize touch-none sm:block"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F1E9D8]/70 bg-[#11110F] text-[#F1E9D8] shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
              <GripVertical className="h-4 w-4" />
            </div>
            <p className="mt-2 whitespace-nowrap text-center font-mono text-[7px] uppercase tracking-[0.16em] text-[#F1E9D8]/80">Open the tear</p>
          </div>
        </div>

        <aside className="record-right relative z-20 px-5 pb-8 pt-6 md:flex md:flex-col md:justify-center md:px-8 md:py-10">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#11110F]/35">The margin / 01</p>
          <div ref={noteRef} className="mt-4 w-full max-w-[280px] rotate-[1.4deg] md:ml-auto border border-[#11110F]/20 bg-[#F7F0E4] p-4 shadow-[8px_10px_0_rgba(17,17,15,0.14)] md:mt-8">
            <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-[#F7F0E4] bg-[#FF5B3D]" />
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-[#C1121F]">The missing fact</p>
            <p className="mt-2 font-display text-[25px] leading-[1.02]">The stockpile figure is unknown.</p>
            <p className="mt-2 font-serif text-[12px] leading-[1.6] text-[#11110F]/60">Iran has not said how much 60%-enriched uranium survived. The Agency can describe the programme without verifying the stockpile.</p>
            <p className="mt-3 border-t border-[#11110F]/15 pt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#11110F]/35">IAEA / safeguards</p>
          </div>
          <p className="mt-5 hidden max-w-[26ch] font-serif text-[12px] leading-[1.5] text-[#11110F]/40 md:block">The thread holds the note to the place the record stops.</p>
        </aside>
      </main>

      <svg className="pointer-events-none absolute inset-0 z-30 hidden h-full w-full md:block" aria-hidden="true">
        {thread ? (
          <>
            <path d={thread} fill="none" stroke="#FF5B3D" strokeWidth="1.2" strokeDasharray="3 4" />
            <circle cx={thread.split(" ")[1]} cy={thread.split(" ")[2]} r="3" fill="#FF5B3D" />
          </>
        ) : null}
      </svg>

      <footer className="relative z-40 flex flex-wrap items-center justify-between gap-2 border-t border-[#11110F]/15 px-5 py-3 font-mono text-[7px] uppercase tracking-[0.13em] text-[#11110F]/35 md:px-8">
        <span>Threadwise / the record</span>
        <span className="hidden sm:inline">Drag the tear / keep the margin attached</span>
        <span>IAEA / 09 Nov 2026</span>
      </footer>
    </div>
  );
}
