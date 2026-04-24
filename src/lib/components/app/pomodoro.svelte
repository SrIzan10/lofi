<script lang="ts">
  import Button from '@/components/ui/button/button.svelte';
  import { state as appState } from '@/state.svelte';
  import { onMount } from 'svelte';

  let timeLeft = $state(0);
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  let startSoundElement: HTMLAudioElement;
  let endSoundElement: HTMLAudioElement;

  let minutes = $derived(Math.floor(timeLeft / 60));
  let seconds = $derived(timeLeft % 60);

  onMount(() => {
    const defaultFirst = 20 * 60;
    const defaultSecond = 5 * 60;

    if (!appState.pomodoroTimer) appState.pomodoroTimer = defaultFirst;
    if (!appState.pomodoroBreakTimer) appState.pomodoroBreakTimer = defaultSecond;

    timeLeft = appState.pomodoroTimer;
  });

  function playSound(element: HTMLAudioElement) {
    if (!element) return;

    element.currentTime = 0;

    const playPromise = element.play();

    if (playPromise) {
      playPromise.catch((error) => {
        console.error('Audio play error:', error);
        if (error.name === 'NotAllowedError') {
          console.warn('Audio playback blocked by browser. User interaction required.');
        }
      });
    }
  }

  function startCountdown() {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }

    intervalHandle = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        if (appState.pomodoroWorkPhase) {
          appState.pomodoroWorkPhase = false;
          timeLeft = appState.pomodoroBreakTimer;
          playSound(startSoundElement);
        } else {
          appState.pomodoroWorkPhase = true;
          timeLeft = appState.pomodoroTimer;
          playSound(endSoundElement);
          appState.isPomodoroActive = false;
        }
      }
    }, 1000);
  }

  $effect(() => {
    if (appState.isPomodoroActive) {
      startCountdown();
    } else if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }

    return () => {
      if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        appState.isPomodoroActive = false;
      }
    };
  });

  function startTimer() {
    reset();
    timeLeft = appState.pomodoroTimer;
    appState.pomodoroWorkPhase = true;
    appState.isPomodoroActive = true;
  }

  function stopTimer() {
    reset();
    appState.isPomodoroActive = false;
  }

  function reset() {
    appState.pomodoroTimer = 20 * 60;
    appState.pomodoroBreakTimer = 5 * 60;
  }
</script>

<audio
  bind:this={startSoundElement}
  src="https://lofi-cdn.srizan.dev/assets/202020/start.mp3"
  preload="auto"
></audio>

<audio
  bind:this={endSoundElement}
  src="https://lofi-cdn.srizan.dev/assets/202020/done.mp3"
  preload="auto"
></audio>

<div class="flex flex-col p-4">
  <div class="mb-6">
    <div class="text-2xl font-bold">
      {appState.pomodoroWorkPhase ? 'Work Time' : 'Break Time'}
    </div>
    <div class="text-3xl font-bold mt-2">
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  </div>

  <div class="flex gap-2">
    {#if appState.isPomodoroActive}
      <Button variant="destructive" onclick={stopTimer}>Stop</Button>
    {:else}
      <Button onclick={startTimer}>Start</Button>
    {/if}
  </div>
</div>
