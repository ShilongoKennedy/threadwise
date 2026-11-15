export type BlueprintColor = {
  hex: string;
  label: string;
  ink: string;
};

export const BLUEPRINT_PALETTE: readonly BlueprintColor[] = [
  { hex: "#B3261E", label: "Soft Red", ink: "#FFFFFF" },
  { hex: "#1F2DEE", label: "Bright Indigo", ink: "#FFFFFF" },
  { hex: "#FF40D6", label: "Cotton Bloom", ink: "#FFFFFF" },
  { hex: "#9F0DF3", label: "Purple (X11)", ink: "#FFFFFF" },
  { hex: "#F0D71D", label: "Golden Glow", ink: "#111111" },
];

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/** Deterministic per-page shuffle: the same page always gets the same order. */
export function paletteFor(key: string): BlueprintColor[] {
  const colors = [...BLUEPRINT_PALETTE];
  let seed = hash(key);
  for (let index = colors.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swap = seed % (index + 1);
    [colors[index], colors[swap]] = [colors[swap], colors[index]];
  }
  // Keep the yellow off the first screen so the opening hero stays crisp white-on-colour.
  if (colors[0].hex === "#F0D71D") {
    [colors[0], colors[1]] = [colors[1], colors[0]];
  }
  return colors;
}
