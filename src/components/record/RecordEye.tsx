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
          <path d="M 152 235 C 137 212 124 188 116 158" strokeWidth="2.4" />
          <path d="M 205 192 C 191 166 181 140 174 110" strokeWidth="2.2" />
          <path d="M 275 162 C 263 134 257 108 252 72" strokeWidth="2.4" />
          <path d="M 350 140 C 342 108 337 82 334 48" strokeWidth="2.8" />
          <path d="M 390 130 C 384 98 382 74 382 40" strokeWidth="2.2" />
          <path d="M 430 124 C 426 94 424 70 424 34" strokeWidth="2.6" />
          <path d="M 520 118 C 524 86 528 62 532 28" strokeWidth="2.8" />
          <path d="M 565 120 C 572 90 578 68 588 36" strokeWidth="2.2" />
          <path d="M 615 128 C 626 96 637 72 650 40" strokeWidth="2.6" />
          <path d="M 655 136 C 668 106 680 84 696 54" strokeWidth="2.2" />
          <path d="M 705 148 C 720 120 734 98 752 68" strokeWidth="2.4" />
          <path d="M 795 180 C 811 154 826 134 846 108" strokeWidth="2.2" />
          <path d="M 870 218 C 889 196 904 180 924 158" strokeWidth="2" />
          <path d="M 215 440 C 205 460 195 474 184 488" strokeWidth="1.6" opacity="0.72" />
          <path d="M 270 478 C 263 496 255 508 244 522" strokeWidth="1.4" opacity="0.55" />
          <path d="M 330 500 C 324 516 316 528 306 540" strokeWidth="1.7" opacity="0.68" />
          <path d="M 690 500 C 698 516 707 528 718 540" strokeWidth="1.7" opacity="0.68" />
          <path d="M 750 478 C 758 496 768 508 780 522" strokeWidth="1.4" opacity="0.55" />
          <path d="M 800 440 C 812 460 822 472 836 486" strokeWidth="1.6" opacity="0.7" />
        </g>

        <g>
          <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 C 840 500 660 540 500 540 C 340 540 160 500 45 300 Z" fill={`url(#${uid}-record-sclera)`} />
          <g clipPath={`url(#${uid}-record-eye-clip)`}>
            <g fill="none" stroke="#B96C5C" strokeLinecap="round" opacity="0.19">
              <path d="M 70 300 C 108 282 138 272 178 258" strokeWidth="1.3" />
              <path d="M 75 296 C 112 298 146 292 190 280" strokeWidth="0.8" />
              <path d="M 860 318 C 818 310 782 298 742 284" strokeWidth="1.2" />
              <path d="M 905 306 C 862 318 828 312 790 304" strokeWidth="0.8" />
              <path d="M 168 252 C 184 244 192 238 204 230" strokeWidth="0.6" />
              <path d="M 742 284 C 726 276 716 272 704 264" strokeWidth="0.6" />
            </g>
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
                        strokeWidth={index % 5 === 0 ? 1.15 : 0.62}
                        opacity={index % 7 === 0 ? 0.4 : index % 3 === 0 ? 0.28 : 0.18}
                      />
                    );
                  })}
                </g>
                {Array.from({ length: 12 }).map((_, index) => {
                  const angle = (index / 12) * Math.PI * 2 + 0.2;
                  const radius = 88 + (index % 3) * 12;
                  const cx = 500 + Math.cos(angle) * radius;
                  const cy = 280 + Math.sin(angle) * radius;
                  return (
                    <ellipse
                      key={`crypt-${index}`}
                      cx={cx}
                      cy={cy}
                      rx={5 + (index % 3) * 2}
                      ry={2 + (index % 2)}
                      fill="#0A1A44"
                      opacity={0.16 + (index % 3) * 0.03}
                      transform={`rotate(${(angle * 180) / Math.PI + 90} ${cx} ${cy})`}
                    />
                  );
                })}
                <circle cx="500" cy="280" r="52" fill="none" stroke="#B9A87E" strokeWidth="2.2" opacity="0.14" />
                <circle cx="500" cy="280" r="66" fill="none" stroke="#B9C6FF" strokeWidth="0.9" strokeDasharray="2 5" opacity="0.45" />
                <circle cx="500" cy="280" r="112" fill="none" stroke="#F1E9D8" strokeWidth="0.7" strokeDasharray="1 11" opacity="0.3" />
                <path d="M 500 280 L 500 132 A 148 148 0 0 1 640 280 Z" fill="#F1E9D8" opacity="0.04" />
                <path d="M 500 168 A 112 112 0 0 1 603 224" fill="none" stroke="#F1E9D8" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" />
                <circle cx="500" cy="280" r="139" fill="none" stroke="#0B1D3A" strokeWidth="8" opacity="0.6" />
                <circle cx="500" cy="280" r="150" fill="none" stroke="#E5B8A9" strokeWidth="1.2" opacity="0.8" />
              </g>
              <circle cx="500" cy="280" r="43" fill={`url(#${uid}-record-pupil)`} />
              <ellipse cx="476" cy="254" rx="15" ry="11" fill="#FBF5E8" opacity="0.78" transform="rotate(-24 476 254)" />
              <ellipse cx="535" cy="303" rx="5" ry="3.5" fill="#FBF5E8" opacity="0.4" />
              <circle cx="500" cy="280" r="45" fill="none" stroke="#000000" strokeWidth="2.5" opacity="0.4" />
              <ellipse cx="500" cy="280" rx="150" ry="150" fill={`url(#${uid}-record-cornea)`} />
              <path d="M 382 218 C 402 168 448 136 500 128" fill="none" stroke="#FFF8EA" strokeWidth="10" strokeLinecap="round" opacity="0.14" />
              <path d="M 365 300 C 380 350 420 386 468 402" fill="none" stroke="#FBF5E8" strokeWidth="7" strokeLinecap="round" opacity="0.08" />
            </g>
            <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 L 955 196 C 800 138 660 120 500 120 C 340 120 200 142 45 204 Z" fill="#4A3428" opacity="0.22" />
            <path d="M 45 300 C 160 165 340 112 500 112 C 660 112 840 165 955 300 L 955 250 C 800 185 660 165 500 165 C 340 165 200 186 45 254 Z" fill="#FBF5E8" opacity="0.08" />
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
