import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';
import { sql } from 'drizzle-orm';

export const userStatBucket = sqliteTable('user_stat_bucket', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  metric: text('metric').notNull(),
  value: integer('value').notNull(), // seconds, count, etc.
  bucketStart: integer('bucket_start', { mode: 'timestamp_ms' }).notNull(),
  stationId: integer('station_id').notNull().default(0),
  fileId: text('file_id').notNull().default(''),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
}, (table) => [
  index('user_stat_bucket_user_metric_bucket_idx').on(table.userId, table.metric, table.bucketStart),
  uniqueIndex('user_stat_bucket_unique_idx').on(
    table.userId,
    table.metric,
    table.bucketStart,
    table.stationId,
    table.fileId,
  ),
]);

export const songIds = sqliteTable('song_ids', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  fileId: text('file_id').notNull(),
  spotifyId: text('spotify_id'),
  title: text('title').notNull(),
  artists: text('artists').notNull(),
  image: text('image').notNull(),
  label: text('label'),
}, (table) => [
  uniqueIndex('song_ids_file_id_idx').on(table.fileId),
]);

export * from './auth.schema';
