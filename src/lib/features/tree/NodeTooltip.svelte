<script>
	import { marked } from 'marked';
	import { onMount } from 'svelte';

	export let mousePosition = { x: 0, y: 0 };
	export let nodeTooltip = null;

	let description;

	onMount(() => {
		const renderer = new marked.Renderer();

		// Define a custom function for rendering text within elements
		renderer.text = function (text) {
			// You can apply custom styling here if needed
			return '<span class="custom-text">' + text + '</span>';
		};

		description.innerHTML = marked(nodeTooltip?.description || '', renderer);
	});
</script>

<div
	class="tooltip-data flex flex-col gap-2 w-60 h-max"
	style={`top: ${mousePosition.y}px; left: ${mousePosition.x}px`}
>
	<div class="flex flex-col gap-3 h-max pb-3 border-b border-slate-500">
		<div class="w-full flex-center gap-3">
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

	<div class="markdown-output" bind:this={description} />
</div>
