import { eq, desc, and, like, or, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  InsertUser,
  users,
  articles,
  resources,
  mapPins,
  pinComments,
  forumPosts,
  forumReplies,
  videos,
  chatConversations,
  chatMessages,
  favoriteArticles,
  favoriteMapPins,
  followedThreads,
  treatmentCenters,
  meetings,
  events,
  mediCalProviders,
  type Article,
  type Resource,
  type MapPin,
  type PinComment,
  type ForumPost,
  type ForumReply,
  type Video,
  type ChatConversation,
  type ChatMessage,
  type TreatmentCenter,
  type Meeting,
  type Event,
  type MediCalProvider,
  type InsertArticle,
  type InsertResource,
  type InsertMapPin,
  type InsertPinComment,
  type InsertTreatmentCenter,
  type InsertMeeting,
  type InsertEvent,
  type InsertForumPost,
  type InsertForumReply,
  type InsertVideo,
  type InsertChatConversation,
  type InsertChatMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

const SEARCH_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "can",
  "do",
  "for",
  "from",
  "get",
  "help",
  "i",
  "in",
  "is",
  "it",
  "know",
  "me",
  "my",
  "near",
  "need",
  "of",
  "on",
  "or",
  "the",
  "to",
  "we",
  "what",
  "where",
  "with",
  "you",
]);

function tokenizeSearchTerms(query: string): string[] {
  const base = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !SEARCH_STOPWORDS.has(t));

  const terms = new Set(base);
  const compact = query.toLowerCase().replace(/\s+/g, " ");

  if (compact.includes("medi-cal") || compact.includes("medi cal") || compact.includes("medicaid")) {
    terms.add("medi");
    terms.add("cal");
    terms.add("medicaid");
  }

  if (compact.includes("la") || compact.includes("los angeles")) {
    terms.add("los");
    terms.add("angeles");
  }

  if (compact.includes("koreatown")) {
    terms.add("koreatown");
    terms.add("los");
    terms.add("angeles");
  }

  return Array.from(terms);
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = createClient({ url: process.env.DATABASE_URL });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER HELPERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ARTICLE HELPERS ============

