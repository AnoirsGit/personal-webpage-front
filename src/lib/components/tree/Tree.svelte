<script>
	import Node from './node/Node.svelte';
	import Edge from './edge/Edge.svelte';
	import Edges from './edge/Edges.svelte';
	import TreeWrapper from './TreeWrapper.svelte';

	import { getNodeUnderMouse, addNodeToTree } from './helpers/node';
	import { nodesMock } from '$lib/mocks/tree';

	import EditForm from './node/EditForm.svelte';
	import TreeActionBar from './treeActionBar.svelte';
	import NodeTooltip from './node/NodeTooltip.svelte';

	export let isEditMode = true;
	export let nodes = nodesMock;
	export let treeId = 1;

	let tree;
	let wrapperZoomScroll = { x: 0, y: 0, scale: 1 };

	let nodesToConnect = [{ sourceNodeId: 1, targetNodeId: 2 }];

	let allowActions = false;
	let allowTreeDrag = true;
	let isNewEdgeDragging = false;
	let newEdge;
	let edgeToConnectId = 0;
	let nodeToEdit;
	let nodeTooltip = null;
	let nodeTooltipDebounceTimer = null;

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
		nodeToEdit = { ...selectedNode };
	};

	const handleWrapperZoomScrollChange = ({ x, y, scale }) => (wrapperZoomScroll = { x, y, scale });

	const handleNodeAdd = () => {
		const newNode = addNodeToTree(nodes, wrapperZoomScroll, tree, treeId);

		nodes = [...nodes, newNode];
	};

	const handleMouseEnter = () => setTimeout(() => (allowActions = true), 500);
	const handleMouseLeave = () => (allowActions = false);

	const handleMouseMoveNode = (nodeId) => {
		const node = nodes.find((tempNode) => tempNode.id === nodeId);
		nodeTooltip = node;
	};
	const handleMouseLeaveNode = () => {
		clearTimeout(nodeTooltipDebounceTimer);
		nodeTooltipDebounceTimer = setTimeout(() => {
			nodeTooltip = null;
		}, 500); // 1000 milliseconds (1 second)
	};

	const handleSaveNode = (node) => {
		nodes = [...nodes.filter((tempNode) => tempNode.id !== node.id), node];
	};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="flex flex-col xl:flex-row gap-3 mb-32">
	<div
		bind:this={tree}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
		class="relative bg-main-blue-90 rounded {isEditMode ? 'w-3/5' : 'w-full'}"
	>
		{#if nodeTooltip}
			<NodeTooltip {nodeTooltip} />
		{/if}
		<TreeActionBar onNodeAdd={handleNodeAdd} />
		<TreeWrapper {allowActions} {allowTreeDrag} onZoomScrollChange={handleWrapperZoomScrollChange}>
			<Edges onEdgeDelete={handleEdgeDelete} {nodesToConnect} {nodes} />

			{#each nodes as node}
				<Node
					{node}
					{allowActions}
					onMouseMoveNode={handleMouseMoveNode}
					onMouseLeaveNode={handleMouseLeaveNode}
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
			<EditForm node={nodeToEdit} onSaveNode={handleSaveNode} />
		</div>
	{/if}
</div>
