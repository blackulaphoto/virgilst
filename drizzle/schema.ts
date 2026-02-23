import { pgTable, serial, text, integer, real, index, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  lastSignedIn: integer("lastSignedIn").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Legal cases (custody reunification, record expungement)
 */
export const legalCases = pgTable("legalCases", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const calendarEvents = pgTable("calendarEvents", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const caseDocuments = pgTable("caseDocuments", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const caseMilestones = pgTable("caseMilestones", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags"), // JSON array of tags
  summary: text("summary"),
  authorId: integer("authorId").references(() => users.id),
  isPublished: integer("isPublished").default(1).notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  typeIdx: index("resources_type_idx").on(table.type),
  zipIdx: index("resources_zip_idx").on(table.zipCode),
}));

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

/**
 * Resource feedback - community reports on resource status
 */
export const resourceFeedback = pgTable("resource_feedback", {
  id: serial("id").primaryKey(),
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

  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const mapPins = pgTable("map_pins", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const pinComments = pgTable("pin_comments", {
  id: serial("id").primaryKey(),
  pinId: integer("pinId").notNull().references(() => mapPins.id, { onDelete: "cascade" }),
  authorId: integer("authorId").references(() => users.id),
  content: text("content").notNull(),
  isAnonymous: integer("isAnonymous").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  pinIdx: index("pinComments_pin_idx").on(table.pinId),
  createdIdx: index("pinComments_created_idx").on(table.createdAt),
}));

export type PinComment = typeof pinComments.$inferSelect;
export type InsertPinComment = typeof pinComments.$inferInsert;

/**
 * Community forum posts
 */
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("postId").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  parentReplyId: integer("parentReplyId"), // For nested replies
  content: text("content").notNull(),
  authorId: integer("authorId").references(() => users.id),
  isAnonymous: integer("isAnonymous").default(0).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  postIdx: index("forumReplies_post_idx").on(table.postId),
  parentIdx: index("forumReplies_parent_idx").on(table.parentReplyId),
}));

export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = typeof forumReplies.$inferInsert;

/**
 * Video library (curated YouTube videos)
 */
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeId: text("youtubeId").notNull(),
  category: text("category").notNull(),
  duration: integer("duration"), // in seconds
  thumbnailUrl: text("thumbnailUrl"),
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  categoryIdx: index("videos_category_idx").on(table.category),
}));

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * AI chat conversations
 */
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  title: text("title"),
  lastMessageAt: integer("lastMessageAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  userIdx: index("chatConversations_user_idx").on(table.userId),
}));

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

/**
 * AI chat messages
 */
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  conversationIdx: index("chatMessages_conversation_idx").on(table.conversationId),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * User favorites - bookmarked articles
 */
export const favoriteArticles = pgTable("favorite_articles", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: integer("articleId").notNull().references(() => articles.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  userArticleIdx: index("favoriteArticles_user_article_idx").on(table.userId, table.articleId),
  uniqueUserArticle: index("favoriteArticles_unique_user_article").on(table.userId, table.articleId),
}));

export type FavoriteArticle = typeof favoriteArticles.$inferSelect;
export type InsertFavoriteArticle = typeof favoriteArticles.$inferInsert;

/**
 * User favorites - saved map pins
 */
export const favoriteMapPins = pgTable("favorite_map_pins", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  pinId: integer("pinId").notNull().references(() => mapPins.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  userPinIdx: index("favoriteMapPins_user_pin_idx").on(table.userId, table.pinId),
  uniqueUserPin: index("favoriteMapPins_unique_user_pin").on(table.userId, table.pinId),
}));

export type FavoriteMapPin = typeof favoriteMapPins.$inferSelect;
export type InsertFavoriteMapPin = typeof favoriteMapPins.$inferInsert;

/**
 * User favorites - followed forum threads
 */
export const followedThreads = pgTable("followed_threads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("postId").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  userPostIdx: index("followedThreads_user_post_idx").on(table.userId, table.postId),
  uniqueUserPost: index("followedThreads_unique_user_post").on(table.userId, table.postId),
}));

