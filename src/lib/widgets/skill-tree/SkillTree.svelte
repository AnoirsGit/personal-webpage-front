<script>
	import Node from '$lib/entities/tree/node/Node.svelte';
	import Edge from '$lib/entities/tree/edge/Edge.svelte';
	import Edges from '$lib/entities/tree/edge/Edges.svelte';
	import TreeWrapper from '$lib/widgets/skill-tree/TreeWrapper.svelte';

	import { getNodeUnderMouse, addNodeToTree } from '$lib/shared/helpers/tree/node';

	import EditForm from '$lib/features/tree/EditForm.svelte';
	import TreeActionBar from '$lib/features/tree/TreeActionBar.svelte';
	import NodeTooltip from '$lib//features/tree/NodeTooltip.svelte';

	import { NODE_DEFAULT_SIZE } from '$lib/shared/consts/nodeConsts';
	import CustomButton from '$lib/shared/UI/CustomButton.svelte';

	export let nodes = [];
	export let edges = [];
	export let isEditMode = true;
	export let treeId = 1;

	let tree;
	let wrapperZoomScroll = { x: 0, y: 0, scale: 1 };
	let mouseOnTreePosition = { x: 0, y: 0 };


	let allowActions = false;
	let allowTreeDrag = true;
	let isNewEdgeDragging = false;
	let newEdge;
	let edgeToConnectId = -1;
	let nodeToEdit;
	let nodeTooltip = null;
	let nodeTooltipDebounceTimer = null;

	const addNewEdge = (sourceNodeId, targetNodeId) => {
		const edgeExists = edges.some(
			(edge) => edge.sourceNodeId === sourceNodeId && edge.targetNodeId === targetNodeId
		);

		if (!edgeExists) {
			edges = [...edges, { sourceNodeId, targetNodeId }];
		}
		console.log(edges)
	};

	const handleNodeDrag = (position, nodeId) => {
		allowTreeDrag = false;
		nodes = nodes.map((node) => (node.id !== nodeId ? node : { ...node, position }));
	};

	const handleNodeDragDone = () => (allowTreeDrag = true);

	const handleNewEdgeClick = (event, sourceNodeId) => {
		isNewEdgeDragging = true;
		const sourceNode = nodes.find((node) => node.id === sourceNodeId);
		if (!sourceNode) return;

		const sourceNodePosition = sourceNode.position;
		const initialY = event.clientY - sourceNodePosition.y;
		const initialX = event.clientX - sourceNodePosition.x;
		const nodeSize = sourceNode.size | NODE_DEFAULT_SIZE;

		const handleMouseMove = (event) => {
			if (isNewEdgeDragging) {
				const y = event.clientY  - initialY;
				const x = event.clientX  - initialX + nodeSize;
				newEdge = { sourcePoint: sourceNodePosition, targetPoint: { y, x } };
				edgeToConnectId = getNodeUnderMouse({ nodes, node: sourceNode, x, y })?.id;
				console.log()
			}
		};

		const handleMouseUp = () => {
			console.log(sourceNode,edgeToConnectId)
			if (edgeToConnectId) addNewEdge(sourceNodeId, edgeToConnectId);

			newEdge = null;
			edgeToConnectId = -1;
			isNewEdgeDragging = false;

			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	const handleEdgeDelete = (index) => {
		edges = edges.filter((_, i) => index !== i);
	};

	const handleNodeDelete = (nodeId) => {
		nodes = nodes.filter((node) => node.id !== nodeId);
		edges = edges.filter(edge => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId)
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

	const handleMouseEnterTree = () => setTimeout(() => (allowActions = true), 500);
	const handleMouseLeaveTree = () => (allowActions = false);
	const handleMouseMoveTree = (event) =>
		(mouseOnTreePosition = { x: event.clientX, y: event.clientY });
	const handleMouseMoveNode = (nodeId) => {
		const node = nodes.find((tempNode) => tempNode.id === nodeId);
		if (!isNewEdgeDragging) nodeTooltip = node;
	};
	const handleMouseLeaveNode = () => {
		clearTimeout(nodeTooltipDebounceTimer);
		nodeTooltipDebounceTimer = setTimeout(() => {
			nodeTooltip = null;
		}, 500); // 1000 milliseconds (1 second)
	};

	const handleSaveNode = (node) => {
		const prevNode = nodes.find(tempNode => tempNode.id === node.id);
		const updatedNode = { ...node, position: prevNode.position };
		nodes = nodes.map(tempNode => (tempNode.id === node.id ? updatedNode : tempNode));
	};

	const saveSkills = () => {
		console.log(JSON.stringify({nodes, edges: edges}));
	}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="w-full flex flex-col lg:flex-row gap-3">
	<div
		class="relative {isEditMode ? 'w-3/5' : 'w-full'}"
		bind:this={tree}
		on:mousemove={handleMouseMoveTree}
		on:mouseenter={handleMouseEnterTree}
		on:mouseleave={handleMouseLeaveTree}
	>
		{#if nodeTooltip}
			<NodeTooltip {nodeTooltip} mousePosition={mouseOnTreePosition} />
		{/if}
		<TreeActionBar onNodeAdd={handleNodeAdd} />
		<TreeWrapper {allowActions} {allowTreeDrag} {isEditMode} onZoomScrollChange={handleWrapperZoomScrollChange}>
			{#each nodes as node}
				<Node
					{node}
					{allowActions}
					{isEditMode}
					onMouseMoveNode={handleMouseMoveNode}
					onMouseLeaveNode={handleMouseLeaveNode}
					active={edgeToConnectId === node.id}
					allowShowTooltip={!isNewEdgeDragging}
					onNodeDrag={handleNodeDrag}
					onDragDone={handleNodeDragDone}
					onNewEdge={handleNewEdgeClick}
					onDeleteNode={handleNodeDelete}
					onNodeSelect={handleNodeSelect}
				/>
			{/each}

			<Edges {isEditMode} onEdgeDelete={handleEdgeDelete} {edges} {nodes} />
			
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
{#if isEditMode}
	<div class="my-4 flex justify-center w-full font-bold">
		<CustomButton onClick={saveSkills}>SAVE SKILLS</CustomButton>
	</div>
{/if}
