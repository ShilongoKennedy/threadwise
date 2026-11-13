import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/cut")({
  head: () => ({
    meta: [
      { title: "The cut-up — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experiment in framing: the same facts, cut into a different order.",
      },
    ],
  }),
  component: CutPage,
});

const STRIPS = [
  "The IAEA sent a confidential report to member states.",
  "Its contents are unpublished.",
  "Inspectors have not been allowed back to the bombed sites.",
  "The stockpile figure is unknown.",
  "The Board decides whether to act.",
];

const FRAMES = [
  { label: "As filed", note: "The source order. The report first, the decision last.", order: [0, 1, 2, 3, 4] },
  { label: "Uncertainty first", note: "The missing number leads. The report becomes a question about what cannot be seen.", order: [3, 0, 2, 1, 4] },
  { label: "Access first", note: "The refusal leads. The report becomes a story about the door that stayed closed.", order: [2, 4, 0, 3, 1] },
];

function CutPage() {
  const [frameIndex, setFrameIndex] = useState(0);
  const [cutting, setCutting] = useState(false);
  const frame = FRAMES[frameIndex]!;

  const cut = () => {
    if (cutting) return;
    setCutting(true);
    window.setTimeout(() => {
      setFrameIndex((current) => (current + 1) % FRAMES.length);
      setCutting(false);
    }, 470);
  };

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-[#F0E64E] text-[#11110F]">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/45">
          <span className="hidden sm:inline">Experiment 07 / the cut-up</span>
          <Link to="/" className="border-b border-[#11110F]/20 pb-0.5 hover:text-[#11110F]">
            Close
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-5 pb-10 md:px-8 md:pb-12">
        <div className="grid gap-5 md:grid-cols-[1fr_270px] md:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1C3BFF]">
              The cut-up / IAEA–Iran
            </p>
            <h1 className="mt-2 max-w-[13ch] font-display text-[clamp(44px,6.8vw,90px)] leading-[0.9] tracking-[-0.045em]">
              The facts don’t change. The order does.
            </h1>
          </div>
          <p className="max-w-[28ch] pb-1 font-serif text-[14px] leading-[1.6] text-[#11110F]/60 md:text-[16px]">
            Pull the cutter. Same record, three framings. Nothing is added, nothing is removed.
          </p>
        </div>

        <div className="relative mt-7 h-[430px] md:mt-9 md:h-[490px]">
          <div
            className={`absolute left-[4%] right-[4%] top-0 z-30 h-[7px] origin-left bg-[#FF4B2C] shadow-[0_3px_0_rgba(17,17,15,0.18)] ${cutting ? "cutter-drop" : ""}`}
          />
          <div className="absolute bottom-2 right-0 z-30 flex items-center gap-3">
            <button
              type="button"
              onClick={cut}
              disabled={cutting}
              className="group flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#11110F] bg-[#FF4B2C] font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#11110F] shadow-[0_6px_0_#11110F] transition-transform active:translate-y-1 active:shadow-none disabled:opacity-50"
              aria-label="Cut the record into a new framing"
            >
              Cut
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 top-[18px] md:top-[20px]">
            {STRIPS.map((strip, index) => {
              const slot = frame.order.indexOf(index);
              return (
                <div
                  key={strip}
                  className="cut-strip absolute left-[1%] right-[76px] flex items-center gap-3 border md:right-[94px] border-[#11110F]/35 bg-[#FBF6E7] px-3 py-2 shadow-[4px_5px_0_rgba(17,17,15,0.14)] md:gap-5 md:px-5 md:py-3"
                  style={{ "--slot": slot } as React.CSSProperties}
                >
                  <span className="w-5 shrink-0 font-mono text-[9px] font-bold text-[#1C3BFF] md:w-7 md:text-[11px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="max-w-[96%] font-display text-[18px] leading-[1.02] tracking-[-0.02em] md:text-[30px]">
                    {strip}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-5 border-t border-[#11110F]/20 pt-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#11110F]/40">
              Frame {String(frameIndex + 1).padStart(2, "0")} / {frame.label}
            </p>
            <p className="mt-1 max-w-[52ch] font-serif text-[14px] leading-[1.55] text-[#11110F]/70">
              {frame.note}
            </p>
          </div>
          <Link
            to="/read/$token"
            params={{ token: "mn4qvf4bhu" }}
            className="inline-flex items-center gap-2 border-b border-[#1C3BFF]/40 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1C3BFF]"
          >
            Open the read <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </main>
    </div>
  );
}
