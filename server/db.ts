import { eq, desc, and, like, ilike, or, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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
  providerCategories,
  serviceSubmissions,
  communitySupportRequests,
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
  type ServiceSubmission,
  type CommunitySupportRequest,
  type InsertArticle,
  type InsertResource,
  type InsertMapPin,
  type InsertPinComment,
  type InsertTreatmentCenter,
  type InsertMeeting,
  type InsertEvent,
  type InsertServiceSubmission,
  type InsertCommunitySupportRequest,
  type InsertForumPost,
  type InsertForumReply,
  type InsertVideo,
  type InsertChatConversation,
  type InsertChatMessage,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { scrapeWebsiteMetadata } from "./webScraper";
import {
  MEDI_CAL_CATEGORY_DEFS,
  type MediCalCategoryKey,
  expandMediCalSearchTerms,
  categorizeSpecialties,
  isValidMediCalCategory,
} from "../shared/mediCalTaxonomy";

let _db: ReturnType<typeof drizzle> | null = null;
let _serviceSubmissionsEnsured = false;
let _communitySupportRequestsEnsured = false;
let _resourcesFeaturedEnsured = false;
let _treatmentFeaturedEnsured = false;
let _resourcesWebsiteMetadataEnsured = false;
let _treatmentWebsiteMetadataEnsured = false;

function normalizeEpochSeconds(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 2147483647) {
      return Math.floor(value / 1000);
    }
    return Math.floor(value);
  }
  return undefined;
}

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

