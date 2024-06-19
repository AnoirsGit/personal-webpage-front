<script>
	import Edge from './Edge.svelte';

	export let isEditMode;
	export let onEdgeDelete;
	export let edges = [];
	export let nodes = [];

	let updatedEdges;
	$: {
		updatedEdges = edges.map((nodesPair) => {
			const p1 = nodes.find((node) => node.id === nodesPair.sourceNodeId)?.position;
			const p2 = nodes.find((node) => node.id === nodesPair.targetNodeId)?.position;

			if (!p1 || !p2) return null;
			return { p1, p2 };
		});
	}
</script>

{#each updatedEdges as edge, index}
	<Edge
		{index}
		width="2"
		{isEditMode}
		isDeletable={true}
		onDelete={onEdgeDelete}
		sourcePoint={edge.p1}
		targetPoint={edge.p2}
	/>
{/each}
