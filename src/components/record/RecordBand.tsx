import { useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, GripVertical } from "lucide-react";
import { RecordEye } from "@/components/record/RecordEye";

export type RecordBandNote = {
  tag: string;
  title: string;
  body: string;
  source: string;
};

export type RecordBandLedgerItem = {
  no: string;
  label: string;
  status: string;
  body: string;
};

type RecordBandProps = {
  kicker?: string;
  title?: string;
  deck?: string;
  note?: RecordBandNote;
  ledger?: RecordBandLedgerItem[];
  ctaLabel?: string;
  ctaHref?: string;
  bandWidth?: number;
  minHeight?: string;
  paper?: string;
  ink?: string;
  leftField?: string;
  rightField?: string;
  thread?: string;
};

const EDGE =
  "polygon(0 0, 99.4% 0, 100% 3%, 99.1% 7%, 100% 11%, 98.8% 16%, 100% 21%, 99.4% 26%, 100% 31%, 98.9% 36%, 100% 41%, 99.5% 46%, 100% 51%, 98.8% 56%, 100% 61%, 99.4% 66%, 100% 71%, 99.1% 76%, 100% 81%, 99.6% 86%, 100% 91%, 99.2% 96%, 100% 100%, 0.4% 100%, 0 96%, 0.8% 91%, 0 86%, 0.5% 81%, 0 76%, 1% 71%, 0 66%, 0.4% 61%, 0 56%, 0.8% 51%, 0 46%, 0.5% 41%, 0 36%, 1.1% 31%, 0 26%, 0.4% 21%, 0 16%, 0.7% 11%, 0 7%, 0.3% 3%)";

const DEFAULT_NOTE: RecordBandNote = {
  tag: "The open question",
  title: "Does a confidential report count as a finding at all?",
  body: "The report is a signal to governments. It is not an enforceable finding until the Board acts.",
  source: "Filed / open",
};

const DEFAULT_LEDGER: RecordBandLedgerItem[] = [
  {
    no: "01",
    label: "Question",
    status: "open",
    body: "Does a confidential report to governments count as a finding against Iran at all?",
  },
  {
    no: "02",
    label: "Correction",
    status: "patched",
    body: "Removed an unsupported reporting date added beyond the move.",
  },
  {
    no: "03",
    label: "Watch",
    status: "pending",
    body: "Whether the Board puts Iran on the formal agenda at its next meeting.",
  },
];

