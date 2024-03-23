<script>
	import { isLoaded } from '$lib/shared/stores/globalStore';
	import { createStarEffect, animate } from '$lib/shared/helpers/2d-canvas/effect';
	import { onMount } from 'svelte';

	let canvas;
	let clientWidth;
	let clientHeight;
	let effect;
	let mounted = false;
	const density = 1 / (50 * 50 * 3);

	const mouseMove = () => {};

	const initContent = () => {
		const ctx = canvas.getContext('2d');
		canvas.width = clientWidth;
		canvas.height = clientHeight;

		effect = createStarEffect({ ctx, canvas, density });
		effect.init();
		animate({ ctx, canvas, effect });
	};

	onMount(() => (mounted = true));

	$: if ($isLoaded && mounted) initContent();
</script>

<div class="absolute w-full h-full" bind:clientHeight bind:clientWidth>
	<canvas on:mousemove={mouseMove} bind:this={canvas} />
</div>
