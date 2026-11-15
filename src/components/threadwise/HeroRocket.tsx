export function HeroRocket() {
  return (
    <svg viewBox="0 0 160 560" className="h-auto w-full overflow-visible" role="presentation">
      <defs>
        <pattern id="rocket-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.25" fill="#FFFFFF" />
        </pattern>
        <pattern id="rocket-dots-dense" width="4.5" height="4.5" patternUnits="userSpaceOnUse">
          <circle cx="2.25" cy="2.25" r="1.15" fill="#DCEBFF" />
        </pattern>
        <pattern id="rocket-dots-soft" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="0.9" fill="#DCEBFF" fillOpacity="0.75" />
        </pattern>
        <linearGradient id="rocket-plume" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.28" stopColor="#DCEBFF" stopOpacity="0.78" />
          <stop offset="0.7" stopColor="#7DD3FC" stopOpacity="0.34" />
          <stop offset="1" stopColor="#7DD3FC" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="rocket-core">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#DCEBFF" />
          <stop offset="1" stopColor="#7DD3FC" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g>
        {/* Exhaust */}
        <path d="M67 456 C58 486 48 512 44 548 C66 524 78 506 80 486 C82 506 94 524 116 548 C112 512 102 486 93 456 Z" fill="url(#rocket-plume)" />
        <ellipse cx="80" cy="456" rx="22" ry="8" fill="url(#rocket-core)" opacity="0.9" />

        {/* Folded landing legs */}
        <path d="M55 410 L35 458 L45 461 L62 425" fill="url(#rocket-dots)" stroke="#DCEBFF" strokeOpacity="0.72" strokeWidth="1.1" />
        <path d="M105 410 L125 458 L115 461 L98 425" fill="url(#rocket-dots)" stroke="#DCEBFF" strokeOpacity="0.72" strokeWidth="1.1" />

        {/* Engine bay / octaweb */}
        <path d="M52 432 L108 432 L103 452 L57 452 Z" fill="url(#rocket-dots-dense)" stroke="#DCEBFF" strokeOpacity="0.75" strokeWidth="1.1" />
        <path d="M61 452 L63 466 L70 452 M75 452 L78 468 L84 452 M90 452 L96 466 L98 452" fill="url(#rocket-dots)" stroke="#EAF4FF" strokeOpacity="0.65" strokeWidth="0.9" />

        {/* Main body */}
        <path
          d="M51 112 C51 92 61 63 80 20 C99 63 109 92 109 112 L109 432 L51 432 Z"
          fill="url(#rocket-dots)"
          stroke="#EAF4FF"
          strokeOpacity="0.86"
          strokeWidth="1.3"
        />

        {/* Stage separation / interstage */}
        <path d="M51 160 L109 160 L109 192 L51 192 Z" fill="url(#rocket-dots-dense)" stroke="#DCEBFF" strokeOpacity="0.78" strokeWidth="1.1" />
        <path d="M51 196 L109 196" stroke="#DCEBFF" strokeOpacity="0.42" strokeWidth="0.9" />

        {/* Longitudinal panel lines */}
        <g fill="none" stroke="#DCEBFF" strokeOpacity="0.38" strokeWidth="0.8">
          <path d="M66 128 L66 422" />
          <path d="M80 112 L80 428" />
          <path d="M94 128 L94 422" />
        </g>

        {/* Grid fins */}
        <path d="M50 145 L31 132 L26 158 L50 170 Z" fill="url(#rocket-dots-soft)" stroke="#EAF4FF" strokeOpacity="0.75" strokeWidth="1" />
        <path d="M110 145 L129 132 L134 158 L110 170 Z" fill="url(#rocket-dots-soft)" stroke="#EAF4FF" strokeOpacity="0.75" strokeWidth="1" />
        <g fill="none" stroke="#DCEBFF" strokeOpacity="0.5" strokeWidth="0.7">
          <path d="M41 138 L38 160 M46 141 L43 164" />
          <path d="M119 138 L122 160 M114 141 L117 164" />
        </g>

        {/* Nose cone seams */}
        <g fill="none" stroke="#DCEBFF" strokeOpacity="0.4" strokeWidth="0.8">
          <path d="M67 82 L93 82" />
          <path d="M60 101 L100 101" />
        </g>

        {/* Running lights */}
        <circle cx="80" cy="45" r="1.7" fill="#EAF4FF" />
        <circle cx="55" cy="220" r="1.4" fill="#7DD3FC" />
        <circle cx="105" cy="300" r="1.3" fill="#B9D7FF" opacity="0.8" />
      </g>
    </svg>
  );
}
