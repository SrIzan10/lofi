<script lang="ts">
  import BgImage from '@/components/app/bg-image.svelte';
  import BottomBar from '@/components/app/bottom-bar.svelte';
  import Daemon from '@/components/app/daemon.svelte';
  import Spinner from '@lucide/svelte/icons/loader';
  import { state } from '@/state.svelte';
  import BackgroundAnalyzer from '@/components/app/bg-analyzer.svelte';
  import Title from '@/components/app/title.svelte';
  import LeftBar from '@/components/app/left-bar.svelte';
  import AuthBar from '@/components/app/auth-bar.svelte';
</script>

<BgImage />
<Daemon />
<BackgroundAnalyzer videoSelector="#bg-video" />

{#if state.isLoading && !state.hasInteracted}
  <div class="flex flex-col h-screen w-full items-center justify-center space-y-2">
    <Spinner class="size-10" />
    <p>Loading...</p>
  </div>
{:else if state.isLoading && state.hasInteracted}
  <div class="flex flex-col h-screen w-full items-center justify-center space-y-2">
    <Spinner class="size-10 animate-spin" />
    <p>Loading...</p>
  </div>
{:else if state.error}
  <div class="flex h-screen w-full items-center justify-center text-red-500">
    <p>Error: {state.error}</p>
  </div>
{:else if state.hasInteracted}
  <Title />
  <AuthBar />
  <LeftBar />
  <BottomBar />
{/if}
