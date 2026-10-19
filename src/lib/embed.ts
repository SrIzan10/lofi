// embed mode (`?embed=1`): a compact player meant to live in a small iframe on another site,
// controllable by the parent page through postMessage. the protocol is documented in the readme.

export const EMBED_API_VERSION = 1;
export const EMBED_DEFAULT_VOLUME = 15;

export type EmbedCommand =
  | { type: 'lofi:play' }
  | { type: 'lofi:pause' }
  | { type: 'lofi:toggle' }
  | { type: 'lofi:next' }
  | { type: 'lofi:setVolume'; value: number }
  | { type: 'lofi:getState' };

export interface EmbedState {
  type: 'lofi:state';
  playing: boolean;
  volume: number; // 0-100
  station?: string;
  track?: {
    title?: string;
    artist?: string;
    cover?: string;
  };
}

export type EmbedEvent = { type: 'lofi:ready'; version: number } | EmbedState;

export function isEmbed(url: URL) {
  return url.searchParams.get('embed') === '1';
}

/** `?volume=0-100` as the 0-1 value `state.volume` uses, defaults to 15 */
export function getEmbedVolume(url: URL) {
  const param = url.searchParams.get('volume');
  const volume = param?.trim() ? Number(param) : NaN;
  return (Number.isFinite(volume) ? clampVolume(volume) : EMBED_DEFAULT_VOLUME) / 100;
}

/** returns null for anything that isn't a valid command so it can be ignored */
export function parseEmbedCommand(data: unknown): EmbedCommand | null {
  if (typeof data !== 'object' || data === null) return null;
  const { type, value } = data as Record<string, unknown>;

  switch (type) {
    case 'lofi:play':
    case 'lofi:pause':
    case 'lofi:toggle':
    case 'lofi:next':
    case 'lofi:getState':
      return { type };
    case 'lofi:setVolume':
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      return { type, value: clampVolume(value) };
    default:
      return null;
  }
}

function clampVolume(volume: number) {
  return Math.min(Math.max(volume, 0), 100);
}
