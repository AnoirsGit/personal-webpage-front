<script>
	import Node from './Node.svelte';
	import Edge from './Edge.svelte';
	import TreeWrapper from './TreeWrapper.svelte';
	import { getEdges, getEdgeData } from './helpers/edge';
	import { getNodeUnderMouse } from './helpers/node';
	import { nodesMock } from '../../mocks/tree';

	export let nodes = nodesMock;

	let edges = getEdges(nodes);
	let allowTreeDrag = true;
	let isNewEdgeDragging = false;
	let newEdgeStyle = '';
	let edgeToConnectFromId = 0;

	const addNewEdge = (sourceNodeId, targetNodeId) => {
		console.log({ sourceNodeId, targetNodeId });
	};

	const handleNodeDrag = (position, nodeId) => {
		allowTreeDrag = false;
		nodes = nodes.map((node) => (node.id !== nodeId ? node : { ...node, position }));
	};

	const handleNodeDragDone = () => {
		allowTreeDrag = true;
	};

	const handleNewEdgeClick = (event, sourceNodeId) => {
		isNewEdgeDragging = true;
		const sourceNode = nodes.find((node) => node.id === sourceNodeId);

		if (!sourceNode) return;

		const sourceNodePosition = sourceNode.position;
		const initialY = event.clientY - sourceNodePosition.y;
		const initialX = event.clientX - sourceNodePosition.x;

		const handleMouseMove = (event) => {
			if (isNewEdgeDragging) {
				const y = event.clientY - initialY;
				const x = event.clientX - initialX;
				newEdgeStyle = getEdgeData(sourceNodePosition, { x, y }).edgeStyle;
				edgeToConnectFromId = getNodeUnderMouse({ nodes, node: sourceNode, x, y })?.id;
			}
		};

		const handleMouseUp = () => {
			isNewEdgeDragging = false;
			newEdgeStyle = '';
			addNewEdge(sourceNodeId, edgeToConnectFromId);
			edgeToConnectFromId = null;
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
			active={edgeToConnectFromId === node.id}
			onNodeDrag={handleNodeDrag}
			onDragDone={handleNodeDragDone}
			onNewEdge={handleNewEdgeClick}
		/>
	{/each}

	{#if isNewEdgeDragging}
		<Edge width={4} edgeStyle={newEdgeStyle} color={'orange'} />
	{/if}

	{#each edges as edge}
		<Edge width={4} edgeStyle={edge.edgeStyle} />
	{/each}
</TreeWrapper>
