<script>
	import '$lib/app/styles/sections/Skills.css';
	import { onMount } from 'svelte';

	export let minZoom = 1;
	export let maxZoom = 2;
	export let isEditMode = false;
	export let allowActions = false;
	export let allowTreeDrag = true;
	export let onZoomScrollChange = () => {};

	let scale = 1;
	let offsetX = 0;
	let offsetY = 0;
	let isDragging = false;
	let container;
	const widthInSections = 20;
	const heightInSections = 20;

	const handleWheel = (event) => {
		event.preventDefault();
		const deltaY = event.deltaY;

		if (deltaY > 0) scale = Math.max(minZoom, scale - 0.1);
		else scale = Math.min(maxZoom, scale + 0.1);

		onZoomScrollChange({ x: container.scrollLeft, y: container.scrollTop, scale });
	};

	const handleMouseDown = (event) => {
		isDragging = true;
		offsetX = event.clientX;
		offsetY = event.clientY;
	};

	$: handleDragging = (event) => {
		if (!allowActions) isDragging = false;
		if (!isDragging || !allowTreeDrag) return;

		const deltaX = event.clientX - offsetX;
		const deltaY = event.clientY - offsetY;
		container.scrollLeft -= deltaX;
		container.scrollTop -= deltaY;

		onZoomScrollChange({ x: container.scrollLeft, y: container.scrollTop, scale });

		offsetX = event.clientX;
		offsetY = event.clientY;
	};

	const handleMouseUp = () => {
		isDragging = false;
	};

	onMount(() => {
		minZoom = container.offsetWidth/(widthInSections * 99);
		if (container.offsetWidth < 768) scale = 0.4;
		else if (container.offsetWidth < 1024) scale = 0.7;
		container.scrollLeft = ((widthInSections * 100)/2) * scale - container.offsetWidth/2
		onZoomScrollChange({ x: container.scrollLeft, y: container.scrollTop, scale });
	});
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->`
<div
	class="w-full h-144 overflow-scroll md:overflow-hidden rounded-xl
	{isDragging && allowActions ? 'cursor-grab' : ''}"
	bind:this={container}
	on:wheel={handleWheel}
	on:mousedown={handleMouseDown}
	on:mousemove={handleDragging}
	on:mouseup={handleMouseUp}
	style="position: relative;"
>
	<div
		class="draggable-content skills-bg-color"
		style="
		width: {widthInSections * 100}px;
		height: {heightInSections * 100}px;
		transform-origin: top left;
		transform: scale({scale});
		overflow: hidden;
		position: absolute;
		"
	>
		{#if isEditMode}
			<div class="w-1 h-full abs-center-x bg-red-500"></div>
			<div class="w-full h-1 abs-center-y bg-blue-500"></div>
		{/if}
		{#each Array(widthInSections) as _, i (i)}
			{#each Array(heightInSections) as _, j (j)}
				<div
					class="absolute skills-section-border"
					style={`width: 100px; height: 100px; top:${i * 100}px; left:${j * 100}px`}
				/>
			{/each}
		{/each}
		<slot />
	</div>
</div>
