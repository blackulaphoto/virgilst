CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`summary` text,
	`authorId` integer,
	`isPublished` integer DEFAULT 1 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `articles_category_idx` ON `articles` (`category`);--> statement-breakpoint
CREATE INDEX `articles_slug_idx` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `articles_published_idx` ON `articles` (`isPublished`);--> statement-breakpoint
CREATE TABLE `calendarEvents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`caseId` integer,
	`title` text NOT NULL,
	`description` text,
	`eventType` text NOT NULL,
	`startTime` integer NOT NULL,
	`endTime` integer,
	`location` text,
	`reminderEnabled` integer DEFAULT 1 NOT NULL,
	`reminderTime` integer,
	`reminderSent` integer DEFAULT 0 NOT NULL,
	`isCompleted` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`caseId`) REFERENCES `legalCases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `calendarEvents_user_idx` ON `calendarEvents` (`userId`);--> statement-breakpoint
CREATE INDEX `calendarEvents_case_idx` ON `calendarEvents` (`caseId`);--> statement-breakpoint
CREATE INDEX `calendarEvents_start_time_idx` ON `calendarEvents` (`startTime`);--> statement-breakpoint
CREATE INDEX `calendarEvents_type_idx` ON `calendarEvents` (`eventType`);--> statement-breakpoint
CREATE TABLE `caseDocuments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`caseId` integer NOT NULL,
	`documentName` text NOT NULL,
	`documentType` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`fileUrl` text,
	`fileKey` text,
	`uploadedAt` integer,
	`templateUrl` text,
	`instructions` text,
	`dueDate` integer,
	`isRequired` integer DEFAULT 1 NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`caseId`) REFERENCES `legalCases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `caseDocuments_case_idx` ON `caseDocuments` (`caseId`);--> statement-breakpoint
CREATE INDEX `caseDocuments_status_idx` ON `caseDocuments` (`status`);--> statement-breakpoint
CREATE INDEX `caseDocuments_due_date_idx` ON `caseDocuments` (`dueDate`);--> statement-breakpoint
CREATE TABLE `caseMilestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`caseId` integer NOT NULL,
	`milestoneName` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'not_started' NOT NULL,
	`completedAt` integer,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`caseId`) REFERENCES `legalCases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `caseMilestones_case_idx` ON `caseMilestones` (`caseId`);--> statement-breakpoint
CREATE INDEX `caseMilestones_status_idx` ON `caseMilestones` (`status`);--> statement-breakpoint
CREATE INDEX `caseMilestones_sort_order_idx` ON `caseMilestones` (`sortOrder`);--> statement-breakpoint
CREATE TABLE `chat_conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer,
	`title` text,
	`lastMessageAt` integer DEFAULT (unixepoch()) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `chatConversations_user_idx` ON `chat_conversations` (`userId`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`conversationId`) REFERENCES `chat_conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chatMessages_conversation_idx` ON `chat_messages` (`conversationId`);--> statement-breakpoint
CREATE TABLE `favorite_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`articleId` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`articleId`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favoriteArticles_user_article_idx` ON `favorite_articles` (`userId`,`articleId`);--> statement-breakpoint
CREATE INDEX `favoriteArticles_unique_user_article` ON `favorite_articles` (`userId`,`articleId`);--> statement-breakpoint
CREATE TABLE `favorite_map_pins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`pinId` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pinId`) REFERENCES `map_pins`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favoriteMapPins_user_pin_idx` ON `favorite_map_pins` (`userId`,`pinId`);--> statement-breakpoint
CREATE INDEX `favoriteMapPins_unique_user_pin` ON `favorite_map_pins` (`userId`,`pinId`);--> statement-breakpoint
CREATE TABLE `followed_threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`postId` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`postId`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `followedThreads_user_post_idx` ON `followed_threads` (`userId`,`postId`);--> statement-breakpoint
CREATE INDEX `followedThreads_unique_user_post` ON `followed_threads` (`userId`,`postId`);--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`authorId` integer,
	`isAnonymous` integer DEFAULT 0 NOT NULL,
	`isPinned` integer DEFAULT 0 NOT NULL,
	`isLocked` integer DEFAULT 0 NOT NULL,
	`upvotes` integer DEFAULT 0 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`replyCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `forumPosts_category_idx` ON `forum_posts` (`category`);--> statement-breakpoint
CREATE INDEX `forumPosts_author_idx` ON `forum_posts` (`authorId`);--> statement-breakpoint
CREATE INDEX `forumPosts_pinned_idx` ON `forum_posts` (`isPinned`);--> statement-breakpoint
CREATE TABLE `forum_replies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`postId` integer NOT NULL,
	`parentReplyId` integer,
	`content` text NOT NULL,
	`authorId` integer,
	`isAnonymous` integer DEFAULT 0 NOT NULL,
	`upvotes` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`postId`) REFERENCES `forum_posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `forumReplies_post_idx` ON `forum_replies` (`postId`);--> statement-breakpoint
