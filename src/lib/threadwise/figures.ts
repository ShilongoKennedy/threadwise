/**
 * Sentences that carry money. Shared by the analyst and the primary-document
 * reader so a budget figure is recognised the same way wherever it is found.
 */
export const MONEY = /(budget|contribution|contributor|donor|funding|funded|million|billion|€|\$|percent|share)/i;

/** A real figure, not merely a year that happens to sit in a budget sentence. */
const FIGURE =
  /(?:[€$£]\s?\d|\b\d{1,3}(?:[.,\s]\d{3})+\b|\b\d+(?:\.\d+)?\s*(?:million|billion|trillion|percent|%))/i;

/** Markdown loses blank lines between headings; split on lines *and* sentences. */
function sentences(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 20 && line.length < 700);
}

export function moneySentences(text: string, limit = 5): string[] {
  return sentences(text)
    .filter((line) => FIGURE.test(line) && MONEY.test(line))
    .slice(0, limit);
}
