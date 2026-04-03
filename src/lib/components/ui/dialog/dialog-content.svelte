<script lang="ts">
  import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
  import X from '@lucide/svelte/icons/x';
  import type { Snippet } from 'svelte';
  import * as Dialog from './index.js';
  import { cn } from '$lib/utils.js';
  import DialogOverlay from './dialog-overlay.svelte';

  let {
    ref = $bindable(null),
    class: className,
    portalProps,
    children,
    ...restProps
  }: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
    portalProps?: DialogPrimitive.PortalProps;
    children: Snippet;
  } = $props();
</script>

<Dialog.Portal {...portalProps}>
  <DialogOverlay />
  <DialogPrimitive.Content
    bind:ref
    class={cn(
      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 duration-200 sm:rounded-xl',
      'bg-black/40 backdrop-blur-lg border border-white/10 shadow-lg text-white',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
      className
    )}
    {...restProps}
  >
    <div class="text-white max-w-none space-y-3 font-medium">
      {@render children?.()}
    </div>
    <DialogPrimitive.Close
      class="absolute right-4 top-4 rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none p-1 shadow-sm bg-black/20 backdrop-blur-md border border-white/10"
    >
      <X class="size-4 text-white" />
      <span class="sr-only">Close</span>
    </DialogPrimitive.Close>
  </DialogPrimitive.Content>
</Dialog.Portal>