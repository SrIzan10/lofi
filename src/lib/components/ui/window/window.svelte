<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onMount, onDestroy } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import { state as appState } from '$lib/state.svelte';

  let {
    children = undefined,
    title = 'Window',
    width = 400,
    height = 300,
    initialX = undefined,
    initialY = undefined,
    showTitleBar = true,
    showCloseButton = true,
    onClose = () => {},
    show = false,
    initialZIndex = 50,
  }: {
    children?: Snippet;
    title?: string;
    width?: number;
    height?: number;
    initialX?: number;
    initialY?: number;
    showTitleBar?: boolean;
    showCloseButton?: boolean;
    onClose?: () => void;
    show?: boolean;
    initialZIndex?: number;
  } = $props();

  let zIndex = $state(initialZIndex);

  function bringToFront() {
    zIndex = appState.windowZIndexCounter++;
  }

  let x = $state(initialX ?? (typeof window !== 'undefined' ? (window.innerWidth - width) / 2 : 0));
  let y = $state(
    initialY ?? (typeof window !== 'undefined' ? (window.innerHeight - height) / 2 : 0)
  );

  let windowRef: HTMLElement | undefined = $state();
  let headerRef: HTMLElement | undefined = $state();
  let isDragging = $state(false);
  let dragOffsetX = $state(0);
  let dragOffsetY = $state(0);

  function handleMouseDown(event: MouseEvent) {
    bringToFront();

    if (
      !showTitleBar ||
      !headerRef ||
      !(event.target instanceof Node) ||
      !headerRef.contains(event.target)
    ) {
      return;
    }
    if (headerRef.contains(event.target as Node)) {
      isDragging = true;
      dragOffsetX = event.clientX - x;
      dragOffsetY = event.clientY - y;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isDragging) return;
    x = event.clientX - dragOffsetX;
    y = event.clientY - dragOffsetY;
  }

  function handleMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  function handleResize() {
    if (typeof window !== 'undefined') {
      x = (window.innerWidth - width) / 2;
      y = (window.innerHeight - height) / 2;
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      if (initialX === undefined) {
        x = (window.innerWidth - width) / 2;
      }
      if (initialY === undefined) {
        y = (window.innerHeight - height) / 2;
      }
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  });
</script>

{#if show}
  <div
    bind:this={windowRef}
    class="fixed flex flex-col bg-white/10 backdrop-blur-md border border-white/20 shadow-lg rounded-lg overflow-hidden"
    style="width: {width}px; height: {height}px; left: {x}px; top: {y}px; z-index: {zIndex};"
    onmousedown={handleMouseDown}
    role="dialog"
    tabindex="0"
  >
    {#if showTitleBar}
      <div
        bind:this={headerRef}
        class="h-8 px-3 flex items-center justify-between bg-black/10 border-b border-white/10 select-none"
        style="cursor: {isDragging ? 'grabbing' : 'grab'};"
      >
        <span class="text-sm font-medium text-foreground/90">{title}</span>
        {#if showCloseButton}
          <button
            onclick={onClose}
            class="w-5 h-5 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-red-500/50 rounded-sm transition-colors"
            aria-label="Close window"
          >
            <X class="size-4" />
          </button>
        {/if}
      </div>
    {/if}

    <div class="flex-1 p-1 overflow-auto bg-transparent" role="dialog" tabindex="0">
      {@render children?.()}
    </div>
  </div>
{/if}