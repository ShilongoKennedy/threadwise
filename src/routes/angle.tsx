import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/angle")({
  head: () => ({
    meta: [
      { title: "The angle — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An anamorphic reading experiment: find the angle where the record resolves.",
      },
    ],
  }),
  component: AnglePage,
});

const IDLE = { x: -38, y: 38, z: -10 };

function AnglePage() {
  const [angles, setAngles] = useState(IDLE);
  const [active, setActive] = useState(false);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    const dx = x - 0.5;
    const dy = y - 0.5;
    const distance = Math.hypot(dx, dy);
    const snapped = distance < 0.055;
    setActive(true);
    setAngles(
      snapped
        ? { x: 0, y: 0, z: 0 }
        : {
            x: (0.5 - y) * 46,
            y: (x - 0.5) * 54,
            z: (x - 0.5) * 10,
          },
    );
  };

  const reset = () => {
    setActive(false);
    setAngles(IDLE);
  };

  const flatten = () => {
    setActive(true);
    setAngles({ x: 0, y: 0, z: 0 });
  };

  const aligned = angles.x === 0 && angles.y === 0 && angles.z === 0;
  const readout = `${angles.x >= 0 ? "+" : "−"}${Math.abs(angles.x).toFixed(0)}° / ${angles.y >= 0 ? "+" : "−"}${Math.abs(angles.y).toFixed(0)}°`;

  return (
    <div
      onPointerMove={move}
      onPointerLeave={(event) => { if (event.pointerType === "mouse") reset(); }}
      className="relative h-[100dvh] min-h-[640px] overflow-hidden bg-[#1B3BFF] text-[#F5EEDF] touch-none selection:bg-[#E6FF55] selection:text-[#11110F]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #F5EEDF 1px, transparent 1px), linear-gradient(to bottom, #F5EEDF 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="pointer-events-none absolute left-5 top-20 h-3 w-3 border-l border-t border-[#F5EEDF]/30 md:left-8" />
      <div className="pointer-events-none absolute right-5 top-20 h-3 w-3 border-r border-t border-[#F5EEDF]/30 md:right-8" />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none text-[#F5EEDF]">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F5EEDF]/50">
          <span className="hidden sm:inline">Experiment 09 / the angle</span>
          <Link to="/" className="border-b border-[#F5EEDF]/25 pb-0.5 hover:text-[#F5EEDF]">
            Close
          </Link>
        </div>
      </header>

      <div className="absolute left-5 top-24 z-30 md:left-8 md:top-28">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#E6FF55]">
          The angle / IAEA–Iran
        </p>
        <p className="mt-1 hidden max-w-[36ch] font-serif text-[14px] leading-snug text-[#F5EEDF]/55 md:block">
          Move toward the centre until the record resolves.
        </p>
      </div>

      <div className="absolute right-5 top-24 z-30 text-right md:right-8 md:top-28">
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#F5EEDF]/40">
          Alignment
        </p>
        <p className={`mt-1 font-mono text-[11px] tracking-[0.1em] ${aligned ? "text-[#E6FF55]" : "text-[#F5EEDF]/70"}`}>
          {aligned ? "READABLE / 00°" : readout}
        </p>
      </div>

      <main className="absolute inset-0 flex items-center justify-center px-5 pt-16 md:px-8">
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <span className={`block h-4 w-px bg-[#F5EEDF]/30 ${aligned ? "bg-[#E6FF55]/70" : ""}`} />
          <span className={`mt-1 block h-px w-4 -translate-x-1/2 bg-[#F5EEDF]/30 ${aligned ? "bg-[#E6FF55]/70" : ""}`} />
        </div>

        <div style={{ perspective: "1300px" }} className="relative flex h-[600px] w-full max-w-[1100px] items-center justify-center">
          <article
            className="relative flex h-[560px] w-[min(1000px,88vw)] flex-col justify-between overflow-hidden bg-[#F5EEDF] p-6 text-[#11110F] shadow-[24px_30px_0_rgba(17,17,15,0.22)] transition-transform duration-150 ease-out md:h-[580px] md:p-10"
            style={{
              transform: `rotateX(${angles.x}deg) rotateY(${angles.y}deg) rotateZ(${angles.z}deg)`,
              transformStyle: "preserve-3d",
            }}
            aria-label="See what the story hides. The IAEA read, plotted."
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#11110F]/20 pb-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#1B3BFF]">
                The read / IAEA–Iran
              </p>
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#11110F]/40">
                09 Nov 2026
              </p>
            </div>

            <div className="my-5 md:my-7">
              <h1 className="max-w-[12ch] font-display text-[clamp(42px,7vw,94px)] leading-[0.88] tracking-[-0.04em]">
                See what the story hides.
              </h1>
              <p className="mt-5 max-w-[44ch] font-serif text-[15px] leading-[1.65] text-[#11110F]/60 md:text-[17px]">
                Every claim has a geography. Vienna issues the demand. Tehran controls the
                permission. Natanz stays unverified.
              </p>
            </div>

            <div className="grid gap-4 border-t border-[#11110F]/20 pt-3 md:grid-cols-[1fr_auto] md:items-end">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#11110F]/45">
                <span className="flex items-center gap-2"><span className="h-px w-5 bg-[#1B3BFF]" /> the demand</span>
                <span className="flex items-center gap-2"><span className="h-px w-5 border-t border-dashed border-[#C1121F]" /> permission denied</span>
              </div>
              <Link
                to="/read/$token"
                params={{ token: "mn4qvf4bhu" }}
                className="inline-flex items-center gap-2 border-b border-[#1B3BFF]/40 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1B3BFF]"
              >
                Open the IAEA read <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 px-5 pb-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#F5EEDF]/35 md:px-8">
        <p>{active ? "Keep moving / find the flat" : "Move the cursor to flatten the plate"}</p>
        <div className="pointer-events-auto flex items-center gap-4">
          <button type="button" onClick={flatten} className="border-b border-[#E6FF55]/40 pb-0.5 text-[#E6FF55]">
            Flatten the plate
          </button>
          <button type="button" onClick={reset} className="border-b border-[#F5EEDF]/20 pb-0.5 hover:text-[#F5EEDF]">
            Reset angle
          </button>
        </div>
      </div>
    </div>
  );
}
