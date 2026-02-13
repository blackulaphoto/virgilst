import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
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

describe("Favorites System", () => {
  it("should bookmark and unbookmark an article", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Get an existing article
    const articles = await caller.articles.list({});
    const article = articles[0];
    if (!article) throw new Error("No articles found");

    // Bookmark the article
    await caller.favorites.addArticle({ articleId: article.id });

    // Check if bookmarked
    const isFavorited = await caller.favorites.isArticleFavorited({ articleId: article.id });
    expect(isFavorited).toBe(true);

    // Get favorites list
    const favorites = await caller.favorites.getArticles();
    expect(favorites.some((f) => f.articleId === article.id)).toBe(true);

    // Remove bookmark
    await caller.favorites.removeArticle({ articleId: article.id });

    // Check if removed
    const isStillFavorited = await caller.favorites.isArticleFavorited({ articleId: article.id });
    expect(isStillFavorited).toBe(false);
  });

  it("should save and unsave a map pin", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Get an existing map pin
    const pins = await caller.mapPins.list({});
    const pin = pins[0];
    if (!pin) throw new Error("No map pins found");

    // Save the pin
    await caller.favorites.addMapPin({ pinId: pin.id });

    // Check if saved
    const isFavorited = await caller.favorites.isMapPinFavorited({ pinId: pin.id });
    expect(isFavorited).toBe(true);

    // Get favorites list
    const favorites = await caller.favorites.getMapPins();
    expect(favorites.some((f) => f.pinId === pin.id)).toBe(true);

    // Remove save
    await caller.favorites.removeMapPin({ pinId: pin.id });

    // Check if removed
    const isStillFavorited = await caller.favorites.isMapPinFavorited({ pinId: pin.id });
    expect(isStillFavorited).toBe(false);
  });

  it("should follow and unfollow a forum thread", async () => {
    const { ctx } = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Get an existing forum post
    const posts = await caller.forum.posts({});
    const post = posts[0];
    if (!post) throw new Error("No forum posts found");

    // Follow the thread
    await caller.favorites.followThread({ postId: post.id });

    // Check if following
    const isFollowing = await caller.favorites.isThreadFollowed({ postId: post.id });
    expect(isFollowing).toBe(true);

    // Get followed threads
    const followed = await caller.favorites.getThreads();
    expect(followed.some((f) => f.postId === post.id)).toBe(true);

    // Unfollow
    await caller.favorites.unfollowThread({ postId: post.id });

    // Check if unfollowed
    const isStillFollowing = await caller.favorites.isThreadFollowed({ postId: post.id });
    expect(isStillFollowing).toBe(false);
  });
});
