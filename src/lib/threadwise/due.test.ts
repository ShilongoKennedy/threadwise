import { describe, expect, it } from "vitest";
import { dueDate } from "@/lib/threadwise/analyst";

const plus = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

describe("dueDate", () => {
  it("reads explicit day counts", () => {
    expect(dueDate("First 60 days")).toBe(plus(60));
    expect(dueDate("Within 30 days of the announcement")).toBe(plus(30));
  });
  it("reads weeks and months", () => {
    expect(dueDate("within 2 weeks")).toBe(plus(14));
    expect(dueDate("in 3 months")).toBe(plus(90));
  });
  it("passes ISO dates through", () => {
    expect(dueDate("before 2027-01-15")).toBe("2027-01-15");
  });
  it("falls back to ninety days", () => {
    expect(dueDate("Before the next continuing-resolution deadline")).toBe(plus(90));
  });
});
