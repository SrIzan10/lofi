import { json } from '@sveltejs/kit';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '@/server/db';
import { songIds, userStatBucket } from '@/server/db/schema';
import type { RequestHandler } from './$types';

const LISTEN_METRIC = 'listen_seconds';

const getUtcDayStart = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const GET: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb(event.platform!.env.DB);
  const todayStart = getUtcDayStart();
  const listenFilter = and(
    eq(userStatBucket.userId, user.id),
    eq(userStatBucket.metric, LISTEN_METRIC),
  );

  const [totalListen] = await db
    .select({ seconds: sql<number>`coalesce(sum(${userStatBucket.value}), 0)` })
    .from(userStatBucket)
    .where(listenFilter);

  const [todayListen] = await db
    .select({ seconds: sql<number>`coalesce(sum(${userStatBucket.value}), 0)` })
    .from(userStatBucket)
    .where(and(listenFilter, gte(userStatBucket.bucketStart, todayStart)));

  const topSongs = await db
    .select({
      fileId: userStatBucket.fileId,
      title: songIds.title,
      artists: songIds.artists,
      image: songIds.image,
      seconds: sql<number>`sum(${userStatBucket.value})`,
    })
    .from(userStatBucket)
    .leftJoin(songIds, eq(userStatBucket.fileId, songIds.fileId))
    .where(listenFilter)
    .groupBy(userStatBucket.fileId, songIds.title, songIds.artists, songIds.image)
    .orderBy(desc(sql`sum(${userStatBucket.value})`))
    .limit(5);

  const topStations = await db
    .select({
      stationId: userStatBucket.stationId,
      seconds: sql<number>`sum(${userStatBucket.value})`,
    })
    .from(userStatBucket)
    .where(listenFilter)
    .groupBy(userStatBucket.stationId)
    .orderBy(desc(sql`sum(${userStatBucket.value})`))
    .limit(5);

  return json({
    totalSeconds: totalListen?.seconds ?? 0,
    todaySeconds: todayListen?.seconds ?? 0,
    topSongs,
    topStations,
  });
};
