<script>
	import MainNode from './mainNode.svelte';
	import { getEdges } from './helpers/edge';
	import { onMount } from 'svelte';

	const nodes = [
		{ id: 1, treeId: 1, size:80, position: { x: 400, y: 200 }, prevNode: null, nexNode: 2, childs: [] },
		{ id: 2, treeId: 1, size:80, position: { x: 100, y: 400 }, prevNode: 1, nexNode: null, childs: [] }
	];
	const edges = getEdges(nodes);

	onMount(() => {
	});
</script>

<div class="w-full h-160 bg-blue-800 overflow-hidden cursor-move">
	<div class="relative w-screen h-200 bg-slate-50">
		{#each nodes as node}
			<MainNode {node} />
		{/each}
		{#each edges as edge}
			<div
				class="absolute origin-top-left  w-1 bg-red-500"
        style={edge.edgeStyle}
			/>
		{/each}
	</div>
</div>
