import { createFileRoute, Link } from "@tanstack/react-router";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: "The board — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experiment in arranging the evidence: drag a note, the thread follows.",
      },
    ],
  }),
  component: BoardPage,
});

const NOTES = [
  {
    id: "move",
    no: "01",
    kicker: "The move",
    title: "A confidential report went to member states.",
    body: "It is a finding against Iran’s safeguards obligations, not a public finding.",
    className: "left-[2%] top-[6%] md:left-[6%] md:top-[24%]",
    rotation: -2.2,
  },
  {
    id: "contents",
    no: "02",
    kicker: "The contents",
    title: "The contents are unpublished.",
    body: "No stockpile figure, site or finding has been quoted publicly.",
    className: "right-[2%] top-[6%] md:right-[6%] md:top-[20%]",
    rotation: 1.8,
  },
  {
    id: "access",
    no: "03",
    kicker: "Access",
    title: "Inspectors have not been back.",
    body: "The sites bombed in June 2025 remain without inspector access.",
    className: "left-[3%] top-[68%] md:left-[6%] md:top-[62%]",
    rotation: 1.4,
  },
  {
    id: "number",
    no: "04",
    kicker: "The number",
    title: "The stockpile figure is unknown.",
    body: "Iran has not said how much of its 60%-enriched uranium survived.",
    className: "right-[3%] top-[66%] md:right-[6%] md:top-[60%]",
    rotation: -1.8,
  },
] as const;

export function BoardPage() {
  const boardRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [threads, setThreads] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    const measure = () => {
      const board = boardRef.current;
      const center = centerRef.current;
      if (!board || !center) return;
      const b = board.getBoundingClientRect();
      const c = center.getBoundingClientRect();
      const cx = c.left + c.width / 2 - b.left;
      const cy = c.top + c.height / 2 - b.top;
      const next: Record<string, string> = {};
      for (const note of NOTES) {
        const element = noteRefs.current[note.id];
        if (!element) continue;
        const n = element.getBoundingClientRect();
        const nx = n.left + n.width / 2 - b.left;
        const ny = n.top + n.height / 2 - b.top;
        const mx = (cx + nx) / 2;
        const my = (cy + ny) / 2;
        next[note.id] = `M ${cx.toFixed(1)} ${cy.toFixed(1)} Q ${(mx + (ny - cy) * 0.12).toFixed(1)} ${(my - (nx - cx) * 0.12).toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
      }
      setThreads(next);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [offsets]);

  const startDrag = (id: string, event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsets[id]?.x ?? 0,
      originY: offsets[id]?.y ?? 0,
    };
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffsets((current) => ({
      ...current,
      [drag.id]: {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      },
    }));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#1737E8] text-[#F5EEDF] selection:bg-[#E7FF58] selection:text-[#11110F]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #F5EEDF 1px, transparent 1px), linear-gradient(to bottom, #F5EEDF 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="pointer-events-none absolute left-5 top-20 h-3 w-3 border-l border-t border-[#F5EEDF]/30 md:left-8" />
      <div className="pointer-events-none absolute right-5 top-20 h-3 w-3 border-r border-t border-[#F5EEDF]/30 md:right-8" />

      <header className="relative z-30 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none text-[#F5EEDF]">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F5EEDF]/50">
          <span className="hidden sm:inline">Experiment 11 / the board</span>
          <Link to="/" className="border-b border-[#F5EEDF]/25 pb-0.5 hover:text-[#F5EEDF]">
            Close
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-16 pt-2 md:px-8 md:pb-20 md:pt-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#E7FF58]">
              The board / IAEA–Iran
            </p>
            <h1 className="mt-2 max-w-[13ch] font-display text-[clamp(38px,5.3vw,76px)] leading-[0.9] tracking-[-0.04em]">
              Four notes. One record. Move them.
            </h1>
          </div>
          <p className="max-w-[28ch] pb-1 font-serif text-[14px] leading-[1.6] text-[#F5EEDF]/60 md:text-[15px]">
            Drag a note. The thread stays attached. The record changes shape.
          </p>
        </div>

        <div
          ref={boardRef}
          className="relative mt-3 h-[560px] w-full touch-none select-none md:mt-5 md:h-[600px]"
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            {NOTES.map((note) => (
              <path
                key={note.id}
                d={threads[note.id] ?? ""}
                fill="none"
                stroke="#FF4B2B"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            ))}
          </svg>

          <div
            ref={centerRef}
            className="absolute left-1/2 top-[37%] z-20 w-[200px] -translate-x-1/2 -translate-y-1/2 rotate-[-1deg] md:top-[45%] md:w-[350px] border border-[#11110F]/25 bg-[#F5EEDF] p-4 text-[#11110F] shadow-[10px_12px_0_rgba(17,17,15,0.2)] md:w-[350px] md:p-6"
          >
            <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-[#F5EEDF] bg-[#FF4B2B]" />
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1737E8]">
              The question / 00
            </p>
            <p className="mt-2 font-display text-[22px] leading-[1] md:mt-3 md:text-[38px]">
              What does the record actually say?
            </p>
            <p className="mt-2 hidden font-serif text-[12px] leading-[1.5] text-[#11110F]/55 md:block">
              Not what the headline says. The note behind it.
            </p>
          </div>

          {NOTES.map((note) => {
            const offset = offsets[note.id] ?? { x: 0, y: 0 };
            return (
              <div
                key={note.id}
                ref={(element) => { noteRefs.current[note.id] = element; }}
                onPointerDown={(event) => startDrag(note.id, event)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`absolute z-20 w-[150px] cursor-grab touch-none border border-[#11110F]/20 bg-[#F5EEDF] p-3 text-[#11110F] shadow-[7px_9px_0_rgba(17,17,15,0.18)] active:cursor-grabbing md:w-[248px] md:p-4 ${note.className}`}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${note.rotation}deg)`,
                }}
              >
                <span className="absolute -top-1.5 left-5 h-2.5 w-2.5 rounded-full border border-[#F5EEDF] bg-[#FF4B2B]" />
                <div className="flex items-center justify-between gap-2 border-b border-[#11110F]/15 pb-2">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#1737E8]">
                    {note.no} / {note.kicker}
                  </span>
                  <span className="h-2 w-6 -rotate-2 bg-[#E7FF58]" />
                </div>
                <p className="mt-2 font-display text-[16px] leading-[1.05] md:mt-3 md:text-[21px]">
                  {note.title}
                </p>
                <p className="mt-2 hidden font-serif text-[11px] leading-[1.45] text-[#11110F]/55 md:block">
                  {note.body}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border-t border-[#F5EEDF]/15 px-5 py-3 md:px-8">
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#F5EEDF]/40">
          Drag the evidence / the thread follows
        </p>
        <Link
          to="/read/$token"
          params={{ token: "mn4qvf4bhu" }}
          className="inline-flex items-center gap-2 border-b border-[#E7FF58]/45 pb-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#E7FF58]"
        >
          Open the full read <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
