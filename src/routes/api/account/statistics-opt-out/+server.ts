import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '@/server/db';
import { user as userTable } from '@/server/db/schema';
import type { RequestHandler } from './$types';

type StatisticsOptOutBody = {
  statisticsOptOut?: unknown;
};

export const PATCH: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await event.request.json().catch(() => ({}))) as StatisticsOptOutBody;
  if (typeof body.statisticsOptOut !== 'boolean') {
    return json({ error: 'Invalid statistics preference' }, { status: 400 });
  }

  await getDb(event.platform!.env.DB)
    .update(userTable)
    .set({ statisticsOptOut: body.statisticsOptOut, updatedAt: new Date() })
    .where(eq(userTable.id, user.id));

  return json({ statisticsOptOut: body.statisticsOptOut });
};
