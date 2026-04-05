<script lang="ts">
  import { Slider } from '$lib/components/ui/slider';
  import * as Popover from '$lib/components/ui/popover';
  import { state as appState } from '@/state.svelte';
  import VolumeZero from '@lucide/svelte/icons/volume';
  import VolumeOne from '@lucide/svelte/icons/volume-1';
  import VolumeTwo from '@lucide/svelte/icons/volume-2';
  import VolumeX from '@lucide/svelte/icons/volume-x';
  import { Button } from '../ui/button';

  let value = $state(appState.volume);
  $effect(() => {
    appState.volume = value;
    window.localStorage.setItem('volume', value.toString());
  });
</script>

<Popover.Root>
  <Popover.Trigger>
    <Button size="icon" class="size-10">
      {#if value === 0}
        <VolumeX />
      {:else if value > 0 && value <= 0.4}
        <VolumeZero />
      {:else if value > 0.4 && value <= 0.8}
        <VolumeOne />
      {:else}
        <VolumeTwo />
      {/if}
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-10 h-32 !min-w-0" side="top">
    <Slider type="single" orientation="vertical" bind:value max={1} step={0.01} />
  </Popover.Content>
</Popover.Root>
