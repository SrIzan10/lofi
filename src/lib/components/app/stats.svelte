<script lang="ts">
  import { onMount } from 'svelte';
  import { state as appState } from '@/state.svelte';
  import Radio from '@lucide/svelte/icons/radio';
  import ListMusic from '@lucide/svelte/icons/list-music';
  import { authClient } from '@/auth-client';

  const session = authClient.useSession();

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
  let activeTab = $state<'stations' | 'songs'>('stations');

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

  const maxStationSeconds = $derived.by(() => {
    if (!stats) return 1;
    return Math.max(...stats.topStations.map((s) => s.seconds), 1);
  });

  const maxSongSeconds = $derived.by(() => {
    if (!stats) return 1;
    return Math.max(...stats.topSongs.map((s) => s.seconds), 1);
  });

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
      if (session) {
        error = 'Could not load stats. Please try again later.';
      } else {
        error = 'Sign in to see your listening stats.';
      }
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="flex h-full min-h-0 flex-col p-5 text-foreground">
  {#if isLoading}
    <div class="flex flex-1 flex-col items-center justify-center gap-3 text-foreground/40">
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-foreground/15 border-t-foreground/60"></div>
      <span class="text-xs tracking-wide">Loading stats</span>
    </div>
  {:else if error}
    <div class="flex flex-1 flex-col items-center justify-center text-center">
      <p class="text-sm text-foreground/50">{error}</p>
    </div>
  {:else if stats}
    <div class="mb-5 shrink-0">
      <p class="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/40">
        Listening Stats
      </p>
      <div class="flex items-baseline gap-5">
        <div>
          <span class="text-3xl">{formatDuration(stats.todaySeconds)}</span>
          <span class="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40">Today</span>
        </div>
        <div class="h-3 w-px bg-white/10"></div>
        <div>
          <span class="text-3xl">{formatDuration(stats.totalSeconds)}</span>
          <span class="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground/40">All time</span>
        </div>
      </div>
    </div>

    <div class="mb-3 flex shrink-0 items-center justify-between">
      <div class="flex rounded-lg border border-white/[0.06] bg-white/[0.03] p-0.5">
        <button
          class="flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-all duration-200 {activeTab === 'stations' ? 'bg-white/10 text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground/70'}"
          onclick={() => (activeTab = 'stations')}
        >
          <Radio class="size-3" />
          Stations
        </button>
        <button
          class="flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-all duration-200 {activeTab === 'songs' ? 'bg-white/10 text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground/70'}"
          onclick={() => (activeTab = 'songs')}
        >
          <ListMusic class="size-3" />
          Songs
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
      {#if activeTab === 'stations'}
        {#each stats.topStations as station, i}
          <div class="flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
            <span class="w-4 text-right text-[10px] font-mono text-foreground/25">{i + 1}</span>
            <div class="min-w-0 flex-1">
              <div class="mb-1 flex items-center justify-between gap-3">
                <span class="truncate text-sm text-foreground/90">
                  {stationName(station.stationId)}
                </span>
                <span class="shrink-0 text-xs font-mono text-foreground/40">
                  {formatDuration(station.seconds)}
                </span>
              </div>
              <div class="h-[2px] overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  class="h-full rounded-full bg-white/20 transition-all duration-700 ease-out"
                  style="width: {(station.seconds / maxStationSeconds) * 100}%"
                ></div>
              </div>
            </div>
          </div>
        {:else}
          <div class="flex h-32 items-center justify-center">
            <p class="text-xs text-foreground/30">Station stats will appear after you listen for a bit.</p>
          </div>
        {/each}
      {:else}
        {#each stats.topSongs as song, i}
          <div class="flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
            <span class="w-4 text-right text-[10px] font-mono text-foreground/25">{i + 1}</span>
            {#if song.image}
              <img src={song.image} alt="" class="size-7 shrink-0 rounded-sm object-cover opacity-80" />
            {:else}
              <div class="size-7 shrink-0 rounded-sm bg-white/[0.06]"></div>
            {/if}
            <div class="min-w-0 flex-1">
              <div class="mb-1 flex items-center justify-between gap-3">
                <span class="truncate text-sm text-foreground/90">
                  {song.title ?? song.fileId}
                </span>
                <span class="shrink-0 text-xs font-mono text-foreground/40">
                  {formatDuration(song.seconds)}
                </span>
              </div>
              <div class="h-[2px] overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  class="h-full rounded-full bg-white/20 transition-all duration-700 ease-out"
                  style="width: {(song.seconds / maxSongSeconds) * 100}%"
                ></div>
              </div>
            </div>
          </div>
        {:else}
          <div class="flex h-32 items-center justify-center">
            <p class="text-xs text-foreground/30">No top songs yet.</p>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
