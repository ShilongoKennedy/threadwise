import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/eye")({
  head: () => ({
    meta: [
      { title: "The eye — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experiment in being read: a typographic eye that follows the cursor.",
      },
    ],
  }),
  component: EyePage,
});

const CAPTIONS = [
  "It does not look away.",
  "A confidential report went to member states.",
  "The contents are unpublished.",
  "Inspectors have not been allowed back.",
  "The stockpile figure is unknown.",
];

function EyePage() {
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [blinks, setBlinks] = useState(0);
  const frame = useRef<number | null>(null);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setPupil({ x: Math.max(-26, Math.min(26, x * 58)), y: Math.max(-18, Math.min(18, y * 38)) });
  };

  const blink = () => {
    if (blinking) return;
    setBlinking(true);
    window.setTimeout(() => {
      setBlinking(false);
      setBlinks((current) => current + 1);
    }, 320);
  };

  return (
    <div
      onPointerMove={move}
      onClick={blink}
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#F1E9D8] text-[#11110F] selection:bg-[#1737E8] selection:text-[#F1E9D8]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,#11110F_5px,#11110F_6px)]" />
      <div className="pointer-events-none absolute left-5 top-20 h-3 w-3 border-l border-t border-[#11110F]/30 md:left-8" />
      <div className="pointer-events-none absolute right-5 top-20 h-3 w-3 border-r border-t border-[#11110F]/30 md:right-8" />

      <header className="relative z-20 flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
        <Link to="/" className="font-display text-[23px] italic leading-none">
          threadwise
        </Link>
        <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.14em] text-[#11110F]/45">
          <span className="hidden sm:inline">Experiment 11 / the eye</span>
          <Link to="/" className="border-b border-[#11110F]/20 pb-0.5 hover:text-[#11110F]">
            Close
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1300px] flex-1 flex-col justify-between px-5 pb-5 pt-6 md:px-8 md:pb-7 md:pt-8">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#1737E8]">
              The read / IAEA–Iran
            </p>
            <h1 className="mt-2 max-w-[13ch] font-display text-[clamp(42px,6.3vw,88px)] leading-[0.9] tracking-[-0.045em]">
              The record is watching.
            </h1>
          </div>
          <p className="max-w-[26ch] pb-1 font-serif text-[14px] leading-[1.6] text-[#11110F]/55 md:text-[15px]">
            Move. It follows. Click. It blinks. It does not look away.
          </p>
        </div>

        <div className="relative mx-auto mt-3 w-full max-w-[1100px] md:mt-4" aria-hidden="true">
          <svg viewBox="0 0 1000 560" className="w-full">
            <defs>
              <clipPath id="eye-clip">
                <path d="M 34 280 Q 500 18 966 280 Q 500 542 34 280 Z" />
              </clipPath>
              <path id="iris-ring" d="M 500,280 m -148,0 a 148,148 0 1,1 296,0 a 148,148 0 1,1 -296,0" />
              <radialGradient id="iris-fill" cx="42%" cy="38%" r="68%">
                <stop offset="0%" stopColor="#3558FF" />
                <stop offset="72%" stopColor="#1737E8" />
                <stop offset="100%" stopColor="#0B1D3A" />
              </radialGradient>
            </defs>

            <g stroke="#11110F" strokeWidth="4" strokeLinecap="round">
              <path d="M 188 205 L 160 150" />
              <path d="M 300 142 L 288 84" />
              <path d="M 420 108 L 418 50" />
              <path d="M 530 102 L 538 44" />
              <path d="M 650 128 L 668 70" />
              <path d="M 775 174 L 808 118" />
              <path d="M 866 222 L 910 180" />
            </g>

            <g className={blinking ? "eye-blink" : ""}>
              <path d="M 34 280 Q 500 18 966 280 Q 500 542 34 280 Z" fill="#F1E9D8" stroke="#11110F" strokeWidth="8" />
              <g clipPath="url(#eye-clip)">
                <g transform={`translate(${pupil.x} ${pupil.y})`}>
                  <circle cx="500" cy="280" r="232" fill="#F1E9D8" />
                  <g className="iris-spin">
                    <circle cx="500" cy="280" r="186" fill="#1737E8" opacity="0.12" />
                    <circle cx="500" cy="280" r="170" fill="url(#iris-fill)" />
                    <circle cx="500" cy="280" r="170" fill="none" stroke="#FF4B2B" strokeWidth="2.5" />
                    <g stroke="#F1E9D8" strokeWidth="0.7" opacity="0.22">
                      {Array.from({ length: 18 }).map((_, index) => {
                        const angle = (index / 18) * Math.PI * 2;
                        return (
                          <line
                            key={index}
                            x1={500 + Math.cos(angle) * 74}
                            y1={280 + Math.sin(angle) * 74}
                            x2={500 + Math.cos(angle) * 160}
                            y2={280 + Math.sin(angle) * 160}
                          />
                        );
                      })}
                    </g>
                    <circle cx="500" cy="280" r="138" fill="none" stroke="#F1E9D8" strokeWidth="0.8" opacity="0.35" />
                    <circle cx="500" cy="280" r="106" fill="none" stroke="#F1E9D8" strokeWidth="0.8" opacity="0.25" />
                    <circle cx="500" cy="280" r="66" fill="#0B0C0E" />
                    <circle cx="474" cy="252" r="18" fill="#F1E9D8" opacity="0.75" />
                    <circle cx="526" cy="304" r="5" fill="#F1E9D8" opacity="0.45" />
                  </g>
                </g>
                <path d="M 34 280 Q 500 18 966 280" fill="none" stroke="#11110F" strokeWidth="14" strokeLinecap="round" />
                <path d="M 34 280 Q 500 542 966 280" fill="none" stroke="#11110F" strokeWidth="8" strokeLinecap="round" />
              </g>
            </g>
          </svg>
        </div>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-t border-[#11110F]/20 pt-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                blink();
              }}
              className="pointer-events-auto border-b border-[#11110F]/30 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#11110F]/55 hover:text-[#11110F]"
            >
              Blink
            </button>
            <span className="max-w-[38ch] font-serif text-[13px] leading-tight text-[#11110F]/55">
              {CAPTIONS[Math.min(blinks, CAPTIONS.length - 1)]}
            </span>
          </div>
          <Link
            to="/read/$token"
            params={{ token: "mn4qvf4bhu" }}
            className="pointer-events-auto inline-flex items-center gap-2 border-b border-[#1737E8]/40 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#1737E8]"
          >
            Open the full read <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </main>
    </div>
  );
}
