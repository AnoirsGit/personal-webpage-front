<script>
	import { isLoaded } from '$lib/shared/stores/globalStore';
	import { createStarEffect, animate } from '$lib/shared/helpers/2d-canvas/effect';
	import { onMount } from 'svelte';

	let mounted = false;
	let canvas;
	let effect;
	let resizeTimer;
	const density = 1 / (50 * 50 * 3);

	const initContent = () => {
		const ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		effect = createStarEffect({ ctx, canvas, density, velocity: 0.15 });
		effect.init();
		animate({ ctx, canvas, effect });
	};

	onMount(() => (mounted = true));

	$: if ($isLoaded && mounted) setTimeout(initContent, 500);

	const resizeHandler = () => {
		if (!effect) return;
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(() => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			effect.resize();
		}, 200);
	};

	const mouseMoveHandler = (event) => {
		effect?.mouseMoveHandler(event.clientX, event.clientY);
	};

	const mouseLeaveHandler = () => {
		effect?.mouseLeaveHandler();
	};
</script>

<svelte:window
	on:mousemove={mouseMoveHandler}
	on:mouseleave={mouseLeaveHandler}
	on:resize={resizeHandler}
/>

<!-- fixed star field: covers the viewport no matter how tall the page grows -->
<div class="fixed inset-0 z-[-1] pointer-events-none">
	<canvas bind:this={canvas} />
</div>
