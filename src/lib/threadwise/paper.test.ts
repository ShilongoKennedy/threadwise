import { describe, expect, it } from "vitest";
import { isCustomColor, paperInk } from "./paper";

describe("isCustomColor", () => {
  it("accepts hex colors and rejects palette names", () => {
    expect(isCustomColor("#3a5a40")).toBe(true);
    expect(isCustomColor("sage")).toBe(false);
    expect(isCustomColor(undefined)).toBe(false);
  });
});

describe("paperInk", () => {
  it("uses dark ink on light cards", () => {
    expect(paperInk("#ffffff")).toContain("0.24");
    expect(paperInk("#f5efe3")).toContain("0.24");
  });
  it("uses light ink on dark cards", () => {
    expect(paperInk("#000000")).toContain("0.96");
    expect(paperInk("#1f2937")).toContain("0.96");
  });
});
