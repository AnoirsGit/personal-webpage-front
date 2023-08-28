<script>
	import Node from './Node.svelte';
	import Edge from './Edge.svelte';
	import TreeWrapper from './TreeWrapper.svelte';

	import { getEdges, getEdgeData } from './helpers/edge';
	import { nodesMock } from '../../mocks/tree';

	export let nodes = nodesMock;

	let edges = getEdges(nodes);

	let allowTreeDrag = true;
	let isNewEdgeDragging = false;

	let newEdgeStyle = '';
	let dotStyles = '';

	const handleNodeDrag = (position, nodeId) => {
		allowTreeDrag = false;
		nodes = nodes.map((node) => {
			if (node.id !== nodeId) return node;
			const draggedNode = { ...node, position };
			return draggedNode;
		});
	};

	const handleNodeDragDone = () => {
		allowTreeDrag = true;
	};

	const handleNewVectorClick = (event, nodeId) => {
		isNewEdgeDragging = true; // Use 'let' instead of 'const' to allow reassignment
		const node = nodes.find((node) => node.id === nodeId);

		if (!node) {
			return; // Node not found, handle the error accordingly
		}

		const nodePosition = node.position;
		const initialY = event.clientY - nodePosition.y;
		const initialX = event.clientX - nodePosition.x; // Should be 'nodePosition.x'

		const handleMouseMove = (event) => {
			if (isNewEdgeDragging) {
				const y = event.clientY - initialY;
				const x = event.clientX - initialX;
				newEdgeStyle = getEdgeData(nodePosition, { x, y }).edgeStyle; // Assuming getEdgeData is a defined function
				dotStyles = `top: ${y}px; left: ${x}px`;
				console.log(dotStyles);

				// Update your element's style with 'newEdgeStyle' and 'dotStyles' as needed
			}
		};

		const handleMouseUp = () => {
			isNewEdgeDragging = false;
			newEdgeStyle = '';
			dotStyles = '';
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};
</script>

<TreeWrapper {allowTreeDrag}>
	{#each nodes as node}
		<Node
			{node}
			onNodeDrag={handleNodeDrag}
			onDragDone={handleNodeDragDone}
			onNewVector={handleNewVectorClick}
		/>
	{/each}

	{#if isNewEdgeDragging}
		<Edge width={4} edgeStyle={newEdgeStyle} color={'orange'} />
	{/if}

	{#if isNewEdgeDragging}
		<div class="w-4 h-4 bg-green-500 absolute" style={dotStyles} />
	{/if}

	{#each edges as edge}
		<Edge width={4} edgeStyle={edge.edgeStyle} />
	{/each}
</TreeWrapper>
