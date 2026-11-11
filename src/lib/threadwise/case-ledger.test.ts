import { describe, expect, it } from "vitest";
import { buildCaseLedger, type CaseRead } from "./case-ledger";

const claim = (text: string, kind = "fact", confidence = "documented", source = "Reuters") => ({
  text,
  kind,
  confidence,
  source,
  falsifier: "",
});

const reads: CaseRead[] = [
  {
    token: "latest",
    input: "The IAEA report lands.",
    at: "2026-11-10T10:00:00Z",
    mode: "document",
    falsifier: "A verified stockpile figure appears.",
    confidence: "documented",
    claims: [
      claim("The IAEA has not been allowed back to the sites."),
      claim("Iran will allow inspectors by March.", "prediction", "high"),
    ],
    counter_reading: "This may be routine.",
    review: "mixed",
  },
  {
    token: "previous",
    input: "The IAEA report is expected.",
    at: "2026-11-08T10:00:00Z",
    mode: "document",
    falsifier: "The report is published in full.",
    confidence: "inferred",
    claims: [
      claim("The IAEA has not been allowed back to the sites.", "fact", "inferred"),
      claim("The Board will meet in December."),
    ],
    counter_reading: "The Board may delay.",
    review: null,
  },
  {
    token: "older",
    input: "The IAEA is concerned.",
    at: "2026-11-01T10:00:00Z",
    mode: "report",
    falsifier: "",
    confidence: "speculative",
    claims: [claim("The IAEA has not been allowed back to the sites.", "fact", "speculative")],
    counter_reading: "",
    review: null,
  },
];

describe("buildCaseLedger", () => {
  const ledger = buildCaseLedger(reads);

  it("groups the recurring claim across reads", () => {
    const recurring = ledger.claims.find((item) =>
      item.text.includes("not been allowed back"),
    );
    expect(recurring?.reads).toHaveLength(3);
    expect(recurring?.latestConfidence).toBe("documented");
    expect(ledger.predictions).toHaveLength(1);
  });

  it("describes what changed between the latest two reads", () => {
    const summary = ledger.change?.summary.join(" ") ?? "";
    expect(summary).toContain("inferred to documented");
    expect(summary).toContain("falsifier changed");
    expect(summary).toContain("counter-reading changed");
    expect(summary).toContain("1 new claim");
    expect(summary).toContain("1 claim no longer appears");
  });

  it("has no change card for a single read", () => {
    expect(buildCaseLedger([reads[0]!]).change).toBeNull();
  });
});
