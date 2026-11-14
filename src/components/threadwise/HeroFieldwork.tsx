/**
 * The quiet apparatus around the hero globe: survey rings, route line,
 * coordinate ticks and a small route index. No photography.
 */
export function HeroFieldwork() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden md:block">
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="survey-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1A4BFF" stopOpacity="0" />
              <stop offset="0.35" stopColor="#1A4BFF" stopOpacity="0.2" />
              <stop offset="0.7" stopColor="#1A4BFF" stopOpacity="0.13" />
              <stop offset="1" stopColor="#1A4BFF" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="survey-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7" />
              <stop offset="0.7" stopColor="#D9E4E6" stopOpacity="0.12" />
              <stop offset="1" stopColor="#D9E4E6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* The globe sits inside this survey plate. */}
          <circle cx="1120" cy="420" r="392" fill="url(#survey-glow)" opacity="0.45" />
          <circle cx="1120" cy="420" r="344" fill="none" stroke="#1A4BFF" strokeOpacity="0.1" />
          <circle cx="1120" cy="420" r="386" fill="none" stroke="#1A4BFF" strokeOpacity="0.13" strokeDasharray="2 14" />
          <circle cx="1120" cy="420" r="428" fill="none" stroke="#9C8D79" strokeOpacity="0.1" strokeDasharray="1 22" />
          <path d="M1120 18 V822 M718 420 H1522" stroke="#1A4BFF" strokeOpacity="0.07" strokeWidth="1" />

          {/* Survey ticks. */}
          <g stroke="#1A4BFF" strokeOpacity="0.2">
            {Array.from({ length: 19 }, (_, i) => {
              const angle = (i / 18) * Math.PI * 2;
              const x1 = 1120 + Math.cos(angle) * 404;
              const y1 = 420 + Math.sin(angle) * 404;
              const x2 = 1120 + Math.cos(angle) * 426;
              const y2 = 420 + Math.sin(angle) * 426;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>

          {/* Route line entering from the field note. */}
          <path
            d="M568 300 C706 246 858 256 1002 316 S1168 382 1206 418"
            fill="none"
            stroke="url(#survey-fade)"
            strokeWidth="1.4"
            strokeDasharray="3 8"
          />
          <circle cx="568" cy="300" r="3.5" fill="#1A4BFF" fillOpacity="0.55" />
          <circle cx="1002" cy="316" r="3" fill="#1A4BFF" fillOpacity="0.4" />

          {/* Registration marks. */}
          <g stroke="#1A4BFF" strokeOpacity="0.16">
            <path d="M84 84 h18 M93 75 v18" />
            <path d="M1350 84 h-18 M1341 75 v18" />
            <path d="M84 816 h18 M93 807 v18" />
            <path d="M1350 816 h-18 M1341 807 v18" />
          </g>
        </svg>
      </div>

      {/* Quiet marginalia, desktop only. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[7%] z-20 hidden items-end justify-between gap-8 px-8 md:flex">
        <div className="flex items-end gap-6">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]/70">The route</p>
            <div className="mt-2 flex items-center gap-3 font-mono text-[8px] uppercase tracking-[0.12em] text-[#1A1A1A]/45">
              <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#1A4BFF]" />01 Vienna</span>
              <span className="text-[#1A1A1A]/25">→</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#1A4BFF]" />02 Tehran</span>
              <span className="text-[#1A1A1A]/25">→</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-[#C1121F]" />03 Natanz</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#1A1A1A]/12" />
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#1A4BFF]/70">Open question</p>
            <p className="mt-2 max-w-[34ch] font-serif text-[12px] leading-snug text-[#1A1A1A]/48">
              Does a confidential report count as a finding at all?
            </p>
          </div>
        </div>
        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#1A1A1A]/30">09 Nov 2026 / Field note 001</p>
      </div>

    </>
  );
}
