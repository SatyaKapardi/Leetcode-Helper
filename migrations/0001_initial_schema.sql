-- Migration: Initial schema for Cloudflare D1
-- Up
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE `problems` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` text NOT NULL,
	`problem_number` integer NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`solution` text NOT NULL,
	`difficulty` text NOT NULL,
	`category` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`problem_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`is_ai` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
CREATE INDEX `idx_problems_user_id` ON `problems` (`user_id`);
CREATE INDEX `idx_problems_difficulty` ON `problems` (`difficulty`);
CREATE INDEX `idx_problems_category` ON `problems` (`category`);
CREATE INDEX `idx_chat_messages_problem_id` ON `chat_messages` (`problem_id`);
CREATE INDEX `idx_chat_messages_user_id` ON `chat_messages` (`user_id`);