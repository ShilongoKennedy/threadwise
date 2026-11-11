/**
 * A standing question is a decision, not a thesis. Keep the list usable by
 * catching statements at the point they are added.
 */
const OPENERS = new Set([
  "is", "are", "was", "were", "will", "would", "can", "could", "should",
  "does", "do", "did", "has", "have", "had", "who", "what", "when", "where",
  "why", "how", "which", "whose",
]);

export function isQuestionLike(text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  if (clean.endsWith("?")) return true;
  const first = clean.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  return OPENERS.has(first);
}
