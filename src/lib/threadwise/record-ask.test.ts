import { describe, expect, it } from "vitest";
import { buildRecordContext } from "./analyst";

describe("buildRecordContext", () => {
  it("numbers the reads and keeps claims, questions and predictions", () => {
    const context = buildRecordContext(
      [
        {
          token: "read-a",
          input: "The IAEA sent a confidential report on Iran.",
          subject: "Iran",
          at: "2026-11-09T10:00:00Z",
          report: {
            move: "The IAEA raised concerns in a confidential report.",
            claims: [
              {
                text: "Iran has not said how much 60%-enriched uranium survived.",
                kind: "fact",
                confidence: "documented",
                source: "Reuters",
                falsifier: "",
              },
            ],
            review: { verdict: "mixed" },
            revision: { patched: 1 },
          } as never,
        },
      ],
      [
        {
          question: "Will Iran let inspectors back in?",
          status: "open",
          findings: [
            { stance: "for", note: "A" },
            { stance: "for", note: "B" },
            { stance: "for", note: "C" },
          ],
        },
      ],
      [
        {
          claim: "Iran will allow inspectors by March.",
          status: "pending",
          due_date: "2026-03-01",
          origin: "prediction:high",
        },
      ],
    );

    expect(context).toContain("[1] 2026-11-09 · Iran");
    expect(context).toContain("REVIEW: mixed, 1 corrected");
    expect(context).toContain("one-sided");
    expect(context).toContain("Iran will allow inspectors by March");
  });

  it("says the record is empty rather than inventing one", () => {
    const context = buildRecordContext([], [], []);
    expect(context).toContain("READS:\n- none");
    expect(context).toContain("QUESTIONS:\n- none");
  });
});
