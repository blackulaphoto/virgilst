import { getDb } from "./db";
import { users, forumPosts, forumReplies, mapPins, pinComments } from "../drizzle/schema";
import { eq, sql, desc } from "drizzle-orm";

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: number;
  displayName: string | null;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: Date;
  stats: {
    postsCreated: number;
    repliesMade: number;
    pinsSubmitted: number;
    commentsPosted: number;
  };
}

/**
 * Get user profile by ID with activity stats
 */
export async function getUserProfile(userId: number): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) return null;

  const userData = user[0];

  // Get activity stats
  const [postsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(forumPosts)
    .where(eq(forumPosts.authorId, userId));

  const [repliesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(forumReplies)
    .where(eq(forumReplies.authorId, userId));

  const [pinsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mapPins)
    .where(eq(mapPins.submittedBy, userId));

  const [commentsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pinComments)
    .where(eq(pinComments.authorId, userId));

  return {
    id: userData.id,
    displayName: userData.displayName,
    name: userData.name,
    bio: userData.bio,
    location: userData.location,
    avatarUrl: userData.avatarUrl,
    role: userData.role,
    createdAt: userData.createdAt,
    stats: {
      postsCreated: Number(postsCount?.count || 0),
      repliesMade: Number(repliesCount?.count || 0),
      pinsSubmitted: Number(pinsCount?.count || 0),
      commentsPosted: Number(commentsCount?.count || 0),
    },
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: number, input: UpdateProfileInput): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};

  if (input.displayName !== undefined) {
    updateData.displayName = input.displayName;
  }
  if (input.bio !== undefined) {
    updateData.bio = input.bio;
  }
  if (input.location !== undefined) {
    updateData.location = input.location;
  }
  if (input.avatarUrl !== undefined) {
    updateData.avatarUrl = input.avatarUrl;
  }

  // Mark profile as complete if displayName is set
  if (input.displayName) {
    updateData.profileComplete = true;
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

/**
 * Get user's recent activity
 */
export async function getUserActivity(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get recent forum posts
  const recentPosts = await db
    .select({
      id: forumPosts.id,
      type: sql<string>`'post'`,
      title: forumPosts.title,
      content: forumPosts.content,
      createdAt: forumPosts.createdAt,
    })
    .from(forumPosts)
    .where(eq(forumPosts.authorId, userId))
    .orderBy(desc(forumPosts.createdAt))
    .limit(limit);

  // Get recent forum replies
  const recentReplies = await db
    .select({
      id: forumReplies.id,
      type: sql<string>`'reply'`,
      content: forumReplies.content,
      postId: forumReplies.postId,
      createdAt: forumReplies.createdAt,
    })
    .from(forumReplies)
    .where(eq(forumReplies.authorId, userId))
    .orderBy(desc(forumReplies.createdAt))
    .limit(limit);

  // Get recent map pins
  const recentPins = await db
    .select({
      id: mapPins.id,
      type: sql<string>`'pin'`,
      title: mapPins.title,
      pinType: mapPins.type,
      createdAt: mapPins.createdAt,
    })
    .from(mapPins)
    .where(eq(mapPins.submittedBy, userId))
    .orderBy(desc(mapPins.createdAt))
    .limit(limit);

  return {
    posts: recentPosts,
    replies: recentReplies,
    pins: recentPins,
  };
}

/**
 * Check if user needs to complete profile
 */
export async function needsProfileSetup(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) return false;

  return !user[0].profileComplete;
}
