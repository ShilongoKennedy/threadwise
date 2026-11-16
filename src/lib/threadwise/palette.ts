export type BlueprintColor = {
  hex: string;
  label: string;
  ink: string;
  wave: "light" | "dark";
};

/** One field family across the site: void, ink, paper. */
export const BLUEPRINT_PALETTE: readonly BlueprintColor[] = [
  { hex: "#000000", label: "Void Black", ink: "#FFFFFF", wave: "light" },
  { hex: "#0F1420", label: "Midnight Ink", ink: "#FFFFFF", wave: "light" },
];

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/** Kept for deterministic feature pages; the site shell now selects a fixed field. */
export function paletteFor(key: string): BlueprintColor[] {
  const colors = [...BLUEPRINT_PALETTE];
  let seed = hash(key);
  for (let index = colors.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swap = seed % (index + 1);
    [colors[index], colors[swap]] = [colors[swap], colors[index]];
  }
  return colors;
}

export const FIELD_STOPS = [
  { at: 0, hex: "#000000" },
  { at: 0.72, hex: "#000000" },
  { at: 1, hex: "#0F1420" },
] as const;

export function mixFieldHex(a: string, b: string, t: number) {
  const parse = (hex: string) => [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const clamped = Math.max(0, Math.min(1, t));
  const channel = (from: number, to: number) =>
    Math.round(from + (to - from) * clamped).toString(16).padStart(2, "0");
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
}

/** Continuous field colour for a page scroll position. */
export function fieldColorAt(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  for (let index = 0; index < FIELD_STOPS.length - 1; index += 1) {
    const from = FIELD_STOPS[index];
    const to = FIELD_STOPS[index + 1];
    if (p <= to.at) {
      const raw = (p - from.at) / Math.max(0.0001, to.at - from.at);
      const eased = raw * raw * (3 - 2 * raw);
      return mixFieldHex(from.hex, to.hex, eased);
    }
  }
  return FIELD_STOPS[FIELD_STOPS.length - 1].hex;
}
