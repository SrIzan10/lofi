import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export const userStatEvent = sqliteTable('user_stat_event', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  metric: text('metric').notNull(), // 'listen_time', 'pomodoro_focus_time'...
  value: integer('value').notNull(), // seconds
  bucketStart: integer('bucket_start', { mode: 'timestamp_ms' }).notNull(),
  stationId: text('station_id'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull()
});

export * from './auth.schema';
