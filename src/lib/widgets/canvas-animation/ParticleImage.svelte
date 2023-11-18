<script>
	import { onMount } from 'svelte';
	import { createEffect, animate } from '$lib/shared/helpers/2d-canvas/effect';
	let image;
	let canvas;
	let effect;

	const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/b/be/Vrp-400x400.jpg';

	onMount(() => {
		const ctx = canvas.getContext('2d');
		canvas.width = 400;
		canvas.height = 400;

		effect = createEffect(ctx, canvas, image);
		effect.init();

		animate({ ctx, canvas, effect });
	});

	const mouseMoveHandler = (event) => {
		effect?.mouseMoveHandler(event.offsetX, event.offsetY);
	};

	const mouseLeaveHandler = () => {
		effect?.mouseLeaveHandler();
	};
</script>

<div class="relative">
	<canvas
		class="bg-transparent"
		on:mousemove={mouseMoveHandler}
		on:mouseleave={mouseLeaveHandler}
		bind:this={canvas}
	/>
	<img
		bind:this={image}
		alt="particle"
		crossorigin="anonymous"
		class="absolute hidden"
		src={imageUrl}
	/>
</div>
