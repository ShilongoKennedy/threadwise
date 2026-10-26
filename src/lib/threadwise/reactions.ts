export function readReactions(raw: string | undefined): Record<string, number> {
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, count]) =>
            ["agree", "challenge", "important", "celebrate"].includes(key) &&
            typeof count === "number" &&
            Number.isFinite(count) &&
            count > 0,
        )
        .map(([key, count]) => [key, Math.floor(Number(count))]),
    );
  } catch {
    return {};
  }
}
