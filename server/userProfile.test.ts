import { describe, it, expect, beforeAll } from "vitest";
import { getUserProfile, updateUserProfile, getUserActivity, needsProfileSetup } from "./userProfile";
import * as db from "./db";

describe("User Profile System", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    await db.upsertUser({
      openId: "test-profile-user",
      name: "Test User",
      email: "test@example.com",
    });

    const user = await db.getUserByOpenId("test-profile-user");
    if (!user) throw new Error("Failed to create test user");
    testUserId = user.id;
  });

  it("should get user profile with stats", async () => {
    const profile = await getUserProfile(testUserId);
    
    expect(profile).toBeDefined();
    expect(profile?.id).toBe(testUserId);
    expect(profile?.stats).toBeDefined();
    expect(profile?.stats.postsCreated).toBeGreaterThanOrEqual(0);
    expect(profile?.stats.repliesMade).toBeGreaterThanOrEqual(0);
    expect(profile?.stats.pinsSubmitted).toBeGreaterThanOrEqual(0);
    expect(profile?.stats.commentsPosted).toBeGreaterThanOrEqual(0);
  });

  it("should return null for non-existent user", async () => {
    const profile = await getUserProfile(999999);
    expect(profile).toBeNull();
  });

  it("should update user profile", async () => {
    await updateUserProfile(testUserId, {
      displayName: "Test Display Name",
      bio: "Test bio",
      location: "Test Location",
    });

    const profile = await getUserProfile(testUserId);
    expect(profile?.displayName).toBe("Test Display Name");
    expect(profile?.bio).toBe("Test bio");
    expect(profile?.location).toBe("Test Location");
  });

  it("should mark profile as complete when displayName is set", async () => {
    // Create another test user
    await db.upsertUser({
      openId: "test-profile-incomplete",
      name: "Incomplete User",
    });

    const user = await db.getUserByOpenId("test-profile-incomplete");
    if (!user) throw new Error("Failed to create test user");

    // Check needs setup - new users have profileComplete=false by default
    let needsSetup = await needsProfileSetup(user.id);
    // If user already has displayName from OAuth, they don't need setup
    const initialNeedsSetup = !user.displayName;
    expect(needsSetup).toBe(initialNeedsSetup);

    // Update profile with displayName
    await updateUserProfile(user.id, {
      displayName: "Complete User",
    });

    // Check again
    needsSetup = await needsProfileSetup(user.id);
    expect(needsSetup).toBe(false);
  });

  it("should get user activity", async () => {
    const activity = await getUserActivity(testUserId, 5);
    
    expect(activity).toBeDefined();
    expect(activity.posts).toBeDefined();
    expect(activity.replies).toBeDefined();
    expect(activity.pins).toBeDefined();
    expect(Array.isArray(activity.posts)).toBe(true);
    expect(Array.isArray(activity.replies)).toBe(true);
    expect(Array.isArray(activity.pins)).toBe(true);
  });

  it("should handle partial profile updates", async () => {
    await updateUserProfile(testUserId, {
      bio: "Updated bio only",
    });

    const profile = await getUserProfile(testUserId);
    expect(profile?.bio).toBe("Updated bio only");
    // displayName should still be there
    expect(profile?.displayName).toBe("Test Display Name");
  });
});
