<script>
	import Node from './Node.svelte';
	import Edge from './edge/Edge.svelte';
	import Edges from './edge/Edges.svelte';
	import TreeWrapper from './TreeWrapper.svelte';
	import { getNodeUnderMouse } from './helpers/node';
	import { nodesMock } from '../../mocks/tree';
	import TreeActionBar from './treeActionBar.svelte';

	export let isEditMode = true;
	export let nodes = nodesMock;

	let nodesToConnect = [{ sourceNodeId: 1, targetNodeId: 2 }];

	let allowTreeDrag = true;
	let isNewEdgeDragging = false;
	let newEdge;
	let edgeToConnectId = 0;

	const addNewEdge = (sourceNodeId, targetNodeId) => {
		const edgeExists = nodesToConnect.some(
			(edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId
		);

		if (!edgeExists) {
			nodesToConnect = [...nodesToConnect, { sourceNodeId, targetNodeId }];
		}
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
				newEdge = { sourcePoint: sourceNodePosition, targetPoint: { y, x } };
				edgeToConnectId = getNodeUnderMouse({ nodes, node: sourceNode, x, y })?.id;
			}
		};

		const handleMouseUp = () => {
			if (edgeToConnectId) addNewEdge(sourceNodeId, edgeToConnectId);

			newEdge = null;
			edgeToConnectId = null;
			isNewEdgeDragging = false;

			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	const handleEdgeDelete = (index) => {
    nodesToConnect = nodesToConnect.filter((_, i) => index !== i);
};
</script>

<div class="flex gap-3  mb-32">
	<div class="relative {isEditMode ? 'w-3/5' : 'w-full'}">
		<TreeActionBar />
		<TreeWrapper {allowTreeDrag}>
			<Edges onEdgeDelete={handleEdgeDelete} {nodesToConnect} {nodes} />

			{#each nodes as node}
				<Node
					{node}
					active={edgeToConnectId === node.id}
					onNodeDrag={handleNodeDrag}
					onDragDone={handleNodeDragDone}
					onNewEdge={handleNewEdgeClick}
				/>
			{/each}

			{#if newEdge && isNewEdgeDragging}
				<Edge width={4} sourcePoint={newEdge.sourcePoint} targetPoint={newEdge.targetPoint} />
			{/if}
		</TreeWrapper>
	</div>
	{#if isEditMode}
		<div class="w-2/5 bg-white rounded-xl" > adsfas </div>
	{/if}
</div>
