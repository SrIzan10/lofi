<script>
  import BgDropdown from '@/components/app/bg-dropdown.svelte';
  import Disclaimer from '@/components/app/disclaimer.svelte';
  import MusicPlayer from '@/components/app/now-playing.svelte';
  import Sounds from '@/components/app/atmospheres.svelte';
  import StationDropdown from '@/components/app/station-dropdown.svelte';
</script>

<div
  class="fixed bottom-5 left-2 right-2 z-50 flex flex-col sm:flex-row items-center p-4 bg-foreground/10 backdrop-blur-lg rounded-xl shadow-lg"
>
  <MusicPlayer />
  
  <div class="hidden sm:block flex-1"></div>
  <div class="flex gap-4 mt-3 sm:mt-0">
    <StationDropdown />
    <BgDropdown />
    <Sounds />
    <Disclaimer />
  </div>
</div>