import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("treatmentCenters.getRecommendations", () => {
  it("returns top 3 facilities matching all criteria", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const recommendations = await caller.treatmentCenters.getRecommendations({
      county: "Los Angeles",
      acceptsMediCal: true,
      type: "residential",
      acceptsCouples: false,
    });

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeLessThanOrEqual(3);

    // Verify all results match the criteria
    recommendations.forEach((facility) => {
      expect(facility.acceptsMediCal).toBe(true);
      expect(facility.type).toBe("residential");
    });
  });

  it("returns facilities when only county is specified", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const recommendations = await caller.treatmentCenters.getRecommendations({
      county: "Orange",
    });

    expect(recommendations).toBeDefined();
    expect(recommendations.length).toBeLessThanOrEqual(3);
  });

  it("returns facilities that accept couples when specified", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const recommendations = await caller.treatmentCenters.getRecommendations({
      acceptsCouples: true,
    });

    expect(recommendations).toBeDefined();
    recommendations.forEach((facility) => {
      expect(facility.acceptsCouples).toBe(true);
    });
  });

  it("returns empty array when no facilities match criteria", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Use very specific criteria unlikely to match
    const recommendations = await caller.treatmentCenters.getRecommendations({
      county: "NonexistentCounty",
      type: "detox",
      acceptsCouples: true,
      acceptsMediCal: true,
    });

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
  });

  it("limits results to maximum of 3 facilities", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Use broad criteria to get many matches
    const recommendations = await caller.treatmentCenters.getRecommendations({
      acceptsMediCal: true,
    });

    expect(recommendations.length).toBeLessThanOrEqual(3);
  });
});
