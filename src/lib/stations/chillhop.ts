import { getRequestEvent } from '$app/server';
import { getDb } from '@/server/db';
import { songIds } from '@/server/db/schema';
import type { CHSong, Song } from '@/types';
import { and, eq } from 'drizzle-orm';


export async function getChillhopStation(id: number): Promise<Song[]> {
  const res = await fetch(`https://stream.chillhop.com/live/${id}`);
  const data = (await res.json()) as CHSong[];
  
  const finalData = data.map((song) => ({
    fileId: String(song.fileId),
    artists: song.artists,
    title: song.title,
    endpoint: `/api/chstream/${song.fileId}`,
    image: song.image,
    label: 'Chillhop Music',
    spotifyId: song.spotifyId,
    duration: song.duration ?? 0,
  })) as Song[];

  // should not await because it doesn't need to be done before returning the data
  for (const song of finalData) {
    analyticsData(song).catch((err) => {
      console.error('Failed to store analytics data for song:', song.title, err);
    });
  }
  
  return finalData;
}

async function analyticsData(song: Song) {
  const db = getRequestDb();
  const existingSong = await db.select().from(songIds).where(and(eq(songIds.title, song.title), eq(songIds.artists, song.artists))).get();
  
  if (existingSong) return;

  await db.insert(songIds).values({
    fileId: song.fileId,
    spotifyId: song.spotifyId,
    title: song.title,
    artists: song.artists,
    image: song.image,
    label: song.label,
  });
}

function getRequestDb() {
  const d1 = getRequestEvent().platform?.env.DB;
  if (!d1) {
    throw new Error('D1 binding "DB" not found');
  }
  return getDb(d1);
}
