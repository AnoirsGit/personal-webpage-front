<script>
	import Icon from '@iconify/svelte';
	import { fade } from 'svelte/transition';
	import '$lib/app/styles/node.css';
	import { getNodeCenter, getNodePositionStyle } from '$lib/shared/helpers/tree/node';
	import { checkAndConvertToRGB } from '$lib/shared/helpers/color-helper';
	import { NODE_DEFAULT_SIZE } from '$lib/shared/consts/nodeConsts';
	import { onMount, onDestroy } from 'svelte';

	export let isEditMode;
	export let node = () => {};
	export let allowActions = false;
	export let allowShowTooltip = true;
	export let onNewEdge = () => {};
	export let onNodeDrag = () => {};
	export let onDragDone = () => {};
	export let onDeleteNode = () => {};
	export let onNodeSelect = () => {};
	export let onMouseMoveNode = () => {};
	export let onMouseLeaveNode = () => {};
	export let editMode = true;
	export let active = false;

	let nodeRef;

	let isDragging = false;
	let showTooltip = false;

	const colorArray = checkAndConvertToRGB(node.color);
	const rgbaColor = colorArray ? `rgba(${colorArray.join(',')}, 0.1)` : 'rgba(255, 255, 255, 0.1)';
	const backgroundStyle = `background: ${rgbaColor};`;
	const borderColor = `border-color: ${
		colorArray ? 'rgb(' + colorArray.join(',') + ')' : 'white'
	};`;

	$: glow = active ? 'box-shadow: 0 0 24px 0px rgba(255,255,255,0.5)' : '';
	$: nodePosition = getNodeCenter(node.position, node.size);
	$: style = getNodePositionStyle(nodePosition) + borderColor + glow;

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
		console.log('onNewEdgeClick');
		onNewEdge(event, node.id);
	};

	const handleNodeClick = () => {
		if (allowShowTooltip) showTooltip = !showTooltip;
	};

	const handleEditClick = () => {
		onNodeSelect(node.id);
	};

	const onMouseMove = (event) => onMouseMoveNode(node.id, event);

	const onMouseLeave = () => onMouseLeaveNode();

	onMount(() => {
		if (isEditMode) nodeRef.addEventListener('click', handleNodeClick);
	});

	onDestroy(() => {
		if (isEditMode) nodeRef.removeEventListener('click', handleNodeClick);
	});
</script>

{#if showTooltip}
	<div
		class="tooltip flex flex-col gap-2"
		style="top: {toolTipPosition.y}px; left: {toolTipPosition.x}px"
	>
		<button class="flex items-center gap-1" on:mousedown={handleMouseDown}>
			<Icon icon="mingcute:move-line" /> move
		</button>

		<button class="flex items-center gap-1" on:click={handleNewEdgeClick}>
			<Icon icon="carbon:connect" /> connect
		</button>

		<button class="flex items-center gap-1" on:click={() => onDeleteNode(node.id)}>
			<Icon icon="material-symbols:delete" /> delete
		</button>
	</div>
{/if}

{#if isEditMode}
	<button
		on:click={handleEditClick}
		class="absolute z-node"
		style="top: {nodePosition.y + -12}px; left: {nodePosition.x + NODE_DEFAULT_SIZE}px"
	>
		<Icon icon="material-symbols:edit" /></button
	>
{/if}

<div transition:fade={{ duration: 400 }} class="node-wrapper" {style}>
	<button
		class="node-element"
		style={backgroundStyle}
		bind:this={nodeRef}
		on:mousemove={onMouseMove}
		on:mouseleave={onMouseLeave}
	>
		{#if node.imageUrl && node.imageUrl != ''}
			<img class="node-image" src={node.imageUrl} crossorigin="anonymous" alt={node.title} />
		{/if}
	</button>
</div>
