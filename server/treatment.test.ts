import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Treatment Centers", () => {
  it("should list treatment centers without authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const centers = await caller.treatmentCenters.list();

    expect(centers).toBeDefined();
    expect(Array.isArray(centers)).toBe(true);
    expect(centers.length).toBeGreaterThan(0);
  });

  it("should filter treatment centers by type", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const centers = await caller.treatmentCenters.list({ type: "sober_living" });

    expect(centers).toBeDefined();
    expect(Array.isArray(centers)).toBe(true);
    if (centers.length > 0) {
      expect(centers[0]?.type).toBe("sober_living");
    }
  });

  it("should filter treatment centers by Medi-Cal acceptance", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const centers = await caller.treatmentCenters.list({ acceptsMediCal: true });

    expect(centers).toBeDefined();
    expect(Array.isArray(centers)).toBe(true);
    if (centers.length > 0) {
      expect(centers[0]?.acceptsMediCal).toBe(true);
    }
  });

  it("should search treatment centers by query", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const centers = await caller.treatmentCenters.search({ query: "SASH" });

    expect(centers).toBeDefined();
    expect(Array.isArray(centers)).toBe(true);
  });

  it("should create a treatment center as admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const newCenter = await caller.treatmentCenters.create({
      name: "Test Treatment Center",
      type: "outpatient",
      city: "Los Angeles",
      servesPopulation: "coed",
      acceptsMediCal: true,
    });

    expect(newCenter).toBeDefined();
    expect(newCenter.name).toBe("Test Treatment Center");
    expect(newCenter.type).toBe("outpatient");
  });

  it("should get treatment center by ID", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const centers = await caller.treatmentCenters.list();
    if (centers.length > 0) {
      const firstCenter = centers[0];
      const center = await caller.treatmentCenters.getById({ id: firstCenter!.id });

      expect(center).toBeDefined();
      expect(center?.id).toBe(firstCenter!.id);
      expect(center?.name).toBe(firstCenter!.name);
    }
  });
});
