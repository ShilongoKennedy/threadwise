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
  { hex: "#FFFBFB", label: "Snow", ink: "#111111", wave: "dark" },
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
