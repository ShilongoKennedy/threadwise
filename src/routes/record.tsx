import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, GripVertical } from "lucide-react";
import { RecordEye } from "@/components/record/RecordEye";

export const Route = createFileRoute("/record")({
  head: () => ({
    meta: [
      { title: "The record — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "One record, torn open. The eye, the lens, the margin and the reach in one place.",
      },
    ],
  }),
  component: RecordPage,
});

const DOC =
  "The IAEA sent a confidential report to member states about Iran’s enrichment programme. The contents are unpublished. Inspectors have not been allowed back to the sites bombed in June 2025, and Iran has not said how much of its 60%-enriched uranium survived.";

const EDGE_LEFT = "polygon(0 0, 100% 0, calc(100% - 10px) 7%, 100% 14%, calc(100% - 16px) 22%, 100% 30%, calc(100% - 8px) 38%, 100% 46%, calc(100% - 14px) 54%, 100% 62%, calc(100% - 9px) 70%, 100% 78%, calc(100% - 15px) 86%, 100% 94%, 100% 100%, 0 100%)";
const EDGE_RIGHT = "polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 93%, 0 86%, 15px 78%, 0 70%, 9px 62%, 0 54%, 14px 46%, 0 38%, 8px 30%, 16px 22%, 0 14%, 10px 7%)";

function LensBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState({ x: 58, y: 28 });
  const [active, setActive] = useState(false);
  const [lifted, setLifted] = useState(false);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (lifted) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setLens({
      x: Math.max(10, Math.min(90, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(12, Math.min(88, ((event.clientY - rect.top) / rect.height) * 100)),
    });
    setActive(true);
  };

  return (
    <div>
      <div
        ref={ref}
        onPointerMove={move}
        onPointerDown={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        className="relative min-h-[176px] overflow-hidden border border-[#11110F]/20 bg-[#11110F] p-4 md:min-h-[198px] md:p-5"
      >
        <p className="font-serif text-[11px] leading-[1.65] text-[#F1E9D8]/85 md:text-[12.5px]">{DOC}</p>
        <div
          className={`redaction-veil ${lifted ? "is-lifted" : ""}`}
          style={{ "--lens-x": `${lens.x}%`, "--lens-y": `${lens.y}%` } as React.CSSProperties}
          aria-hidden="true"
        />
        <div
          className={`redaction-lens ${lifted ? "is-lifted" : ""} ${active ? "is-active" : ""}`}
          style={{ "--lens-x": `${lens.x}%`, "--lens-y": `${lens.y}%` } as React.CSSProperties}
          aria-hidden="true"
        >
          <span />
        </div>
        <span className="pointer-events-none absolute right-3 top-3 rotate-[-6deg] border border-[#FF4B2B] px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em] text-[#FF4B2B]">
          {lifted ? "Record open" : "Partially redacted"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setLifted((current) => !current)}
          className="border-b border-[#1737E8]/35 pb-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-[#1737E8]"
        >
          {lifted ? "Redact it again" : "Lift the redactions"}
        </button>
        <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-[#11110F]/35">Move the lens to read</span>
      </div>
    </div>
  );
}

function RecordPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(false);
  const [center, setCenter] = useState(0.65);
  const [mobile, setMobile] = useState(false);
  const [thread, setThread] = useState<string | null>(null);

  const aperture = mobile ? 0.27 : 0.18;
  const leftWidth = center - aperture / 2;
  const rightStart = center + aperture / 2;

  useEffect(() => {
    const check = () => {
      const isMobile = window.innerWidth < 768;
      setMobile(isMobile);
      if (isMobile) setCenter(0.72);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      if (mobile) {
        setThread(null);
        return;
      }
      const page = pageRef.current;
      const doc = docRef.current;
      const note = noteRef.current;
      if (!page || !doc || !note) return;
      const p = page.getBoundingClientRect();
      const d = doc.getBoundingClientRect();
      const n = note.getBoundingClientRect();
      const x1 = d.right - p.left;
      const y1 = d.top + d.height * 0.45 - p.top;
      const x2 = n.left - p.left;
      const y2 = n.top + 48 - p.top;
      setThread(`M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + 60).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - 60).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [center, mobile]);

  useEffect(() => {
    const up = () => { dragRef.current = false; };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = (event.clientX - rect.left) / rect.width;
    setCenter(Math.max(mobile ? 0.66 : 0.58, Math.min(mobile ? 0.78 : 0.72, next)));
  };

  return (
    <div ref={pageRef} className="relative min-h-[100dvh] overflow-x-clip bg-[#FF4B2E] text-[#11110F]">
      <div className="absolute inset-0 bg-[#1C3BFF]" style={{ clipPath: `polygon(${center * 100}% 0, 100% 0, 100% 100%, ${center * 100}% 100%)` }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,#F1E9D8_5px,#F1E9D8_6px)]" />

      <div
        className="absolute top-[43%] z-[3] -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${center * 100}%` }}
      >
        <div className="w-[150px] md:w-[250px]">
          <RecordEye />
        </div>
      </div>

      <div
        className="relative z-10 min-h-[100dvh]"
        style={{ width: `${leftWidth * 100}%`, clipPath: EDGE_LEFT, WebkitClipPath: EDGE_LEFT }}
      >
        <div className="absolute inset-0 bg-[#F1E9D8]" />
        <div className="relative flex min-h-[100dvh] flex-col px-5 pb-3 pt-3 md:px-8 md:pb-4 md:pt-4">
          <header className="flex items-center justify-between">
            <Link to="/" className="font-display text-[21px] italic leading-none md:text-[23px]">threadwise</Link>
            <div className="flex items-center gap-3 font-mono text-[7px] uppercase tracking-[0.13em] text-[#11110F]/40 md:text-[8px]">
              <span className="hidden sm:inline">Experiment 11 / the record</span>
              <Link to="/" className="border-b border-[#11110F]/20 pb-0.5 hover:text-[#11110F]">Close</Link>
            </div>
          </header>

          <div className="mt-6 flex flex-1 flex-col justify-center md:mt-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#1737E8]">The record / IAEA–Iran / 09 Nov 2026</p>
            <h1 className="mt-2 max-w-[10ch] font-display text-[clamp(40px,5.6vw,84px)] leading-[0.86] tracking-[-0.05em]">See what the story hides.</h1>
            <p className="mt-3 max-w-[34ch] font-serif text-[13px] leading-[1.6] text-[#11110F]/60 md:mt-4 md:text-[15px]">One record, torn open. The eye looks through. The lens opens what was withheld. The thread keeps the note attached.</p>

            <div ref={docRef} className="mt-5 max-w-[460px] md:mt-6">
              <LensBlock />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 md:mt-5">
              <Link to="/read/$token" params={{ token: "mn4qvf4bhu" }} className="inline-flex items-center gap-2 border-b border-[#11110F] pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em]">Open the full IAEA read <ArrowUpRight className="h-3 w-3" /></Link>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#11110F]/35">A record is not a verdict</span>
            </div>

            <div className="mt-4 max-w-[460px] md:hidden">
              <div className="border border-[#11110F]/20 bg-[#E9DDC8] p-3 shadow-[5px_7px_0_rgba(17,17,15,0.12)]">
                <p className="font-mono text-[7px] font-bold uppercase tracking-[0.14em] text-[#C1121F]">The margin</p>
                <p className="mt-1 font-display text-[18px] leading-tight">The missing number leads.</p>
                <p className="mt-1 font-serif text-[11px] leading-[1.5] text-[#11110F]/60">The report can describe the programme without verifying the stockpile.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#11110F]/20 pt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#11110F]/35">
            <span>Threadwise / the record</span>
            <span className="hidden md:inline">Drag the tear / move the lens</span>
            <span>IAEA / 09 Nov 2026</span>
          </div>
        </div>
      </div>

      <div
        className="absolute top-0 z-10 hidden min-h-[100dvh] md:block"
        style={{ left: `${rightStart * 100}%`, width: `${(1 - rightStart) * 100}%`, clipPath: EDGE_RIGHT, WebkitClipPath: EDGE_RIGHT }}
      >
        <div className="absolute inset-0 bg-[#F1E9D8]" />
        <div className="relative flex min-h-[100dvh] flex-col px-4 py-4 md:px-5">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#11110F]/35">The margin / 01</p>
          <div ref={noteRef} className="mt-14 rotate-[1.3deg] border border-[#11110F]/20 bg-[#F7F0E4] p-4 shadow-[7px_9px_0_rgba(17,17,15,0.16)]">
            <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-[#F7F0E4] bg-[#FF5B3D]" />
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-[#C1121F]">The missing fact</p>
            <p className="mt-2 font-display text-[24px] leading-[1.02]">The stockpile figure is unknown.</p>
            <p className="mt-2 font-serif text-[12px] leading-[1.6] text-[#11110F]/60">Iran has not said how much 60%-enriched uranium survived. The Agency can describe the programme without verifying the stockpile.</p>
            <p className="mt-3 border-t border-[#11110F]/15 pt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#11110F]/35">IAEA / safeguards</p>
          </div>
          <div className="mt-auto border-t border-[#11110F]/20 pt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#11110F]/35">The note behind the note</div>
        </div>
      </div>

      <svg className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full md:block" aria-hidden="true">
        {thread ? (
          <>
            <path d={thread} fill="none" stroke="#FF5B3D" strokeWidth="1.2" strokeDasharray="3 4" />
            <circle cx={thread.split(" ")[1]} cy={thread.split(" ")[2]} r="3" fill="#FF5B3D" />
          </>
        ) : null}
      </svg>

      <div
        role="slider"
        aria-label="Move the tear between the record and the margin"
        aria-valuemin={mobile ? 66 : 58}
        aria-valuemax={mobile ? 78 : 72}
        aria-valuenow={Math.round(center * 100)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); setCenter((value) => Math.max(mobile ? 0.66 : 0.58, value - 0.01)); }
          if (event.key === "ArrowRight") { event.preventDefault(); setCenter((value) => Math.min(mobile ? 0.78 : 0.72, value + 0.01)); }
          if (event.key === "Home") { event.preventDefault(); setCenter(mobile ? 0.66 : 0.58); }
          if (event.key === "End") { event.preventDefault(); setCenter(mobile ? 0.78 : 0.72); }
        }}
        onPointerDown={(event) => { dragRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={drag}
        className="absolute bottom-[8%] z-40 -translate-x-1/2 cursor-ew-resize touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F1E9D8]"
        style={{ left: `${center * 100}%` }}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F1E9D8]/70 bg-[#11110F] text-[#F1E9D8] shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
          <GripVertical className="h-4 w-4" />
        </div>
        <p className="mt-2 whitespace-nowrap text-center font-mono text-[7px] uppercase tracking-[0.16em] text-[#F1E9D8]/80">Drag the tear</p>
      </div>
    </div>
  );
}
