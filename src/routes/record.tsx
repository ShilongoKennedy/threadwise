import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { RedactionSheet } from "@/components/threadwise/RedactionSheet";
import { ReachCanvas } from "@/components/threadwise/ReachCanvas";
import { RecordEye } from "@/components/record/RecordEye";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "The record — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "One IAEA record, read five ways: watched, redacted, torn, annotated, unsettled.",
      },
    ],
  }),
  component: RecordPage,
});

const EDGE = [1.1, -0.7, 0.4, -1.3, 0.8, -0.4, 1.4, -0.9, 0.3, -1.1, 0.9, -0.6, 1.2, -0.3, 0.7, -1.2];

const MARGIN_NOTES = [
  {
    id: "confidential",
    no: "01",
    phrase: "a confidential report",
    label: "Not a public finding",
    body: "Confidential means the document is circulated to governments. Its authority is the safeguards mandate, not a power to compel access.",
    source: "IAEA / member states",
  },
  {
    id: "states",
    no: "02",
    phrase: "member states",
    label: "The Board decides what happens next",
    body: "The 35-member Board of Governors receives the report. Whether it reaches the formal agenda is a political decision.",
    source: "IAEA Board of Governors",
  },
  {
    id: "access",
    no: "03",
    phrase: "not been allowed back",
    label: "The door stayed closed",
    body: "The sites bombed in June 2025 remain without inspector access. That is a finding about compliance, not capability.",
    source: "Reuters / IAEA",
  },
  {
    id: "stockpile",
    no: "04",
    phrase: "the stockpile figure is unknown",
    label: "The missing number leads",
    body: "Iran has not said how much 60%-enriched uranium survived. The Agency can describe the programme without verifying the stockpile.",
    source: "IAEA / safeguards",
  },
];

function SectionLabel({ no, children, light = true, accent = "acid" }: { no: string; children: React.ReactNode; light?: boolean; accent?: "acid" | "blue" | "coral" }) {
  const accentClass = accent === "blue" ? "text-[#1737E8]" : accent === "coral" ? "text-[#FF4B2B]" : "text-[#E7FF58]";
  return (
    <div className="flex items-center gap-3 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em]">
      <span className={accentClass}>{no}</span>
      <span className={`h-3 w-px ${light ? "bg-[#F1E9D8]/20" : "bg-[#11110F]/20"}`} />
      <span className={light ? "text-[#F1E9D8]/55" : "text-[#11110F]/55"}>{children}</span>
    </div>
  );
}

