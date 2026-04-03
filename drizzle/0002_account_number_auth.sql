CREATE TABLE `passkey` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`public_key` text NOT NULL,
	`user_id` text NOT NULL,
	`credential_id` text NOT NULL,
	`counter` integer NOT NULL,
	`device_type` text NOT NULL,
	`backed_up` integer NOT NULL,
	`transports` text,
	`created_at` integer,
	`aaguid` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passkey_userId_idx` ON `passkey` (`user_id`);
--> statement-breakpoint
CREATE INDEX `passkey_credentialID_idx` ON `passkey` (`credential_id`);
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `account_number` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `user` ADD COLUMN `is_anonymous` integer DEFAULT false;
--> statement-breakpoint
UPDATE `user`
SET `account_number` = substr('0000000000000000' || abs(random()), -16, 16)
WHERE `account_number` = '';
--> statement-breakpoint
CREATE UNIQUE INDEX `user_account_number_unique` ON `user` (`account_number`);
