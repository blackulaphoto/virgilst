import { integer, sqliteTable, text, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(),
  // Profile fields
  displayName: text("displayName"),
  bio: text("bio"),
  location: text("location"),
  avatarUrl: text("avatarUrl"),
  profileComplete: integer("profileComplete").default(0).notNull(),
  // Timestamps
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
  lastSignedIn: integer("lastSignedIn").default(sql`(unixepoch())`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Legal cases (custody reunification, record expungement)
 */
export const legalCases = sqliteTable("legalCases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  caseType: text("caseType").notNull(),
  status: text("status").default("not_started").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  county: text("county"),
  caseNumber: text("caseNumber"),
  // Progress tracking
  currentStage: text("currentStage"),
  completionPercentage: integer("completionPercentage").default(0).notNull(),
  // Important dates
  startedAt: integer("startedAt"),
  targetCompletionDate: integer("targetCompletionDate"),
  completedAt: integer("completedAt"),
  // Metadata
  notes: text("notes"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userIdx: index("legalCases_user_idx").on(table.userId),
  typeIdx: index("legalCases_type_idx").on(table.caseType),
  statusIdx: index("legalCases_status_idx").on(table.status),
}));

export type LegalCase = typeof legalCases.$inferSelect;
export type InsertLegalCase = typeof legalCases.$inferInsert;

/**
 * Calendar events (court dates, deadlines, appointments)
 */
export const calendarEvents = sqliteTable("calendarEvents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  caseId: integer("caseId").references(() => legalCases.id),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("eventType").notNull(),
  startTime: integer("startTime").notNull(),
  endTime: integer("endTime"),
  location: text("location"),
  // Reminder settings
  reminderEnabled: integer("reminderEnabled").default(1).notNull(),
  reminderTime: integer("reminderTime"),
  reminderSent: integer("reminderSent").default(0).notNull(),
  // Metadata
  isCompleted: integer("isCompleted").default(0).notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userIdx: index("calendarEvents_user_idx").on(table.userId),
  caseIdx: index("calendarEvents_case_idx").on(table.caseId),
  startTimeIdx: index("calendarEvents_start_time_idx").on(table.startTime),
  typeIdx: index("calendarEvents_type_idx").on(table.eventType),
}));

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Case documents (required forms, completion tracking)
 */
export const caseDocuments = sqliteTable("caseDocuments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseId: integer("caseId").notNull().references(() => legalCases.id),
  documentName: text("documentName").notNull(),
  documentType: text("documentType").notNull(),
  description: text("description"),
  // Completion status
  status: text("status").default("not_started").notNull(),
  // File upload
  fileUrl: text("fileUrl"),
  fileKey: text("fileKey"),
  uploadedAt: integer("uploadedAt"),
  // Template/instructions
  templateUrl: text("templateUrl"),
  instructions: text("instructions"),
  // Deadline
  dueDate: integer("dueDate"),
  // Metadata
  isRequired: integer("isRequired").default(1).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  caseIdx: index("caseDocuments_case_idx").on(table.caseId),
  statusIdx: index("caseDocuments_status_idx").on(table.status),
  dueDateIdx: index("caseDocuments_due_date_idx").on(table.dueDate),
}));

export type CaseDocument = typeof caseDocuments.$inferSelect;
export type InsertCaseDocument = typeof caseDocuments.$inferInsert;

/**
 * Case milestones (progress tracking for each case type)
 */
export const caseMilestones = sqliteTable("caseMilestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseId: integer("caseId").notNull().references(() => legalCases.id),
  milestoneName: text("milestoneName").notNull(),
  description: text("description"),
  // Progress
  status: text("status").default("not_started").notNull(),
  completedAt: integer("completedAt"),
  // Ordering
  sortOrder: integer("sortOrder").default(0).notNull(),
  // Metadata
  notes: text("notes"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  caseIdx: index("caseMilestones_case_idx").on(table.caseId),
  statusIdx: index("caseMilestones_status_idx").on(table.status),
  sortOrderIdx: index("caseMilestones_sort_order_idx").on(table.sortOrder),
}));

