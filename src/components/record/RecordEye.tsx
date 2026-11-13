import { useRef, useState } from "react";

export function RecordEye() {
  const ref = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setPupil({ x: Math.max(-22, Math.min(22, x * 46)), y: Math.max(-14, Math.min(14, y * 30)) });
  };

  return (
    <div ref={ref} onPointerMove={move} className="relative w-full" aria-hidden="true">
      <svg viewBox="0 0 1000 560" className="w-full">
        <defs>
          <clipPath id="record-eye-clip">
            <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 C 840 500 660 540 500 540 C 340 540 160 500 45 300 Z" />
          </clipPath>
          <radialGradient id="record-sclera" cx="54%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#FBF5E8" />
            <stop offset="62%" stopColor="#F4EBDD" />
            <stop offset="100%" stopColor="#E6D9C6" />
          </radialGradient>
          <linearGradient id="record-eyeshadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A241D" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#2A241D" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#2A241D" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="record-iris" cx="42%" cy="36%" r="72%">
            <stop offset="0%" stopColor="#4A6BFF" />
            <stop offset="34%" stopColor="#2A4BFA" />
            <stop offset="74%" stopColor="#1737E8" />
            <stop offset="100%" stopColor="#07152F" />
          </radialGradient>
          <radialGradient id="record-pupil" cx="44%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#24262B" />
            <stop offset="46%" stopColor="#0B0C0E" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <linearGradient id="record-cornea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBF5E8" stopOpacity="0.5" />
            <stop offset="42%" stopColor="#FBF5E8" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FBF5E8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g stroke="#11110F" fill="none" strokeLinecap="round">
          <path d="M 160 226 C 145 196 134 174 124 142" strokeWidth="4" />
          <path d="M 225 188 C 213 156 209 132 202 98" strokeWidth="4" />
          <path d="M 302 156 C 296 122 296 100 294 66" strokeWidth="4.5" />
          <path d="M 390 132 C 390 98 394 76 398 44" strokeWidth="5" />
          <path d="M 485 122 C 489 88 495 66 503 34" strokeWidth="5" />
          <path d="M 580 126 C 588 92 596 72 606 42" strokeWidth="5" />
          <path d="M 675 144 C 686 112 696 92 710 60" strokeWidth="4.5" />
          <path d="M 765 174 C 780 146 792 128 810 98" strokeWidth="4" />
          <path d="M 842 210 C 860 184 874 168 894 142" strokeWidth="3.5" />
          <path d="M 215 440 C 206 462 198 474 186 490" strokeWidth="2" opacity="0.7" />
          <path d="M 330 500 C 324 516 318 526 310 540" strokeWidth="2" opacity="0.65" />
          <path d="M 690 500 C 696 516 704 526 714 540" strokeWidth="2" opacity="0.65" />
          <path d="M 800 440 C 810 460 818 470 830 484" strokeWidth="2" opacity="0.65" />
        </g>

        <g>
          <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 C 840 500 660 540 500 540 C 340 540 160 500 45 300 Z" fill="url(#record-sclera)" />
          <g clipPath="url(#record-eye-clip)">
            <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 L 955 250 L 45 250 Z" fill="url(#record-eyeshadow)" />
            <g className="iris-move" style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }}>
              <circle cx="500" cy="280" r="168" fill="#07152F" opacity="0.25" />
              <circle cx="500" cy="280" r="158" fill="#0B1D3A" />
              <circle cx="500" cy="280" r="150" fill="url(#record-iris)" />
              <g className="iris-spin">
                <g strokeLinecap="round">
                  {Array.from({ length: 56 }).map((_, index) => {
                    const angle = (index / 56) * Math.PI * 2;
                    const inner = 58 + (index % 5) * 3;
                    const outer = 128 + (index % 7) * 3;
                    return (
                      <line
                        key={index}
                        x1={500 + Math.cos(angle) * inner}
                        y1={280 + Math.sin(angle) * inner}
                        x2={500 + Math.cos(angle) * outer}
                        y2={280 + Math.sin(angle) * outer}
                        stroke={index % 4 === 0 ? "#F1E9D8" : "#4F6BFF"}
                        strokeWidth={index % 3 === 0 ? 1 : 0.55}
                        opacity={index % 4 === 0 ? 0.32 : 0.25}
                      />
                    );
                  })}
                </g>
                <circle cx="500" cy="280" r="74" fill="none" stroke="#B9C6FF" strokeWidth="1" strokeDasharray="2 5" opacity="0.5" />
                <circle cx="500" cy="280" r="138" fill="none" stroke="#0B1D3A" strokeWidth="6" opacity="0.55" />
                <circle cx="500" cy="280" r="150" fill="none" stroke="#FF4B2B" strokeWidth="2" />
              </g>
              <circle cx="500" cy="280" r="54" fill="url(#record-pupil)" />
              <ellipse cx="472" cy="248" rx="21" ry="15" fill="#FBF5E8" opacity="0.8" transform="rotate(-24 472 248)" />
              <ellipse cx="548" cy="312" rx="7" ry="5" fill="#FBF5E8" opacity="0.45" />
              <ellipse cx="500" cy="280" rx="150" ry="150" fill="url(#record-cornea)" />
            </g>
            <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300" fill="none" stroke="#11110F" strokeWidth="9" strokeLinecap="round" />
            <path d="M 45 300 C 160 500 660 540 955 300" fill="none" stroke="#11110F" strokeWidth="4" strokeLinecap="round" />
            <path d="M 60 300 C 170 490 330 528 470 534" fill="none" stroke="#D9C9B4" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            <path d="M 45 300 C 62 286 82 288 96 300 C 82 314 60 314 45 300 Z" fill="#C56A5B" opacity="0.75" />
          </g>
          <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300" fill="none" stroke="#11110F" strokeWidth="10" strokeLinecap="round" />
          <path d="M 45 300 C 160 500 660 540 955 300" fill="none" stroke="#11110F" strokeWidth="5" strokeLinecap="round" />
          <path d="M 78 272 C 190 138 350 82 500 82 C 646 82 800 134 918 262" fill="none" stroke="#11110F" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        </g>

        <g className="blink-auto" clipPath="url(#record-eye-clip)" pointerEvents="none">
          <rect x="0" y="0" width="1000" height="300" fill="#EBDCC7" />
          <rect x="0" y="300" width="1000" height="280" fill="#EBDCC7" />
          <path d="M 50 300 Q 500 344 950 300" fill="none" stroke="#11110F" strokeWidth="6" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