function TearBand() {
  const [seam, setSeam] = useState(50);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSeam(Math.max(23, Math.min(77, ((event.clientX - rect.left) / rect.width) * 100)));
  };

  const nudge = (delta: number) => setSeam((current) => Math.max(23, Math.min(77, current + delta)));

  const clip = `polygon(0 0, ${EDGE.map((offset, index) => {
    const step = (index / (EDGE.length - 1)) * 100;
    return `calc(var(--seam) + ${offset}%) ${step}%`;
  }).join(", ")}, 0 100%)`;

  return (
    <section
      id="tear"
      ref={surfaceRef}
      onPointerMove={update}
      className="relative h-[86vh] min-h-[620px] w-full overflow-hidden bg-[#FF4B2E] text-[#FFF4E6]"
      style={{ "--seam": `${seam}%` } as React.CSSProperties}
    >
      <div className="absolute inset-0 bg-[#1C3BFF] text-[#FFF4E6]">
        <div className="absolute inset-y-0 right-0 w-[54%] px-5 pt-20 md:px-8 md:pt-24">
          <div className="absolute right-5 top-20 text-right md:right-8 md:top-24">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#E7FF58]">THE COUNTER / 02</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#FFF4E6]/45">A signal, not a finding</p>
          </div>
          <div className="absolute bottom-[17%] right-5 w-[min(38rem,84%)] text-right md:right-8">
            <h2 className="font-display text-[34px] leading-[0.9] tracking-[-0.04em] md:text-[clamp(46px,6.6vw,102px)] md:leading-[0.84]">The report is a signal.</h2>
            <p className="ml-auto mt-4 max-w-[24ch] font-serif text-[12px] leading-[1.6] text-[#FFF4E6]/70 md:mt-5 md:max-w-[29ch] md:text-[17px]">It tells governments where to look. It does not tell them what they will find.</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-[#FF4B2E] text-[#FFF4E6] drop-shadow-[8px_0_0_rgba(17,17,15,0.18)]" style={{ clipPath: clip, WebkitClipPath: clip }}>
        <div className="absolute inset-y-0 left-0 w-[54%] px-5 pt-20 md:px-8 md:pt-24">
          <div className="absolute left-5 top-20 md:left-8 md:top-24">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#E7FF58]">THE MOVE / 01</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#FFF4E6]/45">A finding, not a signal</p>
          </div>
          <div className="absolute bottom-[17%] left-5 w-[min(38rem,84%)] md:left-8">
            <h2 className="font-display text-[34px] leading-[0.9] tracking-[-0.04em] md:text-[clamp(46px,6.6vw,102px)] md:leading-[0.84]">The report is a finding.</h2>
            <p className="mt-4 max-w-[24ch] font-serif text-[12px] leading-[1.6] text-[#FFF4E6]/70 md:mt-5 md:max-w-[29ch] md:text-[17px]">It names a breach, and a government citing it should be read as doing exactly that.</p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 z-20 w-px bg-[#11110F]/45" style={{ left: "var(--seam)" }} />
      <button
        type="button"
        role="slider"
        aria-label="Move the tear between the two readings"
        aria-valuemin={23}
        aria-valuemax={77}
        aria-valuenow={Math.round(seam)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); nudge(-2); }
          if (event.key === "ArrowRight") { event.preventDefault(); nudge(2); }
          if (event.key === "Home") { event.preventDefault(); setSeam(23); }
          if (event.key === "End") { event.preventDefault(); setSeam(77); }
        }}
        className="absolute top-1/2 z-30 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-[#FFF4E6]/70 bg-[#11110F] text-[#FFF4E6] shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
        style={{ left: "var(--seam)" }}
      >
        <span className="flex items-center gap-1 text-[11px]" aria-hidden="true"><span>←</span><span>→</span></span>
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 hidden -translate-y-1/2 text-center md:block">
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#FFF4E6]/55">Drag the tear</p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-[#11110F] bg-[#FFF4E6] text-[#11110F]">
        <div className="mx-auto flex w-full max-w-[1300px] flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-3 md:px-8">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#11110F]/45">02 / The tear / two readings / one record</p>
          <p className="font-serif text-[13px] leading-snug md:text-[14px]">Both are true. Neither is the whole record.</p>
          <a href="#margin" className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1C3BFF]">Next / the margin <ArrowDown className="h-3 w-3" /></a>
        </div>
      </div>
    </section>
  );
}

