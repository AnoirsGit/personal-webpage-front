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
	let targetScale = 1;
	let zoomAnchor = { x: 0, y: 0 };
	let zoomRaf = null;
	let offsetX = 0;
	let offsetY = 0;
	let isDragging = false;
	let container;
	const widthInSections = 20;
	const heightInSections = 20;

	const clampScale = (value) => Math.min(maxZoom, Math.max(minZoom, value));

	/*
	 * Smooth, cursor-anchored zoom: wheel only moves the target,
	 * an rAF loop eases the actual scale toward it and compensates
	 * the scroll position so the point under the cursor stays put.
	 */
	const applyScale = (next) => {
		const ratio = next / scale;
		container.scrollLeft = (container.scrollLeft + zoomAnchor.x) * ratio - zoomAnchor.x;
		container.scrollTop = (container.scrollTop + zoomAnchor.y) * ratio - zoomAnchor.y;
		scale = next;
		onZoomScrollChange({ x: container.scrollLeft, y: container.scrollTop, scale });
	};

	const zoomStep = () => {
		const diff = targetScale - scale;
		if (Math.abs(diff) < 0.001) {
			applyScale(targetScale);
			zoomRaf = null;
			return;
		}
		applyScale(scale + diff * 0.16);
		zoomRaf = requestAnimationFrame(zoomStep);
	};

	const handleWheel = (event) => {
		event.preventDefault();
		const factor = event.deltaY > 0 ? 0.9 : 1.12;
		targetScale = clampScale(targetScale * factor);

		const rect = container.getBoundingClientRect();
		zoomAnchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };

		if (!zoomRaf) zoomRaf = requestAnimationFrame(zoomStep);
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
		minZoom = container.offsetWidth / (widthInSections * 99);
		if (container.offsetWidth < 768) scale = 0.4;
		else if (container.offsetWidth < 1024) scale = 0.7;
		targetScale = scale;
		container.scrollLeft = ((widthInSections * 100) / 2) * scale - container.offsetWidth / 2;
		onZoomScrollChange({ x: container.scrollLeft, y: container.scrollTop, scale });

		return () => cancelAnimationFrame(zoomRaf);
	});
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="skills-stage rounded-xl">
	<div
		class="w-full h-144 overflow-scroll md:overflow-hidden rounded-xl
		{isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
		bind:this={container}
		on:wheel={handleWheel}
		on:mousedown={handleMouseDown}
		on:mousemove={handleDragging}
		on:mouseup={handleMouseUp}
		style="position: relative;"
	>
		<div
			class="draggable-content skills-bg-color skills-grid"
			style="
			width: {widthInSections * 100}px;
			height: {heightInSections * 100}px;
			transform-origin: top left;
			transform: scale({scale});
			overflow: hidden;
			position: absolute;
			will-change: transform;
			"
		>
			{#if isEditMode}
				<div class="w-1 h-full abs-center-x bg-red-500"></div>
				<div class="w-full h-1 abs-center-y bg-blue-500"></div>
			{/if}
			<slot />
		</div>
	</div>
	<span class="skills-vignette" />
	<span class="skills-hint">drag to pan · scroll to zoom</span>
</div>
