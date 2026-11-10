import { describe, expect, it } from "vitest";
import {
  analystSchema,
  applyReadPatches,
  cleanArticle,
  distinctiveTerms,
  editionFor,
  editionLanguage,
  fundedBody,
  matchCount,
  matchStrength,
  publisherUrl,
  reviewedConfidence,
  selectLayers,
  urlQuality,
} from "./analyst";

describe("matchStrength", () => {
  it("keeps years in the search terms but treats them as weak", () => {
    const terms = distinctiveTerms("The finance act passed in 2025 after protests.");
    expect(terms).toContain("2025");
    expect(matchStrength("Kenya budget 2025: what changed", terms)).toBe(1);
  });

  it("treats a place alone as weak", () => {
    expect(matchStrength("Kenya news roundup", ["kenya"])).toBe(1);
  });

  it("treats a named thing as specific evidence", () => {
    expect(matchStrength("Finance Act ruling in Nairobi", ["finance act"])).toBe(2);
  });

  it("does not let a year make an otherwise unrelated headline specific", () => {
    expect(matchStrength("2025 in review", ["2025", "kenya"])).toBe(1);
  });
});

describe("fundedBody", () => {
  it("finds an agency that receives funding", () => {
    expect(
      fundedBody("The International Atomic Energy Agency raised concerns about the reactor."),
    ).toBe("International Atomic Energy Agency");
  });

  it("finds a bank", () => {
    expect(fundedBody("The World Bank approved a new loan.")).toBe("World Bank");
  });

  it("does not treat a court as a funded body", () => {
    expect(fundedBody("Kenya's High Court ruled against the finance act.")).toBe("");
  });

  it("does not treat a person as a funded body", () => {
    expect(fundedBody("Stephen Miller will become chief of staff.")).toBe("");
  });
});

describe("selectLayers", () => {
  it("does not auto-attach the institution layer to a court story", () => {
    expect(
      selectLayers("institution", [], "Kenya's High Court ruled against the finance act."),
    ).toEqual([]);
  });

  it("attaches the institution layer when the move names a funded body", () => {
    expect(
      selectLayers("institution", [], "The International Atomic Energy Agency raised concerns."),
    ).toEqual(["institution"]);
  });

  it("drops an institution layer the classifier requested for a court story", () => {
    expect(
      selectLayers("institution", ["institution", "state"], "Kenya's High Court ruled."),
    ).toEqual(["state"]);
  });

  it("keeps the theory layer for discourse", () => {
    expect(selectLayers("discourse", [], "Maybe it is an inferiority complex.")).toEqual([
      "theory",
    ]);
  });
});

describe("reviewedConfidence", () => {
  it("never raises confidence", () => {
    expect(reviewedConfidence("documented", "grounded")).toBe("documented");
    expect(reviewedConfidence("inferred", "grounded")).toBe("inferred");
  });

  it("lowers documented to inferred when the editor finds mixed support", () => {
    expect(reviewedConfidence("documented", "mixed")).toBe("inferred");
    expect(reviewedConfidence("inferred", "mixed")).toBe("inferred");
  });

  it("lowers any read to speculative when the central claims are unsupported", () => {
    expect(reviewedConfidence("documented", "unsupported")).toBe("speculative");
    expect(reviewedConfidence("inferred", "unsupported")).toBe("speculative");
  });

  it("leaves confidence alone when there was no review", () => {
    expect(reviewedConfidence("documented")).toBe("documented");
  });
});

