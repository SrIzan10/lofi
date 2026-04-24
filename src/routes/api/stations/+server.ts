import { getStationMetadata } from '@/stations';
import { getChillhopData } from '@/utils';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const responses = await Promise.all([
    getStationMetadata(),
    getChillhopData(),
  ]);

  const responseJson = JSON.stringify({
    stations: responses[0],
    backgrounds: responses[1].backgrounds,
    atmospheres: responses[1].atmospheres,
  });

  return new Response(responseJson, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