export async function getArticles(filters?: {
  category?: string;
  search?: string;
  isPublished?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(articles);
  const conditions = [];

  if (filters?.category) {
    conditions.push(eq(articles.category, filters.category as any));
  }
  if (filters?.isPublished !== undefined) {
    conditions.push(eq(articles.isPublished, filters.isPublished));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(articles.title, `%${filters.search}%`),
        like(articles.content, `%${filters.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(articles.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return result[0];
}

export async function createArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(articles).values(article).returning();
  return result[0];
}

export async function incrementArticleViews(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, id));
}

// ============ RESOURCE HELPERS ============

export async function getResources(filters?: {
  type?: string;
  zipCode?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(resources);
  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(resources.type, filters.type as any));
  }
  if (filters?.zipCode) {
    conditions.push(eq(resources.zipCode, filters.zipCode));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(resources.name, `%${filters.search}%`),
        like(resources.description, `%${filters.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(resources.isVerified), desc(resources.updatedAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function createResource(resource: InsertResource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(resources).values(resource).returning();
  return result[0];
}

// ============ MAP PIN HELPERS ============

export async function getMapPins(filters?: {
  type?: string;
  isApproved?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  // Build the query with comment count and submitter info
  let query = db
    .select({
      id: mapPins.id,
      title: mapPins.title,
      description: mapPins.description,
      type: mapPins.type,
      latitude: mapPins.latitude,
      longitude: mapPins.longitude,
      notes: mapPins.notes,
      submittedBy: mapPins.submittedBy,
      isApproved: mapPins.isApproved,
      upvotes: mapPins.upvotes,
      createdAt: mapPins.createdAt,
      commentCount: sql<number>`(SELECT COUNT(*) FROM ${pinComments} WHERE ${pinComments.pinId} = ${mapPins.id})`.as('commentCount'),
      submitter: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(mapPins)
    .leftJoin(users, eq(mapPins.submittedBy, users.id));

  const conditions = [];

  if (filters?.type) {
    conditions.push(eq(mapPins.type, filters.type as any));
  }
  if (filters?.isApproved !== undefined) {
    conditions.push(eq(mapPins.isApproved, filters.isApproved));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(mapPins.upvotes), desc(mapPins.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

export async function createMapPin(pin: InsertMapPin) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(mapPins).values(pin).returning();
  return result[0].id;
}

export async function approveMapPin(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(mapPins).set({ isApproved: true }).where(eq(mapPins.id, id));
}

// ============ FORUM HELPERS ============

export async function getForumPosts(filters?: {
  category?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select({
      id: forumPosts.id,
      title: forumPosts.title,
      content: forumPosts.content,
      category: forumPosts.category,
      authorId: forumPosts.authorId,
      isAnonymous: forumPosts.isAnonymous,
      isPinned: forumPosts.isPinned,
      viewCount: forumPosts.viewCount,
      replyCount: forumPosts.replyCount,
      createdAt: forumPosts.createdAt,
      updatedAt: forumPosts.updatedAt,
      // Author info
      authorName: users.name,
      authorDisplayName: users.displayName,
      authorAvatar: users.avatarUrl,
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.authorId, users.id));

  const conditions = [];

  if (filters?.category) {
    conditions.push(eq(forumPosts.category, filters.category as any));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(forumPosts.isPinned), desc(forumPosts.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

export async function getForumPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      id: forumPosts.id,
      title: forumPosts.title,
      content: forumPosts.content,
      category: forumPosts.category,
      authorId: forumPosts.authorId,
      isAnonymous: forumPosts.isAnonymous,
      isPinned: forumPosts.isPinned,
      upvotes: forumPosts.upvotes,
      viewCount: forumPosts.viewCount,
      replyCount: forumPosts.replyCount,
      createdAt: forumPosts.createdAt,
      updatedAt: forumPosts.updatedAt,
      // Author info
      authorName: users.name,
      authorDisplayName: users.displayName,
      authorAvatar: users.avatarUrl,
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.authorId, users.id))
    .where(eq(forumPosts.id, id))
    .limit(1);
  return result[0];
}

export async function createForumPost(post: InsertForumPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(forumPosts).values(post).returning();
  return { insertId: result[0].id };
}

export async function getForumReplies(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: forumReplies.id,
      postId: forumReplies.postId,
      parentReplyId: forumReplies.parentReplyId,
      content: forumReplies.content,
      authorId: forumReplies.authorId,
      isAnonymous: forumReplies.isAnonymous,
      upvotes: forumReplies.upvotes,
      createdAt: forumReplies.createdAt,
      updatedAt: forumReplies.updatedAt,
      // Author info
      authorName: users.name,
      authorDisplayName: users.displayName,
      authorAvatar: users.avatarUrl,
    })
    .from(forumReplies)
    .leftJoin(users, eq(forumReplies.authorId, users.id))
    .where(eq(forumReplies.postId, postId))
    .orderBy(forumReplies.createdAt);
}

export async function createForumReply(reply: InsertForumReply) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(forumReplies).values(reply);
  
  // Increment reply count
  await db.update(forumPosts).set({ replyCount: sql`${forumPosts.replyCount} + 1` }).where(eq(forumPosts.id, reply.postId));
}

// ============ VIDEO HELPERS ============

export async function getVideos(filters?: {
  category?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(videos);
  const conditions = [];

  if (filters?.category) {
    conditions.push(eq(videos.category, filters.category as any));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(videos.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  return await query;
}

export async function createVideo(video: InsertVideo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(videos).values(video).returning();
  return result[0];
}

// ============ CHAT HELPERS ============

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(desc(chatConversations.lastMessageAt));
}

export async function createConversation(conversation: InsertChatConversation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(chatConversations)
    .values(conversation)
    .returning({ id: chatConversations.id });

  const id = Number(result[0]?.id);
  if (!Number.isFinite(id)) {
    throw new Error("Failed to create conversation: invalid insert id");
  }

  return { insertId: id };
}

export async function getConversationMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}

export async function createChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatMessages).values(message);
  
  // Update conversation last message time
  await db.update(chatConversations).set({ lastMessageAt: new Date() }).where(eq(chatConversations.id, message.conversationId));
}

// ============ SEARCH HELPERS ============

export async function globalSearch(query: string, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return { articles: [], forumPosts: [], resources: [] };

  const searchPattern = `%${query}%`;

  const [articleResults, forumResults, resourceResults] = await Promise.all([
    db.select().from(articles)
      .where(
        and(
          eq(articles.isPublished, true),
          or(
            like(articles.title, searchPattern),
            like(articles.content, searchPattern)
          )
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(forumPosts)
      .where(
        or(
          like(forumPosts.title, searchPattern),
          like(forumPosts.content, searchPattern)
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(resources)
      .where(
        or(
          like(resources.name, searchPattern),
          like(resources.description, searchPattern)
        )
      )
      .limit(limit)
      .offset(offset)
  ]);

  return {
    articles: articleResults,
    forumPosts: forumResults,
    resources: resourceResults
  };
}

export async function incrementForumPostViews(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(forumPosts).set({ viewCount: sql`${forumPosts.viewCount} + 1` }).where(eq(forumPosts.id, id));
}

export async function upvoteForumPost(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(forumPosts).set({ upvotes: sql`${forumPosts.upvotes} + 1` }).where(eq(forumPosts.id, id));
}

export async function upvoteForumReply(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(forumReplies).set({ upvotes: sql`${forumReplies.upvotes} + 1` }).where(eq(forumReplies.id, id));
}


// ============================================================================
// Pin Comments
// ============================================================================

export async function getPinComments(pinId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: pinComments.id,
      pinId: pinComments.pinId,
      authorId: pinComments.authorId,
      content: pinComments.content,
      isAnonymous: pinComments.isAnonymous,
      createdAt: pinComments.createdAt,
      author: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(pinComments)
    .leftJoin(users, eq(pinComments.authorId, users.id))
    .where(eq(pinComments.pinId, pinId))
    .orderBy(desc(pinComments.createdAt));
}

export async function createPinComment(comment: InsertPinComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pinComments).values(comment).returning();
  return { insertId: result[0].id };
}

export async function getPinCommentCount(pinId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(pinComments)
    .where(eq(pinComments.pinId, pinId));

  return result[0]?.count || 0;
}

export async function getRecentPinComments(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: pinComments.id,
      pinId: pinComments.pinId,
      authorId: pinComments.authorId,
      content: pinComments.content,
      isAnonymous: pinComments.isAnonymous,
      createdAt: pinComments.createdAt,
      author: {
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      },
      pin: {
        id: mapPins.id,
        title: mapPins.title,
        type: mapPins.type,
        latitude: mapPins.latitude,
        longitude: mapPins.longitude,
      },
    })
    .from(pinComments)
    .leftJoin(users, eq(pinComments.authorId, users.id))
    .innerJoin(mapPins, eq(pinComments.pinId, mapPins.id))
    .where(eq(mapPins.isApproved, 1))
    .orderBy(desc(pinComments.createdAt))
    .limit(limit);
}


// ============ FAVORITES HELPERS ============

export async function addFavoriteArticle(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(favoriteArticles).values({ userId, articleId });
  return { success: true };
}

export async function removeFavoriteArticle(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(favoriteArticles).where(
    and(
      eq(favoriteArticles.userId, userId),
      eq(favoriteArticles.articleId, articleId)
    )
  );
}

export async function getFavoriteArticles(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: favoriteArticles.id,
      articleId: articles.id,
      title: articles.title,
      slug: articles.slug,
      category: articles.category,
      summary: articles.summary,
      createdAt: favoriteArticles.createdAt,
    })
    .from(favoriteArticles)
    .innerJoin(articles, eq(favoriteArticles.articleId, articles.id))
    .where(eq(favoriteArticles.userId, userId))
    .orderBy(desc(favoriteArticles.createdAt));

  return results;
}

export async function isArticleFavorited(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(favoriteArticles)
    .where(
      and(
        eq(favoriteArticles.userId, userId),
        eq(favoriteArticles.articleId, articleId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function addFavoriteMapPin(userId: number, pinId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(favoriteMapPins).values({ userId, pinId });
  return { success: true };
}

export async function removeFavoriteMapPin(userId: number, pinId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(favoriteMapPins).where(
    and(
      eq(favoriteMapPins.userId, userId),
      eq(favoriteMapPins.pinId, pinId)
    )
  );
}

export async function getFavoriteMapPins(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: favoriteMapPins.id,
      pinId: mapPins.id,
      title: mapPins.title,
      type: mapPins.type,
      latitude: mapPins.latitude,
      longitude: mapPins.longitude,
      description: mapPins.description,
      createdAt: favoriteMapPins.createdAt,
    })
    .from(favoriteMapPins)
    .innerJoin(mapPins, eq(favoriteMapPins.pinId, mapPins.id))
    .where(eq(favoriteMapPins.userId, userId))
    .orderBy(desc(favoriteMapPins.createdAt));

  return results;
}

export async function isMapPinFavorited(userId: number, pinId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(favoriteMapPins)
    .where(
      and(
        eq(favoriteMapPins.userId, userId),
        eq(favoriteMapPins.pinId, pinId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function followThread(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(followedThreads).values({ userId, postId });
  return { success: true };
}

export async function unfollowThread(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(followedThreads).where(
    and(
      eq(followedThreads.userId, userId),
      eq(followedThreads.postId, postId)
    )
  );
}

export async function getFollowedThreads(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: followedThreads.id,
      postId: forumPosts.id,
      title: forumPosts.title,
      category: forumPosts.category,
      replyCount: forumPosts.replyCount,
      upvotes: forumPosts.upvotes,
      createdAt: followedThreads.createdAt,
    })
    .from(followedThreads)
    .innerJoin(forumPosts, eq(followedThreads.postId, forumPosts.id))
    .where(eq(followedThreads.userId, userId))
    .orderBy(desc(followedThreads.createdAt));

  return results;
}

export async function isThreadFollowed(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(followedThreads)
    .where(
      and(
        eq(followedThreads.userId, userId),
        eq(followedThreads.postId, postId)
      )
    )
    .limit(1);

  return result.length > 0;
}


// ========================================
// Treatment Centers
// ========================================

export async function getAllTreatmentCenters(filters?: {
  type?: string;
  city?: string;
  acceptsMediCal?: boolean;
  acceptsCouples?: boolean;
  servesPopulation?: string;
}): Promise<TreatmentCenter[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(treatmentCenters.isPublished, true)];
  
  if (filters?.type) {
    conditions.push(eq(treatmentCenters.type, filters.type as any));
  }
  if (filters?.city) {
    conditions.push(like(treatmentCenters.city, `%${filters.city}%`));
  }
  if (filters?.acceptsMediCal !== undefined) {
    conditions.push(eq(treatmentCenters.acceptsMediCal, filters.acceptsMediCal));
  }
  if (filters?.acceptsCouples !== undefined) {
    conditions.push(eq(treatmentCenters.acceptsCouples, filters.acceptsCouples));
  }
  if (filters?.servesPopulation) {
    conditions.push(eq(treatmentCenters.servesPopulation, filters.servesPopulation as any));
  }

  const results = await db
    .select()
    .from(treatmentCenters)
    .where(and(...conditions))
    .orderBy(desc(treatmentCenters.createdAt));

  return results;
}

export async function getTreatmentCenterById(id: number): Promise<TreatmentCenter | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(treatmentCenters)
    .where(eq(treatmentCenters.id, id))
    .limit(1);

  return results[0];
}

export async function createTreatmentCenter(center: InsertTreatmentCenter): Promise<TreatmentCenter> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(treatmentCenters).values(center).returning();
  return result[0];
}

export async function updateTreatmentCenter(id: number, updates: Partial<InsertTreatmentCenter>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(treatmentCenters)
    .set(updates)
    .where(eq(treatmentCenters.id, id));
}

export async function deleteTreatmentCenter(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(treatmentCenters).where(eq(treatmentCenters.id, id));
}

// ============ MEETINGS ============

export async function getMeetings(filters?: {
  type?: string;
  dayOfWeek?: string;
  meetingMode?: string;
  city?: string;
}): Promise<Meeting[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(meetings.isPublished, true)];

  if (filters?.type) {
    conditions.push(eq(meetings.type, filters.type as any));
  }
  if (filters?.dayOfWeek) {
    conditions.push(eq(meetings.dayOfWeek, filters.dayOfWeek));
  }
  if (filters?.meetingMode) {
    conditions.push(eq(meetings.meetingMode, filters.meetingMode as any));
  }
  if (filters?.city) {
    conditions.push(like(meetings.city, `%${filters.city}%`));
  }

  const results = await db
    .select()
    .from(meetings)
    .where(and(...conditions))
    .orderBy(meetings.dayOfWeek, meetings.time);

  return results;
}

export async function getMeetingById(id: number): Promise<Meeting | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, id))
    .limit(1);

  return results[0];
}

export async function searchMeetings(query: string): Promise<Meeting[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(meetings)
    .where(
      and(
        eq(meetings.isPublished, true),
        or(
          like(meetings.name, `%${query}%`),
          like(meetings.venueName, `%${query}%`),
          like(meetings.city, `%${query}%`),
          like(meetings.description, `%${query}%`)
        )
      )
    )
    .orderBy(meetings.dayOfWeek, meetings.time);

  return results;
}

// ============ EVENTS ============

export async function getEvents(filters?: {
  eventType?: string;
  category?: string;
  city?: string;
  isRecurring?: boolean;
  isFeatured?: boolean;
}): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(events.isPublished, 1)];

  if (filters?.eventType) {
    conditions.push(eq(events.eventType, filters.eventType));
  }
  if (filters?.category) {
    conditions.push(eq(events.category, filters.category));
  }
  if (filters?.city) {
    conditions.push(like(events.city, `%${filters.city}%`));
  }
  if (filters?.isRecurring !== undefined) {
    conditions.push(eq(events.isRecurring, filters.isRecurring ? 1 : 0));
  }
  if (filters?.isFeatured !== undefined) {
    conditions.push(eq(events.isFeatured, filters.isFeatured ? 1 : 0));
  }

  const results = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.isFeatured), events.startDate);

  return results;
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  return results[0];
}

