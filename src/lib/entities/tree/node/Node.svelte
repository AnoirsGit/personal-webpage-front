<script>
	import GiMove from 'svelte-icons/gi/GiMove.svelte';
	import FaSlash from 'svelte-icons/fa/FaSlash.svelte';
	import MdDelete from 'svelte-icons/md/MdDelete.svelte';
	import MdEdit from 'svelte-icons/md/MdEdit.svelte';
	import '$lib/app/styles/node.css';
	import { getNodeCenter, getNodePositionStyle } from '$lib/shared/helpers/tree/node';

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
	let style = '';
	let toolTipPosition;

	$: nodePosition = getNodeCenter(node.position, node.size);
	$: {
		style = `
		${active ? 'box-shadow: 0 0 50px 20px #fff; background: white;' : ''}
		${getNodePositionStyle(nodePosition)}`;
	}

	$: toolTipPosition = {
		y: nodePosition.y,
		x: nodePosition.x + node.size + 8
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

<div class="absolute w-20 h-20 m-0 z-node" {style}>
	<button
		class="w-20 h-20 bg-white border-4 border-main-blue-50 rotate-45 overflow-hidden"
		on:click={handleNodeClick}
		on:mousemove={onMouseMove}
		on:mouseleave={onMouseLeave}
	>
		<img
			class="-rotate-45 w-full h-full"
			src={node.imageUrl}
			crossorigin="anonymous"
			alt={node.title}
		/>
	</button>
	{#if isEditMode}
		<button on:click={handleEditClick} class="absolute z-node -top-3 -right-3">
			<div class="w-5 h-5"><MdEdit /></div></button
		>
	{/if}
</div>
