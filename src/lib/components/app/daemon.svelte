<script lang="ts">
  import { state as appState } from '@/state.svelte';
  import { getGeneralData, getStationSongs } from '@/utils';
  import { onMount } from 'svelte';
  import { useIsMobile } from '@/isMobile.svelte';
  import Window from '../ui/window/window.svelte';
  import TodoList from './todo-list.svelte';
  import Twentytwentytwenty from './twentytwentytwenty.svelte';
  import Pomodoro from './pomodoro.svelte';

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

    const storedVolume = window.localStorage.getItem('volume');
    if (storedVolume) {
      appState.volume = parseFloat(storedVolume);
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

{#if !appState.hasInteracted}
  <button
    class="flex flex-col h-screen w-full items-center justify-center space-y-2 cursor-pointer"
    onclick={() => {
      appState.hasInteracted = true;
      togglePlayback(true);
    }}
  >
    <p>Click anywhere on the screen</p>
  </button>
{/if}

{#if !appState.isLoading}
  <audio
    bind:this={audioElement}
    src={appState.currentSong!.endpoint}
    autoplay
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