export type FollowedThread = typeof followedThreads.$inferSelect;
export type InsertFollowedThread = typeof followedThreads.$inferInsert;

/**
 * Public service submissions pending admin moderation.
 */
export const serviceSubmissions = pgTable("service_submissions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // resource | treatment_center | recovery_meeting | medi_cal_provider | community_event
  status: text("status").default("pending").notNull(), // pending | approved | rejected
  title: text("title").notNull(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  zipCode: text("zipCode"),
  website: text("website"),
  submitterName: text("submitterName"),
  submitterEmail: text("submitterEmail"),
  submitterPhone: text("submitterPhone"),
  payload: text("payload"), // category-specific JSON
  submittedBy: integer("submittedBy").references(() => users.id),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewNotes: text("reviewNotes"),
  approvedEntityType: text("approvedEntityType"),
  approvedEntityId: integer("approvedEntityId"),
  reviewedAt: integer("reviewedAt"),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  categoryIdx: index("serviceSubmissions_category_idx").on(table.category),
  statusIdx: index("serviceSubmissions_status_idx").on(table.status),
  createdIdx: index("serviceSubmissions_created_idx").on(table.createdAt),
}));

export type ServiceSubmission = typeof serviceSubmissions.$inferSelect;
export type InsertServiceSubmission = typeof serviceSubmissions.$inferInsert;

/**
 * Public support inquiries for donation / volunteer / partnership.
 */
export const communitySupportRequests = pgTable("community_support_requests", {
  id: serial("id").primaryKey(),
  requestType: text("requestType").notNull(), // donation | volunteer | partner
  status: text("status").default("new").notNull(), // new | reviewed | closed
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organization: text("organization"),
  message: text("message"),
  reviewedBy: integer("reviewedBy").references(() => users.id),
  reviewNotes: text("reviewNotes"),
  reviewedAt: integer("reviewedAt"),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  typeIdx: index("communitySupportRequests_type_idx").on(table.requestType),
  statusIdx: index("communitySupportRequests_status_idx").on(table.status),
  createdIdx: index("communitySupportRequests_created_idx").on(table.createdAt),
}));

export type CommunitySupportRequest = typeof communitySupportRequests.$inferSelect;
export type InsertCommunitySupportRequest = typeof communitySupportRequests.$inferInsert;

/**
 * Knowledge base documents (source files for RAG)
 */
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  filepath: text("filepath").notNull(),
  fileType: text("fileType").notNull(),
  category: text("category").notNull(),
  summary: text("summary"),
  wordCount: integer("wordCount").default(0).notNull(),
  chunkCount: integer("chunkCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  categoryIdx: index("knowledgeDocuments_category_idx").on(table.category),
  filenameIdx: index("knowledgeDocuments_filename_idx").on(table.filename),
}));

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

/**
 * Knowledge base chunks (text segments with embeddings for semantic search)
 */
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull().references(() => knowledgeDocuments.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunkIndex").notNull(),
  content: text("content").notNull(),
  embedding: text("embedding"), // Store embedding vector as JSON string
  tokenCount: integer("tokenCount").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  documentIdx: index("knowledgeChunks_document_idx").on(table.documentId),
  documentChunkIdx: index("knowledgeChunks_document_chunk_idx").on(table.documentId, table.chunkIndex),
}));

export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;


/**
 * Treatment centers - sober living, detox, and treatment facilities
 */