function MarginBand() {
  const [active, setActive] = useState("confidential");
  const containerRef = useRef<HTMLDivElement>(null);
  const phraseRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const noteRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<string | null>(null);
  const note = MARGIN_NOTES.find((item) => item.id === active) ?? MARGIN_NOTES[0]!;

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const phrase = phraseRefs.current[active];
      const noteEl = noteRef.current;
      if (!container || !phrase || !noteEl) return;
      const c = container.getBoundingClientRect();
      const p = phrase.getBoundingClientRect();
      const n = noteEl.getBoundingClientRect();
      const x1 = p.right - c.left;
      const y1 = p.top + p.height * 0.55 - c.top;
      const x2 = n.left - c.left;
      const y2 = n.top + 42 - c.top;
      setThread(`M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + 70).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - 80).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [active]);

  return (
    <section id="margin" className="relative overflow-hidden bg-[#0A2E25] px-5 py-20 text-[#F4ECDD] md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel no="03" accent="acid">The margin</SectionLabel>
        <div ref={containerRef} className="relative mt-7">
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" aria-hidden="true">
            {thread ? (
              <>
                <path d={thread} fill="none" stroke="#FF5C3D" strokeWidth="1.2" strokeDasharray="3 4" />
                <circle cx={thread.split(" ")[1]} cy={thread.split(" ")[2]} r="3" fill="#FF5C3D" />
              </>
            ) : null}
          </svg>

          <div className="relative z-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_340px] md:gap-16">
            <div>
              <h2 className="max-w-[12ch] font-display text-[clamp(38px,5.2vw,76px)] leading-[0.9] tracking-[-0.04em]">The story is in the margins.</h2>
              <p className="mt-4 max-w-[42ch] font-serif text-[14px] leading-[1.65] text-[#F4ECDD]/55 md:text-[16px]">Hover a marked phrase. The note is not decoration — it is what the record leaves out.</p>
              <p className="mt-9 max-w-[29ch] font-display text-[clamp(24px,3vw,38px)] leading-[1.18] tracking-[-0.02em]">
                The IAEA sent{" "}
                <button ref={(node) => { phraseRefs.current.confidential = node; }} type="button" onMouseEnter={() => setActive("confidential")} onFocus={() => setActive("confidential")} onClick={() => setActive("confidential")} className="marked" data-active={active === "confidential"}>a confidential report <sup>01</sup></button>{" "}
                to{" "}
                <button ref={(node) => { phraseRefs.current.states = node; }} type="button" onMouseEnter={() => setActive("states")} onFocus={() => setActive("states")} onClick={() => setActive("states")} className="marked" data-active={active === "states"}>member states <sup>02</sup></button>
                . The contents are unpublished and the inspectors have{" "}
                <button ref={(node) => { phraseRefs.current.access = node; }} type="button" onMouseEnter={() => setActive("access")} onFocus={() => setActive("access")} onClick={() => setActive("access")} className="marked" data-active={active === "access"}>not been allowed back <sup>03</sup></button>
                . And{" "}
                <button ref={(node) => { phraseRefs.current.stockpile = node; }} type="button" onMouseEnter={() => setActive("stockpile")} onFocus={() => setActive("stockpile")} onClick={() => setActive("stockpile")} className="marked" data-active={active === "stockpile"}>the stockpile figure is unknown <sup>04</sup></button>
                .
              </p>
            </div>

            <aside className="md:pl-5">
              <div className="mb-3 flex items-center justify-between border-b border-[#F4ECDD]/15 pb-2 font-mono text-[8px] uppercase tracking-[0.16em] text-[#F4ECDD]/35">
                <span>Margin</span><span>{note.no}</span>
              </div>
              <div ref={noteRef} className="relative rotate-[-0.7deg] border border-[#1A1A1A]/20 bg-[#F7F0E4] p-5 text-[#11110F] shadow-[10px_14px_0_rgba(0,0,0,0.12)]">
                <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-[#F7F0E4] bg-[#FF5C3D]" />
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#C1121F]">{note.no} / margin note</p>
                <p className="mt-3 font-display text-[25px] leading-[1.05]">{note.label}</p>
                <p className="mt-3 font-serif text-[13px] leading-[1.6] text-[#1A1A1A]/65">{note.body}</p>
                <div className="mt-4 border-t border-[#1A1A1A]/12 pt-3 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">{note.source}</div>
              </div>
            </aside>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#F4ECDD]/15 pt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F4ECDD]/35">
          <span>03 / the margin</span>
          <a href="#reach" className="inline-flex items-center gap-2 text-[#F4ECDD]/55 hover:text-[#F4ECDD]">Next / the reach <ArrowDown className="h-3 w-3" /></a>
        </div>
      </div>
    </section>
  );
}

function ReachBand() {
  const [held, setHeld] = useState(false);
  return (
    <section id="reach" className="relative h-[100dvh] min-h-[640px] overflow-hidden bg-[#0B0C0E] text-[#F3E7D2]">
      <ReachCanvas held={held} />
      <p className="sr-only">
        The IAEA sent a confidential report to member states. The contents are unpublished.
        Inspectors have not been allowed back to the sites bombed in June 2025. The stockpile figure
        is unknown.
      </p>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,90,60,0.08),transparent_46%)]" />
      <div className="relative z-10 flex h-full flex-col justify-between px-5 pb-5 pt-20 md:px-8 md:pb-8 md:pt-24">
        <div className="pointer-events-none max-w-[540px]">
          <SectionLabel no="04" accent="coral">The reach</SectionLabel>
          <h2 className="mt-3 max-w-[12ch] font-display text-[clamp(38px,5.5vw,76px)] leading-[0.9] tracking-[-0.04em]">The story hides when you reach for it.</h2>
          <p className="mt-4 max-w-[34ch] font-serif text-[14px] leading-[1.65] text-[#F3E7D2]/55 md:text-[15px]">Move the cursor. The paragraph flinches. Hold the page to read it straight.</p>
        </div>
        <div className="pointer-events-auto flex flex-wrap items-end justify-between gap-4">
          <button type="button" onClick={() => setHeld((current) => !current)} className="border-b border-[#F3E7D2]/30 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#F3E7D2]/70 hover:text-[#F3E7D2]">{held ? "Let it move" : "Hold the page"}</button>
          <a href="#end" className="inline-flex items-center gap-2 border-b border-[#F3E7D2]/25 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#F3E7D2]/70">Next / the read <ArrowDown className="h-3 w-3" /></a>
        </div>
      </div>
    </section>
  );
}

function RecordPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="record-page bg-[#F1E9D8] text-[#11110F]">
      <div className="fixed left-0 top-0 z-50 h-[2px] bg-[#FF4B2B]" style={{ width: `${progress}%` }} />

      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#F1E9D8] px-5 pb-6 pt-5 md:px-8 md:pb-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,#11110F_5px,#11110F_6px)]" />
        <header className="relative z-20 flex items-center justify-between">
          <Link to="/" className="font-display text-[23px] italic leading-none">threadwise</Link>
          <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/40">
            <span className="hidden sm:inline">Experiment 11 / the record</span>
            <Link to="/" className="border-b border-[#11110F]/20 pb-0.5 hover:text-[#11110F]">Close</Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 items-center gap-4 py-6 md:grid-cols-[1.02fr_1fr] md:gap-10 md:py-8">
          <div className="max-w-[620px]">
            <SectionLabel no="00" light={false} accent="blue">The record / IAEA–Iran / 09 Nov 2026</SectionLabel>
            <h1 className="mt-4 max-w-[11ch] font-display text-[clamp(48px,7.1vw,100px)] leading-[0.86] tracking-[-0.05em]">See what the story hides.</h1>
            <p className="mt-5 max-w-[35ch] font-serif text-[15px] leading-[1.65] text-[#11110F]/60 md:text-[17px]">One IAEA read. Five ways of looking. Move through the record — it behaves differently each time you reach it.</p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <a href="#redacted" className="inline-flex items-center gap-2 border-b border-[#11110F] pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]">Start with the record <ArrowDown className="h-3 w-3" /></a>
              <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="inline-flex items-center gap-2 border-b border-[#1737E8]/40 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1737E8]">Open the full read <ArrowUpRight className="h-3 w-3" /></Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[680px] md:mt-6">
            <RecordEye />
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-3 border-t border-[#11110F]/20 pt-3">
          <nav className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/45">
            <a href="#redacted" className="hover:text-[#1737E8]">01 / redacted</a>
            <a href="#tear" className="hover:text-[#1737E8]">02 / tear</a>
            <a href="#margin" className="hover:text-[#1737E8]">03 / margin</a>
            <a href="#reach" className="hover:text-[#1737E8]">04 / reach</a>
          </nav>
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/35">Scroll / the record is not one thing</p>
        </div>
      </section>

      <section id="redacted" className="relative overflow-hidden bg-[#0B0C0E] px-5 py-20 text-[#FDFBF7] md:px-8 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionLabel no="01" accent="coral">The redacted read</SectionLabel>
          <div className="mt-6 grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div>
              <h2 className="max-w-[11ch] font-display text-[clamp(38px,5.3vw,76px)] leading-[0.9] tracking-[-0.04em]">Some of it is withheld.</h2>
              <p className="mt-5 max-w-[34ch] font-serif text-[15px] leading-[1.65] text-[#FDFBF7]/60 md:text-[17px]">Move the lens. The report only opens where you look. What stays black is still part of the record.</p>
              <div className="mt-8 flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#FDFBF7]/35"><span className="h-px w-8 bg-[#FF4B2B]" /> IAEA / report to member states</div>
            </div>
            <RedactionSheet />
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#FDFBF7]/15 pt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#FDFBF7]/35">
            <span>01 / the redacted read</span>
            <a href="#tear" className="inline-flex items-center gap-2 text-[#FDFBF7]/55 hover:text-[#FDFBF7]">Next / the tear <ArrowDown className="h-3 w-3" /></a>
          </div>
        </div>
      </section>

      <TearBand />
      <MarginBand />
      <ReachBand />

      <section id="end" className="relative overflow-hidden bg-[#F1E9D8] px-5 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <SectionLabel no="05" light={false} accent="blue">The read</SectionLabel>
          <div className="mt-6 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 className="max-w-[10ch] font-display text-[clamp(48px,7vw,96px)] leading-[0.88] tracking-[-0.04em]">Read it before it moves.</h2>
              <p className="mt-5 max-w-[42ch] font-serif text-[16px] leading-[1.65] text-[#11110F]/60">A record is not a verdict. It is a set of claims, sources and silences. Threadwise keeps them connected.</p>
            </div>
            <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="inline-flex items-center gap-2 bg-[#11110F] px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F1E9D8] hover:bg-[#1737E8]">Open the IAEA read <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-16 flex flex-wrap items-end justify-between gap-6 border-t border-[#11110F]/20 pt-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/40">
              <span>Threadwise / the record</span><span>IAEA–Iran / 09 Nov 2026</span><span>Experiment 11</span>
            </div>
            <Link to="/" className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/45 underline underline-offset-4 hover:text-[#1737E8]">Back to threadwise</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
