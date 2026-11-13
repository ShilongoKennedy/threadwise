import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";

export const Route = createFileRoute("/weigh")({
  head: () => ({
    meta: [
      { title: "The weighing — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experiment in weighing two readings of the same record.",
      },
    ],
  }),
  component: WeighPage,
});

const INK = "#11110F";
const CREAM = "#F5EEDF";
const CORAL = "#FF5A3C";
const ACID = "#E4FF54";

function WeighPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState(0);
  const [dragging, setDragging] = useState(false);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (event.clientX - rect.left) / rect.width - 0.5;
    setTilt(Math.max(-17, Math.min(17, ratio * 34)));
  };

  const verdict =
    tilt < -2.5
      ? "The record leans toward the move."
      : tilt > 2.5
        ? "The record leans toward the signal."
        : "The record is held in tension.";

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#1C3BFF] text-[#F5EEDF] selection:bg-[#E4FF54] selection:text-[#11110F]">
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

      <header className="relative z-30 mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none text-[#F5EEDF]">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F5EEDF]/55">
          <span className="hidden sm:inline">Experiment 06 / the weighing</span>
          <Link to="/" className="border-b border-[#F5EEDF]/25 pb-0.5 hover:text-[#F5EEDF]">
            Close
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1200px] px-5 pb-10 pt-4 md:px-8 md:pt-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#E4FF54]">
              A reading / IAEA–Iran
            </p>
            <h1 className="mt-3 max-w-[15ch] font-display text-[clamp(46px,6.4vw,96px)] leading-[0.88] tracking-[-0.045em]">
              Which reading carries the weight?
            </h1>
          </div>
          <p className="max-w-[27ch] pb-1 font-serif text-[14px] leading-[1.6] text-[#F5EEDF]/60 md:text-[16px]">
            Drag the beam. The record does not decide for you.
          </p>
        </div>

        <div
          ref={stageRef}
          onPointerDown={(event) => {
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={move}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className="relative mt-3 h-[480px] touch-none select-none md:mt-4 md:h-[520px]"
          aria-label="Drag the beam to weigh the two readings"
        >
          <div className="absolute left-1/2 top-4 h-[290px] w-[6px] -translate-x-1/2 bg-[#11110F]/75 md:top-8 md:h-[300px]" />
          <div className="absolute left-1/2 top-[318px] h-[8px] w-[260px] -translate-x-1/2 bg-[#11110F] md:top-[332px] md:w-[300px]" />

          <div
            className="absolute left-1/2 top-[108px] h-[5px] w-[60%] origin-center -translate-x-1/2 bg-[#11110F] md:top-[120px] md:w-[70%]"
            style={{ transform: `rotate(${tilt}deg)` }}
          >
            <div className="absolute left-0 top-0 -translate-x-1/2">
              <div className="mx-auto h-[76px] w-px bg-[#11110F]/55 md:h-[96px]" />
              <div
                className="w-[140px] bg-[#F5EEDF] p-3 text-[#11110F] shadow-[8px_12px_0_rgba(17,17,15,0.18)] md:w-[285px] md:p-5"
                style={{ transform: `rotate(${-tilt}deg)` }}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#11110F]/15 pb-2">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1C3BFF]">
                    The move / 01
                  </span>
                  <span className="h-2.5 w-10 -rotate-2 bg-[#FF5A3C]" />
                </div>
                <p className="mt-2 font-display text-[17px] leading-[1.02] md:mt-3 md:text-[30px]">
                  The report is a finding.
                </p>
                <p className="mt-1 font-serif text-[10px] leading-[1.45] text-[#11110F]/60 md:mt-2 md:text-[13px] md:leading-[1.55]">
                  It names a breach. A government citing it is doing exactly that.
                </p>
              </div>
            </div>

            <div className="absolute left-full top-0 -translate-x-1/2">
              <div className="mx-auto h-[76px] w-px bg-[#11110F]/55 md:h-[96px]" />
              <div
                className="w-[140px] bg-[#F5EEDF] p-3 text-[#11110F] shadow-[8px_12px_0_rgba(17,17,15,0.18)] md:w-[285px] md:p-5"
                style={{ transform: `rotate(${-tilt}deg)` }}
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#11110F]/15 pb-2">
                  <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#1C3BFF]">
                    The counter / 02
                  </span>
                  <span className="h-2.5 w-10 -rotate-2 bg-[#E4FF54]" />
                </div>
                <p className="mt-2 font-display text-[17px] leading-[1.02] md:mt-3 md:text-[30px]">
                  The report is a signal.
                </p>
                <p className="mt-1 font-serif text-[10px] leading-[1.45] text-[#11110F]/60 md:mt-2 md:text-[13px] md:leading-[1.55]">
                  It tells governments where to look. Not what they will find.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            role="slider"
            aria-label="Tilt the scale"
            aria-valuemin={-17}
            aria-valuemax={17}
            aria-valuenow={Math.round(tilt)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                setTilt((value) => Math.max(-17, value - 2));
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                setTilt((value) => Math.min(17, value + 2));
              }
              if (event.key === "Home") {
                event.preventDefault();
                setTilt(-17);
              }
              if (event.key === "End") {
                event.preventDefault();
                setTilt(17);
              }
            }}
            className="absolute left-1/2 top-[106px] z-20 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#F5EEDF] bg-[#FF5A3C] text-[#11110F] shadow-[0_8px_0_rgba(17,17,15,0.25)] md:top-[118px]"
            style={{ cursor: dragging ? "grabbing" : "grab" }}
          >
            <span className="text-[14px]" aria-hidden="true">↔</span>
          </button>

          <p className="absolute left-1/2 top-[356px] w-[90%] -translate-x-1/2 text-center font-mono text-[8px] uppercase tracking-[0.16em] text-[#F5EEDF]/35 md:top-[388px]">
            Drag anywhere on the scale / arrow keys also work
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-end justify-between gap-4 border-t border-[#F5EEDF]/20 pt-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#F5EEDF]/35">
              The reading
            </p>
            <p className="mt-1 font-display text-[26px] leading-tight text-[#E4FF54] md:text-[34px]">
              {verdict}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.14em]">
            <button
              type="button"
              onClick={() => setTilt(0)}
              className="border-b border-[#F5EEDF]/25 pb-0.5 text-[#F5EEDF]/55 hover:text-[#F5EEDF]"
            >
              Reset to tension
            </button>
            <Link
              to="/read/$token"
              params={{ token: "mn4qvf4bhu" }}
              className="inline-flex items-center gap-2 border-b border-[#E4FF54]/50 pb-0.5 text-[#E4FF54]"
            >
              Open the read <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