describe("applyReadPatches", () => {
  const draft = analystSchema.parse({
    mode: "report",
    move: "The court ruled.",
    sections: [
      {
        title: "The move",
        body: "The Australian High Court decided Bendel v Commissioner of Taxation.",
      },
    ],
    falsifier: "If the court did not rule.",
  });

  it("patches the exact text in the named section", () => {
    const result = applyReadPatches(draft, [
      {
        section: "sections: The move",
        find: "Australian High Court decided Bendel v Commissioner of Taxation",
        replace: "High Court decided a tax case",
        reason: "Removed the unverified case name",
      },
    ]);

    expect(result.revision.patched).toBe(1);
    expect(result.revision.notes).toEqual(["Removed the unverified case name"]);
    expect(result.draft.sections[0]?.body).toBe("The High Court decided a tax case.");
    expect(draft.sections[0]?.body).toContain("Australian");
  });

  it("falls back to the exact text when the editor names the wrong section", () => {
    const result = applyReadPatches(draft, [
      {
        section: "Precedent",
        find: "Australian High Court decided Bendel v Commissioner of Taxation",
        replace: "High Court decided a tax case",
        reason: "Corrected the case name",
      },
    ]);

    expect(result.revision.patched).toBe(1);
    expect(result.draft.sections[0]?.body).toBe("The High Court decided a tax case.");
  });

  it("leaves the read untouched when the text is not found", () => {
    const result = applyReadPatches(draft, [
      {
        section: "move",
        find: "a sentence that is not in the read",
        replace: "anything",
        reason: "Should not apply",
      },
    ]);

    expect(result.revision.patched).toBe(0);
    expect(result.draft.move).toBe("The court ruled.");
  });
});

describe("matchCount", () => {
  it("counts how many of the move's terms a headline names", () => {
    expect(matchCount("IAEA at COP31", ["iaea", "iran", "enrichment"])).toBe(1);
    expect(matchCount("Iran's IAEA enrichment report", ["iaea", "iran", "enrichment"])).toBe(3);
  });
});

describe("publisherUrl", () => {
  it("unwraps the publisher URL from a Bing News redirect", () => {
    const link =
      "http://www.bing.com/news/apiclick.aspx?ref=FexRss&url=https%3A%2F%2Fwww.cnn.com%2F2026%2F11%2F07%2Fmiddleeast%2Fstory";
    expect(publisherUrl(link)).toBe(
      "https://www.cnn.com/2026/11/07/middleeast/story",
    );
  });

  it("keeps a direct publisher URL", () => {
    expect(publisherUrl("https://example.com/story")).toBe("https://example.com/story");
  });

  it("rejects a link that is not a URL", () => {
    expect(publisherUrl("not a url")).toBe("");
  });
});

describe("urlQuality", () => {
  it("prefers the original publisher over an aggregator or a Google redirect", () => {
    expect(urlQuality("https://news.google.com/rss/articles/abc")).toBe(0);
    expect(urlQuality("https://www.msn.com/en-us/news/other/story")).toBe(1);
    expect(urlQuality("https://www.reuters.com/world/middle-east/story")).toBe(2);
  });
});

describe("cleanArticle", () => {
  it("drops the reader's chrome and keeps the article body", () => {
    const text = `Accessibility
Press enter for Accessibility
[Follow us](https://example.com)
# Iran holds nuclear material
The material includes 440 kilograms of enriched uranium, according to the agency.
![Image](https://example.com/image.png)`;
    const cleaned = cleanArticle(text);
    expect(cleaned).toContain("Iran holds nuclear material");
    expect(cleaned).toContain("440 kilograms");
    expect(cleaned).not.toContain("Accessibility");
    expect(cleaned).not.toContain("Follow us");
  });
});

describe("editionFor", () => {
  it("sends a French story to the French edition", () => {
    expect(editionFor("The French parliament votes on the budget.")).toMatchObject({
      gl: "FR",
      hl: "fr",
      ceid: "FR:fr",
    });
  });

  it("sends an Egyptian story to the Arabic edition", () => {
    expect(editionFor("Egypt's court reviews the case.")).toMatchObject({
      gl: "EG",
      hl: "ar",
      ceid: "EG:ar",
    });
  });

  it("matches the adjective, not just the country name", () => {
    expect(editionFor("Kenyan court ruling")?.gl).toBe("KE");
    expect(editionFor("Brazilian congress")?.gl).toBe("BR");
  });

  it("keeps South Sudan separate from Sudan", () => {
    expect(editionFor("South Sudan's president spoke.")?.gl).toBe("SS");
    expect(editionFor("Sudan's army advanced.")?.gl).toBe("SD");
  });

  it("does not mistake the pronoun for the United States", () => {
    expect(editionFor("Tell us what happened in the budget vote.")).toBeUndefined();
  });

  it("names the language of an edition", () => {
    expect(editionLanguage("pt-BR")).toBe("Portuguese");
    expect(editionLanguage("ar")).toBe("Arabic");
    expect(editionLanguage("en-KE")).toBe("English");
    expect(editionLanguage("xx")).toBe("");
  });
});
