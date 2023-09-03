<script>
	import Edge from './Edge.svelte';

	export let onEdgeDelete;
	export let nodesToConnect = [];
	export let nodes = [];

	let edges;
	$: {
		edges = nodesToConnect.map((nodesPair) => {
			const p1 = nodes.find((node) => node.id === nodesPair.sourceNodeId)?.position;
			const p2 = nodes.find((node) => node.id === nodesPair.targetNodeId)?.position;

			if (!p1 || !p2) return null;
			return { p1, p2 };
		});
	}
</script>

{#each edges as edge, index}
	{#if edge}

	<Edge
		isDeletable={true}
		{index}
		width=2
		onDelete={onEdgeDelete}
		sourcePoint={edge.p1}
		targetPoint={edge.p2}
	/>
	{/if}
{/each}
