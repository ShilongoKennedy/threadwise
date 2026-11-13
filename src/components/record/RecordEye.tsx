import { useId, useRef, useState } from "react";

export function RecordEye() {
  const uid = useId().replace(/:/g, "");
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
          <clipPath id={`${uid}-record-eye-clip`}>
            <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 C 840 500 660 540 500 540 C 340 540 160 500 45 300 Z" />
          </clipPath>
          <radialGradient id={`${uid}-record-sclera`} cx="54%" cy="42%" r="72%">
            <stop offset="0%" stopColor="#FBF5E8" />
            <stop offset="62%" stopColor="#F4EBDD" />
            <stop offset="100%" stopColor="#E6D9C6" />
          </radialGradient>
          <linearGradient id={`${uid}-record-eyeshadow`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A241D" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#2A241D" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#2A241D" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${uid}-record-iris`} cx="42%" cy="36%" r="72%">
            <stop offset="0%" stopColor="#4A6BFF" />
            <stop offset="34%" stopColor="#2A4BFA" />
            <stop offset="74%" stopColor="#1737E8" />
            <stop offset="100%" stopColor="#07152F" />
          </radialGradient>
          <radialGradient id={`${uid}-record-pupil`} cx="44%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#24262B" />
            <stop offset="46%" stopColor="#0B0C0E" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <linearGradient id={`${uid}-record-cornea`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBF5E8" stopOpacity="0.5" />
            <stop offset="42%" stopColor="#FBF5E8" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FBF5E8" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g stroke="#11110F" fill="none" strokeLinecap="round">
          <path d="M 152 235 C 130 212 114 190 100 158" strokeWidth="4.5" />
          <path d="M 205 192 C 189 164 180 142 172 108" strokeWidth="4" />
          <path d="M 275 162 C 264 132 258 110 253 74" strokeWidth="4.5" />
          <path d="M 350 140 C 344 108 341 86 340 50" strokeWidth="5" />
          <path d="M 430 124 C 428 94 428 72 431 38" strokeWidth="5" />
          <path d="M 520 118 C 526 86 531 64 539 30" strokeWidth="5" />
          <path d="M 615 128 C 625 96 635 74 649 42" strokeWidth="4.5" />
          <path d="M 705 148 C 720 118 733 98 751 68" strokeWidth="4" />
          <path d="M 795 180 C 812 154 827 137 848 110" strokeWidth="3.5" />
          <path d="M 870 218 C 890 196 904 182 924 160" strokeWidth="3" />
          <path d="M 215 440 C 207 458 199 472 188 488" strokeWidth="2" opacity="0.7" />
          <path d="M 330 500 C 324 514 316 526 306 540" strokeWidth="2.2" opacity="0.65" />
          <path d="M 690 500 C 698 514 706 526 716 538" strokeWidth="2.2" opacity="0.65" />
          <path d="M 800 440 C 811 458 821 470 834 484" strokeWidth="2" opacity="0.65" />
        </g>

        <g>
          <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 C 840 500 660 540 500 540 C 340 540 160 500 45 300 Z" fill={`url(#${uid}-record-sclera)`} />
          <g clipPath={`url(#${uid}-record-eye-clip)`}>
            <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 L 955 250 L 45 250 Z" fill={`url(#${uid}-record-eyeshadow)`} />
            <g className="iris-move" style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }}>
              <circle cx="500" cy="280" r="168" fill="#07152F" opacity="0.25" />
              <circle cx="500" cy="280" r="158" fill="#0B1D3A" />
              <circle cx="500" cy="280" r="150" fill={`url(#${uid}-record-iris)`} />
              <g className="iris-spin">
                <g strokeLinecap="round">
                  {Array.from({ length: 110 }).map((_, index) => {
                    const angle = (index / 110) * Math.PI * 2;
                    const inner = 48 + (index % 6) * 2.2;
                    const outer = 128 + (index % 9) * 2.2;
                    return (
                      <line
                        key={index}
                        x1={500 + Math.cos(angle) * inner}
                        y1={280 + Math.sin(angle) * inner}
                        x2={500 + Math.cos(angle) * outer}
                        y2={280 + Math.sin(angle) * outer}
                        stroke={index % 7 === 0 ? "#F1E9D8" : index % 5 === 0 ? "#2B45C8" : "#4F6BFF"}
                        strokeWidth={index % 5 === 0 ? 0.8 : 0.38}
                        opacity={index % 7 === 0 ? 0.3 : index % 3 === 0 ? 0.2 : 0.12}
                      />
                    );
                  })}
                </g>
                <circle cx="500" cy="280" r="66" fill="none" stroke="#B9C6FF" strokeWidth="0.9" strokeDasharray="2 5" opacity="0.45" />
                <circle cx="500" cy="280" r="139" fill="none" stroke="#0B1D3A" strokeWidth="8" opacity="0.6" />
                <circle cx="500" cy="280" r="150" fill="none" stroke="#E5B8A9" strokeWidth="1.2" opacity="0.8" />
              </g>
              <circle cx="500" cy="280" r="43" fill={`url(#${uid}-record-pupil)`} />
              <ellipse cx="476" cy="254" rx="15" ry="11" fill="#FBF5E8" opacity="0.78" transform="rotate(-24 476 254)" />
              <ellipse cx="535" cy="303" rx="5" ry="3.5" fill="#FBF5E8" opacity="0.4" />
              <ellipse cx="500" cy="280" rx="150" ry="150" fill={`url(#${uid}-record-cornea)`} />
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

        <g className="blink-auto" clipPath={`url(#${uid}-record-eye-clip)`} pointerEvents="none">
          <rect x="0" y="0" width="1000" height="300" fill="#EBDCC7" />
          <rect x="0" y="300" width="1000" height="280" fill="#EBDCC7" />
          <path d="M 50 300 Q 500 344 950 300" fill="none" stroke="#11110F" strokeWidth="6" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
