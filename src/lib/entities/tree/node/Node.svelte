<script>
	import GiMove from 'svelte-icons/gi/GiMove.svelte';
	import FaSlash from 'svelte-icons/fa/FaSlash.svelte';
	import MdDelete from 'svelte-icons/md/MdDelete.svelte';
	import MdEdit from 'svelte-icons/md/MdEdit.svelte';
	import '$lib/app/styles/node.css';
	import { getNodeCenter, getNodePositionStyle } from '$lib/shared/helpers/tree/node';
	import { checkAndConvertToRGB } from '$lib/shared/helpers/helper';
	import { NODE_DEFAULT_SIZE } from '$lib/shared/consts/nodeConsts';

	export let isEditMode;
	export let node = () => {};
	export let allowActions = false;
	export let onNewEdge = () => {};
	export let onNodeDrag = () => {};
	export let onDragDone = () => {};
	export let onDeleteNode = () => {};
	export let onNodeSelect = () => {};
	export let onMouseMoveNode = () => {};
	export let onMouseLeaveNode = () => {};
	export let editMode = true;
	export let active = false;

	let isDragging = false;
	let showTooltip = false;

	const colorArray = checkAndConvertToRGB(node.color);
	const rgbaColor = colorArray ? `rgba(${colorArray.join(',')}, 0.1)` : 'rgba(255, 255, 255, 0.1)';
	const backgroundStyle = `background: ${active ? 'rgba(255, 255, 255, 0.8)' : rgbaColor};`;
	const borderColor = `border-color: ${colorArray ? 'rgb(' + colorArray.join(',') + ')' : 'white'}`;

	$: nodePosition = getNodeCenter(node.position, node.size);
	$: style = getNodePositionStyle(nodePosition) + borderColor;

	$: toolTipPosition = {
		y: nodePosition.y,
		x: nodePosition.x + NODE_DEFAULT_SIZE + 8
	};

	const handleMouseDown = (event) => {
		if (!editMode) return;
		isDragging = true;

		const initialX = event.clientX - node.position.x;
		const initialY = event.clientY - node.position.y;

		const handleMouseMove = (event) => {
			if (!allowActions) isDragging = false;

			if (isDragging) {
				const y = event.clientY - initialY;
				const x = event.clientX - initialX;
				onNodeDrag({ x, y }, node.id);
			}
		};

		const handleMouseUp = () => {
			onDragDone();
			isDragging = false;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};

	const handleNewEdgeClick = (event) => {
		onNewEdge(event, node.id);
	};

	const handleNodeClick = () => {
		showTooltip = !showTooltip;
	};

	const handleEditClick = () => {
		onNodeSelect(node.id);
	};

	const onMouseMove = (event) => onMouseMoveNode(node.id, event);

	const onMouseLeave = () => onMouseLeaveNode();
</script>

{#if showTooltip}
	<div
		class="tooltip flex flex-col gap-2"
		style="top: {toolTipPosition.y}px; left: {toolTipPosition.x}px"
	>
		<button class="flex items-center gap-2" on:mousedown={handleMouseDown}>
			<div class="w-3 h-3"><GiMove /></div>
			move
		</button>

		<button class="flex items-center gap-2" on:click={handleNewEdgeClick}>
			<div class="w-3 h-3"><FaSlash /></div>
			connect
		</button>

		<button class="flex items-center gap-2" on:click={() => onDeleteNode(node.id)}>
			<div class="w-3 h-3"><MdDelete /></div>
			delete
		</button>
	</div>
{/if}

{#if isEditMode}
	<button
		on:click={handleEditClick}
		class="absolute z-node"
		style="top: {nodePosition.y + -12}px; left: {nodePosition.x + NODE_DEFAULT_SIZE}px"
	>
		<div class="w-4 h-4"><MdEdit /></div></button
	>
{/if}

<div class="node-wrapper" {style}>
	<button
		class="node-element"
		style={backgroundStyle}
		on:click={handleNodeClick}
		on:mousemove={onMouseMove}
		on:mouseleave={onMouseLeave}
	>
		{#if node.imageUrl && node.imageUrl != ''}
			<img class="node-image" src={node.imageUrl} crossorigin="anonymous" alt={node.title} />
		{/if}
	</button>
</div>
