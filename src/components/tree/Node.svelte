<script>
	import { getNodeCenter, getNodePositionStyle } from './helpers/node';

	// Props
	export let node;
	export let onNodeDrag;

	let isDragging = false;

	// Use a reactive statement to update positionStyle when node.position changes
	let positionStyle;

	$: {
		positionStyle = getNodePositionStyle(getNodeCenter(node.position, node.size));
		console.log(node.position);
	}

	const handleMouseDown = (event) => {
		isDragging = true;

		const initialX = event.clientX - node.position.x;
		const initialY = event.clientY - node.position.y;

		const handleMouseMove = (event) => {
			const x = event.clientX - initialX;
			const y = event.clientY - initialY;

			if (isDragging) {
				onNodeDrag({ x, y }, node.id);
			}
		};

		const handleMouseUp = () => {
			isDragging = false;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	};
</script>

<div
	on:mousedown={handleMouseDown}
	class="absolute w-20 h-20 bg-red-400 z-node"
	style={positionStyle}
/>
