<script>
	import MdDelete from 'svelte-icons/md/MdDelete.svelte';
	import { getEdgeData } from '$lib/shared/helpers/tree/edge';

	export let index;
	export let width = 1;
	export let sourcePoint;
	export let targetPoint;

	export let isDeletable = false;
	export let onDelete;

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
</script>

<button on:click={handleEdgeClick} class="absolute z-edge origin-top-left bg-white" {style} />

{#if showTooltip && isDeletable}
	<div class="tooltip" style="top: {toolTipPosition.y}px; left: {toolTipPosition.x}px">
		<button class="flex items-center gap-2" on:click={() => onDelete(index)}>
			<div class="w-3 h-3"><MdDelete /></div>
			delete
		</button>
	</div>
{/if}