export const treatmentCenters = pgTable("treatment_centers", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
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
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
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
export const mediCalProviders = pgTable("medi_cal_providers", {
  id: serial("id").primaryKey(),

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
  normalizedSpecialties: text("normalizedSpecialties"), // JSON array of normalized specialties
  searchTerms: text("searchTerms"), // flattened searchable terms and synonyms
  gender: text("gender"),
  languagesSpoken: text("languagesSpoken"), // JSON array
  boardCertifications: text("boardCertifications"), // JSON array

  // Networks and affiliations
  networks: text("networks"), // JSON array of insurance networks
  hospitalAffiliations: text("hospitalAffiliations"), // JSON array
  medicalGroups: text("medicalGroups"), // JSON array

  // Metadata
  isVerified: integer("isVerified").default(0).notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
  updatedAt: integer("updatedAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  cityIdx: index("mediCal_city_idx").on(table.city),
  zipIdx: index("mediCal_zip_idx").on(table.zipCode),
  npiIdx: index("mediCal_npi_idx").on(table.npi),
}));

export type MediCalProvider = typeof mediCalProviders.$inferSelect;
export type InsertMediCalProvider = typeof mediCalProviders.$inferInsert;

export const providerCategories = pgTable("provider_categories", {
  id: serial("id").primaryKey(),
  providerId: integer("providerId").notNull().references(() => mediCalProviders.id, { onDelete: "cascade" }),
  categoryKey: text("categoryKey").notNull(),
  createdAt: integer("createdAt").default(sql`EXTRACT(EPOCH FROM NOW())::INTEGER`).notNull(),
}, (table) => ({
  providerIdx: index("providerCategories_provider_idx").on(table.providerId),
  categoryIdx: index("providerCategories_category_idx").on(table.categoryKey),
  providerCategoryUniqueIdx: uniqueIndex("providerCategories_unique_provider_category_idx").on(table.providerId, table.categoryKey),
}));

export type ProviderCategory = typeof providerCategories.$inferSelect;
export type InsertProviderCategory = typeof providerCategories.$inferInsert;

/**
 * Job listings from SerpAPI with caching
 */
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  // Job details
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  employmentType: text("employmentType"), // full-time, part-time, contract, etc.
  salary: text("salary"),
  // External data
  externalId: text("externalId").unique(), // SerpAPI job ID
  applyLink: text("applyLink"),
  sourceUrl: text("sourceUrl"),
  postedDate: text("postedDate"),
  // Search metadata
  searchQuery: text("searchQuery"),
  searchLocation: text("searchLocation"),
  // Categorization
  category: text("category"), // entry-level, no-experience, warehouse, retail, etc.
  tags: text("tags"), // JSON array of tags
  // SEO
  slug: text("slug").unique(),
  // Metadata
  isActive: boolean("isActive").default(true).notNull(),
  viewCount: integer("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("jobs_company_idx").on(table.company),
  locationIdx: index("jobs_location_idx").on(table.location),
  categoryIdx: index("jobs_category_idx").on(table.category),
  activeIdx: index("jobs_active_idx").on(table.isActive),
  externalIdx: index("jobs_external_idx").on(table.externalId),
}));

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Job search cache to reduce API calls
 */
export const jobSearches = pgTable("job_searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  location: text("location"),
  employmentType: text("employmentType"),
  // Cache key and results
  cacheKey: text("cacheKey").notNull().unique(),
  resultCount: integer("resultCount").default(0).notNull(),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, (table) => ({
  cacheKeyIdx: index("jobSearches_cache_key_idx").on(table.cacheKey),
  expiresIdx: index("jobSearches_expires_idx").on(table.expiresAt),
}));

export type JobSearch = typeof jobSearches.$inferSelect;
export type InsertJobSearch = typeof jobSearches.$inferInsert;

/**
 * User job applications tracking
 */
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  jobId: integer("jobId").references(() => jobs.id),
  // Application details
  company: text("company").notNull(),
  position: text("position").notNull(),
  status: text("status").default("applied").notNull(), // applied, interviewing, offer, rejected, accepted
  appliedDate: timestamp("appliedDate").defaultNow().notNull(),
  // Tracking
  notes: text("notes"),
  contactName: text("contactName"),
  contactEmail: text("contactEmail"),
  contactPhone: text("contactPhone"),
  followUpDate: timestamp("followUpDate"),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("jobApplications_user_idx").on(table.userId),
  jobIdx: index("jobApplications_job_idx").on(table.jobId),
  statusIdx: index("jobApplications_status_idx").on(table.status),
}));

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = typeof jobApplications.$inferInsert;
