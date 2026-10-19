# lofi.srizan.dev

The ultimate lofi player and productivity tool. Uses music from [Chillhop](https://chillhop.com/) and others.

Chillhop's API had been reverse engineered to allow for custom stations and simplification of certain data to save bandwidth.

Try it out now at [lofi.srizan.dev](https://lofi.srizan.dev)!

## Features
- Neat and beautiful glassmorphic UI! (inspired by liquid glass but actually utilitarian)
- Multple stations, backgrounds and sounds (from Chillhop)
- Custom Lofi Sleep station with music that (hopefully) helps you sleep! (it did help me for a while)
- Todo lists, 20-20-20 rule and Pomodoro timers
- Account number based authentication system
- Listening stats
- (soon) Todo list item syncing
- Song metadata in iOS and Android (and basically anything that supports the `MediaMetadata` API)

## Tech stack
- **Frontend**: [Svelte](https://svelte.dev/)
- **Backend**: [Cloudflare Workers](https://workers.cloudflare.com/)

## Embedding
Add `?embed=1` to get a compact player that fits in a small iframe on your own site (it works from about 320x200, 480x300 is a good size). It shows the current song, station, play/pause, skip and volume, uses a static background instead of the video and hides the productivity tools and account stuff.

| Param | Description |
| --- | --- |
| `embed=1` | Enables embed mode |
| `volume=0-100` | Initial volume in embed mode, defaults to `15`. Embeds never touch the volume saved on the full site |

```html
<iframe
  src="https://lofi.srizan.dev/?embed=1&volume=15"
  width="480"
  height="300"
  allow="autoplay"
  title="lofi.srizan.dev"
  style="border: 0; border-radius: 12px"
></iframe>
```

### Controlling the player
In embed mode the parent page can control the player with `postMessage`:

```js
const lofi = document.querySelector('iframe').contentWindow;
lofi.postMessage({ type: 'lofi:play' }, 'https://lofi.srizan.dev');

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://lofi.srizan.dev') return;
  if (event.data?.type === 'lofi:state') console.log(event.data);
});
```

| Command (parent → player) | Description |
| --- | --- |
| `{ type: 'lofi:play' }` | Starts playback (see the autoplay note below) |
| `{ type: 'lofi:pause' }` | Pauses |
| `{ type: 'lofi:toggle' }` | Toggles between playing and paused |
| `{ type: 'lofi:next' }` | Skips to the next song |
| `{ type: 'lofi:setVolume', value: 50 }` | Sets the volume (0-100) |
| `{ type: 'lofi:getState' }` | Replies with a `lofi:state` event |

| Event (player → parent) | Description |
| --- | --- |
| `{ type: 'lofi:ready', version: 1 }` | Sent once the player has loaded and accepts commands |
| `{ type: 'lofi:state', playing, volume, station?, track?: { title?, artist?, cover? } }` | Sent whenever any of these change and in reply to `lofi:getState`. `volume` is 0-100 |

Commands sent before `lofi:ready`, malformed ones and ones that don't come from the parent window are ignored. If your page might miss `lofi:ready`, send `lofi:getState`: getting a reply means the player is ready.

Browsers don't let pages play audio before the user interacts with them. `lofi:play` starts playing right away if the iframe has `allow="autoplay"` and the user has already interacted with your page (e.g. you send it from a click handler). Otherwise the player shows a "Click to play" overlay instead.
