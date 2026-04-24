CREATE TABLE `song_ids` (
	`id` text PRIMARY KEY NOT NULL,
	`file_id` text NOT NULL,
	`spotify_id` text,
	`title` text NOT NULL,
	`artists` text NOT NULL,
	`image` text NOT NULL,
	`label` text NOT NULL
);