export type CaseMilestone = typeof caseMilestones.$inferSelect;
export type InsertCaseMilestone = typeof caseMilestones.$inferInsert;

/**
 * Resource library articles (benefits, housing, legal, health guides)
 */
export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags"), // JSON array of tags
  summary: text("summary"),
  authorId: integer("authorId").references(() => users.id),
  isPublished: integer("isPublished").default(1).notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  categoryIdx: index("articles_category_idx").on(table.category),
  slugIdx: index("articles_slug_idx").on(table.slug),
  publishedIdx: index("articles_published_idx").on(table.isPublished),
}));

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Community resources (shelters, food banks, clinics, etc.)
 */
export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  hours: text("hours"),
  // Filter tags stored as JSON
  filters: text("filters"), // {lgbtqSafe, acceptsPets, acceptsEBT, noIdRequired, wheelchairAccessible}
  zipCode: text("zipCode"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  isVerified: integer("isVerified").default(0).notNull(),
  lastVerifiedAt: integer("lastVerifiedAt"),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  typeIdx: index("resources_type_idx").on(table.type),
  zipIdx: index("resources_zip_idx").on(table.zipCode),
}));

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

/**
 * Resource feedback - community reports on resource status
 */
export const resourceFeedback = sqliteTable("resource_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  resourceId: integer("resourceId").notNull().references(() => resources.id),
  userId: integer("userId").references(() => users.id),

  // Feedback type
  feedbackType: text("feedbackType").notNull(), // 'still_open', 'closed', 'incorrect_info', 'updated_info'

  // Status reports
  isStillOpen: integer("isStillOpen"), // 1 = confirmed open, 0 = confirmed closed, null = unknown
  visitedAt: integer("visitedAt"), // When user visited (unix timestamp)

  // Details
  comment: text("comment"),
  updatedInfo: text("updatedInfo"), // JSON with updated fields {phone: "...", hours: "...", etc}

  // Helpfulness voting
  helpfulCount: integer("helpfulCount").default(0).notNull(),
  notHelpfulCount: integer("notHelpfulCount").default(0).notNull(),

  // Moderation
  isVerified: integer("isVerified").default(0).notNull(), // Admin verified this feedback
  verifiedBy: integer("verifiedBy").references(() => users.id),
  verifiedAt: integer("verifiedAt"),

  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  resourceIdx: index("resourceFeedback_resource_idx").on(table.resourceId),
  typeIdx: index("resourceFeedback_type_idx").on(table.feedbackType),
  openStatusIdx: index("resourceFeedback_status_idx").on(table.isStillOpen),
  verifiedIdx: index("resourceFeedback_verified_idx").on(table.isVerified),
}));

export type ResourceFeedback = typeof resourceFeedback.$inferSelect;
export type InsertResourceFeedback = typeof resourceFeedback.$inferInsert;

/**
 * Interactive map pins (safe zones, resource locations, warnings)
 */
export const mapPins = sqliteTable("map_pins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  notes: text("notes"),
  submittedBy: integer("submittedBy").references(() => users.id),
  isApproved: integer("isApproved").default(0).notNull(),
  isFlagged: integer("isFlagged").default(0).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  typeIdx: index("mapPins_type_idx").on(table.type),
  approvedIdx: index("mapPins_approved_idx").on(table.isApproved),
  locationIdx: index("mapPins_location_idx").on(table.latitude, table.longitude),
}));

export type MapPin = typeof mapPins.$inferSelect;
export type InsertMapPin = typeof mapPins.$inferInsert;

/**
 * Comments on map pins for real-time updates
 */
export const pinComments = sqliteTable("pin_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pinId: integer("pinId").notNull().references(() => mapPins.id, { onDelete: "cascade" }),
  authorId: integer("authorId").references(() => users.id),
  content: text("content").notNull(),
  isAnonymous: integer("isAnonymous").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  pinIdx: index("pinComments_pin_idx").on(table.pinId),
  createdIdx: index("pinComments_created_idx").on(table.createdAt),
}));

