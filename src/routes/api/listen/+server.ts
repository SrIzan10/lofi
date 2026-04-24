import { json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import { getDb } from '@/server/db';
import { userStatBucket } from '@/server/db/schema';
import type { RequestHandler } from './$types';

type ListenBody = {
  fileId?: unknown;
  stationId?: unknown;
  seconds?: unknown;
};

const LISTEN_METRIC = 'listen_seconds';
const BUCKET_SIZE_MS = 60 * 60 * 1000;

const getHourlyBucketStart = (date = new Date()) =>
  new Date(Math.floor(date.getTime() / BUCKET_SIZE_MS) * BUCKET_SIZE_MS);

const clampListenSeconds = (seconds: unknown) => {
  const parsed = typeof seconds === 'number' ? seconds : Number(seconds);

  if (!Number.isFinite(parsed)) {
    return 30;
  }

  return Math.max(1, Math.min(60, Math.round(parsed)));
};

export const POST: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.statisticsOptOut) {
    return json({ ok: true, skipped: true });
  }

  const body = (await event.request.json().catch(() => ({}))) as ListenBody;
  const fileId = typeof body.fileId === 'string' ? body.fileId.trim() : '';
  const stationId = typeof body.stationId === 'number' ? body.stationId : Number(body.stationId);

  if (!fileId || !Number.isInteger(stationId)) {
    return json({ error: 'Invalid listen payload' }, { status: 400 });
  }

  const seconds = clampListenSeconds(body.seconds);
  const db = getDb(event.platform!.env.DB);

  await db
    .insert(userStatBucket)
    .values({
      userId: user.id,
      metric: LISTEN_METRIC,
      value: seconds,
      bucketStart: getHourlyBucketStart(),
      stationId,
      fileId,
    })
    .onConflictDoUpdate({
      target: [
        userStatBucket.userId,
        userStatBucket.metric,
        userStatBucket.bucketStart,
        userStatBucket.stationId,
        userStatBucket.fileId,
      ],
      set: {
        value: sql`${userStatBucket.value} + ${seconds}`,
      },
    });

  return json({ ok: true });
};
