import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@virgilst.com",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Admin Dashboard", () => {
  it("should create a new article", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueSlug = `test-admin-guide-${Date.now()}`;
    const article = await caller.articles.create({
      title: "Test Admin Guide",
      slug: uniqueSlug,
      content: "This is a test guide created by admin.",
      category: "benefits",
      summary: "Test summary",
    });

    expect(article).toBeDefined();
    expect(article.title).toBe("Test Admin Guide");
    expect(article.category).toBe("benefits");
  });

  it("should create a new video", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const video = await caller.videos.create({
      title: "Test Admin Video",
      youtubeId: "test123",
      category: "how_to_guides",
      description: "Test video description",
    });

    expect(video).toBeDefined();
    expect(video.title).toBe("Test Admin Video");
    expect(video.category).toBe("how_to_guides");
  });

  it("should create a new resource", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const resource = await caller.resources.create({
      name: "Test Admin Resource",
      type: "shelter",
      description: "Test resource description",
      address: "123 Test St",
      phone: "(555) 123-4567",
    });

    expect(resource).toBeDefined();
    expect(resource.name).toBe("Test Admin Resource");
    expect(resource.type).toBe("shelter");
  });

  it("should list pending map pins", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const pendingPins = await caller.mapPins.pending();

    expect(Array.isArray(pendingPins)).toBe(true);
  });

  it("should approve a map pin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create a pending pin
    const pin = await caller.mapPins.create({
      title: "Test Pin for Approval",
      type: "safe_zone",
      latitude: "34.0522",
      longitude: "-118.2437",
      description: "Test pin",
    });

    // Then approve it
    const result = await caller.mapPins.approve({ id: pin.id });

    expect(result.success).toBe(true);
  });
});