export type PinComment = typeof pinComments.$inferSelect;
export type InsertPinComment = typeof pinComments.$inferInsert;

/**
 * Community forum posts
 */
export const forumPosts = sqliteTable("forum_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorId: integer("authorId").references(() => users.id),
  isAnonymous: integer("isAnonymous").default(0).notNull(),
  isPinned: integer("isPinned").default(0).notNull(),
  isLocked: integer("isLocked").default(0).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  replyCount: integer("replyCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  categoryIdx: index("forumPosts_category_idx").on(table.category),
  authorIdx: index("forumPosts_author_idx").on(table.authorId),
  pinnedIdx: index("forumPosts_pinned_idx").on(table.isPinned),
}));

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;

/**
 * Forum post replies (nested comments)
 */
export const forumReplies = sqliteTable("forum_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("postId").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  parentReplyId: integer("parentReplyId"), // For nested replies
  content: text("content").notNull(),
  authorId: integer("authorId").references(() => users.id),
  isAnonymous: integer("isAnonymous").default(0).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  postIdx: index("forumReplies_post_idx").on(table.postId),
  parentIdx: index("forumReplies_parent_idx").on(table.parentReplyId),
}));

export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;

/**
 * Video library (curated YouTube videos)
 */
export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  youtubeId: text("youtubeId").notNull(),
  category: text("category").notNull(),
  duration: integer("duration"), // in seconds
  thumbnailUrl: text("thumbnailUrl"),
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  categoryIdx: index("videos_category_idx").on(table.category),
}));

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * AI chat conversations
 */
export const chatConversations = sqliteTable("chat_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").references(() => users.id),
  title: text("title"),
  lastMessageAt: integer("lastMessageAt").default(sql`(unixepoch())`).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userIdx: index("chatConversations_user_idx").on(table.userId),
}));

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

/**
 * AI chat messages
 */
export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversationId").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  conversationIdx: index("chatMessages_conversation_idx").on(table.conversationId),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * User favorites - bookmarked articles
 */
export const favoriteArticles = sqliteTable("favorite_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: integer("articleId").notNull().references(() => articles.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userArticleIdx: index("favoriteArticles_user_article_idx").on(table.userId, table.articleId),
  uniqueUserArticle: index("favoriteArticles_unique_user_article").on(table.userId, table.articleId),
}));

export type FavoriteArticle = typeof favoriteArticles.$inferSelect;
export type InsertFavoriteArticle = typeof favoriteArticles.$inferInsert;

/**
 * User favorites - saved map pins
 */
export const favoriteMapPins = sqliteTable("favorite_map_pins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  pinId: integer("pinId").notNull().references(() => mapPins.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userPinIdx: index("favoriteMapPins_user_pin_idx").on(table.userId, table.pinId),
  uniqueUserPin: index("favoriteMapPins_unique_user_pin").on(table.userId, table.pinId),
}));

export type FavoriteMapPin = typeof favoriteMapPins.$inferSelect;
export type InsertFavoriteMapPin = typeof favoriteMapPins.$inferInsert;

/**
 * User favorites - followed forum threads
 */
export const followedThreads = sqliteTable("followed_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("postId").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  userPostIdx: index("followedThreads_user_post_idx").on(table.userId, table.postId),
  uniqueUserPost: index("followedThreads_unique_user_post").on(table.userId, table.postId),
}));

export type FollowedThread = typeof followedThreads.$inferSelect;
export type InsertFollowedThread = typeof followedThreads.$inferInsert;

/**
 * Knowledge base documents (source files for RAG)
 */
export const knowledgeDocuments = sqliteTable("knowledge_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  fileType: text("fileType").notNull(),
  category: text("category").notNull(),
  summary: text("summary"),
  wordCount: integer("wordCount").default(0).notNull(),
  chunkCount: integer("chunkCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  categoryIdx: index("knowledgeDocuments_category_idx").on(table.category),
  filenameIdx: index("knowledgeDocuments_filename_idx").on(table.filename),
}));

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

