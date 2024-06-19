<script>
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';

	export let mousePosition = { x: 0, y: 0 };
	export let nodeTooltip = null;
</script>

<div
	class="tooltip-data flex flex-col gap-2 w-60 md:w-72 h-max -translate-y-full -translate-x-1/2"
	style={`top: ${mousePosition.y - 16}px; left: ${mousePosition.x}px`}
>
	<div class="flex flex-col gap-3 h-max border-b border-slate-500">
		<div class="w-full flex items-center gap-3">
			{#if nodeTooltip.imageUrl && nodeTooltip.imageUrl !== ''}
				<div class="w-12 h-12 rounded-full overflow-hidden bg-slate-500">
					<img
					class="m-1 w-10 h-10 object-contain"
					crossorigin="anonymous"
					src={nodeTooltip.imageUrl}
					alt={nodeTooltip.title}
					/>
				</div>
			{/if}
			<h1 class="text-xl text-bold">{nodeTooltip?.title}</h1>
		</div>

		<div class="flex flex-wrap gap-3">
			{#if nodeTooltip?.tags}
				{#each nodeTooltip?.tags as tag}
					<div class="py-2 px-3 rounded bg-[rgba(255,255,255,0.1)]">
						{tag}
					</div>
				{/each}
			{/if}
		</div>
	</div>
	<div class="my-2">
		<MarkdownWrapper source={nodeTooltip?.description} mdClasses="sm" />
	</div>
</div>