export function RecordBand({
  kicker = "The record / from the IAEA read",
  title = "What the read leaves behind.",
  deck = "A chat window gives you an answer and forgets it. This leaves a record: the question the read opened, the correction it needed, and what to watch next.",
  note = DEFAULT_NOTE,
  ledger = DEFAULT_LEDGER,
  ctaLabel = "Open the record",
  ctaHref = "/digest",
  bandWidth = 38,
  minHeight = "74vh",
  paper = "#FDFBF7",
  ink = "#1A1A1A",
  leftField = "#171714",
  rightField = "#8E2B2B",
  thread = "#1A4BFF",
}: RecordBandProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; width: number } | null>(null);
  const [band, setBand] = useState(bandWidth);
  const [threadPath, setThreadPath] = useState<string | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const section = sectionRef.current;
      const bandEl = bandRef.current;
      const noteEl = noteRef.current;
      if (!section || !bandEl || !noteEl || window.innerWidth < 640) {
        setThreadPath(null);
        return;
      }
      const s = section.getBoundingClientRect();
      const b = bandEl.getBoundingClientRect();
      const n = noteEl.getBoundingClientRect();
      const x1 = b.left + b.width * 0.62 - s.left;
      const y1 = b.top + b.height * 0.45 - s.top;
      const x2 = n.left - s.left;
      const y2 = n.top + 46 - s.top;
      setThreadPath(`M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + 70).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - 70).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [band]);

  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    if (!start) return;
    setBand(Math.max(30, Math.min(46, start.width + (event.clientX - start.x) * 0.055)));
  };

  return (
    <section
      ref={sectionRef}
      id="record"
      className="relative overflow-hidden"
      style={{ backgroundColor: paper, minHeight }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-5 py-8 md:px-8 md:py-10">
        <div
          className="record-grid relative"
          style={{ "--band": `${band}%`, minHeight: "520px" } as React.CSSProperties}
        >
          <div className="record-left relative z-20 flex flex-col justify-center py-6 md:py-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: thread }}>{kicker}</p>
            <h2 className="mt-3 max-w-[11ch] font-display text-[clamp(38px,5vw,64px)] leading-[0.9] tracking-[-0.04em]" style={{ color: ink }}>{title}</h2>
            <p className="mt-4 max-w-[38ch] font-serif text-[14px] leading-[1.65] text-[#1A1A1A]/60 md:text-[15px]">{deck}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a href={ctaHref} className="inline-flex items-center gap-2 border-b border-[#1A1A1A] pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1A1A1A]">{ctaLabel} <ArrowUpRight className="h-3 w-3" /></a>
              <span className="rotate-[-4deg] border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.16em]" style={{ borderColor: rightField, color: rightField }}>Open / 001</span>
            </div>
          </div>

          <div
            ref={bandRef}
            className="record-band relative z-10 overflow-hidden drop-shadow-[10px_0_18px_rgba(17,17,15,0.10)]"
            style={{ clipPath: EDGE, WebkitClipPath: EDGE }}
          >
            <div className="absolute inset-0" style={{ backgroundColor: leftField }} />
            <div className="absolute inset-0" style={{ backgroundColor: rightField, clipPath: "inset(0 0 0 50%)" }} />
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,#F1E9D8_5px,#F1E9D8_6px)]" />
            <div className="absolute left-1/2 top-[45%] z-10 w-[78%] max-w-[300px] -translate-x-1/2 -translate-y-1/2">
              <RecordEye />
            </div>
            <div
              role="slider"
              aria-label="Open or close the tear"
              aria-valuemin={30}
              aria-valuemax={46}
              aria-valuenow={Math.round(band)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") { event.preventDefault(); setBand((value) => Math.max(30, value - 1)); }
                if (event.key === "ArrowRight") { event.preventDefault(); setBand((value) => Math.min(46, value + 1)); }
                if (event.key === "Home") { event.preventDefault(); setBand(30); }
                if (event.key === "End") { event.preventDefault(); setBand(46); }
              }}
              onPointerDown={(event) => {
                dragRef.current = { x: event.clientX, width: band };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={drag}
              onPointerUp={() => { dragRef.current = null; }}
              onPointerCancel={() => { dragRef.current = null; }}
              className="absolute bottom-[7%] left-1/2 z-30 hidden -translate-x-1/2 cursor-ew-resize touch-none sm:block"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#F1E9D8]/70 bg-[#11110F] text-[#F1E9D8] shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
                <GripVertical className="h-4 w-4" />
              </div>
              <p className="mt-2 whitespace-nowrap text-center font-mono text-[7px] uppercase tracking-[0.16em] text-[#F1E9D8]/80">Open the tear</p>
            </div>
          </div>

          <aside className="record-right relative z-20 flex flex-col justify-center py-6 md:py-8">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#1A1A1A]/35">The margin / note 01</p>
            <div ref={noteRef} className="mt-4 w-full max-w-[280px] rotate-[1.2deg] border border-[#1A1A1A]/20 bg-[#F7F0E4] p-4 shadow-[8px_10px_0_rgba(17,17,15,0.14)] md:ml-auto">
              <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-[#F7F0E4]" style={{ backgroundColor: thread }} />
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.15em]" style={{ color: rightField }}>{note.tag}</p>
              <p className="mt-2 font-display text-[24px] leading-[1.03]">{note.title}</p>
              <p className="mt-2 font-serif text-[12px] leading-[1.55] text-[#11110F]/60">{note.body}</p>
              <p className="mt-3 border-t border-[#11110F]/15 pt-2 font-mono text-[7px] uppercase tracking-[0.12em] text-[#11110F]/35">{note.source}</p>
            </div>
          </aside>

          <svg className="pointer-events-none absolute inset-0 z-30 hidden h-full w-full sm:block" aria-hidden="true">
            {threadPath ? (
              <>
                <path d={threadPath} fill="none" stroke={thread} strokeWidth="1.2" strokeDasharray="3 4" />
                <circle cx={threadPath.split(" ")[1]} cy={threadPath.split(" ")[2]} r="3" fill={thread} />
              </>
            ) : null}
          </svg>
        </div>

        <ol className="mt-6 grid border-t border-[#1A1A1A]/15 md:grid-cols-3">
          {ledger.map((item, index) => (
            <li key={item.no} className={`border-b border-[#1A1A1A]/15 py-4 md:border-b-0 ${index < ledger.length - 1 ? "md:border-r md:pr-5" : ""} ${index > 0 ? "md:pl-5" : ""}`}>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[9px] font-bold tracking-[0.1em]" style={{ color: thread }}>{item.no}</span>
                <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-[#1A1A1A]/45">{item.label}</span>
                <span className="font-mono text-[7px] uppercase tracking-[0.1em]" style={{ color: item.status === "open" ? rightField : item.status === "patched" ? rightField : "#1A1A1A/35" }}>{item.status}</span>
              </div>
              <p className="mt-2 max-w-[32ch] font-display text-[18px] leading-[1.08]">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