/**
 * Knowledge base chunks (text segments with embeddings for semantic search)
 */
export const knowledgeChunks = sqliteTable("knowledge_chunks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  documentId: integer("documentId").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunkIndex").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // Store embedding vector as JSON string
  tokenCount: integer("tokenCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  documentIdx: index("knowledgeChunks_document_idx").on(table.documentId),
  documentChunkIdx: index("knowledgeChunks_document_chunk_idx").on(table.documentId, table.chunkIndex),
}));

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;


/**
 * Treatment centers - sober living, detox, and treatment facilities
 */
export const treatmentCenters = sqliteTable("treatment_centers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  address: text("address"),
  city: text("city"),
  zipCode: text("zipCode"),
  phone: text("phone"),
  website: text("website"),
  description: text("description"),

  // Population served
  servesPopulation: text("servesPopulation").notNull(),
  acceptsCouples: integer("acceptsCouples").default(0).notNull(),

  // Insurance and payment
  acceptsMediCal: integer("acceptsMediCal").default(0).notNull(),
  acceptsMedicare: integer("acceptsMedicare").default(0).notNull(),
  acceptsPrivateInsurance: integer("acceptsPrivateInsurance").default(0).notNull(),
  acceptsRBH: integer("acceptsRBH").default(0).notNull(), // Recovery Bridge Housing
  priceRange: text("priceRange"), // e.g., "$800-$1000", "Varies", "Free"

  // Services offered
  servicesOffered: text("servicesOffered"), // JSON array
  amenities: text("amenities"), // JSON array

  // Accreditation
  isJointCommission: integer("isJointCommission").default(0).notNull(),

  // Location coordinates for map
  latitude: real("latitude"),
  longitude: real("longitude"),
  
  // Admin fields
  isVerified: integer("isVerified").default(0).notNull(),
  isPublished: integer("isPublished").default(1).notNull(),
  addedBy: integer("addedBy").references(() => users.id),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  typeIdx: index("treatmentCenters_type_idx").on(table.type),
  cityIdx: index("treatmentCenters_city_idx").on(table.city),
  mediCalIdx: index("treatmentCenters_medicaid_idx").on(table.acceptsMediCal),
  couplesIdx: index("treatmentCenters_couples_idx").on(table.acceptsCouples),
  publishedIdx: index("treatmentCenters_published_idx").on(table.isPublished),
}));

export type TreatmentCenter = typeof treatmentCenters.$inferSelect;
export type InsertTreatmentCenter = typeof treatmentCenters.$inferInsert;

/**
 * Recovery meetings - AA, NA, CMA, SMART Recovery, etc.
 */
