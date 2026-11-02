import { PROJ_H, PROJ_W, WORLD_PATH } from "./world";

export type Pinned = {
  id: string;
  x: number;
  y: number;
  name: string;
  label: string;
  active: boolean;
  past: boolean;
};

/**
 * The wall behind the line: real coastlines, one pin per story, and a rope from
 * each to the next — the same cord the canvas uses, laid on a map instead.
 * The map only ever pans to the focused pin; it never redraws.
 */
export function WorldMap({ pins }: { pins: Pinned[] }) {
  const focus = pins.find((pin) => pin.active) ?? pins[0];
  const zoom = 2.1;
  const cx = focus?.x ?? PROJ_W / 2;
  const cy = focus?.y ?? PROJ_H / 2;
  const tx = PROJ_W * 0.62 - cx * zoom;
  const ty = PROJ_H * 0.44 - cy * zoom;

  return (
    <svg
      viewBox={`0 0 ${PROJ_W} ${PROJ_H}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="map-fade" cx="62%" cy="44%" r="72%">
          <stop offset="0%" stopColor="#f4f1ea" stopOpacity="0.15" />
          <stop offset="60%" stopColor="#f4f1ea" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f4f1ea" stopOpacity="0.95" />
        </radialGradient>
      </defs>

      <g
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transition: "transform 900ms cubic-bezier(.22,.8,.24,1)",
        }}
      >
        <path d={WORLD_PATH} fill="#1A1A1A" fillOpacity="0.09" stroke="none" />
        <path d={WORLD_PATH} fill="none" stroke="#1A1A1A" strokeOpacity="0.22" strokeWidth="0.7" />

        {/* the thread: each pin tied to the one before it */}
        {pins.map((pin, index) => {
          const next = pins[index + 1];
          if (!next) return null;
          const mx = (pin.x + next.x) / 2;
          const my = (pin.y + next.y) / 2 - Math.hypot(next.x - pin.x, next.y - pin.y) * 0.22;
          return (
            <path
              key={`rope-${pin.id}`}
              d={`M${pin.x} ${pin.y} Q${mx} ${my} ${next.x} ${next.y}`}
              fill="none"
              stroke="#1A4BFF"
              strokeWidth="1.4"
              strokeOpacity={pin.past ? 0.5 : 0.22}
              strokeDasharray={pin.past ? undefined : "4 4"}
            />
          );
        })}

        {pins.map((pin) => (
          <g key={pin.id} transform={`translate(${pin.x} ${pin.y})`}>
            {pin.active && (
              <>
                <circle r="16" fill="#1A4BFF" opacity="0.12" />
                <circle r="9" fill="none" stroke="#1A4BFF" strokeWidth="1" opacity="0.5" />
              </>
            )}
            <circle
              r={pin.active ? 3.4 : 2.2}
              fill={pin.active ? "#1A4BFF" : "#1A1A1A"}
              fillOpacity={pin.active ? 1 : 0.55}
            />
            {pin.active && (
              <text
                y="-14"
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                letterSpacing="1.6"
                fill="#1A1A1A"
                fillOpacity="0.72"
              >
                {pin.name.toUpperCase()}
              </text>
            )}
          </g>
        ))}
      </g>

      <rect width={PROJ_W} height={PROJ_H} fill="url(#map-fade)" />
    </svg>
  );
}
