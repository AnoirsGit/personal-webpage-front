<script>
	let scale = 1;
	let offsetX = 0;
	let offsetY = 0;

	let isDragging = false;
	let isDraggingContent = false;

	function handleWheel(event) {
		event.preventDefault();
		const deltaY = event.deltaY;

		// Calculate new scale based on scroll direction
		if (deltaY > 0) {
			scale = Math.max(1, scale - 0.1); // Prevent zooming out below 1
		} else {
			scale += 0.1;
		}

		// Constrain the scale within a certain range
		scale = Math.min(2, scale); // Maximum scale of 2
	}

	function handleMouseDown(event) {
		isDragging = true;
		offsetX = event.clientX;
		offsetY = event.clientY;
	}

	function handleMouseMove(event) {
		if (!isDragging) return;

		// Calculate the amount to move based on mouse movement
		const deltaX = event.clientX - offsetX;
		const deltaY = event.clientY - offsetY;

		// Update the container's scroll position
		const container = event.target.closest('.draggable-container');
		container.scrollLeft -= deltaX;
		container.scrollTop -= deltaY;

		// Update the initial offset for the next movement
		offsetX = event.clientX;
		offsetY = event.clientY;
	}

	function handleMouseUp() {
		console.log();
		isDragging = false;
	}
</script>

<div
	class="draggable-container bg-red-200 w-full h-160 overflow-hidden {isDragging
		? 'cursor-grab'
		: ''}"
	on:wheel={handleWheel}
	on:mousedown={handleMouseDown}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseUp}
	style="position: relative;"
>
	<div
		class="draggable-content w-full h-full"
		style="
    transform-origin: top left;
    transform: scale({scale});
    overflow: hidden;
    position: absolute;
  "
	>
		<slot />
	</div>
</div>
