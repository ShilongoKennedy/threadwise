import { it, expect } from "vitest";
import { validateFindings } from "./redteam";
it("rejects invented or empty card citations", () => {
  const f = {
    title: "Challenge",
    challenge: "Test",
    bias: "confirmation",
    severity: "high",
    suggestedTest: "Interview",
    nodeIds: ["a"],
  };
  expect(
    validateFindings({ findings: [f, { ...f, nodeIds: ["invented"] }, { ...f, nodeIds: [] }] }, [
      "a",
    ]).findings,
  ).toEqual([f]);
});
