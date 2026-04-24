PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_song_ids` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`spotify_id` text,
	`title` text NOT NULL,
	`artists` text NOT NULL,
	`image` text NOT NULL,
	`label` text
);
--> statement-breakpoint
INSERT INTO `__new_song_ids`("id", "file_id", "spotify_id", "title", "artists", "image", "label") SELECT "id", "file_id", "spotify_id", "title", "artists", "image", "label" FROM `song_ids`;--> statement-breakpoint
DROP TABLE `song_ids`;--> statement-breakpoint
ALTER TABLE `__new_song_ids` RENAME TO `song_ids`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `song_ids_file_id_idx` ON `song_ids` (`file_id`);--> statement-breakpoint
CREATE TABLE `__new_user_stat_bucket` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`metric` text NOT NULL,
	`value` integer NOT NULL,
	`bucket_start` integer NOT NULL,
	`station_id` integer DEFAULT 0 NOT NULL,
	`file_id` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_stat_bucket`("id", "user_id", "metric", "value", "bucket_start", "station_id", "file_id", "created_at") SELECT "id", "user_id", "metric", "value", "bucket_start", "station_id", "file_id", "created_at" FROM `user_stat_bucket`;--> statement-breakpoint
DROP TABLE `user_stat_bucket`;--> statement-breakpoint
ALTER TABLE `__new_user_stat_bucket` RENAME TO `user_stat_bucket`;--> statement-breakpoint
CREATE INDEX `user_stat_bucket_user_metric_bucket_idx` ON `user_stat_bucket` (`user_id`,`metric`,`bucket_start`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_stat_bucket_unique_idx` ON `user_stat_bucket` (`user_id`,`metric`,`bucket_start`,`station_id`,`file_id`);