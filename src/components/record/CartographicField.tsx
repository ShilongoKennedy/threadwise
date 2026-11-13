import { useId } from "react";

const SITES = [
  { id: "vienna", no: "01", name: "VIENNA / IAEA", coords: "48.2N 16.4E", x: 548, y: 250 },
  { id: "tehran", no: "02", name: "TEHRAN", coords: "35.7N 51.4E", x: 672, y: 334 },
  { id: "natanz", no: "03", name: "NATANZ", coords: "33.7N 51.7E", x: 720, y: 408 },
];

export function CartographicField({ active = null, mobile = false }: { active?: string | null; mobile?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const verticals = Array.from({ length: 31 }, (_, i) => i * 40);
  const horizontals = Array.from({ length: 19 }, (_, i) => i * 40);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio={mobile ? "xMidYMid slice" : "xMidYMid slice"}
        className="h-full w-full"
      >
        <defs>
          <linearGradient id={`${uid}-field-fade`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FDFBF7" stopOpacity="0.96" />
            <stop offset="0.35" stopColor="#FDFBF7" stopOpacity="0.72" />
            <stop offset="0.52" stopColor="#FDFBF7" stopOpacity="0.28" />
            <stop offset="0.64" stopColor="#FDFBF7" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${uid}-field-glow`} cx="78%" cy="43%" r="36%">
            <stop offset="0%" stopColor="#1A4BFF" stopOpacity="0.055" />
            <stop offset="100%" stopColor="#1A4BFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1200" height="720" fill="#FDFBF7" />
        <rect width="1200" height="720" fill={`url(#${uid}-field-glow)`} />

        <g stroke="#1A1A1A" strokeWidth="0.55" opacity="0.16">
          {verticals.map((x) => <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="720" />)}
          {horizontals.map((y) => <line key={`h-${y}`} x1="0" y1={y} x2="1200" y2={y} />)}
        </g>
        <g stroke="#1A4BFF" strokeWidth="0.8" opacity="0.2">
          {[200, 400, 600, 800, 1000].map((x) => <line key={`vm-${x}`} x1={x} y1="0" x2={x} y2="720" />)}
          {[160, 320, 480, 640].map((y) => <line key={`hm-${y}`} x1="0" y1={y} x2="1200" y2={y} />)}
        </g>

        <g fontFamily="'IBM Plex Mono', monospace" fontSize="10" letterSpacing="1.3" fill="#1A1A1A" opacity="0.34">
          {[16.4, 35.0, 51.4, 62.8].map((value, index) => (
            <text key={`lon-${value}`} x={520 + index * 160} y="700">{value.toFixed(1)}E</text>
          ))}
          {[48.2, 39.5, 33.7, 28.0].map((value, index) => (
            <text key={`lat-${value}`} x="1132" y={170 + index * 132}>{value.toFixed(1)}N</text>
          ))}
        </g>

        <circle cx="920" cy="330" r="300" fill="none" stroke="#1A1A1A" strokeWidth="0.7" opacity="0.18" strokeDasharray="1 9" />
        <circle cx="920" cy="330" r="218" fill="none" stroke="#1A4BFF" strokeWidth="0.7" opacity="0.2" strokeDasharray="1 7" />
        <g stroke="#1A4BFF" strokeWidth="0.8" opacity="0.3">
          {Array.from({ length: 12 }).map((_, index) => {
            const a = (index / 12) * Math.PI * 2;
            return (
              <line
                key={`tick-${index}`}
                x1={920 + Math.cos(a) * 292}
                y1={330 + Math.sin(a) * 292}
                x2={920 + Math.cos(a) * 306}
                y2={330 + Math.sin(a) * 306}
              />
            );
          })}
        </g>
        <path d="M 896 330 H 944 M 920 306 V 354" stroke="#1A1A1A" strokeWidth="0.8" opacity="0.22" />

        <path
          d="M 548 250 C 598 220, 638 264, 672 334 C 690 366, 706 388, 720 408"
          fill="none"
          stroke="#1A4BFF"
          strokeWidth="1.55"
          strokeDasharray="5 5"
          opacity={active ? 0.95 : 0.7}
        />
        <path
          d="M 672 334 C 690 366, 706 388, 720 408"
          fill="none"
          stroke="#C1121F"
          strokeWidth="1.55"
          opacity={active === "natanz" || active === "tehran" ? 1 : 0.72}
        />

        {SITES.map((site) => {
          const isActive = active === site.id;
          const red = site.id === "natanz";
          return (
            <g key={site.id}>
              <g stroke={red ? "#C1121F" : "#1A4BFF"} strokeWidth="0.7" opacity={isActive ? 0.6 : 0.24}>
                <line x1={site.x - 26} y1={site.y} x2={site.x + 26} y2={site.y} />
                <line x1={site.x} y1={site.y - 26} x2={site.x} y2={site.y + 26} />
              </g>
              <circle cx={site.x} cy={site.y} r={isActive ? 6 : 4.5} fill={red ? "#C1121F" : "#1A4BFF"} opacity={isActive ? 1 : 0.7} />
              <circle cx={site.x} cy={site.y} r="13" fill="none" stroke={red ? "#C1121F" : "#1A4BFF"} strokeWidth="0.7" opacity={isActive ? 0.6 : 0.2} />
              <text
                x={site.x + 18}
                y={site.y + 4}
                fontFamily="'IBM Plex Mono', monospace"
                fontSize="9"
                letterSpacing="1.1"
                fill={red ? "#C1121F" : "#1A4BFF"}
                opacity={isActive ? 0.95 : 0.55}
              >
                {site.no}
              </text>
            </g>
          );
        })}

        <rect width="1200" height="720" fill={`url(#${uid}-field-fade)`} />
      </svg>
    </div>
  );
}