export async function searchEvents(query: string): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isPublished, 1),
        or(
          like(events.title, `%${query}%`),
          like(events.description, `%${query}%`),
          like(events.venueName, `%${query}%`),
          like(events.city, `%${query}%`)
        )
      )
    )
    .orderBy(desc(events.isFeatured), events.startDate);

  return results;
}

export async function createEvent(event: InsertEvent): Promise<Event> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .insert(events)
    .values(event)
    .returning();

  return results[0];
}

export async function updateEvent(id: number, event: Partial<InsertEvent>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(events)
    .set({ ...event, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(events.id, id));
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(events).where(eq(events.id, id));
}

export async function searchTreatmentCenters(query: string): Promise<TreatmentCenter[]> {
  const db = await getDb();
  if (!db) return [];

  const terms = tokenizeSearchTerms(query);
  const wantsMediCal = /\bmedi[-\s]?cal\b|\bmedicaid\b/i.test(query);

  const tokenConditions = terms.map(term =>
    or(
      like(treatmentCenters.name, `%${term}%`),
      like(treatmentCenters.description, `%${term}%`),
      like(treatmentCenters.city, `%${term}%`),
      like(treatmentCenters.address, `%${term}%`),
      like(treatmentCenters.type, `%${term}%`),
      like(treatmentCenters.servicesOffered, `%${term}%`)
    )
  );

  const textMatcher =
    tokenConditions.length > 0
      ? or(
          like(treatmentCenters.name, `%${query}%`),
          like(treatmentCenters.description, `%${query}%`),
          like(treatmentCenters.city, `%${query}%`),
          like(treatmentCenters.address, `%${query}%`),
          ...tokenConditions
        )
      : or(
          like(treatmentCenters.name, `%${query}%`),
          like(treatmentCenters.description, `%${query}%`),
          like(treatmentCenters.city, `%${query}%`),
          like(treatmentCenters.address, `%${query}%`)
        );

  const conditions = [eq(treatmentCenters.isPublished, 1), textMatcher];
  if (wantsMediCal) {
    conditions.push(eq(treatmentCenters.acceptsMediCal, 1));
  }

  const results = await db
    .select()
    .from(treatmentCenters)
    .where(and(...conditions))
    .orderBy(desc(treatmentCenters.createdAt));

  return results;
}

export async function searchResources(query: string, limit: number = 50): Promise<Resource[]> {
  const db = await getDb();
  if (!db) return [];

  const terms = tokenizeSearchTerms(query);
  const tokenConditions = terms.map(term =>
    or(
      like(resources.name, `%${term}%`),
      like(resources.description, `%${term}%`),
      like(resources.type, `%${term}%`),
      like(resources.address, `%${term}%`),
      like(resources.filters, `%${term}%`)
    )
  );

  const textMatcher =
    tokenConditions.length > 0
      ? or(
          like(resources.name, `%${query}%`),
          like(resources.description, `%${query}%`),
          like(resources.address, `%${query}%`),
          ...tokenConditions
        )
      : or(
          like(resources.name, `%${query}%`),
          like(resources.description, `%${query}%`),
          like(resources.address, `%${query}%`)
        );

  const results = await db
    .select()
    .from(resources)
    .where(textMatcher)
    .orderBy(desc(resources.isVerified), desc(resources.updatedAt))
    .limit(limit);

  return results;
}

// ============ MEDI-CAL PROVIDERS ============

export async function getMediCalProviders(filters: {
  city?: string;
  specialty?: string;
  language?: string;
  zipCode?: string;
  gender?: string;
  limit?: number;
  offset?: number;
}): Promise<MediCalProvider[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.city) {
    conditions.push(like(mediCalProviders.city, `%${filters.city}%`));
  }

  if (filters.specialty) {
    conditions.push(like(mediCalProviders.specialties, `%${filters.specialty}%`));
  }

  if (filters.language) {
    conditions.push(like(mediCalProviders.languagesSpoken, `%${filters.language}%`));
  }

  if (filters.zipCode) {
    conditions.push(eq(mediCalProviders.zipCode, filters.zipCode));
  }

  if (filters.gender) {
    conditions.push(eq(mediCalProviders.gender, filters.gender));
  }

  let query = db
    .select()
    .from(mediCalProviders);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(mediCalProviders.city, mediCalProviders.providerName) as any;

  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }

  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }

  const results = await query;
  return results;
}

