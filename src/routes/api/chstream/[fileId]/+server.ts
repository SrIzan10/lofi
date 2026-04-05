// overengineered proxy brought to you by codex.
import type { RequestHandler } from '@sveltejs/kit';

const FILE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function isValidFileId(fileId: string) {
  return FILE_ID_PATTERN.test(fileId);
}

export const GET: RequestHandler = async ({ params, request, fetch }) => {
  const { fileId } = params;

  if (!fileId || !isValidFileId(fileId)) {
    return new Response('Invalid file ID', { status: 400 });
  }

  const upstreamHeaders = new Headers();
  const range = request.headers.get('range');

  if (range) {
    upstreamHeaders.set('range', range);
  }

  const upstreamResponse = await fetch(`https://stream.chillhop.com/mp3/${fileId}`, {
    headers: upstreamHeaders,
  });

  if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
    return new Response('File not found', { status: upstreamResponse.status === 404 ? 404 : 502 });
  }

  const responseHeaders = new Headers();
  const headersToForward = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
    'etag',
    'last-modified',
    'cache-control',
  ];

  for (const header of headersToForward) {
    const value = upstreamResponse.headers.get(header);
    if (value) {
      responseHeaders.set(header, value);
    }
  }

  responseHeaders.set('Content-Disposition', `inline; filename="${fileId}.mp3"`);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
};
