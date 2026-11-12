import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, Pin } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Note = {
  id: string;
  no: string;
  phrase: string;
  label: string;
  body: string;
  source: string;
};

const NOTES: Note[] = [
  {
    id: "confidential",
    no: "01",
    phrase: "a confidential report",
    label: "It is not a public finding",
    body: "Confidential means the document is circulated to governments, not published as a finding against Iran. Its authority is the safeguards mandate, not a power to compel access.",
    source: "IAEA / member states",
  },
  {
    id: "states",
    no: "02",
    phrase: "member states",
    label: "The Board decides what happens next",
    body: "The 35-member Board of Governors receives the report. Whether it reaches the formal agenda is a political decision, not a technical consequence of the report.",
    source: "IAEA Board of Governors",
  },
  {
    id: "unpublished",
    no: "03",
    phrase: "unpublished",
    label: "The public record is thinner than the headline",
    body: "No stockpile figure, site or finding from the report has been quoted publicly. What is known is the access dispute around it.",
    source: "Public record / IAEA",
  },
  {
    id: "june",
    no: "04",
    phrase: "June 2025",
    label: "Inspectors have not been back",
    body: "The sites bombed in the June 2025 campaign remain without inspector access. A report that documents missing access is a finding about compliance, not capability.",
    source: "Reuters / IAEA",
  },
  {
    id: "uranium",
    no: "05",
    phrase: "60%-enriched",
    label: "The number is the missing fact",
    body: "Iran has not said how much of its 60%-enriched uranium survived. The Agency can describe the programme without being able to verify the stockpile.",
    source: "IAEA / safeguards",
  },
];

