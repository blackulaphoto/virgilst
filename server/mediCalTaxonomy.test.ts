import { describe, expect, it } from "vitest";
import {
  buildProviderSearchTerms,
  categorizeSpecialties,
  expandMediCalSearchTerms,
  normalizeSpecialties,
} from "../shared/mediCalTaxonomy";

describe("mediCalTaxonomy", () => {
  it("normalizes and categorizes obstetrics and gynecology variants", () => {
    const normalized = normalizeSpecialties(["OB/GYN", "Obstetrics/Gynecology"]);
    expect(normalized).toContain("Obstetrics And Gynecology");

    const categories = categorizeSpecialties(normalized);
    expect(categories).toContain("obgyn");
  });

  it("maps family medicine to primary care", () => {
    const normalized = normalizeSpecialties(["Family Medicine Physician"]);
    const categories = categorizeSpecialties(normalized);
    expect(categories).toContain("primary_care");
  });

  it("maps dentistry keywords to dental category", () => {
    const normalized = normalizeSpecialties(["Dentistry"]);
    const categories = categorizeSpecialties(normalized);
    expect(categories).toContain("dental");
  });

  it("expands obgyn query synonyms for search", () => {
    const terms = expandMediCalSearchTerms("obgyn near me");
    expect(terms).toContain("obstetrics");
    expect(terms).toContain("gynecology");
  });

  it("builds flattened search terms from provider metadata", () => {
    const terms = buildProviderSearchTerms({
      providerName: "Jane Doe",
      city: "Los Angeles",
      specialties: ["Family Medicine"],
      normalizedSpecialties: ["Family Medicine"],
      categories: ["primary_care"],
    });

    expect(terms).toContain("jane doe");
    expect(terms).toContain("family medicine");
    expect(terms).toContain("primary care");
  });
});
