export function accountLabel(
  metadata: Record<string, unknown> | null | undefined,
  fallback = "Participant",
) {
  const name = metadata?.["display_name"];
  return typeof name === "string" && name.trim() ? name.trim().slice(0, 80) : fallback;
}
