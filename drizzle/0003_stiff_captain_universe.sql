CREATE TABLE `user_stat_bucket` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`metric` text NOT NULL,
	`value` integer NOT NULL,
	`bucket_start` integer NOT NULL,
	`station_id` integer,
	`file_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_stat_bucket_user_metric_bucket_idx` ON `user_stat_bucket` (`user_id`,`metric`,`bucket_start`);--> statement-breakpoint
DROP TABLE `task`;