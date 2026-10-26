import { z } from "zod";
export const redTeamSchema = z.object({
  findings: z.array(
    z.object({
      title: z.string(),
      challenge: z.string(),
      bias: z.enum([
        "confirmation",
        "anchoring",
        "availability",
        "sunk_cost",
        "planning_fallacy",
        "overconfidence",
        "missing_evidence",
        "none",
      ]),
      severity: z.enum(["low", "medium", "high"]),
      nodeIds: z.array(z.string()),
      suggestedTest: z.string(),
    }),
  ),
});
export type RedTeamResult = z.infer<typeof redTeamSchema>;
export function validateFindings(result: unknown, ids: string[]): RedTeamResult {
  const parsed = redTeamSchema.parse(result),
    allowed = new Set(ids);
  return {
    findings: parsed.findings.filter(
      (f) => f.nodeIds.length > 0 && f.nodeIds.every((id) => allowed.has(id)),
    ),
  };
}
