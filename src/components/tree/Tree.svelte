<script>
	import Node from './Node.svelte';
	import Edge from './Edge.svelte';
	import TreeWrapper from './TreeWrapper.svelte';
	import { getEdges } from './helpers/edge';
	import { onMount } from 'svelte';

	export let nodes = [
		{
			id: 1,
			treeId: 1,
			size: 80,
			position: { x: 400, y: 200 },
			prevNode: null,
			nexNode: 2,
			points: []
		},
		{
			id: 2,
			treeId: 1,
			size: 80,
			position: { x: 100, y: 400 },
			prevNode: 1,
			nexNode: null,
			childs: []
		}
	];

	let edges = [];

	onMount(() => {
		edges = getEdges(nodes);
	});

	const handleNodeDrag = (position, nodeId) => {
		// console.log(position)
		nodes = nodes.map(node => {
			if(node.id !== nodeId) return node;
			const draggedNode = { ...node,position};
			return draggedNode;
		})
	}
</script>

<TreeWrapper>
	{#each nodes as node}
		<Node {node} onNodeDrag={handleNodeDrag} />
	{/each}

	{#each edges as edge}
		<Edge width={4} edgeStyle={edge.edgeStyle} />
	{/each}
</TreeWrapper>
