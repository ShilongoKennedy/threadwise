export const PAPER_COLORS = ["paper", "butter", "rose", "sage", "sky", "lilac"] as const;
export type PaperColor = (typeof PAPER_COLORS)[number];
export const PAPER_LABELS: Record<PaperColor, string> = { paper: "Paper", butter: "Butter", rose: "Rose", sage: "Sage", sky: "Sky", lilac: "Lilac" };
export function paperColor(value: unknown): PaperColor {
  return PAPER_COLORS.find((color) => color === value) ?? "paper";
}

/** A custom card color is any #rrggbb hex outside the paper palette. */
export const isCustomColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

const INK_DARK = "oklch(0.24 0.02 65)"; // warm near-black ink
const INK_LIGHT = "oklch(0.96 0.015 90)"; // warm paper white

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/**
 * Contrast-safe label ink for a custom card color: picks dark ink or paper
 * white by WCAG relative luminance, whichever contrasts more with the card.
 */
export function paperInk(hex: string): string {
  const L = luminance(hex);
  const withDark = (L + 0.05) / (0.015 + 0.05);
  const withLight = (0.87 + 0.05) / (L + 0.05);
  return withDark >= withLight ? INK_DARK : INK_LIGHT;
}