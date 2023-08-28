<script>
	import Node from './Node.svelte';
	import Edge from './Edge.svelte';
	import { getEdges } from './helpers/edge';
	import { onMount } from 'svelte';

	export let nodes =[
		{ id: 1, treeId: 1, size:80, position: { x: 400, y: 200 }, prevNode: null, nexNode: 2, childs: [] },
		{ id: 2, treeId: 1, size:80, position: { x: 100, y: 400 }, prevNode: 1, nexNode: null, childs: [] }
	];

	let edges =[];

	onMount(() => {
		edges = getEdges(nodes);
	
	});
</script>

<div class="w-full h-160 cursor-move">
	<div class="relative w-screen h-200 bg-slate-50">
		{#each nodes as node}
			<Node {node} />
		{/each}
		
		{#each edges as edge}
		<Edge width={4} edgeStyle={edge.edgeStyle} />
		{/each}

	</div>
</div>
