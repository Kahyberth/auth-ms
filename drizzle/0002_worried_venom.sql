DROP INDEX IF EXISTS "users_table_email_unique";--> statement-breakpoint
ALTER TABLE `team` ALTER COLUMN "description" TO "description" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);