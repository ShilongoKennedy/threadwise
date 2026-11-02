import { PROJ_H, PROJ_W, WORLD_PATH } from "./world";

export type Pinned = {
  id: string;
  x: number;
  y: number;
  name: string;
  label: string;
  active: boolean;
  past: boolean;
  index: number;
};

/**
 * The wall behind the line: real coastlines, one pin per story, and a rope from
 * each to the next — the same cord the canvas uses, laid on a map instead.
 * The map only ever pans to the focused pin; it never redraws.
 */
export function WorldMap({ pins, onPick }: { pins: Pinned[]; onPick?: (index: number) => void }) {
  const focus = pins.find((pin) => pin.active) ?? pins[0];
  const zoom = 1.45;
  const cx = focus?.x ?? PROJ_W / 2;
  const cy = focus?.y ?? PROJ_H / 2;
  const tx = PROJ_W * 0.62 - cx * zoom;
  const ty = PROJ_H * 0.44 - cy * zoom;

  return (
    <svg
      viewBox={`0 0 ${PROJ_W} ${PROJ_H}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="map-fade" cx="58%" cy="46%" r="80%">
          <stop offset="0%" stopColor="#f4f1ea" stopOpacity="0" />
          <stop offset="72%" stopColor="#f4f1ea" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f4f1ea" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      <g opacity="0.5">
        {Array.from({ length: 11 }, (_, i) => 200 + i * 200).map((x) => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={PROJ_H} stroke="#1A1A1A" strokeOpacity="0.07" strokeWidth="1" />
        ))}
        {Array.from({ length: 5 }, (_, i) => 200 + i * 200).map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={PROJ_W} y2={y} stroke="#1A1A1A" strokeOpacity="0.07" strokeWidth="1" />
        ))}
      </g>

      <g
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transition: "transform 900ms cubic-bezier(.22,.8,.24,1)",
        }}
      >
        <path d={WORLD_PATH} fill="#3B3830" fillOpacity="0.16" stroke="none" />
        <path d={WORLD_PATH} fill="none" stroke="#1A1A1A" strokeOpacity="0.3" strokeWidth="0.6" />

        {/* the thread: each pin tied to the one before it */}
        {pins.map((pin, index) => {
          const next = pins[index + 1];
          if (!next) return null;
          const mx = (pin.x + next.x) / 2;
          const my = (pin.y + next.y) / 2 - Math.hypot(next.x - pin.x, next.y - pin.y) * 0.22;
          const lead = next.active;
          return (
            <g key={`rope-${pin.id}`}>
              <path
                d={`M${pin.x} ${pin.y} Q${mx} ${my} ${next.x} ${next.y}`}
                fill="none"
                stroke={lead ? "#1A4BFF" : "#1A1A1A"}
                strokeWidth={lead ? 1.6 : 1}
                strokeOpacity={lead ? 0.85 : 0.28}
                strokeDasharray={pin.past ? undefined : "3 4"}
                strokeLinecap="round"
              />
              <circle cx={pin.x} cy={pin.y} r={lead ? 2.2 : 1.5} fill={lead ? "#1A4BFF" : "#1A1A1A"} fillOpacity={lead ? 1 : 0.4} />
            </g>
          );
        })}

        {pins.map((pin) => (
          <g
            key={pin.id}
            transform={`translate(${pin.x} ${pin.y})`}
            style={{ cursor: onPick ? "pointer" : "default", pointerEvents: onPick ? "auto" : "none" }}
            onClick={() => onPick?.(pin.index)}
          >
            <circle r="18" fill="transparent" />
            {pin.active && (
              <>
                <circle r="16" fill="#1A4BFF" opacity="0.12" />
                <circle r="9" fill="none" stroke="#1A4BFF" strokeWidth="1" opacity="0.5" />
              </>
            )}
            <circle
              r={pin.active ? 5.5 : 2.6}
              fill="none"
              stroke="#1A1A1A"
              strokeOpacity={pin.active ? 0.9 : 0.35}
              strokeWidth="1"
            />
            <circle
              r={pin.active ? 2.6 : 1.6}
              fill={pin.active ? "#1A4BFF" : "#1A1A1A"}
              fillOpacity={pin.active ? 1 : 0.75}
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

      {(
        [
          [24, 24, 1, 1],
          [PROJ_W - 24, 24, -1, 1],
          [24, PROJ_H - 24, 1, -1],
          [PROJ_W - 24, PROJ_H - 24, -1, -1],
        ] as const
      ).map(([x, y, dx, dy], i) => (
        <g key={i} stroke="#1A1A1A" strokeOpacity="0.35" strokeWidth="1.5">
          <line x1={x} y1={y} x2={x + 20 * dx} y2={y} />
          <line x1={x} y1={y} x2={x} y2={y + 20 * dy} />
        </g>
      ))}
    </svg>
  );
}
