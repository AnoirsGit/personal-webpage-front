<script>
	import Node from './Node.svelte';
	import Edge from './edge/Edge.svelte';
	import Edges from './edge/Edges.svelte';
	import TreeWrapper from './TreeWrapper.svelte';

	import { getNodeUnderMouse, newNodePosition } from './helpers/node';
	import { nodesMock } from '../../mocks/tree';
	import { generateRandomID } from './helpers/helper';

	import EditForm from './EditForm.svelte';
	import TreeActionBar from './treeActionBar.svelte';

	export let isEditMode = true;
	export let nodes = nodesMock;

	let tree;
	let wrapperZoomScroll = { x: 0, y: 0, scale: 1 };

	let nodesToConnect = [{ sourceNodeId: 1, targetNodeId: 2 }];

	let allowTreeDrag = true;
	let isNewEdgeDragging = false;
	let newEdge;
	let edgeToConnectId = 0;
	let itemToEdit;

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
				const x = event.clientX - initialX + sourceNode.size;
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

	const handleNodeDelete = (nodeId) => {
		nodes = nodes.filter((node) => node.id !== nodeId);
	};

	const handleNodeSelect = (nodeId) => {
		const selectedNode = nodes.find((node) => node.id === nodeId);
		itemToEdit = { type: 'NODE', item: { ...selectedNode } };
	};

	const handleWrapperZoomScrollChange = ({ x, y, scale }) => (wrapperZoomScroll = { x, y, scale });

	const handleNodeAdd = () => {
		const nodePosition = newNodePosition(wrapperZoomScroll, tree, 80);
		let mockId;

		do {
			mockId = `mock-${generateRandomID(6)}`;
		} while (nodes.some((node) => node.id === mockId));

		const newNode = {
			id: mockId,
			treeId: 1,
			size: 80,
			position: nodePosition,
			isActive: false
		};

		nodes = [...nodes, newNode];
	};
</script>

<div class="flex gap-3 mb-32">
	<div bind:this={tree} class="relative {isEditMode ? 'w-3/5' : 'w-full'}">
		<TreeActionBar onNodeAdd={handleNodeAdd} />
		<TreeWrapper {allowTreeDrag} onZoomScrollChange={handleWrapperZoomScrollChange}>
			<Edges onEdgeDelete={handleEdgeDelete} {nodesToConnect} {nodes} />

			{#each nodes as node}
				<Node
					{node}
					active={edgeToConnectId === node.id}
					onNodeDrag={handleNodeDrag}
					onDragDone={handleNodeDragDone}
					onNewEdge={handleNewEdgeClick}
					onDeleteNode={handleNodeDelete}
					onNodeSelect={handleNodeSelect}
				/>
			{/each}

			{#if newEdge && isNewEdgeDragging}
				<Edge width={4} sourcePoint={newEdge.sourcePoint} targetPoint={newEdge.targetPoint} />
			{/if}
		</TreeWrapper>
	</div>
	{#if isEditMode}
		<div class="w-2/5 bg-white rounded-xl">
			<EditForm {itemToEdit} />
		</div>
	{/if}
</div>
