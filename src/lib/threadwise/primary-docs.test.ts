import { describe, expect, it } from "vitest";
import { moneySentences } from "./figures";
import {
  documentLinks,
  filingLink,
  holdingSentences,
  looksUSLegal,
} from "./primary-docs.server";

describe("moneySentences", () => {
  it("keeps a real budget figure", () => {
    const text =
      "1. Appropriates an amount of € 430 020 873 for the operational portion of the Regular Budget in 2024.";
    const sentences = moneySentences(text, 3);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toContain("€ 430 020 873");
  });

  it("does not treat a year alone as a figure", () => {
    const text = "The regular budget process has run since 2000 under the same formula.";
    expect(moneySentences(text, 3)).toEqual([]);
  });
});

describe("documentLinks", () => {
  it("keeps the English budget PDF and drops localised editions", () => {
    const page = `- [Arabic](https://www.iaea.org/gc/gc67-res3_ar_.pdf) | [Chinese](https://www.iaea.org/gc/gc67_res3_ch.pdf) | [English](https://www.iaea.org/gc/gc67-res3.pdf)
- [Not a document](https://www.iaea.org/about/overview/budget)`;
    expect(documentLinks(page, "https://www.iaea.org/about/overview/budget")).toEqual([
      { title: "English", url: "https://www.iaea.org/gc/gc67-res3.pdf" },
    ]);
  });
});

describe("filingLink", () => {
  it("finds a judgment PDF linked by the coverage", () => {
    const article = `The court published its [judgment](https://kenyalaw.org/caselaw/docs/FinanceAct2025.pdf) today.`;
    expect(filingLink(article, "https://nation.africa/story")).toEqual({
      title: "judgment",
      url: "https://kenyalaw.org/caselaw/docs/FinanceAct2025.pdf",
    });
  });

  it("ignores PDFs that are not a filing", () => {
    const article = `See the [budget table](https://example.com/budget.pdf) for context.`;
    expect(filingLink(article, "https://nation.africa/story")).toBeNull();
  });
});

describe("looksUSLegal", () => {
  it("recognises a US court", () => {
    expect(looksUSLegal("A federal judge blocked the order.")).toBe(true);
    expect(looksUSLegal("The US Supreme Court agreed to hear the appeal.")).toBe(true);
  });

  it("does not mistake a Kenyan court or the pronoun for the US", () => {
    expect(looksUSLegal("Kenya's High Court ruled against the finance act.")).toBe(false);
    expect(looksUSLegal("Tell us what the court decided.")).toBe(false);
  });
});

describe("holdingSentences", () => {
  it("joins hard-wrapped opinion lines and keeps the holding", () => {
    const opinion = `Title: Learning Resources v. Trump
URL Source: https://www.courtlistener.com/opinion/1/
Markdown Content:
For the reasons discussed below, the Court
denies Defendants' motion to transfer and grants Plaintiffs'
motion for a preliminary injunction.`;
    const sentences = holdingSentences(opinion, 2);
    expect(sentences).toHaveLength(1);
    expect(sentences[0]).toContain("grants Plaintiffs' motion for a preliminary injunction");
  });
});
