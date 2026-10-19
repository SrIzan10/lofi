<script lang="ts">
  import { state as appState } from '@/state.svelte';
  import { getGeneralData, getStationSongs } from '@/utils';
  import { onMount } from 'svelte';
  import { useIsMobile } from '@/isMobile.svelte';
  import Window from '../ui/window/window.svelte';
  import TodoList from './todo-list.svelte';
  import Twentytwentytwenty from './twentytwentytwenty.svelte';
  import Pomodoro from './pomodoro.svelte';
  import Stats from './stats.svelte';
  import { authClient } from '$lib';
  import { page } from '$app/state';
  import { getEmbedVolume } from '@/embed';
  import Play from '@lucide/svelte/icons/play';

  let { embed = false }: { embed?: boolean } = $props();

  const session = authClient.useSession();
  const user = $derived($session.data?.user);

  // svelte-ignore non_reactive_update
  let audioElement: HTMLAudioElement;
  let isTransitioning = $state(false);
  let isMobile = useIsMobile();

  function togglePlayback(play: boolean) {
    if (!audioElement) return;

    if (appState.backgroundElement) {
      if (play) {
        appState.backgroundElement.play().catch(e => console.error('Error playing background video:', e));
      } else {
        appState.backgroundElement.pause();
      }
    }

    if (play && appState.hasInteracted) {
      audioElement.currentTime = appState.currentTime;
      audioElement.play().catch(() => {
        appState.error = 'Audio playback failed. Please interact with the page first.';
        appState.isPlaying = false;
      });
    } else {
      appState.currentTime = audioElement.currentTime;
      audioElement.pause();
    }
  }

  function setMediaSession() {
    if ('mediaSession' in navigator) {
      const mediaSession = navigator.mediaSession;
      mediaSession.metadata = new MediaMetadata({
        title: appState.currentSong!.title,
        artist: appState.currentSong!.artists,
        artwork: [
          { src: appState.currentSong!.image, sizes: '2000x2000', type: 'image/jpeg' }
        ],
      });
    }
  }

  appState.togglePlay = () => {
    appState.isPlaying = !appState.isPlaying;
    togglePlayback(appState.isPlaying);
  };

  // used by the embed api. before the first click, try to start anyway: browsers allow it when
  // the parent page delegates autoplay to the iframe. if they don't, the click gate stays up
  appState.play = () => {
    if (appState.hasInteracted) {
      appState.isPlaying = true;
      return;
    }
    if (!audioElement) return;

    audioElement
      .play()
      .then(() => {
        appState.hasInteracted = true;
        appState.isPlaying = true;
      })
      .catch(() => {});
  };

  appState.next = () => {
    if (!appState.currentSong) return;
    handleSongEnd();
    if (appState.hasInteracted) appState.isPlaying = true;
  };

  function start() {
    appState.hasInteracted = true;
    appState.isPlaying = true;
    togglePlayback(true);
  }

  // ios safari requires a user gesture to play audio
  // please send help
  function handleSongEnd() {
    if (isTransitioning) return;
    
    isTransitioning = true;
    appState.currentSong = null;
    appState.currentTime = 0;

    appState.songQueue.shift();
    if (appState.songQueue.length > 0) {
      appState.currentSong = appState.songQueue[0];
      appState.duration = appState.currentSong.duration;
      setMediaSession();

      setTimeout(() => { isTransitioning = false; }, 500);
    } else {
      getStationSongs(appState.currentStation!).then((songs) => {
        if (songs) {
          appState.songQueue = songs;
          appState.currentSong = appState.songQueue[0];
          appState.duration = appState.currentSong.duration;
          setMediaSession();
        } else {
          appState.error = 'Failed to load songs.';
        }

        setTimeout(() => { isTransitioning = false; }, 500);
      });
    }
  }

  function checkTimeAndPrepareNextSong() {
    if (!audioElement || !appState.currentSong || isTransitioning) return;
    
    // if near the end, prepare for next song
    if (audioElement.duration > 0 && 
        audioElement.currentTime > 0 && 
        audioElement.duration - audioElement.currentTime < 1.5) {
      handleSongEnd();
    }
  }

  onMount(async () => {
    const data = await getGeneralData();
    appState.presets = data.presets;
    appState.stations = data.stations;
    // TODO: support parent backgrounds
    appState.backgrounds = data.backgrounds.filter(bg => bg.isActive === 1 && !bg.parentId);
    appState.atmospheres = data.atmospheres;

    if (embed) {
      // embeds get their own volume and leave the one saved for the full site alone
      appState.volume = getEmbedVolume(page.url);
    } else {
      const storedVolume = window.localStorage.getItem('volume');
      if (storedVolume) {
        appState.volume = parseFloat(storedVolume);
      }
    }

    if (data.stations.length > 0) {
      const storedStationId = window.localStorage.getItem('stationId');
      if (storedStationId && data.stations.some(station => station.id.toString() === storedStationId)) {
        appState.currentStation = parseInt(storedStationId, 10);
      } else {
        appState.currentStation = data.stations[0].id;
      }
      console.log('current station ID:', appState.currentStation);
    }
    if (appState.backgrounds.length > 0) {
      const storedBackgroundId = window.localStorage.getItem('backgroundId');
      if (storedBackgroundId && appState.backgrounds.some(bg => bg.id === storedBackgroundId)) {
        appState.currentBackgroundId = storedBackgroundId;
      } else {
        appState.currentBackgroundId = appState.backgrounds[0].id;
      }
      console.log('current background ID:', appState.currentBackgroundId);
    } else {
      appState.error = 'Failed to load initial data (empty response).';
    }

    const stationSongs = await getStationSongs(appState.currentStation!);
    if (stationSongs) {
      appState.songQueue = stationSongs;
    } else {
      appState.error = 'Failed to load songs.';
    }

    if (appState.songQueue.length > 0) {
      appState.currentSong = appState.songQueue[0];
      appState.duration = appState.currentSong.duration;
    } else {
      appState.error = 'No songs available.';
    }

    appState.isLoading = false;

    if ('mediaSession' in navigator) {
      const mediaSession = navigator.mediaSession;
      setMediaSession();
      mediaSession.setActionHandler('play', () => {
        appState.isPlaying = true;
        togglePlayback(true);
      });
      mediaSession.setActionHandler('pause', () => {
        appState.isPlaying = false;
        togglePlayback(false);
      });
    }
  });

  onMount(() => {
    const listenInterval = setInterval(async () => {
      if (
        !appState.isPlaying ||
        !appState.currentSong ||
        !appState.currentStation ||
        !user ||
        user?.statisticsOptOut ||
        !audioElement ||
        audioElement.paused
      ) {
        return;
      }

      await fetch('/api/listen', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fileId: appState.currentSong.fileId,
          stationId: appState.currentStation,
          seconds: 30,
        }),
      });
    }, 30_000);

    return () => clearInterval(listenInterval);
  })

  $effect(() => {
    if (!audioElement) return;
    togglePlayback(appState.isPlaying);
  });

  $effect(() => {
    const currentTime = appState.currentTime;
    const currentSong = appState.currentSong;
    console.log(`setting time to ${currentTime}`);
    
    if (!audioElement || !currentSong) return;
    const handleTimeSet = () => {
      if (audioElement.readyState >= 2) {
        audioElement.currentTime = currentTime;
      }
    };
    
    audioElement.removeEventListener('loadedmetadata', handleTimeSet);
    
    if (audioElement.readyState >= 2) {
      audioElement.currentTime = currentTime;
    } else {
      audioElement.addEventListener('loadedmetadata', handleTimeSet, { once: true });
    }
  })

  $effect(() => {
    if (appState.currentStation) {
      getStationSongs(appState.currentStation).then((songs) => {
        if (songs) {
          appState.songQueue = songs;
          appState.currentSong = appState.songQueue[0];
          appState.duration = appState.currentSong.duration;
          setMediaSession();
        } else {
          appState.error = 'Failed to load songs.';
        }
      });
    }
  })
