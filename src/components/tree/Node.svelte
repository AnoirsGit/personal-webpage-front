<script>
	import GiMove from 'svelte-icons/gi/GiMove.svelte';
	import FaSlash from 'svelte-icons/fa/FaSlash.svelte';
	import MdDelete from 'svelte-icons/md/MdDelete.svelte';
	import '../../styles/node.css';
	import { getNodeCenter, getNodePositionStyle } from './helpers/node';

	export let node = () => {};
	export let onNewEdge = () => {};
	export let onNodeDrag = () => {};
	export let onDragDone = () => {};
	export let onDeleteNode = () => {};
	export let onNodeSelect = () => {};
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
		onNodeSelect(node);
		showTooltip = !showTooltip;
	};
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

<button class="absolute m-0 w-20 h-20 bg-red-400 z-node" {style} on:click={handleNodeClick} />
