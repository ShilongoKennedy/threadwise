const INK = "#1A1A1A";
const COBALT = "#1A4BFF";
const RED = "#C1121F";
const PAPER = "#FDFBF7";

type Card = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: string;
  status: string;
  title: string[];
  body?: string;
  rule: "solid" | "dash" | "dot";
  ruleWidth: number;
  tone?: "ink" | "red";
};

/** Four legible cards with real air between them — a specimen, not a screenshot. */
const CARDS: Card[] = [
  {
    id: "claim",
    x: 30,
    y: 40,
    w: 260,
    h: 140,
    kind: "evidence",
    status: "evidence",
    title: ["“I said, you have", "three armies within", "400 miles.”"],
    body: "Reuters brief · US Treasury",
    rule: "dash",
    ruleWidth: 3,
  },
  {
    id: "support",
    x: 430,
    y: 40,
    w: 280,
    h: 140,
    kind: "note",
    status: "evidence",
    title: ["Gold defended by the", "Atlantic, the Pacific,", "the US military."],
    body: "Three assurances in one breath.",
    rule: "solid",
    ruleWidth: 3,
  },
  {
    id: "gap",
    x: 30,
    y: 300,
    w: 260,
    h: 130,
    kind: "question",
    status: "unknown",
    title: ["Who is the threat,", "exactly?"],
    body: "Never stated in the source.",
    rule: "dash",
    ruleWidth: 3,
    tone: "red",
  },
  {
    id: "reading",
    x: 400,
    y: 280,
    w: 310,
    h: 150,
    kind: "hypothesis",
    status: "hypothesis",
    title: ["The reassurance", "is the threat."],
    body: "Protection named as leverage.",
    rule: "dot",
    ruleWidth: 3,
  },
];

const CORDS: { from: string; to: string; label: string; tone: "ink" | "cobalt" | "red"; tag: [number, number]; curve: number }[] = [
  { from: "claim", to: "support", label: "supports", tone: "ink", tag: [360, 110], curve: 132 },
  { from: "claim", to: "gap", label: "needs evidence", tone: "red", tag: [160, 240], curve: 220 },
  { from: "claim", to: "reading", label: "leads to", tone: "cobalt", tag: [352, 250], curve: 300 },
];

const byId = new Map(CARDS.map((card) => [card.id, card]));

/** A still specimen of the canvas: four cards, three cords, one hanging gap. */
export function LandingCanvas() {
  return (
    <svg
      viewBox="0 0 740 470"
      className="block h-full w-full"
      role="img"
      aria-label="Four cards connected by cords: a quote, its evidence, an unproven reading, and an unanswered question."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="plate-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={INK} strokeOpacity="0.06" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="740" height="470" fill={PAPER} />
      <rect width="740" height="470" fill="url(#plate-grid)" />

      {CORDS.map((cord) => {
        const a = byId.get(cord.from)!;
        const b = byId.get(cord.to)!;
        const stroke = cord.tone === "red" ? RED : cord.tone === "cobalt" ? COBALT : INK;
        const [tx, ty] = cord.tag;
        return (
          <g key={`${cord.from}-${cord.to}`}>
            <path
              d={`M${a.x + a.w / 2} ${a.y + a.h} Q${cord.curve} ${ty + 20} ${b.x + b.w / 2} ${b.y}`}
              fill="none"
              stroke={stroke}
              strokeOpacity={cord.tone === "ink" ? 0.5 : 0.9}
              strokeWidth={cord.tone === "ink" ? 1.4 : 1.8}
              strokeDasharray={cord.tone === "red" ? "5 4" : undefined}
            />
            <g transform={`translate(${tx} ${ty}) rotate(-3)`}>
              <rect x="-62" y="-12" width="124" height="24" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
              <circle cx="-49" cy="0" r="2.4" fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="1" />
              <text
                x="-40"
                y="4"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="9.5"
                letterSpacing="1.1"
                fill={INK}
                fillOpacity="0.82"
              >
                {cord.label.toUpperCase()}
              </text>
            </g>
          </g>
        );
      })}

      {CARDS.map((card) => {
        const dash = card.rule === "dash" ? "6 5" : card.rule === "dot" ? "2 4" : undefined;
        const line = card.tone === "red" ? RED : INK;
        return (
          <g key={card.id}>
            <rect x={card.x} y={card.y} width={card.w} height={card.h} fill="#FFFFFF" stroke={INK} strokeWidth="2" />
            <rect
              x={card.x + 1}
              y={card.y + 12}
              width={card.ruleWidth}
              height={card.h - 24}
              fill={card.rule === "solid" ? line : "none"}
              stroke={line}
              strokeWidth={card.ruleWidth}
              strokeDasharray={dash}
            />
            <text
              x={card.x + 18}
              y={card.y + 26}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9"
              letterSpacing="1.7"
              fill={INK}
              fillOpacity="0.6"
            >
              {card.kind.toUpperCase()}
            </text>
            <g transform={`translate(${card.x + card.w - 84} ${card.y + 14})`}>
              <rect width="70" height="18" fill="none" stroke={INK} strokeOpacity="0.3" strokeWidth="1" />
              <text
                x="35"
                y="12.5"
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="8"
                letterSpacing="1.1"
                fill={INK}
                fillOpacity="0.68"
              >
                {card.status.toUpperCase()}
              </text>
            </g>
            {card.title.map((text, index) => (
              <text
                key={index}
                x={card.x + 18}
                y={card.y + 62 + index * 27}
                fontFamily="Fraunces, Georgia, serif"
                fontSize="22"
                fill={INK}
              >
                {text}
              </text>
            ))}
            {card.body && (
              <text
                x={card.x + 18}
                y={card.y + 62 + (card.title.length - 1) * 27 + 18}
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="11.5"
                fill={INK}
                fillOpacity="0.6"
              >
                {card.body}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
