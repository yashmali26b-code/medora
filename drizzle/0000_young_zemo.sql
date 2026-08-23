CREATE TABLE `medicine_catalog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`genericName` varchar(160) NOT NULL,
	`brandNames` text NOT NULL,
	`searchTerms` text NOT NULL,
	`activeIngredient` text NOT NULL,
	`medicineClass` varchar(160) NOT NULL,
	`informationSummary` text NOT NULL,
	`safetyNote` text NOT NULL,
	`jurisdiction` varchar(80) NOT NULL DEFAULT 'US',
	`sourceUrl` varchar(500) NOT NULL,
	`reviewerName` varchar(160) NOT NULL,
	`reviewedAt` timestamp NOT NULL,
	`status` enum('draft','approved','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicine_catalog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