export function MarginRead() {
  const [active, setActive] = useState<string | null>("confidential");
  const [pinned, setPinned] = useState<string[]>([]);
  const [thread, setThread] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phraseRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const noteRef = useRef<HTMLDivElement>(null);

  const activeNote = NOTES.find((note) => note.id === active) ?? null;

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const phrase = active ? phraseRefs.current[active] : null;
      const note = noteRef.current;
      if (!container || !phrase || !note || !activeNote) {
        setThread(null);
        return;
      }
      const c = container.getBoundingClientRect();
      const p = phrase.getBoundingClientRect();
      const n = note.getBoundingClientRect();
      const x1 = p.right - c.left;
      const y1 = p.top + p.height * 0.55 - c.top;
      const x2 = n.left - c.left;
      const y2 = n.top + 42 - c.top;
      setThread(
        `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + 70).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - 80).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      );
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, activeNote]);

  useEffect(() => {
    const onScroll = () => {
      if (!active) return;
      const container = containerRef.current;
      const phrase = phraseRefs.current[active];
      const note = noteRef.current;
      if (!container || !phrase || !note) return;
      const c = container.getBoundingClientRect();
      const p = phrase.getBoundingClientRect();
      const n = note.getBoundingClientRect();
      const x1 = p.right - c.left;
      const y1 = p.top + p.height * 0.55 - c.top;
      const x2 = n.left - c.left;
      const y2 = n.top + 42 - c.top;
      setThread(
        `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 + 70).toFixed(1)} ${y1.toFixed(1)}, ${(x2 - 80).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [active]);

  const togglePin = (id: string) => {
    setPinned((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0A2E25] text-[#F4ECDD] selection:bg-[#D7FF57] selection:text-[#0A2E25]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(244,236,221,0.045)_1px,transparent_1px)] bg-[size:80px_100%] opacity-50" />
      <div className="pointer-events-none absolute left-5 top-20 h-3 w-3 border-l border-t border-[#F4ECDD]/25 md:left-8" />
      <div className="pointer-events-none absolute right-5 top-20 h-3 w-3 border-r border-t border-[#F4ECDD]/25 md:right-8" />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none text-[#F4ECDD]">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F4ECDD]/55">
          <span className="hidden sm:inline">Experiment 05 / the margin</span>
          <Link to="/" className="border-b border-[#F4ECDD]/25 pb-0.5 hover:text-[#F4ECDD]">
            Close
          </Link>
        </div>
      </header>

      <div ref={containerRef} className="relative mx-auto w-full max-w-[1400px] px-5 pb-20 pt-24 md:px-8 md:pt-28">
        <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" aria-hidden="true">
          {thread ? (
            <>
              <path d={thread} fill="none" stroke="#FF5C3D" strokeWidth="1.2" strokeDasharray="3 4" />
              <circle cx={thread.split(" ")[1]} cy={thread.split(" ")[2]} r="3" fill="#FF5C3C" />
            </>
          ) : null}
        </svg>

        <div className="relative z-10 grid gap-12 md:grid-cols-[minmax(0,1fr)_360px] md:gap-20">
          <div className="max-w-[780px]">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em]">
              <span className="text-[#D7FF57]">The read / IAEA–Iran</span>
              <span className="h-3 w-px bg-[#F4ECDD]/20" />
              <span className="text-[#F4ECDD]/35">09 Nov 2026</span>
            </div>
            <h1 className="mt-3 max-w-[12ch] font-display text-[clamp(46px,7vw,92px)] leading-[0.88] tracking-[-0.04em]">
              The story is in the margins.
            </h1>
            <p className="mt-5 max-w-[38ch] font-serif text-[16px] leading-[1.65] text-[#F4ECDD]/55">
              Hover a marked phrase. The note is not decoration — it is what the record leaves out.
            </p>

            <p className="mt-10 max-w-[28ch] font-display text-[clamp(26px,3.3vw,42px)] leading-[1.18] tracking-[-0.02em]">
              The IAEA sent{" "}
              <button
                ref={(node) => { phraseRefs.current.confidential = node; }}
                type="button"
                onMouseEnter={() => setActive("confidential")}
                onFocus={() => setActive("confidential")}
                onClick={() => setActive("confidential")}
                className="marked" data-active={active === "uranium"} data-active={active === "june"} data-active={active === "unpublished"} data-active={active === "states"} data-active={active === "confidential"}
              >
                a confidential report <sup>01</sup>
              </button>{" "}
              to{" "}
              <button
                ref={(node) => { phraseRefs.current.states = node; }}
                type="button"
                onMouseEnter={() => setActive("states")}
                onFocus={() => setActive("states")}
                onClick={() => setActive("states")}
                className="marked"
              >
                member states <sup>02</sup>
              </button>{" "}
              about Iran’s enrichment programme. The contents are{" "}
              <button
                ref={(node) => { phraseRefs.current.unpublished = node; }}
                type="button"
                onMouseEnter={() => setActive("unpublished")}
                onFocus={() => setActive("unpublished")}
                onClick={() => setActive("unpublished")}
                className="marked"
              >
                unpublished <sup>03</sup>
              </button>
              . The public record is that inspectors have not been allowed back to the sites
              bombed in{" "}
              <button
                ref={(node) => { phraseRefs.current.june = node; }}
                type="button"
                onMouseEnter={() => setActive("june")}
                onFocus={() => setActive("june")}
                onClick={() => setActive("june")}
                className="marked"
              >
                June 2025 <sup>04</sup>
              </button>
              , and Iran has not said how much of its{" "}
              <button
                ref={(node) => { phraseRefs.current.uranium = node; }}
                type="button"
                onMouseEnter={() => setActive("uranium")}
                onFocus={() => setActive("uranium")}
                onClick={() => setActive("uranium")}
                className="marked"
              >
                60%-enriched <sup>05</sup>
              </button>{" "}
              uranium survived.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                to="/read/$token"
                params={{ token: "mn4qvf4bhu" }}
                className="inline-flex items-center gap-2 border-b border-[#D7FF57]/50 pb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#D7FF57]"
              >
                Open the full read <ArrowUpRight className="h-3 w-3" />
              </Link>
              <button
                type="button"
                onClick={() => setPinned([])}
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#F4ECDD]/35 underline underline-offset-4 hover:text-[#F4ECDD]/65"
              >
                Clear pins
              </button>
            </div>
          </div>

          <aside className="relative md:pl-8">
            <div className="mb-4 flex items-center justify-between border-b border-[#F4ECDD]/15 pb-2 font-mono text-[8px] uppercase tracking-[0.16em] text-[#F4ECDD]/35">
              <span>Margin</span>
              <span>{activeNote ? activeNote.no : "—"}</span>
            </div>

            {activeNote ? (
              <div
                ref={noteRef}
                className="relative rotate-[-0.7deg] border border-[#1A1A1A]/20 bg-[#F7F0E4] p-5 text-[#1A1A1A] shadow-[10px_14px_0_rgba(0,0,0,0.12)] md:p-6"
              >
                <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-[#F7F0E4] bg-[#FF5C3D]" />
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#C1121F]">
                  {activeNote.no} / margin note
                </p>
                <p className="mt-3 font-display text-[25px] leading-[1.05]">{activeNote.label}</p>
                <p className="mt-3 font-serif text-[13.5px] leading-[1.65] text-[#1A1A1A]/65">
                  {activeNote.body}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1A1A1A]/12 pt-3">
                  <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/40">
                    {activeNote.source}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePin(activeNote.id)}
                    className="inline-flex items-center gap-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-[#C1121F]"
                  >
                    <Pin className="h-3 w-3" />
                    {pinned.includes(activeNote.id) ? "Pinned" : "Pin note"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-[#F4ECDD]/20 p-6 font-serif text-[14px] leading-relaxed text-[#F4ECDD]/45">
                Hover a marked phrase to pull its note out of the margin.
              </div>
            )}

            {pinned.length > 0 ? (
              <div className="mt-8 border-t border-[#F4ECDD]/15 pt-3">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#F4ECDD]/35">
                  Pinned / {pinned.length}
                </p>
                <ul className="mt-2 space-y-2">
                  {pinned.map((id) => {
                    const note = NOTES.find((item) => item.id === id);
                    if (!note) return null;
                    return (
                      <li key={id} className="flex gap-2 font-serif text-[13px] leading-snug text-[#F4ECDD]/65">
                        <span className="font-mono text-[8px] text-[#D7FF57]">{note.no}</span>
                        {note.phrase}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-[#F4ECDD]/15 px-5 py-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F4ECDD]/35 md:px-8">
        The margin keeps the note / verify before you act
      </div>
    </div>
  );
}
