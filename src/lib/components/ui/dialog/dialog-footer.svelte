<script lang="ts">
	import type { WithElementRef } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	class={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-4 mt-2 border-t border-white/[0.08]", className)}
	{...restProps}
>
	{@render children?.()}
</div>
