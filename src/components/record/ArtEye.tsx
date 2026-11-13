import { useId, useRef, useState } from "react";

export function ArtEye() {
  const uid = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setPupil({ x: Math.max(-14, Math.min(14, x * 28)), y: Math.max(-8, Math.min(8, y * 18)) });
  };

  return (
    <div ref={ref} onPointerMove={move} className="relative w-full" aria-hidden="true">
      <svg viewBox="0 0 1200 800" className="w-full">
        <defs>
          <clipPath id={`${uid}-opening`}>
            <path d="M 96 424 C 244 274 440 204 620 204 C 800 204 978 286 1104 424 C 976 574 798 636 620 636 C 440 636 246 574 96 424 Z" />
          </clipPath>
          <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C99E84" />
            <stop offset="42%" stopColor="#DDB99F" />
            <stop offset="100%" stopColor="#F0DAC8" />
          </linearGradient>
          <radialGradient id={`${uid}-skin-light`} cx="58%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#F3DDCB" />
            <stop offset="58%" stopColor="#E3BFA5" />
            <stop offset="100%" stopColor="#C08D74" />
          </radialGradient>
          <radialGradient id={`${uid}-sclera`} cx="52%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#FCF5E8" />
            <stop offset="60%" stopColor="#F1E4D2" />
            <stop offset="100%" stopColor="#D9BFA8" />
          </radialGradient>
          <radialGradient id={`${uid}-iris`} cx="42%" cy="35%" r="68%">
            <stop offset="0%" stopColor="#6C86FF" />
            <stop offset="30%" stopColor="#3355F1" />
            <stop offset="66%" stopColor="#182FA8" />
            <stop offset="91%" stopColor="#071743" />
            <stop offset="100%" stopColor="#020817" />
          </radialGradient>
          <radialGradient id={`${uid}-pupil`} cx="43%" cy="37%" r="68%">
            <stop offset="0%" stopColor="#1C1E22" />
            <stop offset="55%" stopColor="#050607" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <linearGradient id={`${uid}-cornea`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF9ED" stopOpacity="0.62" />
            <stop offset="38%" stopColor="#FFF9ED" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#FFF9ED" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${uid}-under-eye`} cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#9E6A55" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#9E6A55" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/* skin around the eye */}
        <path d="M 0 0 H 1200 V 520 C 1010 300 820 168 620 168 C 420 168 226 300 0 520 Z" fill={`url(#${uid}-skin)`} />
        <path d="M 0 520 C 226 300 420 168 620 168 C 820 168 1010 300 1200 520 V 800 H 0 Z" fill={`url(#${uid}-skin-light)`} opacity="0.55" />
        <path d="M 0 520 C 226 300 420 168 620 168 C 820 168 1010 300 1200 520" fill="none" stroke="#A97760" strokeWidth="2.5" opacity="0.2" />

        {/* eyelid crease and upper shadow */}
        <path d="M 130 356 C 282 218 452 154 620 154 C 790 154 950 216 1090 344" fill="none" stroke="#98654E" strokeWidth="4.5" strokeLinecap="round" opacity="0.32" />
        <path d="M 96 424 C 244 274 440 204 620 204 C 800 204 978 286 1104 424 C 978 390 800 330 620 330 C 440 330 244 382 96 424 Z" fill="#8F5A44" opacity="0.16" filter={`url(#${uid}-blur)`} />
        <path d="M 96 424 C 244 274 440 204 620 204 C 800 204 978 286 1104 424" fill="none" stroke="#2A1A14" strokeWidth="7" strokeLinecap="round" opacity="0.82" />
        <path d="M 96 424 C 246 574 440 636 620 636 C 798 636 976 574 1104 424" fill="none" stroke="#2A1A14" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <path d="M 118 440 C 260 566 442 612 610 614" fill="none" stroke="#E8BEAA" strokeWidth="3" strokeLinecap="round" opacity="0.55" />

        {/* globe */}
        <path d="M 96 424 C 244 274 440 204 620 204 C 800 204 978 286 1104 424 C 976 574 798 636 620 636 C 440 636 246 574 96 424 Z" fill={`url(#${uid}-sclera)`} />

        <g clipPath={`url(#${uid}-opening)`}>
          <path d="M 96 424 C 244 274 440 204 620 204 C 800 204 978 286 1104 424 L 1104 330 C 900 242 770 232 620 232 C 470 232 320 262 96 354 Z" fill="#704A38" opacity="0.2" filter={`url(#${uid}-blur)`} />

          {/* sclera vessels */}
          <g fill="none" stroke="#C1745F" strokeLinecap="round" opacity="0.22">
            <path d="M 122 426 C 186 404 230 400 292 390" strokeWidth="1.6" />
            <path d="M 142 420 C 196 434 236 428 284 416" strokeWidth="1" />
            <path d="M 1066 432 C 1004 414 960 408 906 398" strokeWidth="1.4" />
            <path d="M 1034 424 C 980 442 942 434 892 422" strokeWidth="0.9" />
            <path d="M 274 394 C 298 384 314 380 336 370" strokeWidth="0.7" />
            <path d="M 906 398 C 884 388 868 382 846 374" strokeWidth="0.7" />
          </g>

          {/* iris */}
          <g className="art-eye-iris" style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }}>
            <circle cx="620" cy="410" r="172" fill="#07142C" opacity="0.24" />
            <circle cx="620" cy="410" r="163" fill="#07152F" />
            <circle cx="620" cy="410" r="157" fill={`url(#${uid}-iris)`} />
            <g className="art-eye-spin">
              <g strokeLinecap="round">
                {Array.from({ length: 150 }).map((_, index) => {
                  const angle = (index / 150) * Math.PI * 2;
                  const inner = 54 + (index % 6) * 2;
                  const outer = 138 + (index % 9) * 2;
                  return (
                    <line
                      key={index}
                      x1={620 + Math.cos(angle) * inner}
                      y1={410 + Math.sin(angle) * inner}
                      x2={620 + Math.cos(angle) * outer}
                      y2={410 + Math.sin(angle) * outer}
                      stroke={index % 8 === 0 ? "#E9DFC9" : index % 5 === 0 ? "#9FB2FF" : "#4F6BFF"}
                      strokeWidth={index % 5 === 0 ? 1.2 : 0.55}
                      opacity={index % 8 === 0 ? 0.3 : index % 3 === 0 ? 0.18 : 0.1}
                    />
                  );
                })}
              </g>
              {Array.from({ length: 18 }).map((_, index) => {
                const angle = (index / 18) * Math.PI * 2 + 0.18;
                const radius = 82 + (index % 4) * 13;
                const cx = 620 + Math.cos(angle) * radius;
                const cy = 410 + Math.sin(angle) * radius;
                return (
                  <ellipse
                    key={`crypt-${index}`}
                    cx={cx}
                    cy={cy}
                    rx={4 + (index % 4) * 2}
                    ry={1.5 + (index % 2)}
                    fill="#061337"
                    opacity={0.2 + (index % 3) * 0.04}
                    transform={`rotate(${(angle * 180) / Math.PI + 90} ${cx} ${cy})`}
                  />
                );
              })}
              <circle cx="620" cy="410" r="72" fill="none" stroke="#B9C6FF" strokeWidth="0.8" strokeDasharray="2 6" opacity="0.45" />
              <circle cx="620" cy="410" r="145" fill="none" stroke="#06122C" strokeWidth="9" opacity="0.55" />
              <circle cx="620" cy="410" r="157" fill="none" stroke="#E4C3B0" strokeWidth="1.2" opacity="0.72" />
            </g>
            <circle cx="620" cy="410" r="56" fill={`url(#${uid}-pupil)`} />
            <circle cx="620" cy="410" r="58" fill="none" stroke="#000000" strokeWidth="2" opacity="0.35" />
            <ellipse cx="592" cy="378" rx="18" ry="13" fill="#FFF9ED" opacity="0.72" transform="rotate(-25 592 378)" />
            <ellipse cx="650" cy="432" rx="5" ry="3.5" fill="#FFF9ED" opacity="0.36" />
            <circle cx="620" cy="410" r="157" fill={`url(#${uid}-cornea)`} />
            <path d="M 490 350 C 512 292 562 252 620 244" fill="none" stroke="#FFF9ED" strokeWidth="14" strokeLinecap="round" opacity="0.12" />
          </g>

          {/* upper lid shadow over the iris */}
          <path d="M 96 424 C 244 274 440 204 620 204 C 800 204 978 286 1104 424 L 1104 306 C 928 238 790 226 620 226 C 450 226 304 250 96 326 Z" fill="#4F3326" opacity="0.22" filter={`url(#${uid}-blur)`} />
          <path d="M 98 426 C 246 576 440 638 620 638 C 798 638 976 576 1104 426" fill="none" stroke="#C98F75" strokeWidth="3" opacity="0.7" />
          <path d="M 96 424 C 112 410 132 412 146 424 C 132 438 110 438 96 424 Z" fill="#B86658" opacity="0.68" />
        </g>

        {/* lashes */}
        <g stroke="#2A1A14" fill="none" strokeLinecap="round">
          <path d="M 188 356 C 170 334 156 314 146 282" strokeWidth="3.2" />
          <path d="M 244 306 C 228 282 218 258 210 226" strokeWidth="3.6" />
          <path d="M 312 266 C 300 240 294 214 288 180" strokeWidth="3.8" />
          <path d="M 384 236 C 376 208 372 182 368 148" strokeWidth="4" />
          <path d="M 458 220 C 452 192 450 166 450 132" strokeWidth="4.2" />
          <path d="M 534 214 C 530 184 532 158 536 124" strokeWidth="4.2" />
          <path d="M 610 214 C 610 184 614 158 620 124" strokeWidth="4.2" />
          <path d="M 686 218 C 690 188 696 162 704 128" strokeWidth="4.2" />
          <path d="M 760 230 C 768 202 778 176 790 144" strokeWidth="4" />
          <path d="M 830 252 C 842 226 854 202 870 172" strokeWidth="3.8" />
          <path d="M 896 280 C 912 256 926 234 944 208" strokeWidth="3.6" />
          <path d="M 954 312 C 972 292 988 272 1006 248" strokeWidth="3.4" />
          <path d="M 1006 350 C 1026 332 1042 314 1060 292" strokeWidth="3" />
          <path d="M 190 526 C 178 548 166 562 152 578" strokeWidth="2" opacity="0.72" />
          <path d="M 250 566 C 242 586 232 600 216 618" strokeWidth="2" opacity="0.7" />
          <path d="M 316 596 C 310 616 302 630 290 646" strokeWidth="2.2" opacity="0.72" />
          <path d="M 390 614 C 386 632 380 646 370 662" strokeWidth="2.2" opacity="0.7" />
          <path d="M 820 614 C 826 632 834 646 846 660" strokeWidth="2.2" opacity="0.7" />
          <path d="M 900 596 C 908 614 916 628 928 644" strokeWidth="2.2" opacity="0.72" />
          <path d="M 968 566 C 978 584 988 598 1002 616" strokeWidth="2" opacity="0.7" />
          <path d="M 1020 526 C 1032 546 1042 560 1056 576" strokeWidth="2" opacity="0.72" />
        </g>

        {/* crease, lower lid and under-eye form */}
        <path d="M 130 356 C 282 218 452 154 620 154 C 790 154 950 216 1090 344" fill="none" stroke="#9B6850" strokeWidth="3" strokeLinecap="round" opacity="0.26" />
        <path d="M 96 424 C 246 574 440 636 620 636 C 798 636 976 574 1104 424" fill="none" stroke="#9A614B" strokeWidth="8" strokeLinecap="round" opacity="0.16" filter={`url(#${uid}-blur)`} />

        <g className="art-eye-blink" clipPath={`url(#${uid}-opening)`}>
          <path d="M 0 0 H 1200 V 424 C 1000 320 800 286 620 286 C 440 286 240 320 0 424 Z" fill={`url(#${uid}-skin)`} />
          <path d="M 96 424 C 244 274 440 204 620 204 C 800 204 978 286 1104 424" fill="none" stroke="#2A1A14" strokeWidth="7" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
