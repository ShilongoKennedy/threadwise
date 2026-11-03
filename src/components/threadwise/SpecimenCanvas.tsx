import { useEffect, useRef, useState } from "react";
import { TYPE_INFO, type ThreadNodeType } from "@/lib/threadwise/model";

/**
 * The landing's plate is the product's own canvas, not a drawing of it:
 * real `.tw-card`, real spines, real `.tw-tag` labels, real cords.
 */

const STAGE_W = 1060;
const STAGE_H = 470;

type Spec = {
  id: string;
  x: number;
  y: number;
  kind: ThreadNodeType;
  epistemic: "fact" | "evidence" | "assumption" | "hypothesis" | "unknown";
  title: string;
  body: string;
  lift: 0 | 1;
};

const CARDS: Spec[] = [
  {
    id: "a",
    x: 44,
    y: 44,
    kind: "note",
    epistemic: "evidence",
    title: "“I said, you have three armies within 400 miles.”",
    body: "Reuters brief · US Treasury, Nov 2026",
    lift: 0,
  },
  {
    id: "b",
    x: 366,
    y: 24,
    kind: "note",
    epistemic: "evidence",
    title: "Gold defended by the Atlantic, the Pacific, the US military.",
    body: "Three assurances in one breath.",
    lift: 0,
  },
  {
    id: "c",
    x: 700,
    y: 64,
    kind: "idea",
    epistemic: "hypothesis",
    title: "The reassurance is the threat.",
    body: "Protection named as leverage: what could be taken if the gold moves.",
    lift: 1,
  },
  {
    id: "d",
    x: 300,
    y: 300,
    kind: "question",
    epistemic: "unknown",
    title: "Who is the threat, exactly?",
    body: "Never stated in the source.",
    lift: 0,
  },
];

const CORDS: { from: string; to: string; label: string; tone: "ink" | "cobalt" | "red" }[] = [
  { from: "a", to: "b", label: "supports", tone: "ink" },
  { from: "b", to: "c", label: "leads to", tone: "cobalt" },
  { from: "a", to: "d", label: "needs evidence from", tone: "red" },
];

const CARD_W = 286;

export function SpecimenCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const node = wrap.current;
    if (!node) return;
    const measure = () => setScale(Math.min(1, (node.clientWidth || STAGE_W) / STAGE_W));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const byId = new Map(CARDS.map((card) => [card.id, card]));

  return (
    <div ref={wrap} className="relative w-full" style={{ height: STAGE_H * scale }}>
      <div
        className="tw-canvas-specimen absolute left-0 top-0 origin-top-left"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `scale(${scale})`,
          background: "var(--background)",
        }}
      >
        <svg width={STAGE_W} height={STAGE_H} className="absolute inset-0" aria-hidden>
          <defs>
            <pattern id="spec-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M28 0H0V28" fill="none" stroke="#1A1A1A" strokeOpacity="0.07" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={STAGE_W} height={STAGE_H} fill="url(#spec-grid)" />

          {CORDS.map((cord) => {
            const a = byId.get(cord.from)!;
            const b = byId.get(cord.to)!;
            const ax = a.x + CARD_W;
            const ay = a.y + 96;
            const bx = b.x;
            const by = b.y + 96;
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2 + 44;
            const stroke = cord.tone === "red" ? "#C1121F" : cord.tone === "cobalt" ? "#1A4BFF" : "#1A1A1A";
            return (
              <g key={`${cord.from}-${cord.to}`}>
                <path
                  d={`M${ax} ${ay} Q${mx} ${my} ${bx} ${by}`}
                  fill="none"
                  stroke={stroke}
                  strokeOpacity={cord.tone === "ink" ? 0.45 : 0.85}
                  strokeWidth={cord.tone === "ink" ? 1.3 : 1.7}
                  strokeDasharray={cord.tone === "red" ? "5 4" : undefined}
                />
                <circle cx={ax} cy={ay} r="3.2" fill="var(--card)" stroke={stroke} strokeWidth="1.4" />
                <circle cx={bx} cy={by} r="3.2" fill="var(--card)" stroke={stroke} strokeWidth="1.4" />
              </g>
            );
          })}
        </svg>

        {CORDS.map((cord, index) => {
          const a = byId.get(cord.from)!;
          const b = byId.get(cord.to)!;
          const ax = a.x + CARD_W;
          const ay = a.y + 96;
          const bx = b.x;
          const by = b.y + 96;
          const tilt = [-2, 1.5, -3][index] ?? 0;
          return (
            <span
              key={`tag-${cord.from}-${cord.to}`}
              className="tw-tag absolute"
              style={{
                left: (ax + bx) / 2 - 58,
                top: (ay + by) / 2 + 20,
                transform: `rotate(${tilt}deg)`,
                pointerEvents: "none",
              }}
            >
              <span className="tw-tag-hole" aria-hidden />
              <span>{cord.label}</span>
            </span>
          );
        })}

        {CARDS.map((card) => {
          const active = selected === card.id;
          const dim = selected !== null && !active;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelected(active ? null : card.id)}
              className={`tw-card absolute text-left ${active ? "is-selected" : ""}`}
              data-kind={card.kind}
              data-lift={card.lift}
              aria-pressed={active}
              style={{
                left: card.x,
                top: card.y,
                width: CARD_W,
                opacity: dim ? 0.45 : 1,
                transition: "opacity .2s",
                ["--lift" as string]: card.lift,
                ["--z" as string]: 1,
                ["--full" as string]: 1,
                ["--label" as string]: 1,
                ["--unfold" as string]: 1,
                ["--lx" as string]: 0,
                ["--ly" as string]: 0,
              }}
            >
              <div className="tw-full px-4 pb-3.5 pt-3">
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
                  <span className="flex items-center gap-1.5 text-[#1A1A1A]">
                    {TYPE_INFO[card.kind].label}
                  </span>
                  <span className="text-muted-foreground">{card.epistemic}</span>
                </div>
                <div className="font-display text-[16px] leading-[1.25]">{card.title}</div>
                <p className="tw-body mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
