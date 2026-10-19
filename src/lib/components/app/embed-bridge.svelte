<script lang="ts">
  import { state as appState } from '@/state.svelte';
  import { EMBED_API_VERSION, parseEmbedCommand, type EmbedEvent, type EmbedState } from '@/embed';

  // postMessage api for the page embedding us, see the readme

  let ready = $state(false);
  let lastState = '';

  function post(message: EmbedEvent) {
    // not inside an iframe, nobody to talk to
    if (window.parent === window) return;
    // nothing in here is sensitive, so any origin can embed and listen
    window.parent.postMessage(message, '*');
  }

  function getState() {
    const song = appState.currentSong;
    const station = appState.stations.find((s) => s.id === appState.currentStation);

    const message: EmbedState = {
      type: 'lofi:state',
      // isPlaying starts as true, but nothing plays until the click gate is passed
      playing: appState.hasInteracted && appState.isPlaying,
      volume: Math.round(appState.volume * 100),
    };
    if (station) message.station = station.name;
    if (song) message.track = { title: song.title, artist: song.artists, cover: song.image };
    return message;
  }

  function handleMessage(event: MessageEvent) {
    if (!ready || event.source !== window.parent) return;

    const command = parseEmbedCommand(event.data);
    if (!command) return;

    switch (command.type) {
      case 'lofi:play':
        appState.play();
        break;
      case 'lofi:pause':
        appState.isPlaying = false;
        break;
      case 'lofi:toggle':
        if (appState.hasInteracted && appState.isPlaying) {
          appState.isPlaying = false;
        } else {
          appState.play();
        }
        break;
      case 'lofi:next':
        appState.next();
        break;
      case 'lofi:setVolume':
        appState.volume = command.value / 100;
        break;
      case 'lofi:getState':
        post(getState());
        break;
    }
  }

  $effect(() => {
    if (ready || appState.isLoading || appState.error) return;
    ready = true;
    post({ type: 'lofi:ready', version: EMBED_API_VERSION });
  });

  $effect(() => {
    if (!ready) return;

    const message = getState();
    const serialized = JSON.stringify(message);
    if (serialized === lastState) return;

    lastState = serialized;
    post(message);
  });
</script>

<svelte:window onmessage={handleMessage} />
