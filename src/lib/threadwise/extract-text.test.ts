import { describe, expect, it } from "vitest";
import { cleanArticleText } from "./extract-text";

describe("cleanArticleText", () => {
  it("drops the reader preamble and navigation before the headline", () => {
    const input = `Title: US warns Madagascar
URL Source: https://example.com/story
Published Time: 2026-11-11T07:30:15Z

Markdown Content:
[Skip to content](https://example.com#main)

Advertisement

*   [Home](https://example.com/)
*   [News](https://example.com/news)

# US warns Madagascar over growing military ties with Russia

The US has warned Madagascar against strengthening its ties with Russia.

The three Sahel countries had blamed their former Western partners.`;

    const clean = cleanArticleText(input);
    expect(clean.startsWith("# US warns Madagascar")).toBe(true);
    expect(clean).not.toContain("Advertisement");
    expect(clean).not.toContain("Skip to content");
    expect(clean).toContain("The three Sahel countries");
  });

  it("leaves text without a headline alone", () => {
    expect(cleanArticleText("  A short note without a headline.  ")).toBe(
      "A short note without a headline.",
    );
  });
});
