CREATE TABLE `profile` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
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
CREATE TABLE `role` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`leader_id` text,
	FOREIGN KEY (`leader_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users_table` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`lastName` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`last_login` integer,
	`is_active` integer NOT NULL,
	`is_available` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);--> statement-breakpoint
CREATE TABLE `users_roles` (
	`user_id` text,
	`role_id` text,
	`joined_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users_teams` (
	`user_id` text,
	`team_id` text,
	`role_in_team` text,
	FOREIGN KEY (`user_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE no action
);
