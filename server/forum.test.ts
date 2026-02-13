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
  id: 1, // Use existing user ID from seed data
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

describe("Forum Features", () => {
  describe("Post Creation", () => {
    it("should create a new forum post", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.forum.createPost({
        title: "Test Post",
        content: "This is a test post content",
        category: "general",
      });

      expect(result.success).toBe(true);
      expect(result.postId).toBeTypeOf("number");
    });

    it("should create anonymous post", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.forum.createPost({
        title: "Anonymous Test",
        content: "This is anonymous",
        category: "emotional_support",
        isAnonymous: true,
      });

      expect(result.success).toBe(true);
    });

    it("should require authentication to create post", async () => {
      const ctx = createTestContext(); // No user
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.forum.createPost({
          title: "Test",
          content: "Test",
          category: "general",
        })
      ).rejects.toThrow();
    });
  });

  describe("Replies", () => {
    it("should create a reply to a post", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // First create a post
      const postResult = await caller.forum.createPost({
        title: "Test Post for Reply",
        content: "Test content",
        category: "general",
      });

      // Then create a reply
      const replyResult = await caller.forum.createReply({
        postId: postResult.postId,
        content: "This is a reply",
      });

      expect(replyResult.success).toBe(true);
    });

    it("should get replies for a post", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a post
      const postResult = await caller.forum.createPost({
        title: "Test Post",
        content: "Test",
        category: "general",
      });

      // Create a reply
      await caller.forum.createReply({
        postId: postResult.postId,
        content: "Reply 1",
      });

      // Get replies
      const replies = await caller.forum.replies({ postId: postResult.postId });

      expect(Array.isArray(replies)).toBe(true);
      expect(replies.length).toBeGreaterThan(0);
    });

    it("should require authentication to reply", async () => {
      const ctx = createTestContext(); // No user
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.forum.createReply({
          postId: 1,
          content: "Test reply",
        })
      ).rejects.toThrow();
    });
  });

  describe("Upvoting", () => {
    it("should upvote a post", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a post
      const postResult = await caller.forum.createPost({
        title: "Test Post",
        content: "Test",
        category: "general",
      });

      // Upvote it
      const upvoteResult = await caller.forum.upvotePost({ postId: postResult.postId });

      expect(upvoteResult.success).toBe(true);
    });

    it("should upvote a reply", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a post
      const postResult = await caller.forum.createPost({
        title: "Test Post",
        content: "Test",
        category: "general",
      });

      // Create a reply
      await caller.forum.createReply({
        postId: postResult.postId,
        content: "Test reply",
      });

      // Get the reply
      const replies = await caller.forum.replies({ postId: postResult.postId });
      const replyId = replies[0]?.id;

      if (replyId) {
        const upvoteResult = await caller.forum.upvoteReply({ replyId });
        expect(upvoteResult.success).toBe(true);
      }
    });

    it("should require authentication to upvote", async () => {
      const ctx = createTestContext(); // No user
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.forum.upvotePost({ postId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("Post Retrieval", () => {
    it("should get a single post by ID", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a post
      const postResult = await caller.forum.createPost({
        title: "Test Post",
        content: "Test content",
        category: "general",
      });

      // Get the post
      const post = await caller.forum.post({ id: postResult.postId });

      expect(post).toBeDefined();
      expect(post?.title).toBe("Test Post");
    });

    it("should increment view count when viewing post", async () => {
      const ctx = createTestContext(testUser);
      const caller = appRouter.createCaller(ctx);

      // Create a post
      const postResult = await caller.forum.createPost({
        title: "View Count Test",
        content: "Test",
        category: "general",
      });

      expect(postResult.postId).toBeTypeOf("number");
      expect(postResult.postId).toBeGreaterThan(0);

      // View it once
      const post1 = await caller.forum.post({ id: postResult.postId });
      const initialViews = post1?.viewCount || 0;

      // View it again
      const post2 = await caller.forum.post({ id: postResult.postId });
      const newViews = post2?.viewCount || 0;

      expect(newViews).toBeGreaterThan(initialViews);
    });
  });
});
