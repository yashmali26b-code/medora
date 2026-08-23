import { describe, expect, it } from "vitest";
import { matchesCatalogueQuery, normalizeCatalogueQuery, selectPublicCatalogueMatches, splitCatalogueTerms } from "./medicineCatalogue";

describe("medicine catalogue search helpers", () => {
  it("normalizes an owner-entered search query", () => {
    expect(normalizeCatalogueQuery("  Nose   Problem ")).toBe("nose problem");
  });

  it("matches only the terms that the owner has attached to a catalogue item", () => {
    const item = {
      genericName: "Example medicine",
      brandNames: "Example brand",
      searchTerms: "headache, sinus pressure",
    };

    expect(matchesCatalogueQuery(item, "headache")).toBe(true);
    expect(matchesCatalogueQuery(item, "sinus pressure")).toBe(true);
    expect(matchesCatalogueQuery(item, "unrelated symptom")).toBe(false);
  });

  it("splits a comma-separated upload field into clean searchable terms", () => {
    expect(splitCatalogueTerms("headache, sinus pressure; nasal congestion")).toEqual([
      "headache",
      "sinus pressure",
      "nasal congestion",
    ]);
  });

  it("keeps draft and archived uploads out of public search even when their owner-entered terms match", () => {
    const items = [
      { genericName: "Approved item", brandNames: "", searchTerms: "headache", status: "approved" as const },
      { genericName: "Draft item", brandNames: "", searchTerms: "headache", status: "draft" as const },
      { genericName: "Archived item", brandNames: "", searchTerms: "headache", status: "archived" as const },
    ];

    expect(selectPublicCatalogueMatches(items, "headache").map((item) => item.genericName)).toEqual(["Approved item"]);
  });

  it("returns an approved Paracetamol record when its owner-entered search terms include fever", () => {
    const items = [
      { genericName: "Paracetamol", brandNames: "", searchTerms: "fever, high temperature", status: "approved" as const },
      { genericName: "Paracetamol", brandNames: "", searchTerms: "fever", status: "draft" as const },
    ];

    expect(selectPublicCatalogueMatches(items, "fever").map((item) => item.genericName)).toEqual(["Paracetamol"]);
  });
});