export async function searchMediCalProviders(
  query: string,
  limit: number = 100,
  offset: number = 0
): Promise<MediCalProvider[]> {
  const db = await getDb();
  if (!db) return [];

  const terms = tokenizeSearchTerms(query);
  const tokenConditions = terms.map(term =>
    or(
      like(mediCalProviders.providerName, `%${term}%`),
      like(mediCalProviders.facilityName, `%${term}%`),
      like(mediCalProviders.city, `%${term}%`),
      like(mediCalProviders.specialties, `%${term}%`),
      like(mediCalProviders.address, `%${term}%`),
      like(mediCalProviders.zipCode, `%${term}%`),
      like(mediCalProviders.npi, `%${term}%`)
    )
  );

  const textMatcher =
    tokenConditions.length > 0
      ? or(
          like(mediCalProviders.providerName, `%${query}%`),
          like(mediCalProviders.facilityName, `%${query}%`),
          like(mediCalProviders.city, `%${query}%`),
          like(mediCalProviders.specialties, `%${query}%`),
          ...tokenConditions
        )
      : or(
          like(mediCalProviders.providerName, `%${query}%`),
          like(mediCalProviders.facilityName, `%${query}%`),
          like(mediCalProviders.city, `%${query}%`),
          like(mediCalProviders.specialties, `%${query}%`)
        );

  const results = await db
    .select()
    .from(mediCalProviders)
    .where(textMatcher)
    .orderBy(mediCalProviders.city, mediCalProviders.providerName)
    .limit(limit)
    .offset(offset);

  return results;
}

export async function getMediCalProviderById(id: number): Promise<MediCalProvider | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(mediCalProviders)
    .where(eq(mediCalProviders.id, id));

  return results[0] || null;
}

export async function getMediCalCities(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .selectDistinct({ city: mediCalProviders.city })
    .from(mediCalProviders)
    .where(sql`${mediCalProviders.city} IS NOT NULL`)
    .orderBy(mediCalProviders.city);

  return results.map(r => r.city).filter(Boolean) as string[];
}

export async function getMediCalSpecialties(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({ specialties: mediCalProviders.specialties })
    .from(mediCalProviders)
    .where(sql`${mediCalProviders.specialties} IS NOT NULL AND ${mediCalProviders.specialties} != '[]'`);

  const specialtiesSet = new Set<string>();

  for (const row of results) {
    try {
      const parsed = JSON.parse(row.specialties || '[]');
      if (Array.isArray(parsed)) {
        parsed.forEach(s => specialtiesSet.add(s));
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }

  return Array.from(specialtiesSet).sort();
}