</script>

{#if !appState.hasInteracted && !embed}
  <button
    class="flex flex-col h-screen w-full items-center justify-center space-y-2 cursor-pointer"
    onclick={start}
  >
    <p>Click anywhere on the screen</p>
  </button>
{:else if !appState.hasInteracted && embed && !appState.isLoading && !appState.error}
  <!-- compact version of the gate for embeds, shown over the player -->
  <button
    class="dark fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm cursor-pointer"
    onclick={start}
  >
    <span
      class="flex size-12 items-center justify-center rounded-full border border-neutral-600/30 bg-foreground/20 shadow-lg"
    >
      <Play class="size-5" />
    </span>
    <p class="text-sm">Click to play</p>
  </button>
{/if}

{#if !appState.isLoading}
  <!-- only autoplay while playing, so skipping or switching songs while paused stays paused -->
  <audio
    bind:this={audioElement}
    src={appState.currentSong?.endpoint}
    autoplay={appState.hasInteracted && appState.isPlaying}
    volume={appState.volume}
    ontimeupdate={checkTimeAndPrepareNextSong}
    onended={handleSongEnd}
    class="hidden"
  ></audio>
{/if}

{#each Object.entries(appState.activeAtmospheres) as [name, volume]}
  <audio
    src={isMobile ? appState.atmospheres.find(atm => atm.name === name)?.urlMobile : appState.atmospheres.find(atm => atm.name === name)?.url}
    class="hidden"
    id={name}
    volume={volume}
    loop
    autoplay
    preload="none"
  ></audio>
{/each}

<Window
  title="Todo List"
  showTitleBar={true}
  showCloseButton={true}
  width={320}
  height={400}
  onClose={() => appState.showTodoList = false}
  show={appState.showTodoList}
>
  <TodoList></TodoList>
</Window>

<Window
  title="20 20 20 Rule"
  showTitleBar={true}
  showCloseButton={true}
  width={320}
  height={400}
  onClose={() => appState.show202020 = false}
  show={appState.show202020}
>
  <Twentytwentytwenty></Twentytwentytwenty>
</Window>

<Window
  title="Pomodoro Timer"
  showTitleBar={true}
  showCloseButton={true}
  width={320}
  height={250}
  onClose={() => appState.showPomodoro = false}
  show={appState.showPomodoro}
>
  <Pomodoro></Pomodoro>
</Window>

<Window
  title="Stats"
  showTitleBar={true}
  showCloseButton={true}
  width={500}
  height={400}
  onClose={() => appState.showStats = false}
  show={appState.showStats}
>
  <Stats></Stats>
</Window>
