import { describe, expect, it } from "vitest";
import {
  distinctiveTerms,
  editionFor,
  editionLanguage,
  fundedBody,
  matchStrength,
  selectLayers,
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
