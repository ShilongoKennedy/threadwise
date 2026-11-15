export function HeroSpaceship() {
  return (
    <svg viewBox="0 0 1000 360" className="h-auto w-full overflow-visible" role="presentation">
      <defs>
        <pattern id="ship-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.25" fill="#FFFFFF" />
        </pattern>
        <pattern id="ship-dots-soft" width="9" height="9" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="0.9" fill="#DCEBFF" fillOpacity="0.72" />
        </pattern>
        <radialGradient id="engine-core">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor="#DCEBFF" />
          <stop offset="0.7" stopColor="#7DD3FC" stopOpacity="0.8" />
          <stop offset="1" stopColor="#7DD3FC" stopOpacity="0" />
        </radialGradient>
        <filter id="engine-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <g transform="rotate(-5 510 190)">
        {/* Dotted exhaust wakes */}
        <g fill="none" stroke="#DCEBFF" strokeLinecap="round">
          <path d="M108 197 C58 191 22 201 4 218" strokeOpacity="0.5" strokeWidth="1.3" strokeDasharray="1.5 9" />
          <path d="M104 167 C56 160 24 169 8 184" strokeOpacity="0.32" strokeWidth="1.1" strokeDasharray="1.5 11" />
        </g>
        <ellipse cx="158" cy="188" rx="40" ry="14" fill="#7DD3FC" opacity="0.07" filter="url(#engine-glow)" />

        {/* Lower wing */}
        <path
          d="M322 209 L430 286 C472 304 540 292 616 258 L700 214 L486 224 Z"
          fill="url(#ship-dots-soft)"
          stroke="#DCEBFF"
          strokeOpacity="0.72"
          strokeWidth="1.15"
        />
        <path d="M420 232 L470 279 L560 269 L622 241" fill="none" stroke="#DCEBFF" strokeOpacity="0.35" strokeWidth="0.9" />

        {/* Upper fin */}
        <path
          d="M365 153 L478 56 C505 38 548 45 583 62 L688 120 L512 145 Z"
          fill="url(#ship-dots-soft)"
          stroke="#DCEBFF"
          strokeOpacity="0.8"
          strokeWidth="1.15"
        />
        <path d="M468 84 L522 72 L604 108 L514 124 Z" fill="url(#ship-dots-soft)" stroke="#7DD3FC" strokeOpacity="0.45" />

        {/* Main hull */}
        <path
          d="M156 186 L306 146 L676 118 L900 174 L712 226 L412 246 L244 226 Z"
          fill="url(#ship-dots)"
          stroke="#FFFFFF"
          strokeOpacity="0.82"
          strokeWidth="1.3"
        />
        <path d="M306 146 L676 118 L738 142 L430 178 Z" fill="url(#ship-dots-soft)" opacity="0.7" />
        <path d="M244 226 L412 246 L680 216 L712 226 L412 246 Z" fill="url(#ship-dots-soft)" opacity="0.58" />

        {/* Hull panel lines */}
        <g fill="none" stroke="#DCEBFF" strokeOpacity="0.42" strokeWidth="0.9">
          <path d="M356 163 L652 142" />
          <path d="M382 197 L704 177" />
          <path d="M320 210 L652 193" />
          <path d="M446 154 L438 229" />
          <path d="M590 136 L570 213" />
        </g>

        {/* Canopy / bridge */}
        <path d="M690 142 L812 158 L770 185 L664 169 Z" fill="#7DD3FC" fillOpacity="0.09" stroke="#EAF4FF" strokeOpacity="0.86" strokeWidth="1.25" />
        <path d="M700 148 L770 158 L750 170 L682 160 Z" fill="none" stroke="#DCEBFF" strokeOpacity="0.42" strokeWidth="0.9" />

        {/* Engine housings */}
        <g>
          <path d="M158 169 L248 163 L252 184 L166 194 Z" fill="url(#ship-dots)" stroke="#DCEBFF" strokeOpacity="0.7" strokeWidth="1" />
          <path d="M158 198 L248 190 L252 211 L166 218 Z" fill="url(#ship-dots)" stroke="#DCEBFF" strokeOpacity="0.62" strokeWidth="1" />
          <ellipse cx="158" cy="181" rx="12" ry="7" fill="url(#engine-core)" />
          <ellipse cx="158" cy="205" rx="10" ry="6" fill="url(#engine-core)" opacity="0.82" />
          <ellipse cx="154" cy="180" rx="5" ry="3" fill="#FFFFFF" opacity="0.9" />
          <ellipse cx="154" cy="205" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.76" />
        </g>

        {/* Running lights */}
        <circle cx="704" cy="119" r="2" fill="#EAF4FF" />
        <circle cx="435" cy="286" r="1.8" fill="#7DD3FC" />
        <circle cx="366" cy="56" r="1.6" fill="#B9D7FF" opacity="0.8" />
      </g>
    </svg>
  );
}
