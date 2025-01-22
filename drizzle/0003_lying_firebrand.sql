PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT '"2025-01-20T21:03:30.973Z"',
	`updated_at` integer DEFAULT '"2025-01-20T21:03:30.973Z"',
	`leader_id` text NOT NULL,
	FOREIGN KEY (`leader_id`) REFERENCES `users_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_team`("id", "name", "description", "created_at", "updated_at", "leader_id") SELECT "id", "name", "description", "created_at", "updated_at", "leader_id" FROM `team`;--> statement-breakpoint
DROP TABLE `team`;--> statement-breakpoint
ALTER TABLE `__new_team` RENAME TO `team`;--> statement-breakpoint
PRAGMA foreign_keys=ON;