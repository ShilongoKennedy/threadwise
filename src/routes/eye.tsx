import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
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
  "Confidential.",
  "Unpublished.",
  "No access.",
  "The figure is unknown.",
];

function EyePage() {
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [blinks, setBlinks] = useState(0);
  const blinkRef = useRef(false);

  const blink = useCallback(() => {
    if (blinkRef.current) return;
    blinkRef.current = true;
    setBlinking(true);
    window.setTimeout(() => {
      blinkRef.current = false;
      setBlinking(false);
      setBlinks((current) => current + 1);
    }, 240);
  }, []);



  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setPupil({ x: Math.max(-24, Math.min(24, x * 54)), y: Math.max(-16, Math.min(16, y * 34)) });
  };

  return (
    <div
      onPointerMove={move}
      onClick={blink}
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#F1E9D8] text-[#11110F] selection:bg-[#1737E8] selection:text-[#F1E9D8]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,#11110F_5px,#11110F_6px)]" />
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
            Move. It follows. It blinks every second or two. It does not look away.
          </p>
        </div>

        <div className="relative mx-auto mt-2 w-full max-w-[1100px] md:mt-3" aria-hidden="true">
          <svg viewBox="0 0 1000 560" className="w-full">
            <defs>
              <clipPath id="eye-clip">
                <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 C 840 500 660 540 500 540 C 340 540 160 500 45 300 Z" />
              </clipPath>
              <radialGradient id="sclera-fill" cx="54%" cy="42%" r="72%">
                <stop offset="0%" stopColor="#FBF5E8" />
                <stop offset="62%" stopColor="#F4EBDD" />
                <stop offset="100%" stopColor="#E6D9C6" />
              </radialGradient>
              <linearGradient id="upper-shadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2A241D" stopOpacity="0.42" />
                <stop offset="55%" stopColor="#2A241D" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#2A241D" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="iris-fill" cx="42%" cy="36%" r="72%">
                <stop offset="0%" stopColor="#4A6BFF" />
                <stop offset="34%" stopColor="#2A4BFA" />
                <stop offset="74%" stopColor="#1737E8" />
                <stop offset="100%" stopColor="#07152F" />
              </radialGradient>
              <radialGradient id="pupil-fill" cx="44%" cy="38%" r="72%">
                <stop offset="0%" stopColor="#24262B" />
                <stop offset="46%" stopColor="#0B0C0E" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>
              <linearGradient id="cornea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FBF5E8" stopOpacity="0.5" />
                <stop offset="42%" stopColor="#FBF5E8" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#FBF5E8" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="socket" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#B7A88F" stopOpacity="0.3" />
                <stop offset="65%" stopColor="#B7A88F" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#B7A88F" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="500" cy="310" rx="500" ry="235" fill="url(#socket)" />

            <g stroke="#11110F" fill="none" strokeLinecap="round">
              <path d="M 160 226 C 145 196 134 174 124 142" strokeWidth="5" />
              <path d="M 225 188 C 213 156 209 132 202 98" strokeWidth="5" />
              <path d="M 302 156 C 296 122 296 100 294 66" strokeWidth="5.5" />
              <path d="M 390 132 C 390 98 394 76 398 44" strokeWidth="6" />
              <path d="M 485 122 C 489 88 495 66 503 34" strokeWidth="6" />
              <path d="M 580 126 C 588 92 596 72 606 42" strokeWidth="6" />
              <path d="M 675 144 C 686 112 696 92 710 60" strokeWidth="5.5" />
              <path d="M 765 174 C 780 146 792 128 810 98" strokeWidth="5" />
              <path d="M 842 210 C 860 184 874 168 894 142" strokeWidth="4.5" />
              <path d="M 215 360 C 206 382 198 394 186 410" strokeWidth="2.5" opacity="0.75" />
              <path d="M 330 405 C 324 424 318 436 310 450" strokeWidth="2.5" opacity="0.7" />
              <path d="M 690 402 C 696 420 704 432 714 446" strokeWidth="2.5" opacity="0.7" />
              <path d="M 800 360 C 810 380 818 392 830 406" strokeWidth="2.5" opacity="0.7" />
            </g>

            <g>
              <path
                d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 C 840 500 660 540 500 540 C 340 540 160 500 45 300 Z"
                fill="url(#sclera-fill)"
              />

              <g clipPath="url(#eye-clip)">
                <path
                  d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 L 955 250 L 45 250 Z"
                  fill="url(#upper-shadow)"
                />

                <g
                  className="iris-move"
                  style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }}
                >
                  <circle cx="500" cy="280" r="168" fill="#07152F" opacity="0.28" />
                  <circle cx="500" cy="280" r="158" fill="#0B1D3A" />
                  <circle cx="500" cy="280" r="150" fill="url(#iris-fill)" />

                  <g className="iris-spin">
                    <g strokeLinecap="round">
                      {Array.from({ length: 64 }).map((_, index) => {
                        const angle = (index / 64) * Math.PI * 2;
                        const inner = 58 + (index % 5) * 3;
                        const outer = 128 + (index % 7) * 3;
                        return (
                          <line
                            key={`fiber-${index}`}
                            x1={500 + Math.cos(angle) * inner}
                            y1={280 + Math.sin(angle) * inner}
                            x2={500 + Math.cos(angle) * outer}
                            y2={280 + Math.sin(angle) * outer}
                            stroke={index % 4 === 0 ? "#F1E9D8" : "#4F6BFF"}
                            strokeWidth={index % 3 === 0 ? 1.1 : 0.6}
                            opacity={index % 4 === 0 ? 0.35 : 0.28}
                          />
                        );
                      })}
                    </g>
                    <circle
                      cx="500"
                      cy="280"
                      r="74"
                      fill="none"
                      stroke="#B9C6FF"
                      strokeWidth="1"
                      strokeDasharray="2 5"
                      opacity="0.5"
                    />
                    <circle cx="500" cy="280" r="138" fill="none" stroke="#0B1D3A" strokeWidth="6" opacity="0.55" />
                    <circle cx="500" cy="280" r="150" fill="none" stroke="#FF4B2B" strokeWidth="2" />
                  </g>

                  <circle cx="500" cy="280" r="54" fill="url(#pupil-fill)" />
                  <circle cx="500" cy="280" r="54" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />
                  <ellipse cx="472" cy="248" rx="21" ry="15" fill="#FBF5E8" opacity="0.82" transform="rotate(-24 472 248)" />
                  <ellipse cx="548" cy="312" rx="7" ry="5" fill="#FBF5E8" opacity="0.45" />
                  <ellipse cx="500" cy="280" rx="150" ry="150" fill="url(#cornea)" />
                </g>

                <path
                  d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300"
                  fill="none"
                  stroke="#11110F"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                <path
                  d="M 45 300 C 160 500 660 540 955 300"
                  fill="none"
                  stroke="#11110F"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M 60 300 C 170 490 330 528 470 534"
                  fill="none"
                  stroke="#D9C9B4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <path
                  d="M 45 300 C 62 286 82 288 96 300 C 82 314 60 314 45 300 Z"
                  fill="#C56A5B"
                  opacity="0.75"
                />
              </g>

              <path
                d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300"
                fill="none"
                stroke="#11110F"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 45 300 C 160 500 660 540 955 300"
                fill="none"
                stroke="#11110F"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 78 272 C 190 138 350 82 500 82 C 646 82 800 134 918 262"
                fill="none"
                stroke="#11110F"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.35"
              />
            </g>

            <g pointerEvents="none" clipPath="url(#eye-clip)" style={{ opacity: blinking ? 1 : 0 }}>
              <rect x="0" y="0" width="1000" height="300" fill="#EBDCC7" />
              <rect x="0" y="300" width="1000" height="280" fill="#EBDCC7" />
              <path d="M 50 300 Q 500 344 950 300" fill="none" stroke="#11110F" strokeWidth="6" strokeLinecap="round" />
            </g>

            <g className="blink-auto" pointerEvents="none" clipPath="url(#eye-clip)">
              <rect x="0" y="0" width="1000" height="300" fill="#EBDCC7" />
              <rect x="0" y="300" width="1000" height="280" fill="#EBDCC7" />
              <path d="M 50 300 Q 500 344 950 300" fill="none" stroke="#11110F" strokeWidth="6" strokeLinecap="round" />
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
