import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { formatDate, toIsoDate, toValidDate } from "../client/src/lib/dateTime";
import { classifyResourceGeography, sortResourcesForLosAngeles } from "../shared/resourceGeography";
import { auditTreatmentRecords, summarizePrivateInsurance } from "../shared/resourceQuality";
import { formatTreatmentPrice, isDatabaseTrue, normalizeTreatmentPrice, shouldShowInsuranceClaim } from "../shared/treatmentPresentation";

describe("release blocker regressions", () => {
  it("does not restore unverified personalized housing claims", () => {
    const source = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/components/home/RecommendedProgramCard.tsx"), "utf8");
    expect(source).toContain("Find housing options");
    for (const forbidden of ["Recommended for you", "LAHSA Interim Housing Program", "Match 93%", "Accepting applications", "$1,500", "3–12 mo", "View & apply"]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("normalizes truthful treatment prices and rejects truncated values", () => {
    expect(normalizeTreatmentPrice("$2,575")).toBe("$2,575");
    expect(normalizeTreatmentPrice("2500")).toBe("$2,500");
    expect(normalizeTreatmentPrice("$800-$1,100")).toBe("$800–$1,100");
    expect(normalizeTreatmentPrice("$2")).toBeNull();
    expect(formatTreatmentPrice("$2")).toBe("Contact for pricing");
    expect(formatTreatmentPrice(null)).toBe("Contact for pricing");
    expect(shouldShowInsuranceClaim(1, 0)).toBe(false);
    expect(shouldShowInsuranceClaim(1, 1)).toBe(true);
    expect(isDatabaseTrue("0")).toBe(false);
    expect(shouldShowInsuranceClaim("1", "0")).toBe(false);
  });

  it("flags the old treatment corruption without rewriting records", () => {
    const records = [
      { id: 1, name: "Private Sober Suites", priceRange: "$2", acceptsPrivateInsurance: 1, isVerified: 0 },
      { id: 2, name: "Verified Center", priceRange: "$900", acceptsPrivateInsurance: 1, isVerified: 1 },
    ];
    const issues = auditTreatmentRecords(records);
    expect(issues.map(issue => issue.reason)).toEqual(expect.arrayContaining(["malformed or implausibly low price", "unverified insurance claim"]));
    expect(summarizePrivateInsurance(records)).toEqual({ total: 2, claimed: 2, share: 1 });
    expect(summarizePrivateInsurance([{ id: 3, acceptsPrivateInsurance: "0" as any }, { id: 4, acceptsPrivateInsurance: "1" as any }])).toEqual({ total: 2, claimed: 1, share: 0.5 });
    expect(records[0].priceRange).toBe("$2");
  });

  it("converts Unix seconds, milliseconds, ISO strings, and missing dates centrally", () => {
    const seconds = 1_770_771_864;
    expect(toValidDate(seconds)?.getTime()).toBe(seconds * 1000);
    expect(toValidDate(seconds * 1000)?.getTime()).toBe(seconds * 1000);
    expect(toIsoDate("2026-02-11T00:00:00.000Z")).toBe("2026-02-11T00:00:00.000Z");
    expect(formatDate(seconds)).not.toContain("1970");
    expect(formatDate(null)).toBe("Date unavailable");
    expect(toValidDate("not-a-date")).toBeNull();
  });

  it("ranks Los Angeles and statewide resources ahead of out-of-area entries", () => {
    const sacramento = { name: "211 Sacramento", address: "Sacramento, CA 95814" };
    const statewide = { name: "California Benefits", description: "California statewide information" };
    const losAngeles = { name: "LA service", address: "630 W Fifth St, Los Angeles, CA 90071" };
    expect(classifyResourceGeography(sacramento)).toBe("outside_los_angeles");
    expect(sortResourcesForLosAngeles([sacramento, statewide, losAngeles])).toEqual([losAngeles, statewide, sacramento]);
  });
});
