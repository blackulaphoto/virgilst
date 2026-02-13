import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Chat Streaming", () => {
  let testUserId: number;
  let conversationId: number;

  beforeAll(async () => {
    // Create test user
    await db.upsertUser({
      openId: "test-streaming-user",
      displayName: "Test Streaming User",
    });

    const user = await db.getUserByOpenId("test-streaming-user");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;

    // Create test conversation
    const result = await db.createConversation({
      userId: testUserId,
      title: "Test Streaming Conversation",
    });
    conversationId = Number((result as any).insertId);
  });

  describe("Streaming Infrastructure", () => {
    it("should have invokeLLMStream function", async () => {
      const { invokeLLMStream } = await import("./_core/llm");
      expect(invokeLLMStream).toBeDefined();
      expect(typeof invokeLLMStream).toBe("function");
    });

    it("should create conversation and save messages", async () => {
      await db.createChatMessage({
        conversationId,
        role: "user",
        content: "Test streaming message",
      });

      const messages = await db.getConversationMessages(conversationId);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[messages.length - 1].content).toBe("Test streaming message");
    });
  });

  describe("Message History", () => {
    it("should retrieve conversation messages", async () => {
      const messages = await db.getConversationMessages(conversationId);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBeGreaterThan(0);
    });

    it("should save assistant responses", async () => {
      await db.createChatMessage({
        conversationId,
        role: "assistant",
        content: "Test assistant response",
      });

      const messages = await db.getConversationMessages(conversationId);
      const assistantMessages = messages.filter(m => m.role === "assistant");
      expect(assistantMessages.length).toBeGreaterThan(0);
    });
  });
});
