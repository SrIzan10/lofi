<script lang="ts">
  import { Button } from '@/components/ui/button';
  import { Slider } from '@/components/ui/slider';
  import { state as appState } from '@/state.svelte';
  import Spinner from '@lucide/svelte/icons/loader';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import SkipForward from '@lucide/svelte/icons/skip-forward';
  import Radio from '@lucide/svelte/icons/radio';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import VolumeX from '@lucide/svelte/icons/volume-x';
  import VolumeZero from '@lucide/svelte/icons/volume';
  import VolumeOne from '@lucide/svelte/icons/volume-1';
  import VolumeTwo from '@lucide/svelte/icons/volume-2';

  // compact player for `?embed=1`, made to fit iframes from around 320x200

  const background = $derived(
    appState.backgrounds.find((bg) => bg.id === appState.currentBackgroundId)
  );
</script>

<div class="dark fixed inset-0 overflow-hidden bg-neutral-900">
  <!-- the background videos are tens of megabytes, way too much for a tiny iframe, -->
  <!-- so use the (dimmed) thumbnail instead -->
  {#if background}
    <img
      src={background.thumbnailUrl}
      alt=""
      class="absolute inset-0 size-full scale-105 object-cover blur-[2px] brightness-50"
    />
  {/if}

  {#if appState.error}
    <div class="relative flex h-full items-center justify-center p-4 text-center text-sm">
      <p class="text-red-500">Error: {appState.error}</p>
    </div>
  {:else if appState.isLoading}
    <div class="relative flex h-full flex-col items-center justify-center space-y-2">
      <Spinner class="size-8 animate-spin" />
      <p class="text-sm">Loading...</p>
    </div>
  {:else}
    <div class="relative flex h-full flex-col justify-between gap-2 p-2">
      <div class="flex items-start justify-between gap-2">
        <div
          class="flex min-w-0 items-center gap-1.5 rounded-lg bg-foreground/10 px-2.5 py-1.5 text-xs font-medium shadow-lg backdrop-blur-lg"
        >
          <Radio class="size-3.5 shrink-0" />
          <span class="truncate">lofi.srizan.dev</span>
        </div>
        <Button
          href="/"
          target="_blank"
          size="icon"
          class="size-8 shrink-0"
          title="Open lofi.srizan.dev"
          aria-label="Open lofi.srizan.dev"
        >
          <ExternalLink />
        </Button>
      </div>

      <div class="flex flex-col gap-3 rounded-xl bg-foreground/10 p-3 shadow-lg backdrop-blur-lg">
        <div class="flex min-w-0 items-center gap-3">
          {#if appState.currentSong}
            <img
              src={appState.currentSong.image}
              alt="Cover Art"
              class="size-12 shrink-0 rounded-lg shadow-lg min-[440px]:size-16"
            />
          {/if}
          <div class="flex min-w-0 flex-col">
            <h2 class="truncate text-sm font-semibold min-[440px]:text-base">
              {appState.currentSong?.title}
            </h2>
            <p class="truncate text-xs min-[440px]:text-sm">{appState.currentSong?.artists}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            size="icon"
            onclick={() => appState.togglePlay()}
            aria-label={appState.isPlaying ? 'Pause' : 'Play'}
          >
            {#if appState.isPlaying}
              <Pause />
            {:else}
              <Play />
            {/if}
          </Button>
          <Button size="icon" onclick={() => appState.next()} aria-label="Next song">
            <SkipForward />
          </Button>
          <div class="ml-2 flex flex-1 items-center gap-3">
            {#if appState.volume === 0}
              <VolumeX class="size-4 shrink-0" />
            {:else if appState.volume <= 0.4}
              <VolumeZero class="size-4 shrink-0" />
            {:else if appState.volume <= 0.8}
              <VolumeOne class="size-4 shrink-0" />
            {:else}
              <VolumeTwo class="size-4 shrink-0" />
            {/if}
            <Slider
              type="single"
              bind:value={appState.volume}
              max={1}
              step={0.01}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
