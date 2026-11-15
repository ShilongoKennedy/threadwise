export type BlueprintColor = {
  hex: string;
  label: string;
  ink: string;
  wave: "light" | "dark";
};

export const BLUEPRINT_PALETTE: readonly BlueprintColor[] = [
  { hex: "#B3261E", label: "Soft Red", ink: "#FFFFFF", wave: "light" },
  { hex: "#1F2DEE", label: "Bright Indigo", ink: "#FFFFFF", wave: "light" },
  { hex: "#9F0DF3", label: "Purple (X11)", ink: "#FFFFFF", wave: "light" },
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
  return colors;
}
