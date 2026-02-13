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

describe("Articles Router", () => {
  it("should list published articles", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.list({});

    expect(Array.isArray(articles)).toBe(true);
    // Should only return published articles
    articles.forEach((article) => {
      expect(article.isPublished).toBe(true);
    });
  });

  it("should filter articles by category", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const articles = await caller.articles.list({ category: "benefits" });

    articles.forEach((article) => {
      expect(article.category).toBe("benefits");
    });
  });

  it("should get article by slug", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const article = await caller.articles.bySlug({ slug: "how-to-apply-for-general-relief" });

    if (article) {
      expect(article.slug).toBe("how-to-apply-for-general-relief");
      expect(article.isPublished).toBe(true);
    }
  });
});

describe("Resources Router", () => {
  it("should list all resources", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const resources = await caller.resources.list({});

    expect(Array.isArray(resources)).toBe(true);
  });

  it("should filter resources by type", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const resources = await caller.resources.list({ type: "shelter" });

    resources.forEach((resource) => {
      expect(resource.type).toBe("shelter");
    });
  });
});

describe("Forum Router", () => {
  it("should list forum posts", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const posts = await caller.forum.posts({});

    expect(Array.isArray(posts)).toBe(true);
  });

  it("should filter forum posts by category", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const posts = await caller.forum.posts({ category: "survival_tips" });

    posts.forEach((post) => {
      expect(post.category).toBe("survival_tips");
    });
  });

  it("should require authentication to create post", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.forum.createPost({
        title: "Test Post",
        content: "Test content",
        category: "general",
      })
    ).rejects.toThrow();
  });
});

describe("Videos Router", () => {
  it("should list all videos", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.videos.list({});

    expect(Array.isArray(videos)).toBe(true);
  });

  it("should filter videos by category", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const videos = await caller.videos.list({ category: "how_to_guides" });

    videos.forEach((video) => {
      expect(video.category).toBe("how_to_guides");
    });
  });
});

describe("Search Router", () => {
  it("should search across all content types", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.search.global({ query: "general" });

    expect(results).toHaveProperty("articles");
    expect(results).toHaveProperty("forumPosts");
    expect(results).toHaveProperty("resources");
    expect(Array.isArray(results.articles)).toBe(true);
    expect(Array.isArray(results.forumPosts)).toBe(true);
    expect(Array.isArray(results.resources)).toBe(true);
  });
});

describe("Map Pins Router", () => {
  it("should only list approved pins for public users", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const pins = await caller.mapPins.list({});

    pins.forEach((pin) => {
      expect(pin.isApproved).toBe(true);
    });
  });

  it("should require authentication to create pin", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mapPins.create({
        title: "Test Pin",
        type: "safe_zone",
        latitude: "34.0522",
        longitude: "-118.2437",
      })
    ).rejects.toThrow();
  });
});

describe("Chat Router", () => {
  it("should require authentication to access conversations", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(caller.chat.conversations()).rejects.toThrow();
  });

  it("should require authentication to send messages", async () => {
    const ctx = createTestContext(); // No user
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.chat.send({
        message: "Test message",
      })
    ).rejects.toThrow();
  });
});
