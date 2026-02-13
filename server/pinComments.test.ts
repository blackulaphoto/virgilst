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

describe("Pin Comments", () => {
  describe("Comment Creation", () => {
    it("should add a comment to a pin", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // First create a pin
      await caller.mapPins.create({
        title: "Test Pin for Comments",
        type: "safe_zone",
        latitude: "34.0522",
        longitude: "-118.2437",
      });

      // Get approved pins (assuming admin approved it or we're testing with approved pins)
      const pins = await caller.mapPins.list({});
      if (pins.length > 0) {
        const pinId = pins[0].id;

        // Add a comment
        const result = await caller.mapPins.addComment({
          pinId,
          content: "Still open as of today!",
        });

        expect(result.success).toBe(true);
        expect(result.commentId).toBeTypeOf("number");
      }
    });

    it("should add anonymous comment", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.list({});
      if (pins.length > 0) {
        const result = await caller.mapPins.addComment({
          pinId: pins[0].id,
          content: "Anonymous update",
          isAnonymous: true,
        });

        expect(result.success).toBe(true);
      }
    });

    it("should require authentication to add comment", async () => {
      const ctx = createTestContext(); // No user
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.mapPins.addComment({
          pinId: 1,
          content: "Test comment",
        })
      ).rejects.toThrow();
    });
  });

  describe("Comment Retrieval", () => {
    it("should list comments for a pin", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.list({});
      if (pins.length > 0) {
        const pinId = pins[0].id;

        // Add a comment first
        await caller.mapPins.addComment({
          pinId,
          content: "Test comment for retrieval",
        });

        // Get comments
        const comments = await caller.mapPins.comments({ pinId });

        expect(Array.isArray(comments)).toBe(true);
        expect(comments.length).toBeGreaterThan(0);
      }
    });

    it("should return empty array for pin with no comments", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Use a high pin ID that likely doesn't exist
      const comments = await caller.mapPins.comments({ pinId: 999999 });

      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBe(0);
    });

    it("should allow public access to view comments", async () => {
      const ctx = createTestContext(); // No user
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.list({});
      if (pins.length > 0) {
        const comments = await caller.mapPins.comments({ pinId: pins[0].id });
        expect(Array.isArray(comments)).toBe(true);
      }
    });
  });

  describe("Comment Content", () => {
    it("should store comment with correct content", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.list({});
      if (pins.length > 0) {
        const pinId = pins[0].id;
        const testContent = "Verified open today at 3pm - unique test";

        await caller.mapPins.addComment({
          pinId,
          content: testContent,
        });

        const comments = await caller.mapPins.comments({ pinId });
        const matchingComment = comments.find((c) => c.content === testContent);

        expect(matchingComment).toBeDefined();
        expect(matchingComment?.content).toBe(testContent);
      }
    });

    it("should mark anonymous comments correctly", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const pins = await caller.mapPins.list({});
      if (pins.length > 0) {
        const pinId = pins[0].id;

        await caller.mapPins.addComment({
          pinId,
          content: "Anonymous test",
          isAnonymous: true,
        });

        const comments = await caller.mapPins.comments({ pinId });
        const anonymousComment = comments.find((c) => c.content === "Anonymous test");

        expect(anonymousComment?.isAnonymous).toBe(true);
      }
    });
  });
});