type ServiceSubmissionCategory =
  | "resource"
  | "treatment_center"
  | "recovery_meeting"
  | "medi_cal_provider"
  | "community_event";

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function ensureServiceSubmissionsTable(): Promise<void> {
  if (_serviceSubmissionsEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS service_submissions (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      title TEXT NOT NULL,
      description TEXT,
      address TEXT,
      city TEXT,
      "zipCode" TEXT,
      website TEXT,
      "submitterName" TEXT,
      "submitterEmail" TEXT,
      "submitterPhone" TEXT,
      payload TEXT,
      "submittedBy" INTEGER,
      "reviewedBy" INTEGER,
      "reviewNotes" TEXT,
      "approvedEntityType" TEXT,
      "approvedEntityId" INTEGER,
      "reviewedAt" INTEGER,
      "createdAt" INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
      "updatedAt" INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
    )
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS "serviceSubmissions_status_idx" ON service_submissions (status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "serviceSubmissions_category_idx" ON service_submissions (category)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "serviceSubmissions_created_idx" ON service_submissions ("createdAt")`);

  _serviceSubmissionsEnsured = true;
}

async function ensureCommunitySupportRequestsTable(): Promise<void> {
  if (_communitySupportRequestsEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS community_support_requests (
      id SERIAL PRIMARY KEY,
      "requestType" TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      organization TEXT,
      message TEXT,
      "reviewedBy" INTEGER,
      "reviewNotes" TEXT,
      "reviewedAt" INTEGER,
      "createdAt" INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER,
      "updatedAt" INTEGER NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
    )
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS "communitySupportRequests_type_idx" ON community_support_requests ("requestType")`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "communitySupportRequests_status_idx" ON community_support_requests (status)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "communitySupportRequests_created_idx" ON community_support_requests ("createdAt")`);

  _communitySupportRequestsEnsured = true;
}

async function ensureResourcesFeaturedColumn(): Promise<void> {
  if (_resourcesFeaturedEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    ALTER TABLE resources
    ADD COLUMN IF NOT EXISTS "isFeatured" INTEGER NOT NULL DEFAULT 0
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "resources_featured_idx" ON resources ("isFeatured")`);

  _resourcesFeaturedEnsured = true;
}

async function ensureResourcesWebsiteMetadataColumns(): Promise<void> {
  if (_resourcesWebsiteMetadataEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteTitle" TEXT`);
  await db.execute(sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteDescription" TEXT`);
  await db.execute(sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteImage" TEXT`);
  await db.execute(sql`ALTER TABLE resources ADD COLUMN IF NOT EXISTS "websiteFavicon" TEXT`);

  _resourcesWebsiteMetadataEnsured = true;
}

async function ensureTreatmentFeaturedColumn(): Promise<void> {
  if (_treatmentFeaturedEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    ALTER TABLE treatment_centers
    ADD COLUMN IF NOT EXISTS "isFeatured" INTEGER NOT NULL DEFAULT 0
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "treatmentCenters_featured_idx" ON treatment_centers ("isFeatured")`);

  _treatmentFeaturedEnsured = true;
}

async function ensureTreatmentWebsiteMetadataColumns(): Promise<void> {
  if (_treatmentWebsiteMetadataEnsured) return;
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteTitle" TEXT`);
  await db.execute(sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteDescription" TEXT`);
  await db.execute(sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteImage" TEXT`);
  await db.execute(sql`ALTER TABLE treatment_centers ADD COLUMN IF NOT EXISTS "websiteFavicon" TEXT`);

  _treatmentWebsiteMetadataEnsured = true;
}

async function refreshResourceWebsiteMetadata(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureResourcesWebsiteMetadataColumns();

  const row = await db
    .select({ id: resources.id, website: resources.website })
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);

  const website = row[0]?.website;
  if (!website) return;
  const normalizedUrl = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  const metadata = await scrapeWebsiteMetadata(normalizedUrl);
  if (!metadata.success) return;

  await db
    .update(resources)
    .set({
      websiteTitle: metadata.title,
      websiteDescription: metadata.description,
      websiteImage: metadata.imageUrl,
      websiteFavicon: metadata.faviconUrl,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(resources.id, id));
}

async function refreshTreatmentWebsiteMetadata(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureTreatmentWebsiteMetadataColumns();

  const row = await db
    .select({ id: treatmentCenters.id, website: treatmentCenters.website })
    .from(treatmentCenters)
    .where(eq(treatmentCenters.id, id))
    .limit(1);

  const website = row[0]?.website;
  if (!website) return;
  const normalizedUrl = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  const metadata = await scrapeWebsiteMetadata(normalizedUrl);
  if (!metadata.success) return;

  await db
    .update(treatmentCenters)
    .set({
      websiteTitle: metadata.title,
      websiteDescription: metadata.description,
      websiteImage: metadata.imageUrl,
      websiteFavicon: metadata.faviconUrl,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(treatmentCenters.id, id));
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
      const normalizedLastSignedIn = normalizeEpochSeconds(user.lastSignedIn);
      if (normalizedLastSignedIn !== undefined) {
        values.lastSignedIn = normalizedLastSignedIn;
        updateSet.lastSignedIn = normalizedLastSignedIn;
      }
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = Math.floor(Date.now() / 1000);
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = Math.floor(Date.now() / 1000);
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
    conditions.push(eq(articles.isPublished, filters.isPublished ? 1 : 0));
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
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  await ensureResourcesFeaturedColumn();
  await ensureResourcesWebsiteMetadataColumns();

  let query = db.select().from(resources);
  const conditions = [];

  if (filters?.type) {
    // Handle legal_aid to also include "legal" type for backwards compatibility
    if (filters.type === 'legal_aid') {
      conditions.push(or(
        eq(resources.type, 'legal_aid' as any),
        eq(resources.type, 'legal' as any)
      ));
    } else {
      conditions.push(eq(resources.type, filters.type as any));
    }
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
  if (filters?.featuredOnly) {
    conditions.push(eq(resources.isFeatured, 1));
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
  await ensureResourcesFeaturedColumn();
  await ensureResourcesWebsiteMetadataColumns();

  const result = await db.insert(resources).values(resource).returning();
  return result[0];
}

export async function setResourceFeatured(id: number, isFeatured: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureResourcesFeaturedColumn();
  await ensureResourcesWebsiteMetadataColumns();

  await db
    .update(resources)
    .set({
      isFeatured: isFeatured ? 1 : 0,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(resources.id, id));

  if (isFeatured) {
    await refreshResourceWebsiteMetadata(id);
  }
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
    conditions.push(eq(mapPins.isApproved, filters.isApproved ? 1 : 0));
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

  await db.update(mapPins).set({ isApproved: 1 }).where(eq(mapPins.id, id));
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

export async function updateVideo(id: number, updates: Partial<InsertVideo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(videos).set(updates).where(eq(videos.id, id));
}

export async function deleteVideo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(videos).where(eq(videos.id, id));
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
  await db
    .update(chatConversations)
    .set({ lastMessageAt: Math.floor(Date.now() / 1000) })
    .where(eq(chatConversations.id, message.conversationId));
}

// ============ SEARCH HELPERS ============

export async function globalSearch(query: string, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) {
    return {
      articles: [],
      forumPosts: [],
      resources: [],
      treatmentCenters: [],
      mediCalProviders: [],
      meetings: [],
      events: [],
      mapPins: [],
      videos: [],
      jobs: [],
    };
  }

  const searchPattern = `%${query}%`;
  const safeJobsSearch = async () => {
    try {
      const { jobs } = await import("../drizzle/schema");
      const jobsResults = await db
        .select()
        .from(jobs)
        .where(
          and(
            eq(jobs.isActive, true),
            or(
              ilike(jobs.title, searchPattern),
              ilike(jobs.company, searchPattern),
              ilike(jobs.location, searchPattern),
              ilike(jobs.description, searchPattern),
              ilike(jobs.category, searchPattern)
            )
          )
        )
        .orderBy(desc(jobs.createdAt))
        .limit(limit)
        .offset(offset);
      return jobsResults;
    } catch {
      return [];
    }
  };

  const [
    articleResults,
    forumResults,
    resourceResults,
    treatmentResults,
    providerResults,
    meetingResults,
    eventResults,
    mapPinResults,
    videoResults,
    jobResults,
  ] = await Promise.all([
    db.select().from(articles)
      .where(
        and(
          eq(articles.isPublished, 1),
          or(
            like(articles.title, searchPattern),
            like(articles.content, searchPattern),
            like(articles.summary, searchPattern),
            like(articles.tags, searchPattern)
          )
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(forumPosts)
      .where(
        or(
          like(forumPosts.title, searchPattern),
          like(forumPosts.content, searchPattern),
          like(forumPosts.category, searchPattern)
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(resources)
      .where(
        or(
          like(resources.name, searchPattern),
          like(resources.description, searchPattern),
          like(resources.type, searchPattern),
          like(resources.filters, searchPattern),
          like(resources.address, searchPattern)
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(treatmentCenters)
      .where(
        and(
          eq(treatmentCenters.isPublished, 1),
          or(
            like(treatmentCenters.name, searchPattern),
            like(treatmentCenters.description, searchPattern),
            like(treatmentCenters.type, searchPattern),
            like(treatmentCenters.city, searchPattern),
            like(treatmentCenters.servicesOffered, searchPattern)
          )
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(mediCalProviders)
      .where(
        or(
          like(mediCalProviders.providerName, searchPattern),
          like(mediCalProviders.facilityName, searchPattern),
          like(mediCalProviders.city, searchPattern),
          like(mediCalProviders.specialties, searchPattern),
          like(mediCalProviders.searchTerms, searchPattern)
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(meetings)
      .where(
        and(
          eq(meetings.isPublished, 1),
          or(
            like(meetings.name, searchPattern),
            like(meetings.description, searchPattern),
            like(meetings.venueName, searchPattern),
            like(meetings.city, searchPattern),
            like(meetings.tags, searchPattern)
          )
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(events)
      .where(
        and(
          eq(events.isPublished, 1),
          or(
            like(events.title, searchPattern),
            like(events.description, searchPattern),
            like(events.eventType, searchPattern),
            like(events.category, searchPattern),
            like(events.tags, searchPattern),
            like(events.servicesOffered, searchPattern),
            like(events.city, searchPattern)
          )
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(mapPins)
      .where(
        and(
          eq(mapPins.isApproved, 1),
          or(
            like(mapPins.title, searchPattern),
            like(mapPins.description, searchPattern),
            like(mapPins.notes, searchPattern),
            like(mapPins.type, searchPattern)
          )
        )
      )
      .limit(limit)
      .offset(offset),
    db.select().from(videos)
      .where(
        or(
          like(videos.title, searchPattern),
          like(videos.description, searchPattern),
          like(videos.category, searchPattern)
        )
      )
      .limit(limit)
      .offset(offset),
    safeJobsSearch(),
  ]);

  return {
    articles: articleResults,
    forumPosts: forumResults,
    resources: resourceResults,
    treatmentCenters: treatmentResults,
    mediCalProviders: providerResults,
    meetings: meetingResults,
    events: eventResults,
    mapPins: mapPinResults,
    videos: videoResults,
    jobs: jobResults,
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
  acceptsPrivateInsurance?: boolean;
  acceptsCouples?: boolean;
  servesPopulation?: string;
  featuredOnly?: boolean;
}): Promise<TreatmentCenter[]> {
  const db = await getDb();
  if (!db) return [];
  await ensureTreatmentFeaturedColumn();
  await ensureTreatmentWebsiteMetadataColumns();

  const conditions = [eq(treatmentCenters.isPublished, 1)];

  if (filters?.type) {
    conditions.push(eq(treatmentCenters.type, filters.type as any));
  }
  if (filters?.city) {
    // Use ilike for case-insensitive city search
    conditions.push(ilike(treatmentCenters.city, `%${filters.city}%`));
  }
  if (filters?.acceptsMediCal !== undefined) {
    conditions.push(eq(treatmentCenters.acceptsMediCal, filters.acceptsMediCal ? 1 : 0));
  }
  if (filters?.acceptsPrivateInsurance !== undefined) {
    conditions.push(eq(treatmentCenters.acceptsPrivateInsurance, filters.acceptsPrivateInsurance ? 1 : 0));
  }
  if (filters?.acceptsCouples !== undefined) {
    conditions.push(eq(treatmentCenters.acceptsCouples, filters.acceptsCouples ? 1 : 0));
  }
  if (filters?.servesPopulation) {
    conditions.push(eq(treatmentCenters.servesPopulation, filters.servesPopulation as any));
  }
  if (filters?.featuredOnly) {
    conditions.push(eq(treatmentCenters.isFeatured, 1));
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
  await ensureTreatmentFeaturedColumn();
  await ensureTreatmentWebsiteMetadataColumns();

  const result = await db.insert(treatmentCenters).values(center).returning();
  return result[0];
}

export async function updateTreatmentCenter(id: number, updates: Partial<InsertTreatmentCenter>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureTreatmentFeaturedColumn();
  await ensureTreatmentWebsiteMetadataColumns();

  await db
    .update(treatmentCenters)
    .set(updates)
    .where(eq(treatmentCenters.id, id));
}

export async function setTreatmentCenterFeatured(id: number, isFeatured: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await ensureTreatmentFeaturedColumn();
  await ensureTreatmentWebsiteMetadataColumns();

  await db
    .update(treatmentCenters)
    .set({
      isFeatured: isFeatured ? 1 : 0,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(treatmentCenters.id, id));

  if (isFeatured) {
    await refreshTreatmentWebsiteMetadata(id);
  }
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

  const conditions = [eq(meetings.isPublished, 1)];

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
        eq(meetings.isPublished, 1),
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

export async function createMeeting(meeting: InsertMeeting): Promise<Meeting> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db.insert(meetings).values(meeting).returning();
  return results[0];
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
  return searchTreatmentCentersWithFilters(query, {});
}

export async function searchTreatmentCentersWithFilters(
  query: string,
  filters: {
    acceptsMediCal?: number;
    acceptsCouples?: number;
    servesPopulation?: string | string[];
  }
): Promise<TreatmentCenter[]> {
  const db = await getDb();
  if (!db) return [];

  const terms = tokenizeSearchTerms(query);
  const wantsMediCal = /\bmedi[-\s]?cal\b|\bmedicaid\b/i.test(query);

  const tokenConditions = terms.map(term =>
    or(
      ilike(treatmentCenters.name, `%${term}%`),
      ilike(treatmentCenters.description, `%${term}%`),
      ilike(treatmentCenters.city, `%${term}%`),
      ilike(treatmentCenters.address, `%${term}%`),
      ilike(treatmentCenters.type, `%${term}%`),
      ilike(treatmentCenters.servicesOffered, `%${term}%`)
    )
  );

  const textMatcher =
    tokenConditions.length > 0
      ? or(
          ilike(treatmentCenters.name, `%${query}%`),
          ilike(treatmentCenters.description, `%${query}%`),
          ilike(treatmentCenters.city, `%${query}%`),
          ilike(treatmentCenters.address, `%${query}%`),
          ...tokenConditions
        )
      : or(
          ilike(treatmentCenters.name, `%${query}%`),
          ilike(treatmentCenters.description, `%${query}%`),
          ilike(treatmentCenters.city, `%${query}%`),
          ilike(treatmentCenters.address, `%${query}%`)
        );

  const conditions = [eq(treatmentCenters.isPublished, 1), textMatcher];

  // Add Medi-Cal filter from query or explicit filter
  if (wantsMediCal || filters.acceptsMediCal !== undefined) {
    conditions.push(eq(treatmentCenters.acceptsMediCal, filters.acceptsMediCal ?? 1));
  }

  // Add couples filter
  if (filters.acceptsCouples !== undefined) {
    conditions.push(eq(treatmentCenters.acceptsCouples, filters.acceptsCouples));
  }

  // Add population filter (can be array or single value)
  if (filters.servesPopulation) {
    if (Array.isArray(filters.servesPopulation)) {
      conditions.push(
        or(...filters.servesPopulation.map(pop =>
          eq(treatmentCenters.servesPopulation, pop)
        ))
      );
    } else {
      conditions.push(eq(treatmentCenters.servesPopulation, filters.servesPopulation));
    }
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
  category?: string;
  language?: string;
  zipCode?: string;
  gender?: string;
  limit?: number;
  offset?: number;
}): Promise<MediCalProvider[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  if (filters.city) {
    conditions.push(ilike(mediCalProviders.city, `%${filters.city}%`));
  }

  if (filters.specialty) {
    conditions.push(
      or(
        ilike(mediCalProviders.specialties, `%${filters.specialty}%`),
        ilike(mediCalProviders.normalizedSpecialties, `%${filters.specialty}%`)
      )
    );
  }

  if (filters.language) {
    conditions.push(ilike(mediCalProviders.languagesSpoken, `%${filters.language}%`));
  }

  if (filters.zipCode) {
    conditions.push(eq(mediCalProviders.zipCode, filters.zipCode));
  }

  if (filters.gender) {
    conditions.push(eq(mediCalProviders.gender, filters.gender));
  }

  if (isValidMediCalCategory(filters.category)) {
    conditions.push(
      sql`EXISTS (
        SELECT 1
        FROM ${providerCategories}
        WHERE ${providerCategories.providerId} = ${mediCalProviders.id}
          AND ${providerCategories.categoryKey} = ${filters.category}
      )`
    );
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
  category?: string,
  city?: string,
  limit: number = 100,
  offset: number = 0
): Promise<MediCalProvider[]> {
  const db = await getDb();
  if (!db) return [];

  const terms = Array.from(new Set([...tokenizeSearchTerms(query), ...expandMediCalSearchTerms(query)]));
  const tokenConditions = terms.map(term =>
    or(
      ilike(mediCalProviders.providerName, `%${term}%`),
      ilike(mediCalProviders.facilityName, `%${term}%`),
      ilike(mediCalProviders.city, `%${term}%`),
      ilike(mediCalProviders.specialties, `%${term}%`),
      ilike(mediCalProviders.normalizedSpecialties, `%${term}%`),
      ilike(mediCalProviders.searchTerms, `%${term}%`),
      ilike(mediCalProviders.address, `%${term}%`),
      ilike(mediCalProviders.zipCode, `%${term}%`),
      ilike(mediCalProviders.npi, `%${term}%`)
    )
  );

  const textMatcher =
    tokenConditions.length > 0
      ? or(
          ilike(mediCalProviders.providerName, `%${query}%`),
          ilike(mediCalProviders.facilityName, `%${query}%`),
          ilike(mediCalProviders.city, `%${query}%`),
          ilike(mediCalProviders.specialties, `%${query}%`),
          ilike(mediCalProviders.normalizedSpecialties, `%${query}%`),
          ilike(mediCalProviders.searchTerms, `%${query}%`),
          ...tokenConditions
        )
      : or(
          ilike(mediCalProviders.providerName, `%${query}%`),
          ilike(mediCalProviders.facilityName, `%${query}%`),
          ilike(mediCalProviders.city, `%${query}%`),
          ilike(mediCalProviders.specialties, `%${query}%`),
          ilike(mediCalProviders.normalizedSpecialties, `%${query}%`),
          ilike(mediCalProviders.searchTerms, `%${query}%`)
        );

  const conditions: any[] = [textMatcher];

  if (city) {
    conditions.push(ilike(mediCalProviders.city, `%${city}%`));
  }

  if (isValidMediCalCategory(category)) {
    conditions.push(
      sql`EXISTS (
        SELECT 1
        FROM ${providerCategories}
        WHERE ${providerCategories.providerId} = ${mediCalProviders.id}
          AND ${providerCategories.categoryKey} = ${category}
      )`
    );
  }

  const results = await db
    .select()
    .from(mediCalProviders)
    .where(and(...conditions))
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
    .select({
      specialties: mediCalProviders.specialties,
      normalizedSpecialties: mediCalProviders.normalizedSpecialties,
    })
    .from(mediCalProviders)
    .where(
      sql`(${mediCalProviders.specialties} IS NOT NULL AND ${mediCalProviders.specialties} != '[]')
           OR (${mediCalProviders.normalizedSpecialties} IS NOT NULL AND ${mediCalProviders.normalizedSpecialties} != '[]')`
    );

  const specialtiesSet = new Set<string>();

  for (const row of results) {
    try {
      const normalizedParsed = JSON.parse(row.normalizedSpecialties || "[]");
      if (Array.isArray(normalizedParsed)) {
        normalizedParsed.forEach(s => specialtiesSet.add(String(s)));
      }

      if (normalizedParsed.length === 0) {
        const parsed = JSON.parse(row.specialties || "[]");
        if (Array.isArray(parsed)) {
          parsed.forEach(s => specialtiesSet.add(String(s)));
        }
      }
    } catch (e) {
      // Skip invalid JSON
    }
  }

  return Array.from(specialtiesSet).sort();
}

export async function getMediCalCategories(): Promise<Array<{ key: MediCalCategoryKey; label: string; count: number }>> {
  const db = await getDb();
  if (!db) {
    return MEDI_CAL_CATEGORY_DEFS.map(category => ({
      key: category.key,
      label: category.label,
      count: 0,
    }));
  }

  const rows = await db
    .select({
      key: providerCategories.categoryKey,
      count: sql<number>`count(distinct ${providerCategories.providerId})`.as("count"),
    })
    .from(providerCategories)
    .groupBy(providerCategories.categoryKey);

  const countMap = new Map<string, number>();
  rows.forEach(row => countMap.set(String(row.key), Number(row.count || 0)));

  return MEDI_CAL_CATEGORY_DEFS.map(category => ({
    key: category.key,
    label: category.label,
    count: countMap.get(category.key) || 0,
  }));
}

// ============ SERVICE SUBMISSIONS ============

export async function createServiceSubmission(submission: InsertServiceSubmission): Promise<ServiceSubmission> {
  await ensureServiceSubmissionsTable();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(serviceSubmissions).values(submission).returning();
  return result[0];
}

export async function getServiceSubmissions(filters?: {
  status?: "pending" | "approved" | "rejected";
  category?: ServiceSubmissionCategory;
  limit?: number;
  offset?: number;
}) {
  await ensureServiceSubmissionsTable();
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(serviceSubmissions);
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(serviceSubmissions.status, filters.status));
  }
  if (filters?.category) {
    conditions.push(eq(serviceSubmissions.category, filters.category));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(serviceSubmissions.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function getServiceSubmissionById(id: number): Promise<ServiceSubmission | undefined> {
  await ensureServiceSubmissionsTable();
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(serviceSubmissions)
    .where(eq(serviceSubmissions.id, id))
    .limit(1);
  return result[0];
}

export async function reviewServiceSubmission(input: {
  id: number;
  status: "approved" | "rejected";
  reviewedBy: number;
  reviewNotes?: string;
}) {
  await ensureServiceSubmissionsTable();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(serviceSubmissions)
    .set({
      status: input.status,
      reviewedBy: input.reviewedBy,
      reviewNotes: input.reviewNotes,
      reviewedAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(serviceSubmissions.id, input.id));
}

export async function approveServiceSubmission(input: {
  id: number;
  reviewedBy: number;
  reviewNotes?: string;
}) {
  await ensureServiceSubmissionsTable();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const submission = await getServiceSubmissionById(input.id);
  if (!submission) {
    throw new Error("Submission not found");
  }
  if (submission.status !== "pending") {
    throw new Error("Only pending submissions can be approved");
  }

  const payload = safeParseJson<Record<string, any>>(submission.payload, {});

  let approvedEntityType: string | null = null;
  let approvedEntityId: number | null = null;

  if (submission.category === "resource") {
    const created = await createResource({
      name: submission.title,
      description: submission.description || undefined,
      type: (payload.resourceType || "other") as any,
      address: submission.address || undefined,
      phone: submission.submitterPhone || payload.phone || undefined,
      website: submission.website || undefined,
      hours: payload.hours || undefined,
      zipCode: submission.zipCode || undefined,
      filters: payload.filters ? JSON.stringify(payload.filters) : undefined,
      isVerified: 0,
    });
    approvedEntityType = "resource";
    approvedEntityId = created.id;
  } else if (submission.category === "treatment_center") {
    const created = await createTreatmentCenter({
      name: submission.title,
      type: (payload.type || "outpatient") as any,
      address: submission.address || undefined,
      city: submission.city || undefined,
      zipCode: submission.zipCode || undefined,
      phone: payload.phone || submission.submitterPhone || undefined,
      website: submission.website || undefined,
      description: submission.description || undefined,
      servesPopulation: (payload.servesPopulation || "coed") as any,
      acceptsCouples: payload.acceptsCouples ? 1 : 0,
      acceptsMediCal: payload.acceptsMediCal ? 1 : 0,
      acceptsMedicare: payload.acceptsMedicare ? 1 : 0,
      acceptsPrivateInsurance: payload.acceptsPrivateInsurance ? 1 : 0,
      acceptsRBH: payload.acceptsRBH ? 1 : 0,
      priceRange: payload.priceRange || undefined,
      servicesOffered: payload.servicesOffered ? JSON.stringify(payload.servicesOffered) : undefined,
      amenities: payload.amenities ? JSON.stringify(payload.amenities) : undefined,
      isJointCommission: payload.isJointCommission ? 1 : 0,
      isVerified: 0,
      isPublished: 1,
      addedBy: input.reviewedBy,
    });
    approvedEntityType = "treatment_center";
    approvedEntityId = created.id;
  } else if (submission.category === "recovery_meeting") {
    const created = await createMeeting({
      name: submission.title,
      type: (payload.meetingType || "aa") as any,
      dayOfWeek: payload.dayOfWeek || "monday",
      time: payload.time || "7:00 PM",
      duration: payload.duration ? Number(payload.duration) : undefined,
      venueName: payload.venueName || undefined,
      address: submission.address || undefined,
      city: submission.city || undefined,
      zipCode: submission.zipCode || undefined,
      format: payload.format || "discussion",
      meetingMode: (payload.meetingMode || "in_person") as any,
      zoomId: payload.zoomId || undefined,
      zoomPassword: payload.zoomPassword || undefined,
      tags: payload.tags ? JSON.stringify(payload.tags) : undefined,
      language: payload.language || "en",
      description: submission.description || undefined,
      notes: payload.notes || undefined,
      isVerified: 0,
      isPublished: 1,
    });
    approvedEntityType = "meeting";
    approvedEntityId = created.id;
  } else if (submission.category === "medi_cal_provider") {
    const specialties = Array.isArray(payload.specialties)
      ? payload.specialties
      : String(payload.specialties || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean);
    const languages = Array.isArray(payload.languagesSpoken)
      ? payload.languagesSpoken
      : String(payload.languagesSpoken || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean);
    const networks = Array.isArray(payload.networks)
      ? payload.networks
      : String(payload.networks || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean);
    const hospitals = Array.isArray(payload.hospitalAffiliations)
      ? payload.hospitalAffiliations
      : String(payload.hospitalAffiliations || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean);
    const medicalGroups = Array.isArray(payload.medicalGroups)
      ? payload.medicalGroups
      : String(payload.medicalGroups || "")
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean);

    const normalizedSpecialties = specialties.map((s: string) => s.toLowerCase());
    const createdProvider = await db
      .insert(mediCalProviders)
      .values({
        providerName: submission.title,
        facilityName: payload.facilityName || undefined,
        npi: payload.npi || undefined,
        stateLicense: payload.stateLicense || undefined,
        address: submission.address || undefined,
        city: submission.city || undefined,
        state: payload.state || "CA",
        zipCode: submission.zipCode || undefined,
        phone: payload.phone || submission.submitterPhone || undefined,
        specialties: JSON.stringify(specialties),
        normalizedSpecialties: JSON.stringify(normalizedSpecialties),
        searchTerms: [...specialties, submission.title, submission.city || "", payload.facilityName || ""]
          .join(" ")
          .trim(),
        gender: payload.gender || undefined,
        languagesSpoken: JSON.stringify(languages),
        boardCertifications: payload.boardCertifications ? JSON.stringify(payload.boardCertifications) : undefined,
        networks: JSON.stringify(networks),
        hospitalAffiliations: JSON.stringify(hospitals),
        medicalGroups: JSON.stringify(medicalGroups),
        isVerified: 0,
      })
      .returning();

    const provider = createdProvider[0];
    const categoryKeys = categorizeSpecialties(normalizedSpecialties);
    if (categoryKeys.length > 0) {
      await db
        .insert(providerCategories)
        .values(categoryKeys.map(categoryKey => ({ providerId: provider.id, categoryKey })))
        .onConflictDoNothing();
    }

    approvedEntityType = "medi_cal_provider";
    approvedEntityId = provider.id;
  } else if (submission.category === "community_event") {
    const created = await createEvent({
      title: submission.title,
      description: submission.description || undefined,
      eventType: payload.eventType || "community_event",
      category: payload.category || "general",
      startDate: payload.startDate ? Number(payload.startDate) : undefined,
      endDate: payload.endDate ? Number(payload.endDate) : undefined,
      startTime: payload.startTime || undefined,
      endTime: payload.endTime || undefined,
      isRecurring: payload.isRecurring ? 1 : 0,
      recurrencePattern: payload.recurrencePattern || undefined,
      recurrenceDetails: payload.recurrenceDetails ? JSON.stringify(payload.recurrenceDetails) : undefined,
      venueName: payload.venueName || undefined,
      address: submission.address || undefined,
      city: submission.city || undefined,
      zipCode: submission.zipCode || undefined,
      isOnline: payload.isOnline ? 1 : 0,
      onlineUrl: payload.onlineUrl || undefined,
      phone: payload.phone || submission.submitterPhone || undefined,
      email: payload.email || submission.submitterEmail || undefined,
      website: submission.website || undefined,
      registrationUrl: payload.registrationUrl || undefined,
      servicesOffered: payload.servicesOffered ? JSON.stringify(payload.servicesOffered) : undefined,
      tags: payload.tags ? JSON.stringify(payload.tags) : undefined,
      eligibility: payload.eligibility || undefined,
      registrationRequired: payload.registrationRequired ? 1 : 0,
      cost: payload.cost || "Free",
      organizerName: payload.organizerName || submission.submitterName || undefined,
      organizerId: input.reviewedBy,
      isPublished: 1,
      isFeatured: 0,
    });
    approvedEntityType = "event";
    approvedEntityId = created.id;
  } else {
    throw new Error(`Unsupported submission category: ${submission.category}`);
  }

  await db
    .update(serviceSubmissions)
    .set({
      status: "approved",
      reviewedBy: input.reviewedBy,
      reviewNotes: input.reviewNotes,
      approvedEntityType,
      approvedEntityId,
      reviewedAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(serviceSubmissions.id, input.id));

  return { approvedEntityType, approvedEntityId };
}

// ============ COMMUNITY SUPPORT REQUESTS ============

export async function createCommunitySupportRequest(
  request: InsertCommunitySupportRequest
): Promise<CommunitySupportRequest> {
  await ensureCommunitySupportRequestsTable();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(communitySupportRequests).values(request).returning();
  return result[0];
}

export async function getCommunitySupportRequests(filters?: {
  status?: "new" | "reviewed" | "closed";
  requestType?: "donation" | "volunteer" | "partner";
  limit?: number;
  offset?: number;
}) {
  await ensureCommunitySupportRequestsTable();
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(communitySupportRequests);
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(communitySupportRequests.status, filters.status));
  }
  if (filters?.requestType) {
    conditions.push(eq(communitySupportRequests.requestType, filters.requestType));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(communitySupportRequests.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

export async function updateCommunitySupportRequestStatus(input: {
  id: number;
  status: "new" | "reviewed" | "closed";
  reviewedBy: number;
  reviewNotes?: string;
}) {
  await ensureCommunitySupportRequestsTable();
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(communitySupportRequests)
    .set({
      status: input.status,
      reviewedBy: input.reviewedBy,
      reviewNotes: input.reviewNotes,
      reviewedAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(communitySupportRequests.id, input.id));
}

// ============ ADMIN FUNCTIONS ============

/**
 * Get all users (admin only)
 */
export async function getAllUsers(filters?: {
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const { role, limit = 50, offset = 0 } = filters || {};

  let query = db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      displayName: users.displayName,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      profileComplete: users.profileComplete,
    })
    .from(users);

  if (role) {
    query = query.where(eq(users.role, role)) as any;
  }

  const results = await query
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: number, role: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({ role, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(users.id, userId));
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Get all forum posts with moderation info (admin only)
 */
export async function getAllForumPostsForModeration(filters?: {
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const { category, limit = 50, offset = 0 } = filters || {};

  let query = db
    .select({
      id: forumPosts.id,
      title: forumPosts.title,
      content: forumPosts.content,
      category: forumPosts.category,
      authorId: forumPosts.authorId,
      isAnonymous: forumPosts.isAnonymous,
      isPinned: forumPosts.isPinned,
      isLocked: forumPosts.isLocked,
      upvotes: forumPosts.upvotes,
      viewCount: forumPosts.viewCount,
      replyCount: forumPosts.replyCount,
      createdAt: forumPosts.createdAt,
      updatedAt: forumPosts.updatedAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(forumPosts)
    .leftJoin(users, eq(forumPosts.authorId, users.id));

  if (category) {
    query = query.where(eq(forumPosts.category, category)) as any;
  }

  const results = await query
    .orderBy(desc(forumPosts.createdAt))
    .limit(limit)
    .offset(offset);

  return results;
}

/**
 * Delete forum post (admin only)
 */
export async function deleteForumPost(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(forumPosts).where(eq(forumPosts.id, postId));
}

/**
 * Pin/unpin forum post (admin only)
 */
export async function togglePinForumPost(postId: number, isPinned: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(forumPosts)
    .set({ isPinned: isPinned ? 1 : 0, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(forumPosts.id, postId));
}

/**
 * Lock/unlock forum post (admin only)
 */
export async function toggleLockForumPost(postId: number, isLocked: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(forumPosts)
    .set({ isLocked: isLocked ? 1 : 0, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(forumPosts.id, postId));
}

/**
 * Delete forum reply (admin only)
 */
export async function deleteForumReply(replyId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(forumReplies).where(eq(forumReplies.id, replyId));
}

// ============ JOB LISTINGS ============

/**
 * Save job listings to database
 */
export async function saveJobs(jobsData: Array<any>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { jobs } = await import("../drizzle/schema");

  for (const job of jobsData) {
    try {
      await db.insert(jobs).values(job).onConflictDoNothing({ target: jobs.externalId });
    } catch (error) {
      console.error('[DB] Error saving job:', error);
    }
  }
}

/**
 * Get jobs with filters
 */
export async function getJobs(filters?: {
  category?: string;
  location?: string;
  employmentType?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { jobs } = await import("../drizzle/schema");

  let query = db.select().from(jobs).where(eq(jobs.isActive, true)).$dynamic();

  const conditions = [];

  if (filters?.category) {
    conditions.push(eq(jobs.category, filters.category));
  }

  if (filters?.location) {
    conditions.push(ilike(jobs.location, `%${filters.location}%`));
  }

  if (filters?.employmentType) {
    conditions.push(eq(jobs.employmentType, filters.employmentType));
  }

  if (filters?.searchQuery) {
    conditions.push(eq(jobs.searchQuery, filters.searchQuery));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  query = query.orderBy(desc(jobs.createdAt)) as any;

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }

  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return await query;
}

/**
 * Get job by slug
 */
export async function getJobBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const { jobs } = await import("../drizzle/schema");

  const result = await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1);
  return result[0] || null;
}

/**
 * Increment job view count
 */
export async function incrementJobViews(jobId: number) {
  const db = await getDb();
  if (!db) return;

  const { jobs } = await import("../drizzle/schema");

  await db.update(jobs)
    .set({ viewCount: sql`${jobs.viewCount} + 1` })
    .where(eq(jobs.id, jobId));
}

/**
 * Save/update job search cache
 */
export async function saveJobSearch(searchData: {
  query: string;
  location?: string;
  employmentType?: string;
  cacheKey: string;
  resultCount: number;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) return;

  const { jobSearches } = await import("../drizzle/schema");

  await db.insert(jobSearches).values(searchData).onConflictDoUpdate({
    target: jobSearches.cacheKey,
    set: {
      resultCount: searchData.resultCount,
      expiresAt: searchData.expiresAt,
    },
  });
}

/**
 * Get job search from cache
 */
export async function getJobSearch(cacheKey: string) {
  const db = await getDb();
  if (!db) return null;

  const { jobSearches } = await import("../drizzle/schema");

  const result = await db.select().from(jobSearches)
    .where(and(
      eq(jobSearches.cacheKey, cacheKey),
      sql`${jobSearches.expiresAt} > NOW()`
    ))
    .limit(1);

  return result[0] || null;
}

/**
 * Track job application
 */
export async function createJobApplication(application: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { jobApplications } = await import("../drizzle/schema");

  const result = await db.insert(jobApplications).values(application).returning();
  return result[0];
}

/**
 * Get user's job applications
 */
export async function getUserJobApplications(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];

  const { jobApplications } = await import("../drizzle/schema");

  let query = db.select().from(jobApplications).where(eq(jobApplications.userId, userId));

  if (status) {
    query = query.where(eq(jobApplications.status, status)) as any;
  }

  return await query.orderBy(desc(jobApplications.appliedDate));
}

/**
 * Update job application status
 */
export async function updateJobApplication(id: number, userId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { jobApplications } = await import("../drizzle/schema");

  await db.update(jobApplications)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(
      eq(jobApplications.id, id),
      eq(jobApplications.userId, userId)
    ));
}
