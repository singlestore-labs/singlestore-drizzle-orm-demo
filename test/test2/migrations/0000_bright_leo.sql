CREATE TABLE `users` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`full_name` varchar(256),
	`bson_column` bson,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
