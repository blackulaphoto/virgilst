CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`eventType` text NOT NULL,
	`category` text,
	`startDate` integer,
	`endDate` integer,
	`startTime` text,
	`endTime` text,
	`isRecurring` integer DEFAULT 0 NOT NULL,
	`recurrencePattern` text,
	`recurrenceDetails` text,
	`venueName` text,
	`address` text,
	`city` text,
	`zipCode` text,
	`latitude` real,
	`longitude` real,
	`isOnline` integer DEFAULT 0 NOT NULL,
	`onlineUrl` text,
	`phone` text,
	`email` text,
	`website` text,
	`registrationUrl` text,
	`servicesOffered` text,
	`tags` text,
	`eligibility` text,
	`registrationRequired` integer DEFAULT 0 NOT NULL,
	`cost` text DEFAULT 'Free',
	`organizerName` text,
	`organizerId` integer,
	`isPublished` integer DEFAULT 1 NOT NULL,
	`isFeatured` integer DEFAULT 0 NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`organizerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_type_idx` ON `events` (`eventType`);--> statement-breakpoint
CREATE INDEX `events_category_idx` ON `events` (`category`);--> statement-breakpoint
CREATE INDEX `events_city_idx` ON `events` (`city`);--> statement-breakpoint
CREATE INDEX `events_start_date_idx` ON `events` (`startDate`);--> statement-breakpoint
CREATE INDEX `events_recurring_idx` ON `events` (`isRecurring`);--> statement-breakpoint
CREATE INDEX `events_published_idx` ON `events` (`isPublished`);--> statement-breakpoint
CREATE TABLE `medi_cal_providers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`providerName` text NOT NULL,
	`facilityName` text,
	`npi` text,
	`stateLicense` text,
	`address` text,
	`city` text,
	`state` text DEFAULT 'CA',
	`zipCode` text,
	`distance` text,
	`phone` text,
	`specialties` text,
	`gender` text,
	`languagesSpoken` text,
	`boardCertifications` text,
	`networks` text,
	`hospitalAffiliations` text,
	`medicalGroups` text,
	`isVerified` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `mediCal_city_idx` ON `medi_cal_providers` (`city`);--> statement-breakpoint
CREATE INDEX `mediCal_zip_idx` ON `medi_cal_providers` (`zipCode`);--> statement-breakpoint
CREATE INDEX `mediCal_npi_idx` ON `medi_cal_providers` (`npi`);--> statement-breakpoint
CREATE TABLE `resource_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`resourceId` integer NOT NULL,
	`userId` integer,
	`feedbackType` text NOT NULL,
	`isStillOpen` integer,
	`visitedAt` integer,
	`comment` text,
	`updatedInfo` text,
	`helpfulCount` integer DEFAULT 0 NOT NULL,
	`notHelpfulCount` integer DEFAULT 0 NOT NULL,
	`isVerified` integer DEFAULT 0 NOT NULL,
	`verifiedBy` integer,
	`verifiedAt` integer,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `resourceFeedback_resource_idx` ON `resource_feedback` (`resourceId`);--> statement-breakpoint
CREATE INDEX `resourceFeedback_type_idx` ON `resource_feedback` (`feedbackType`);--> statement-breakpoint
CREATE INDEX `resourceFeedback_status_idx` ON `resource_feedback` (`isStillOpen`);--> statement-breakpoint
CREATE INDEX `resourceFeedback_verified_idx` ON `resource_feedback` (`isVerified`);