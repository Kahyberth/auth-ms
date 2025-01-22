PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_picture` text DEFAULT '' NOT NULL,
	`profile_banner` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`updated_at` integer,
	`availability_status` text DEFAULT 'Online' NOT NULL,
	`is_verified` integer NOT NULL,
	`is_blocked` integer NOT NULL,
	`skills` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`social_links` text DEFAULT '' NOT NULL,
	`experience` text DEFAULT '' NOT NULL,
	`education` text DEFAULT '' NOT NULL,
	`timezone` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_profile`("id", "user_id", "profile_picture", "profile_banner", "bio", "updated_at", "availability_status", "is_verified", "is_blocked", "skills", "location", "social_links", "experience", "education", "timezone") SELECT "id", "user_id", "profile_picture", "profile_banner", "bio", "updated_at", "availability_status", "is_verified", "is_blocked", "skills", "location", "social_links", "experience", "education", "timezone" FROM `profile`;--> statement-breakpoint
DROP TABLE `profile`;--> statement-breakpoint
ALTER TABLE `__new_profile` RENAME TO `profile`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `users_table` ADD `company` text NOT NULL;