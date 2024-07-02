<script>
	import MarkdownWrapper from '$lib/shared/MarkdownWrapper.svelte';
	import { deviceWidth } from '$lib/shared/stores/globalStore';

	export let mousePosition = { x: 0, y: 0 };
	export let nodeTooltip = null;

	$: y = `top: ${mousePosition.y - 16}px`;
	$: x = `left: ${mousePosition.x}px`;
	let translate = '';

	$: {
		let translateY = 0;
		let translateX = 0;

		if (mousePosition.y < 500) translateY = 110;
		if ( $deviceWidth * 0.6 < mousePosition.x)  translateX = -54;
		if ( $deviceWidth * 0.3 > mousePosition.x)  translateX = 54;
		
		translate = `translate: ${translateX}% ${translateY}%`;
	}
</script>

<div
	class="tooltip-data flex flex-col gap-2 w-72 md:w-96 h-max -translate-y-full -translate-x-1/2"
	style="{y};{x};{translate}"
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
		<MarkdownWrapper source={nodeTooltip?.description} mdClasses="sm mobile-xs" />
	</div>
</div>
