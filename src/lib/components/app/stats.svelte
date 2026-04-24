<script lang="ts">
  import { onMount } from 'svelte';
  import { state as appState } from '@/state.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { buttonVariants } from '$lib/components/ui/button/index.js';
  import ListMusic from '@lucide/svelte/icons/list-music';

  type TopSong = {
    fileId: string;
    title: string | null;
    artists: string | null;
    image: string | null;
    seconds: number;
  };

  type TopStation = {
    stationId: number | null;
    seconds: number;
  };

  type StatsResponse = {
    totalSeconds: number;
    todaySeconds: number;
    topSongs: TopSong[];
    topStations: TopStation[];
  };

  let stats = $state<StatsResponse | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;

    return `${hours}h ${minutes}m`;
  };

  const stationName = (stationId: number | null) => {
    const station = appState.stations.find((item) => item.id === stationId);

    return station?.name ?? 'Unknown station';
  };

  onMount(async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        error =
          response.status === 401
            ? 'Sign in to see your listening stats.'
            : 'Could not load stats.';
        return;
      }

      stats = await response.json();
    } catch {
      error = 'Could not load stats.';
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 text-foreground">
  <div>
    <p class="text-xs uppercase tracking-[0.2em] text-foreground/50">Statistics</p>
    <h2 class="text-2xl font-semibold leading-tight">Listening overview</h2>
  </div>

  {#if isLoading}
    <div class="rounded-lg border border-white/10 bg-white/10 p-4 text-sm text-foreground/70">
      Loading stats...
    </div>
  {:else if error}
    <div class="rounded-lg border border-white/10 bg-white/10 p-4 text-sm text-foreground/70">
      {error}
    </div>
  {:else if stats}
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-lg border border-white/10 bg-white/10 p-3">
        <p class="text-xs uppercase tracking-[0.16em] text-foreground/50">Today</p>
        <p class="mt-1 text-2xl font-semibold">{formatDuration(stats.todaySeconds)}</p>
      </div>
      <div class="rounded-lg border border-white/10 bg-white/10 p-3">
        <p class="text-xs uppercase tracking-[0.16em] text-foreground/50">All time</p>
        <p class="mt-1 text-2xl font-semibold">{formatDuration(stats.totalSeconds)}</p>
      </div>
    </div>

    <section class="flex min-h-0 flex-1 flex-col">
      <div class="mb-2 flex items-center justify-between gap-3">
        <h3 class="text-sm font-medium text-foreground/80">Top stations</h3>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class={buttonVariants({
              variant: 'default',
              size: 'sm',
              class: 'h-7 px-2 text-xs'
            })}
            aria-label="Show top songs"
          >
            <ListMusic class="size-3.5" />
            Songs
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-72 max-h-72 overflow-y-auto" align="end">
            <DropdownMenu.Label>Top songs</DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              {#each stats.topSongs as song}
                <DropdownMenu.Item class="gap-3 p-2">
                  {#if song.image}
                    <img src={song.image} alt="" class="size-9 shrink-0 rounded-md object-cover" />
                  {:else}
                    <div class="size-9 shrink-0 rounded-md bg-white/10"></div>
                  {/if}
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium">{song.title ?? song.fileId}</p>
                    <p class="truncate text-xs text-foreground/55">
                      {song.artists ?? 'Unknown artist'}
                    </p>
                  </div>
                  <span class="shrink-0 text-xs text-foreground/60">
                    {formatDuration(song.seconds)}
                  </span>
                </DropdownMenu.Item>
              {:else}
                <DropdownMenu.Item disabled class="text-foreground/60">
                  No top songs yet
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      <div class="min-h-0 space-y-2 overflow-y-auto pr-1">
        {#each stats.topStations as station}
          <div
            class="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm"
          >
            <span class="min-w-0 truncate">{stationName(station.stationId)}</span>
            <span class="shrink-0 text-foreground/60">{formatDuration(station.seconds)}</span>
          </div>
        {:else}
          <p class="rounded-lg border border-white/10 bg-white/10 p-3 text-sm text-foreground/60">
            Station stats will appear after you listen for a bit.
          </p>
        {/each}
      </div>
    </section>
  {/if}
</div>