export const meetings = sqliteTable("meetings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'aa', 'na', 'cma', 'smart', 'other'

  // Schedule
  dayOfWeek: text("dayOfWeek").notNull(), // 'monday', 'tuesday', etc.
  time: text("time").notNull(), // '7:00 PM', '12:00 PM', etc.
  duration: integer("duration"), // in minutes

  // Location
  venueName: text("venueName"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zipCode"),
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Meeting format
  format: text("format").notNull(), // 'discussion', 'speaker', 'book_study', 'step_study', 'topic', etc.
  meetingMode: text("meetingMode").notNull(), // 'in_person', 'online', 'hybrid'
  zoomId: text("zoomId"),
  zoomPassword: text("zoomPassword"),

  // Special characteristics (stored as JSON)
  tags: text("tags"), // ['wheelchair_accessible', 'lgbtq_friendly', 'women_only', 'men_only', 'young_people', etc.]

  // Language
  language: text("language").default("en").notNull(), // 'en', 'es', 'fa', 'ru', 'hy', etc.

  // Details
  description: text("description"),
  notes: text("notes"),

  // Metadata
  isVerified: integer("isVerified").default(0).notNull(),
  isPublished: integer("isPublished").default(1).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  typeIdx: index("meetings_type_idx").on(table.type),
  dayIdx: index("meetings_day_idx").on(table.dayOfWeek),
  cityIdx: index("meetings_city_idx").on(table.city),
  modeIdx: index("meetings_mode_idx").on(table.meetingMode),
  publishedIdx: index("meetings_published_idx").on(table.isPublished),
}));

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * Community events - resource fairs, workshops, support events
 */
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),

  // Event type and category
  eventType: text("eventType").notNull(), // 'resource_fair', 'workshop', 'support_group', 'community_event', etc.
  category: text("category"), // 'housing', 'health', 'legal', 'benefits', 'general', etc.

  // Schedule
  startDate: integer("startDate"), // Unix timestamp for one-time events
  endDate: integer("endDate"),
  startTime: text("startTime"), // "12:30 PM"
  endTime: text("endTime"), // "3:00 PM"

  // Recurring event support
  isRecurring: integer("isRecurring").default(0).notNull(),
  recurrencePattern: text("recurrencePattern"), // 'daily', 'weekly', 'monthly', 'last_tuesday', 'first_monday', etc.
  recurrenceDetails: text("recurrenceDetails"), // JSON: {dayOfWeek: 'tuesday', weekOfMonth: 'last', interval: 1}

  // Location
  venueName: text("venueName"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zipCode"),
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Online event support
  isOnline: integer("isOnline").default(0).notNull(),
  onlineUrl: text("onlineUrl"),

  // Contact information
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  registrationUrl: text("registrationUrl"),

  // Services & features offered (stored as JSON arrays)
  servicesOffered: text("servicesOffered"), // ['free_ids', 'birth_certificates', 'medi_cal', 'housing_assessment', etc.]
  tags: text("tags"), // ['free', 'no_id_required', 'child_friendly', 'wheelchair_accessible', etc.]

  // Requirements & eligibility
  eligibility: text("eligibility"), // "Homeless Angelenos and low-income residents"
  registrationRequired: integer("registrationRequired").default(0).notNull(),
  cost: text("cost").default("Free"),

  // Organizer information
  organizerName: text("organizerName"),
  organizerId: integer("organizerId").references(() => users.id),

  // Metadata
  isPublished: integer("isPublished").default(1).notNull(),
  isFeatured: integer("isFeatured").default(0).notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  typeIdx: index("events_type_idx").on(table.eventType),
  categoryIdx: index("events_category_idx").on(table.category),
  cityIdx: index("events_city_idx").on(table.city),
  startDateIdx: index("events_start_date_idx").on(table.startDate),
  recurringIdx: index("events_recurring_idx").on(table.isRecurring),
  publishedIdx: index("events_published_idx").on(table.isPublished),
}));

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Medi-Cal Providers - doctors, clinics, and medical facilities that accept Medi-Cal
 */
export const mediCalProviders = sqliteTable("medi_cal_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Provider information
  providerName: text("providerName").notNull(),
  facilityName: text("facilityName"),
  npi: text("npi"), // National Provider Identifier
  stateLicense: text("stateLicense"),

  // Location
  address: text("address"),
  city: text("city"),
  state: text("state").default("CA"),
  zipCode: text("zipCode"),
  distance: text("distance"), // Distance from search origin

  // Contact
  phone: text("phone"),

  // Medical info
  specialties: text("specialties"), // JSON array of specialties
  gender: text("gender"),
  languagesSpoken: text("languagesSpoken"), // JSON array
  boardCertifications: text("boardCertifications"), // JSON array

  // Networks and affiliations
  networks: text("networks"), // JSON array of insurance networks
  hospitalAffiliations: text("hospitalAffiliations"), // JSON array
  medicalGroups: text("medicalGroups"), // JSON array

  // Metadata
  isVerified: integer("isVerified").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt").default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  cityIdx: index("mediCal_city_idx").on(table.city),
  zipIdx: index("mediCal_zip_idx").on(table.zipCode),
  npiIdx: index("mediCal_npi_idx").on(table.npi),
}));

export type MediCalProvider = typeof mediCalProviders.$inferSelect;
export type InsertMediCalProvider = typeof mediCalProviders.$inferInsert;
