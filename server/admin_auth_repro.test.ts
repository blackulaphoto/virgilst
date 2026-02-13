import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import { ENV } from "./_core/env";

describe("Admin Authentication Reality Check", () => {
  beforeAll(async () => {
    // Ensure we are using the test config
    console.log("Testing with OWNER_OPEN_ID:", ENV.ownerOpenId);
  });

  it("should assign admin role to ownerOpenId during upsert", async () => {
    const openId = ENV.ownerOpenId || "local-admin";
    
    // 1. Upsert the user as a regular dev login would
    await db.upsertUser({
      openId,
      name: "Test Admin",
      loginMethod: "dev",
    });

    // 2. Fetch the user back
    const user = await db.getUserByOpenId(openId);
    
    expect(user).toBeDefined();
    expect(user?.openId).toBe(openId);
    expect(user?.role).toBe("admin");
  });

  it("should allow adminProcedure for the owner user", async () => {
    const openId = ENV.ownerOpenId || "local-admin";
    const user = await db.getUserByOpenId(openId);
    
    if (!user) throw new Error("User not found");

    const ctx = {
      user: {
        ...user,
        createdAt: new Date(user.createdAt * 1000),
        updatedAt: new Date(user.updatedAt * 1000),
        lastSignedIn: new Date(user.lastSignedIn * 1000),
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx as any);

    // This uses adminProcedure
    const pendingPins = await caller.mapPins.pending();
    expect(Array.isArray(pendingPins)).toBe(true);
  });

  it("should DENY adminProcedure for a regular user", async () => {
    const regularOpenId = "regular-user-" + Date.now();
    await db.upsertUser({
      openId: regularOpenId,
      name: "Regular User",
      loginMethod: "dev",
    });

    const user = await db.getUserByOpenId(regularOpenId);
    if (!user) throw new Error("User not found");
    
    expect(user.role).toBe("user");

    const ctx = {
      user: {
        ...user,
        createdAt: new Date(user.createdAt * 1000),
        updatedAt: new Date(user.updatedAt * 1000),
        lastSignedIn: new Date(user.lastSignedIn * 1000),
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(ctx as any);

    await expect(caller.mapPins.pending()).rejects.toThrow(/Admin access required|Forbidden/i);
  });
});
