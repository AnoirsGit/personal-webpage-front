<script>
	import GiMove from 'svelte-icons/gi/GiMove.svelte';
	import MdCallReceived from 'svelte-icons/md/MdCallReceived.svelte';

	import '../../styles/node.css';
	import { getNodeCenter, getNodePositionStyle } from './helpers/node';
	// Props
	export let node;
	export let onNodeDrag;
	export let onDragDone;
	export let onNewVector;
	export let editMode = true;

	let isDragging = false;

	// Use a reactive statement to update positionStyle when node.position changes
	let positionStyle;

	$: {
		positionStyle = getNodePositionStyle(getNodeCenter(node.position, node.size));
	}

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

	const handleNewVectorClick = (event) => {
		onNewVector(event, node.id);
	};
</script>

<div class="absolute m-0 w-20 h-20 bg-red-400 z-node" style={positionStyle}>
	<button class="absolute top-2 right-2 w-4 h-4 text-slate-500" on:mousedown={handleMouseDown}>
		<GiMove />
	</button>
	<button class="absolute top-6 right-2 w-4 h-4 text-slate-500" on:click={handleNewVectorClick}>
		<MdCallReceived />
	</button>
</div>
