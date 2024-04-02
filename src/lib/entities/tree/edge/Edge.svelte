<script>
	import Icon from '@iconify/svelte';
	import { getEdgeData } from '$lib/shared/helpers/tree/edge';
	import GlowingElement from '$lib/shared/UI/GlowingElement.svelte';
	import { onMount, onDestroy } from 'svelte';

	export let isEditMode;
	export let index;
	export let width = 1;
	export let sourcePoint;
	export let targetPoint;

	export let isDeletable = false;
	export let onDelete;

	let edgeRef;
	let widthPx = `${width}px`;
	let edgeData;
	let style;
	let toolTipPosition;

	$: edgeData = getEdgeData(sourcePoint, targetPoint);
	$: style = `width: ${widthPx}; ${edgeData.edgeStyle}`;
	$: toolTipPosition = {
		y: (edgeData.p1.y + edgeData.p2.y) / 2,
		x: (edgeData.p1.x + edgeData.p2.x) / 2
	};

	let showTooltip = false;

	const handleEdgeClick = () => {
		showTooltip = !showTooltip;
	};

	onMount(() => {
		if (isEditMode) edgeRef.addEventListener('click', handleEdgeClick);
	});

	onDestroy(() => {
		if (isEditMode) edgeRef.removeEventListener('click', handleEdgeClick);
	});
</script>

<button
	bind:this={edgeRef}
	on:click={handleEdgeClick}
	class="absolute z-edge origin-top-left bg-white"
	{style}
/>

{#if showTooltip && isDeletable}
	<div class="tooltip" style="top: {toolTipPosition.y}px; left: {toolTipPosition.x}px">
		<GlowingElement />
		<button class="flex items-center gap-1" on:click={() => onDelete(index)}>
			<Icon icon="material-symbols:delete" />
			delete
		</button>
	</div>
{/if}
