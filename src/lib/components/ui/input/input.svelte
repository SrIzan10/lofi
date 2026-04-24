<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		class={cn(
			"flex h-10 w-full rounded-lg px-3 py-2 text-sm transition-all duration-200",
			"bg-white/[0.06] dark:bg-black/20 backdrop-blur-sm",
			"border border-white/[0.1] dark:border-white/[0.08]",
			"placeholder:text-white/40 text-white",
			"focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20",
			"disabled:cursor-not-allowed disabled:opacity-50",
			"file:border-0 file:bg-transparent file:text-sm file:font-medium",
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		class={cn(
			"flex h-10 w-full rounded-lg px-3 py-2 text-sm transition-all duration-200",
			"bg-white/[0.06] dark:bg-black/20 backdrop-blur-sm",
			"border border-white/[0.1] dark:border-white/[0.08]",
			"placeholder:text-white/40 text-white",
			"focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20",
			"disabled:cursor-not-allowed disabled:opacity-50",
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
