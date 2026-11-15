export function HeroSpaceship() {
  return (
    <svg viewBox="0 0 1000 360" className="h-auto w-full overflow-visible" role="presentation">
      <defs>
        <linearGradient id="ship-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#242044" />
          <stop offset="0.5" stopColor="#100D20" />
          <stop offset="1" stopColor="#070611" />
        </linearGradient>
        <linearGradient id="ship-upper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#302A5A" />
          <stop offset="1" stopColor="#100D20" />
        </linearGradient>
        <linearGradient id="ship-canopy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EAF4FF" stopOpacity="0.92" />
          <stop offset="0.38" stopColor="#7DD3FC" stopOpacity="0.85" />
          <stop offset="1" stopColor="#3B5BFF" stopOpacity="0.56" />
        </linearGradient>
        <linearGradient id="engine-trail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7DD3FC" stopOpacity="0" />
          <stop offset="0.58" stopColor="#B9D7FF" stopOpacity="0.16" />
          <stop offset="0.92" stopColor="#EAF4FF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="engine-core">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor="#DCEBFF" />
          <stop offset="0.7" stopColor="#7DD3FC" stopOpacity="0.8" />
          <stop offset="1" stopColor="#7DD3FC" stopOpacity="0" />
        </radialGradient>
        <filter id="engine-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="ship-glow" x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <g transform="rotate(-5 510 190)">
        {/* Exhaust wakes */}
        <path d="M108 197 C58 191 22 201 4 218 C58 212 94 215 142 224 Z" fill="url(#engine-trail)" />
        <path d="M104 167 C56 160 24 169 8 184 C58 181 92 185 138 194 Z" fill="url(#engine-trail)" opacity="0.58" />
        <ellipse cx="158" cy="188" rx="42" ry="15" fill="#7DD3FC" opacity="0.1" filter="url(#engine-glow)" />

        {/* Lower wing */}
        <path
          d="M322 209 L430 286 C472 304 540 292 616 258 L700 214 L486 224 Z"
          fill="url(#ship-upper)"
          stroke="#B9D7FF"
          strokeOpacity="0.32"
          strokeWidth="1.2"
        />
        <path d="M420 232 L470 279 L560 269 L622 241" fill="none" stroke="#7DD3FC" strokeOpacity="0.26" strokeWidth="1" />

        {/* Upper fin */}
        <path
          d="M365 153 L478 56 C505 38 548 45 583 62 L688 120 L512 145 Z"
          fill="url(#ship-upper)"
          stroke="#B9D7FF"
          strokeOpacity="0.34"
          strokeWidth="1.2"
        />
        <path d="M468 84 L522 72 L604 108 L514 124 Z" fill="#0B0918" stroke="#7DD3FC" strokeOpacity="0.28" />

        {/* Main hull */}
        <path
          d="M156 186 L306 146 L676 118 L900 174 L712 226 L412 246 L244 226 Z"
          fill="url(#ship-hull)"
          stroke="#DCEBFF"
          strokeOpacity="0.55"
          strokeWidth="1.4"
        />
        <path d="M306 146 L676 118 L738 142 L430 178 Z" fill="url(#ship-upper)" opacity="0.92" />
        <path d="M244 226 L412 246 L680 216 L712 226 L412 246 Z" fill="#05040C" opacity="0.7" />

        {/* Hull panel lines */}
        <g fill="none" stroke="#B9D7FF" strokeOpacity="0.28" strokeWidth="1">
          <path d="M356 163 L652 142" />
          <path d="M382 197 L704 177" />
          <path d="M320 210 L652 193" />
          <path d="M446 154 L438 229" />
          <path d="M590 136 L570 213" />
        </g>

        {/* Canopy / bridge */}
        <path d="M690 142 L812 158 L770 185 L664 169 Z" fill="url(#ship-canopy)" stroke="#EAF4FF" strokeOpacity="0.62" />
        <path d="M700 148 L770 158 L750 170 L682 160 Z" fill="#EAF4FF" opacity="0.22" />

        {/* Engine housings */}
        <g>
          <path d="M158 169 L248 163 L252 184 L166 194 Z" fill="#18142E" stroke="#B9D7FF" strokeOpacity="0.34" />
          <path d="M158 198 L248 190 L252 211 L166 218 Z" fill="#18142E" stroke="#B9D7FF" strokeOpacity="0.3" />
          <ellipse cx="158" cy="181" rx="13" ry="8" fill="url(#engine-core)" />
          <ellipse cx="158" cy="205" rx="11" ry="7" fill="url(#engine-core)" opacity="0.82" />
          <ellipse cx="154" cy="180" rx="6" ry="3.5" fill="#FFFFFF" opacity="0.92" />
          <ellipse cx="154" cy="205" rx="5" ry="3" fill="#FFFFFF" opacity="0.78" />
        </g>

        {/* Running lights */}
        <circle cx="704" cy="119" r="2.2" fill="#EAF4FF" />
        <circle cx="435" cy="286" r="2" fill="#7DD3FC" />
        <circle cx="366" cy="56" r="1.8" fill="#B9D7FF" opacity="0.8" />
        <path d="M700 119 L716 114" stroke="#EAF4FF" strokeOpacity="0.45" />
      </g>
    </svg>
  );
}
