<script>
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
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

<!-- clicks are wired in onMount for edit mode only; on the public tree an edge
	is a plain line, so it stays out of the tab order and the accessibility tree -->
<button
	bind:this={edgeRef}
	transition:fade={{ duration: 400 }}
	class="absolute z-edge origin-top-left bg-white"
	tabindex={isEditMode ? undefined : -1}
	aria-hidden={isEditMode ? undefined : 'true'}
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
