import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/tear")({
  head: () => ({
    meta: [
      { title: "The tear — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experiment in reading two rival accounts of the same record at once.",
      },
    ],
  }),
  component: TearPage,
});

const EDGE = [
  1.1, -0.7, 0.4, -1.3, 0.8, -0.4, 1.4, -0.9, 0.3, -1.1, 0.9, -0.6, 1.2, -0.3, 0.7, -1.2,
];

function TearPage() {
  const [seam, setSeam] = useState(50);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((event.clientX - rect.left) / rect.width) * 100;
    setSeam(Math.max(23, Math.min(77, next)));
  };

  const nudge = (delta: number) => {
    setSeam((current) => Math.max(23, Math.min(77, current + delta)));
  };

  const clip = `polygon(0 0, ${EDGE.map((offset, index) => {
    const step = (index / (EDGE.length - 1)) * 100;
    return `calc(var(--seam) + ${offset}%) ${step}%`;
  }).join(", ")}, 0 100%)`;

  return (
    <div
      ref={surfaceRef}
      onPointerMove={update}
      className="relative h-[100dvh] min-h-[640px] w-full overflow-hidden bg-[#FF4B2E] text-[#FFF4E6]"
      style={{ "--seam": `${seam}%` } as React.CSSProperties}
    >
      {/* Right reading, underneath. */}
      <div className="absolute inset-0 bg-[#1C3BFF] text-[#FFF4E6]">
        <div className="absolute inset-y-0 right-0 w-[54%] px-5 pt-28 md:px-8 md:pt-32">
          <div className="absolute right-5 top-24 text-right md:right-8 md:top-28">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#D7FF57]">
              The counter / 02
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#FFF4E6]/45">
              A signal, not a finding
            </p>
          </div>
          <div className="absolute bottom-[15%] right-5 w-[min(38rem,84%)] text-right md:right-8">
            <h2 className="font-display text-[34px] leading-[0.9] tracking-[-0.04em] md:text-[clamp(46px,6.6vw,102px)] md:leading-[0.84]">
              The report is a signal.
            </h2>
            <p className="ml-auto mt-4 max-w-[24ch] font-serif text-[12px] leading-[1.6] text-[#FFF4E6]/70 md:mt-5 md:max-w-[29ch] md:text-[17px]">
              It tells governments where to look. It does not tell them what they will find.
            </p>
          </div>
        </div>
      </div>

      {/* Left reading, torn over the top. */}
      <div
        className="absolute inset-0 bg-[#FF4B2E] text-[#FFF4E6] drop-shadow-[8px_0_0_rgba(17,17,15,0.18)]"
        style={{ clipPath: clip, WebkitClipPath: clip }}
      >
        <div className="absolute inset-y-0 left-0 w-[54%] px-5 pt-28 md:px-8 md:pt-32">
          <div className="absolute left-5 top-24 md:left-8 md:top-28">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#D7FF57]">
              The move / 01
            </p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#FFF4E6]/45">
              A finding, not a signal
            </p>
          </div>
          <div className="absolute bottom-[15%] left-5 w-[min(38rem,84%)] md:left-8">
            <h1 className="font-display text-[34px] leading-[0.9] tracking-[-0.04em] md:text-[clamp(46px,6.6vw,102px)] md:leading-[0.84]">
              The report is a finding.
            </h1>
            <p className="mt-4 max-w-[24ch] font-serif text-[12px] leading-[1.6] text-[#FFF4E6]/70 md:mt-5 md:max-w-[29ch] md:text-[17px]">
              It names a breach, and a government citing it should be read as doing exactly that.
            </p>
          </div>
        </div>
      </div>

      {/* Registration marks and a torn seam. */}
      <div className="pointer-events-none absolute left-5 top-20 z-20 h-3 w-3 border-l border-t border-[#FFF4E6]/35 md:left-8" />
      <div className="pointer-events-none absolute right-5 top-20 z-20 h-3 w-3 border-r border-t border-[#FFF4E6]/35 md:right-8" />
      <div
        className="pointer-events-none absolute inset-y-0 z-20 w-px bg-[#11110F]/45"
        style={{ left: "var(--seam)" }}
      />

      <button
        type="button"
        role="slider"
        aria-label="Move the tear between the two readings"
        aria-valuemin={23}
        aria-valuemax={77}
        aria-valuenow={Math.round(seam)}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            nudge(-2);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            nudge(2);
          }
          if (event.key === "Home") {
            event.preventDefault();
            setSeam(23);
          }
          if (event.key === "End") {
            event.preventDefault();
            setSeam(77);
          }
        }}
        className="absolute top-1/2 z-30 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#FFF4E6]/70 bg-[#11110F] text-[#FFF4E6] shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
        style={{ left: "var(--seam)" }}
      >
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="text-[11px]">←</span>
          <span className="text-[11px]">→</span>
        </span>
      </button>

      <div className="pointer-events-none absolute left-1/2 top-[18%] z-20 -translate-x-1/2 text-center">
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#FFF4E6]/55">
          Drag the tear
        </p>
      </div>

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none text-[#FFF4E6]">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#FFF4E6]/60">
          <span className="hidden sm:inline">Experiment 04 / the tear</span>
          <Link to="/" className="border-b border-[#FFF4E6]/30 pb-0.5 hover:text-[#FFF4E6]">
            Close
          </Link>
        </div>
      </header>

      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-[#11110F] bg-[#FFF4E6] text-[#11110F]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-4 md:px-8">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#11110F]/45">
            Two readings / one record
          </p>
          <p className="font-serif text-[14px] leading-snug">
            Both are true. Neither is the whole record.
          </p>
          <Link
            to="/read/$token"
            params={{ token: "mn4qvf4bhu" }}
            className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1C3BFF]"
          >
            Open the read <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