CREATE INDEX `forumReplies_parent_idx` ON `forum_replies` (`parentReplyId`);--> statement-breakpoint
CREATE TABLE `knowledge_chunks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`documentId` integer NOT NULL,
	`chunkIndex` integer NOT NULL,
	`content` text NOT NULL,
	`embedding` text,
	`tokenCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`documentId`) REFERENCES `knowledge_documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `knowledgeChunks_document_idx` ON `knowledge_chunks` (`documentId`);--> statement-breakpoint
CREATE INDEX `knowledgeChunks_document_chunk_idx` ON `knowledge_chunks` (`documentId`,`chunkIndex`);--> statement-breakpoint
CREATE TABLE `knowledge_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`filename` text NOT NULL,
	`filepath` text NOT NULL,
	`fileType` text NOT NULL,
	`category` text NOT NULL,
	`summary` text,
	`wordCount` integer DEFAULT 0 NOT NULL,
	`chunkCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `knowledgeDocuments_category_idx` ON `knowledge_documents` (`category`);--> statement-breakpoint
CREATE INDEX `knowledgeDocuments_filename_idx` ON `knowledge_documents` (`filename`);--> statement-breakpoint
CREATE TABLE `legalCases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`caseType` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`county` text,
	`caseNumber` text,
	`currentStage` text,
	`completionPercentage` integer DEFAULT 0 NOT NULL,
	`startedAt` integer,
	`targetCompletionDate` integer,
	`completedAt` integer,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `legalCases_user_idx` ON `legalCases` (`userId`);--> statement-breakpoint
CREATE INDEX `legalCases_type_idx` ON `legalCases` (`caseType`);--> statement-breakpoint
CREATE INDEX `legalCases_status_idx` ON `legalCases` (`status`);--> statement-breakpoint
CREATE TABLE `map_pins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`notes` text,
	`submittedBy` integer,
	`isApproved` integer DEFAULT 0 NOT NULL,
	`isFlagged` integer DEFAULT 0 NOT NULL,
	`upvotes` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mapPins_type_idx` ON `map_pins` (`type`);--> statement-breakpoint
CREATE INDEX `mapPins_approved_idx` ON `map_pins` (`isApproved`);--> statement-breakpoint
CREATE INDEX `mapPins_location_idx` ON `map_pins` (`latitude`,`longitude`);--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`dayOfWeek` text NOT NULL,
	`time` text NOT NULL,
	`duration` integer,
	`venueName` text,
	`address` text,
	`city` text,
	`zipCode` text,
	`latitude` real,
	`longitude` real,
	`format` text NOT NULL,
	`meetingMode` text NOT NULL,
	`zoomId` text,
	`zoomPassword` text,
	`tags` text,
	`language` text DEFAULT 'en' NOT NULL,
	`description` text,
	`notes` text,
	`isVerified` integer DEFAULT 0 NOT NULL,
	`isPublished` integer DEFAULT 1 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `meetings_type_idx` ON `meetings` (`type`);--> statement-breakpoint
CREATE INDEX `meetings_day_idx` ON `meetings` (`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `meetings_city_idx` ON `meetings` (`city`);--> statement-breakpoint
CREATE INDEX `meetings_mode_idx` ON `meetings` (`meetingMode`);--> statement-breakpoint
CREATE INDEX `meetings_published_idx` ON `meetings` (`isPublished`);--> statement-breakpoint
CREATE TABLE `pin_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pinId` integer NOT NULL,
	`authorId` integer,
	`content` text NOT NULL,
	`isAnonymous` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pinId`) REFERENCES `map_pins`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pinComments_pin_idx` ON `pin_comments` (`pinId`);--> statement-breakpoint
CREATE INDEX `pinComments_created_idx` ON `pin_comments` (`createdAt`);--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`address` text,
	`phone` text,
	`website` text,
	`hours` text,
	`filters` text,
	`zipCode` text,
	`latitude` real,
	`longitude` real,
	`isVerified` integer DEFAULT 0 NOT NULL,
	`lastVerifiedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `resources_type_idx` ON `resources` (`type`);--> statement-breakpoint
CREATE INDEX `resources_zip_idx` ON `resources` (`zipCode`);--> statement-breakpoint
CREATE TABLE `treatment_centers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`address` text,
	`city` text,
	`zipCode` text,
	`phone` text,
	`website` text,
	`description` text,
	`servesPopulation` text NOT NULL,
	`acceptsCouples` integer DEFAULT 0 NOT NULL,
	`acceptsMediCal` integer DEFAULT 0 NOT NULL,
	`acceptsMedicare` integer DEFAULT 0 NOT NULL,
	`acceptsPrivateInsurance` integer DEFAULT 0 NOT NULL,
	`acceptsRBH` integer DEFAULT 0 NOT NULL,
	`priceRange` text,
	`servicesOffered` text,
	`amenities` text,
	`isJointCommission` integer DEFAULT 0 NOT NULL,
	`latitude` real,
	`longitude` real,
	`isVerified` integer DEFAULT 0 NOT NULL,
	`isPublished` integer DEFAULT 1 NOT NULL,
	`addedBy` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `treatmentCenters_type_idx` ON `treatment_centers` (`type`);--> statement-breakpoint
CREATE INDEX `treatmentCenters_city_idx` ON `treatment_centers` (`city`);--> statement-breakpoint
CREATE INDEX `treatmentCenters_medicaid_idx` ON `treatment_centers` (`acceptsMediCal`);--> statement-breakpoint
CREATE INDEX `treatmentCenters_couples_idx` ON `treatment_centers` (`acceptsCouples`);--> statement-breakpoint
CREATE INDEX `treatmentCenters_published_idx` ON `treatment_centers` (`isPublished`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`displayName` text,
	`bio` text,
	`location` text,
	`avatarUrl` text,
	`profileComplete` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastSignedIn` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE TABLE `videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`youtubeId` text NOT NULL,
	`category` text NOT NULL,
	`duration` integer,
	`thumbnailUrl` text,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `videos_category_idx` ON `videos` (`category`);