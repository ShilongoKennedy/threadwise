import { describe, expect, it } from "vitest";
import { checkPractice, namedEntities } from "./practice";

const report = {
  move: "The IAEA raised concerns about Iran's enrichment programme in a confidential report.",
  why_now: "The Board of Governors meets in December, so the leak lands before a scheduled session.",
  counter_reading: "The IAEA routinely circulates technical updates before Board meetings; this may be procedure.",
  falsifier:
    "If the IAEA publicly confirms the report and states it was a routine Board-requested update, the reading of a deliberate escalation is wrong.",
};

describe("namedEntities", () => {
  it("finds names and acronyms but ignores sentence-starting words", () => {
    const entities = namedEntities("The IAEA told Kenya's High Court that the report was routine.");
    expect(entities).toContain("IAEA");
    expect(entities).toContain("Kenya");
    expect(entities).not.toContain("The");
  });
});

describe("checkPractice", () => {
  it("rejects a one-line answer", () => {
    const checks = checkPractice("falsifier", "It is wrong.", report);
    expect(checks.every((check) => !check.passed)).toBe(true);
  });

  it("recognises a usable falsifier", () => {
    const checks = checkPractice(
      "falsifier",
      "If the IAEA confirms the report and publishes the enrichment figure by December, the read that this is a deliberate escalation is wrong.",
      report,
    );
    expect(checks.find((check) => check.label.includes("condition"))?.passed).toBe(true);
    expect(checks.find((check) => check.label.includes("own test"))?.passed).toBe(true);
    expect(checks.find((check) => check.label.includes("settle"))?.passed).toBe(true);
  });

  it("recognises a steelman that concedes routine procedure", () => {
    const checks = checkPractice(
      "steelman",
      "However, the IAEA routinely circulates technical updates before Board meetings, so this may be ordinary procedure rather than a rupture.",
      report,
    );
    expect(checks.find((check) => check.label.includes("routine"))?.passed).toBe(true);
    expect(checks.find((check) => check.label.includes("counter-case"))?.passed).toBe(true);
  });

  it("recognises a teach-back that explains a cause and why now", () => {
    const checks = checkPractice(
      "teach",
      "The IAEA raised concerns because it wants the Board of Governors to act; the leak matters now because the Board meets in December.",
      report,
    );
    expect(checks.find((check) => check.label.includes("cause"))?.passed).toBe(true);
    expect(checks.find((check) => check.label.includes("why now"))?.passed).toBe(true);
  });
});
