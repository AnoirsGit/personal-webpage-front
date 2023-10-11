<script>
	import MdDelete from 'svelte-icons/md/MdDelete.svelte';
	import { getEdgeData } from '$lib/helpers/edge';
	import GlowingElement from '$lib/components/UI/GlowingElement.svelte';

	export let index;
	export let color;
	export let width = 1;
	export let sourcePoint;
	export let targetPoint;

	export let isDeletable = false;
	export let onDelete;

	let widthPx = `${width * 4}px`;
	let edgeData;
	let style;
	let toolTipPosition;

	$: edgeData = getEdgeData(sourcePoint, targetPoint);
	$: style = `background: ${color}; width: ${widthPx}; ${edgeData.edgeStyle}`;
	$: toolTipPosition = {
		y: (edgeData.p1.y + edgeData.p2.y) / 2,
		x: (edgeData.p1.x + edgeData.p2.x) / 2
	};

	let showTooltip = false;

	const handleEdgeClick = () => {
		showTooltip = !showTooltip;
	};
</script>

<button
	on:click={handleEdgeClick}
	class="absolute z-edge origin-top-left {color ? `bg-[${color}]` : 'bg-violet-700'}"
	{style}
>
	<GlowingElement isInner={true} size={1} color="rgba(100, 40, 220 , 0.5)" opacity={20} /></button
>

{#if showTooltip && isDeletable}
	<div class="tooltip" style="top: {toolTipPosition.y}px; left: {toolTipPosition.x}px">
		<button class="flex items-center gap-2" on:click={() => onDelete(index)}>
			<div class="w-3 h-3"><MdDelete /></div>
			delete
		</button>
	</div>
{/if}
