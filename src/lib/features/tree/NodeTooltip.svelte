<script>
	import SvelteMarkdown from 'svelte-markdown';

	export let mousePosition = { x: 0, y: 0 };
	export let nodeTooltip = null;
</script>

<div
	class="tooltip-data flex flex-col gap-2 w-60 h-max -translate-y-full -translate-x-1/2"
	style={`top: ${mousePosition.y - 16}px; left: ${mousePosition.x}px`}
>
	<div class="flex flex-col gap-3 h-max border-b border-slate-500">
		<div class="w-full flex items-center gap-3">
			{#if nodeTooltip.imageUrl && nodeTooltip.imageUrl !== ''}
				<img
					class="w-10 h-10"
					crossorigin="anonymous"
					src={nodeTooltip.imageUrl}
					alt={nodeTooltip.title}
				/>
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
	<div class="markdown-reader small">
		<SvelteMarkdown source={nodeTooltip?.description} />
	</div>
</div>
