import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

const testUser: AuthenticatedUser = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const adminUser: AuthenticatedUser = {
  ...testUser,
  id: 1,
  role: "admin",
};

describe("Map Pins", () => {
  describe("Pin Listing", () => {
    it("should list approved pins for public users", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.list({});

      expect(Array.isArray(pins)).toBe(true);
      pins.forEach((pin) => {
        expect(pin.isApproved).toBe(true);
      });
    });

    it("should filter pins by type", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.list({ type: "safe_zone" });

      pins.forEach((pin) => {
        expect(pin.type).toBe("safe_zone");
      });
    });
  });

  describe("Pin Creation", () => {
    it("should create a new map pin", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.mapPins.create({
        title: "Test Safe Zone",
        description: "A test safe zone location",
        type: "safe_zone",
        latitude: "34.0522",
        longitude: "-118.2437",
        notes: "Test notes",
      });

      expect(result.success).toBe(true);
    });

    it("should require authentication to create pin", async () => {
      const ctx = createTestContext(); // No user
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.mapPins.create({
          title: "Test",
          type: "safe_zone",
          latitude: "34.0522",
          longitude: "-118.2437",
        })
      ).rejects.toThrow();
    });

    it("should create pin with minimal required fields", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.mapPins.create({
        title: "Minimal Pin",
        type: "water",
        latitude: "34.0522",
        longitude: "-118.2437",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Admin Functions", () => {
    it("should list pending pins for admin", async () => {
      const ctx = createTestContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.pending();

      expect(Array.isArray(pins)).toBe(true);
      pins.forEach((pin) => {
        expect(pin.isApproved).toBe(false);
      });
    });

    it("should require admin role to view pending pins", async () => {
      const ctx = createTestContext(testUser); // Regular user
      const caller = appRouter.createCaller(ctx);

      await expect(caller.mapPins.pending()).rejects.toThrow();
    });

    it("should approve a pin", async () => {
      const ctx = createTestContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      // First create a pin as regular user
      const userCtx = createTestContext(testUser);
      const userCaller = appRouter.createCaller(userCtx);
      await userCaller.mapPins.create({
        title: "Pin to Approve",
        type: "food",
        latitude: "34.0522",
        longitude: "-118.2437",
      });

      // Get pending pins
      const pending = await caller.mapPins.pending();
      if (pending.length > 0) {
        const pinToApprove = pending[0];

        // Approve it
        const result = await caller.mapPins.approve({ id: pinToApprove.id });
        expect(result.success).toBe(true);
      }
    });

    it("should require admin role to approve pins", async () => {
      const ctx = createTestContext(testUser); // Regular user
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.mapPins.approve({ id: 1 })
      ).rejects.toThrow();
    });
  });
});
